"""
Preparación de datos para entrenamiento del modelo de recomendaciones
Construye dataset de interacciones con pesos y negative sampling
"""
import numpy as np
import pandas as pd
from typing import Dict, Tuple, List
import random


def get_interaction_weights() -> Dict[str, float]:
    """
    Pesos para cada tipo de interacción.
    Ajustar según la importancia relativa de cada acción.
    """
    return {
        'view': 1.0,
        'like': 4.0,
        'comment': 3.0,
        'saved': 2.5,
        'share': 2.5,
    }


def build_interaction_dataset(negative_ratio: int = 4) -> Tuple[np.ndarray, np.ndarray, np.ndarray, Dict, Dict]:
    """
    Construye el dataset de entrenamiento desde los modelos de Django.
    
    Args:
        negative_ratio: Número de ejemplos negativos por cada positivo
        
    Returns:
        user_ids: array de user_id
        video_ids: array de video_id
        labels: array de labels (1 = interacción positiva, 0 = negativa)
        user_to_idx: mapping {user_id: index}
        video_to_idx: mapping {video_id: index}
    """
    from catalogodigital.models import Video
    try:
        from catalogodigital.models import (
            VisualizacionVideo, LikeVideo, ComentarioVideo,
            VideoGuardado, CompartirVideo
        )
    except ImportError:
        raise RuntimeError("No se pudieron importar los modelos de interacción")
    
    weights = get_interaction_weights()
    
    # Recolectar todas las interacciones con sus pesos
    interactions = []  # lista de (user_id, video_id, weight)
    
    # Visualizaciones
    for vis in VisualizacionVideo.objects.select_related('usuario', 'video').all():
        if vis.usuario_id and vis.video_id:
            interactions.append((vis.usuario_id, vis.video_id, weights['view']))
    
    # Likes
    for like in LikeVideo.objects.select_related('usuario', 'video').all():
        if like.usuario_id and like.video_id:
            interactions.append((like.usuario_id, like.video_id, weights['like']))
    
    # Comentarios
    for comment in ComentarioVideo.objects.filter(activo=True).select_related('usuario', 'video').all():
        if comment.usuario_id and comment.video_id:
            interactions.append((comment.usuario_id, comment.video_id, weights['comment']))
    
    # Guardados
    for saved in VideoGuardado.objects.select_related('usuario', 'video').all():
        if saved.usuario_id and saved.video_id:
            interactions.append((saved.usuario_id, saved.video_id, weights['saved']))
    
    # Compartidos
    for share in CompartirVideo.objects.select_related('usuario', 'video').all():
        if share.usuario_id and share.video_id:
            interactions.append((share.usuario_id, share.video_id, weights['share']))
    
    if len(interactions) < 10:
        raise RuntimeError(
            f"Datos insuficientes para entrenar: solo {len(interactions)} interacciones. "
            "Se necesitan al menos 100 para resultados significativos."
        )
    
    # Agregar interacciones múltiples del mismo par (user, video)
    interaction_dict = {}  # (user_id, video_id) -> total_weight
    for uid, vid, weight in interactions:
        key = (uid, vid)
        interaction_dict[key] = interaction_dict.get(key, 0.0) + weight
    
    # Normalizar pesos a [0, 1] para labels
    max_weight = max(interaction_dict.values()) if interaction_dict else 1.0
    positive_examples = []
    for (uid, vid), weight in interaction_dict.items():
        # Usar peso normalizado como label (más fuerte = más cercano a 1)
        normalized_label = min(weight / max_weight, 1.0)
        positive_examples.append((uid, vid, normalized_label))
    
    print(f"✓ Interacciones positivas: {len(positive_examples)}")
    
    # Construir mappings
    all_users = set(uid for uid, _, _ in positive_examples)
    all_videos_interacted = set(vid for _, vid, _ in positive_examples)
    
    # Obtener todos los videos disponibles para negative sampling
    all_video_ids = set(Video.objects.filter(
        activo=True,
        estado='PUBLICADO'
    ).values_list('id', flat=True))
    
    if len(all_video_ids) < 10:
        raise RuntimeError("No hay suficientes videos publicados para entrenar")
    
    user_to_idx = {uid: idx for idx, uid in enumerate(sorted(all_users))}
    video_to_idx = {vid: idx for idx, vid in enumerate(sorted(all_video_ids))}
    
    # Construir dataset con positivos
    user_list = []
    video_list = []
    label_list = []
    
    for uid, vid, label in positive_examples:
        user_list.append(user_to_idx[uid])
        video_list.append(video_to_idx[vid])
        label_list.append(label)
    
    # Negative sampling: para cada usuario, generar N videos no vistos
    user_interactions = {}  # user_id -> set(video_ids interactuados)
    for uid, vid, _ in positive_examples:
        if uid not in user_interactions:
            user_interactions[uid] = set()
        user_interactions[uid].add(vid)
    
    num_negatives = len(positive_examples) * negative_ratio
    negatives_generated = 0
    
    print(f"Generando {num_negatives} ejemplos negativos...")
    
    for _ in range(num_negatives):
        # Seleccionar usuario aleatorio
        uid = random.choice(list(all_users))
        
        # Seleccionar video aleatorio que el usuario NO haya visto
        interacted = user_interactions.get(uid, set())
        available_videos = list(all_video_ids - interacted)
        
        if not available_videos:
            continue
        
        vid = random.choice(available_videos)
        
        user_list.append(user_to_idx[uid])
        video_list.append(video_to_idx[vid])
        label_list.append(0.0)  # Label 0 para negativo
        negatives_generated += 1
    
    print(f"✓ Ejemplos negativos generados: {negatives_generated}")
    
    # Convertir a numpy arrays
    user_ids = np.array(user_list, dtype=np.int32)
    video_ids = np.array(video_list, dtype=np.int32)
    labels = np.array(label_list, dtype=np.float32)
    
    # Shuffle el dataset
    indices = np.arange(len(user_ids))
    np.random.shuffle(indices)
    user_ids = user_ids[indices]
    video_ids = video_ids[indices]
    labels = labels[indices]
    
    print(f"✓ Dataset total: {len(user_ids)} ejemplos")
    print(f"  - Usuarios únicos: {len(user_to_idx)}")
    print(f"  - Videos únicos: {len(video_to_idx)}")
    print(f"  - Ratio positivos/negativos: {len(positive_examples)}/{negatives_generated}")
    
    return user_ids, video_ids, labels, user_to_idx, video_to_idx


def save_mappings(user_to_idx: Dict, video_to_idx: Dict, output_path: str = 'backend/IA/'):
    """
    Guarda los mappings en formato joblib para uso en inferencia.
    """
    import joblib
    import os
    
    os.makedirs(output_path, exist_ok=True)
    
    mappings = {
        'user_to_idx': user_to_idx,
        'video_to_idx': video_to_idx,
        'idx_to_user': {idx: uid for uid, idx in user_to_idx.items()},
        'idx_to_video': {idx: vid for vid, idx in video_to_idx.items()},
        'num_users': len(user_to_idx),
        'num_videos': len(video_to_idx),
    }
    
    mapping_file = os.path.join(output_path, 'mappings.joblib')
    joblib.dump(mappings, mapping_file)
    print(f"✓ Mappings guardados en: {mapping_file}")
    
    return mapping_file
