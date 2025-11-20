"""
Inferencia: carga modelo entrenado y genera recomendaciones
"""
import os
import numpy as np
import joblib
from typing import List, Optional, Dict
import tensorflow as tf


def load_model_and_mappings(model_path: str = 'backend/IA/tf_saved_model/'):
    """
    Carga el modelo y los mappings necesarios para inferencia.
    
    Returns:
        (model, mappings_dict)
    """
    from tensorflow import keras
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Modelo no encontrado en: {model_path}")
    
    # Cargar modelo TensorFlow
    model = keras.models.load_model(model_path)
    
    # Cargar mappings
    mappings_file = os.path.join(os.path.dirname(model_path), 'mappings.joblib')
    if not os.path.exists(mappings_file):
        raise FileNotFoundError(f"Mappings no encontrados en: {mappings_file}")
    
    mappings = joblib.load(mappings_file)
    
    return model, mappings


def get_recommendations_for_user(
    user_id: int,
    top_n: int = 10,
    model_path: str = 'backend/IA/tf_saved_model/',
    exclude_interacted: bool = True
) -> List[int]:
    """
    Genera recomendaciones para un usuario específico.
    
    Args:
        user_id: ID del usuario (de la BD)
        top_n: Número de recomendaciones a retornar
        model_path: Ruta del modelo entrenado
        exclude_interacted: Si True, excluye videos ya vistos/interactuados
        
    Returns:
        Lista de video_ids recomendados (IDs de BD, no índices)
    """
    try:
        model, mappings = load_model_and_mappings(model_path)
    except FileNotFoundError as e:
        print(f"Error al cargar modelo: {e}")
        return _fallback_recommendations(top_n)
    
    user_to_idx = mappings['user_to_idx']
    video_to_idx = mappings['video_to_idx']
    idx_to_video = mappings['idx_to_video']
    
    # Verificar si el usuario existe en el modelo
    if user_id not in user_to_idx:
        print(f"Usuario {user_id} no está en el modelo. Usando fallback.")
        return _fallback_recommendations(top_n)
    
    user_idx = user_to_idx[user_id]
    
    # Obtener videos ya interactuados (si queremos excluirlos)
    interacted_videos = set()
    if exclude_interacted:
        interacted_videos = _get_user_interacted_videos(user_id)
    
    # Preparar todos los videos para scoring
    all_video_ids = list(video_to_idx.keys())
    all_video_indices = [video_to_idx[vid] for vid in all_video_ids]
    
    # Crear batch de inputs (user repetido, todos los videos)
    num_videos = len(all_video_indices)
    user_batch = np.full(num_videos, user_idx, dtype=np.int32)
    video_batch = np.array(all_video_indices, dtype=np.int32)
    
    # Predecir scores
    predictions = model.predict(
        {'user_id': user_batch, 'video_id': video_batch},
        batch_size=512,
        verbose=0
    )
    
    # Flatten predictions
    scores = predictions.flatten()
    
    # Crear lista de (video_id, score)
    video_scores = []
    for i, vid in enumerate(all_video_ids):
        # Excluir videos ya interactuados
        if exclude_interacted and vid in interacted_videos:
            continue
        video_scores.append((vid, scores[i]))
    
    # Ordenar por score descendente
    video_scores.sort(key=lambda x: x[1], reverse=True)
    
    # Retornar top N video_ids
    recommended_ids = [vid for vid, score in video_scores[:top_n]]
    
    return recommended_ids


def _get_user_interacted_videos(user_id: int) -> set:
    """
    Obtiene el set de videos con los que el usuario ha interactuado.
    """
    from catalogodigital.models import (
        VisualizacionVideo, LikeVideo, ComentarioVideo,
        VideoGuardado, CompartirVideo
    )
    
    interacted = set()
    
    # Visualizaciones
    interacted.update(
        VisualizacionVideo.objects.filter(usuario_id=user_id).values_list('video_id', flat=True)
    )
    
    # Likes
    interacted.update(
        LikeVideo.objects.filter(usuario_id=user_id).values_list('video_id', flat=True)
    )
    
    # Comentarios
    interacted.update(
        ComentarioVideo.objects.filter(usuario_id=user_id).values_list('video_id', flat=True)
    )
    
    # Guardados
    interacted.update(
        VideoGuardado.objects.filter(usuario_id=user_id).values_list('video_id', flat=True)
    )
    
    # Compartidos
    interacted.update(
        CompartirVideo.objects.filter(usuario_id=user_id).values_list('video_id', flat=True)
    )
    
    return interacted


def _fallback_recommendations(top_n: int = 10) -> List[int]:
    """
    Recomendaciones de fallback: videos más populares recientes.
    Se usa cuando el modelo no está disponible o el usuario es nuevo.
    """
    from catalogodigital.models import Video
    from django.db.models import Count
    
    videos = Video.objects.filter(
        activo=True,
        estado='PUBLICADO'
    ).annotate(
        popularidad=Count('visualizaciones') + Count('likes') * 3
    ).order_by('-popularidad', '-fecha_publicacion')[:top_n]
    
    return list(videos.values_list('id', flat=True))


def rank_videos_for_user(
    user_id: int,
    video_ids: List[int],
    model_path: str = 'backend/IA/tf_saved_model/'
) -> List[int]:
    """
    Rankea una lista de videos según el score de recomendación para un usuario.
    Útil para ordenar el feed principal (estilo TikTok).
    
    Args:
        user_id: ID del usuario
        video_ids: Lista de IDs de videos a rankear
        model_path: Ruta del modelo entrenado
        
    Returns:
        Lista de video_ids ordenados por score descendente (más relevante primero)
    """
    if not video_ids:
        return []
    
    try:
        model, mappings = load_model_and_mappings(model_path)
    except FileNotFoundError:
        # Si no hay modelo, devolver en orden original
        return video_ids
    
    user_to_idx = mappings['user_to_idx']
    video_to_idx = mappings['video_to_idx']
    
    # Si el usuario no está en el modelo, devolver orden original
    if user_id not in user_to_idx:
        return video_ids
    
    user_idx = user_to_idx[user_id]
    
    # Filtrar videos que estén en el modelo
    valid_videos = [vid for vid in video_ids if vid in video_to_idx]
    
    if not valid_videos:
        return video_ids
    
    # Preparar batch para predicción
    num_videos = len(valid_videos)
    user_batch = np.full(num_videos, user_idx, dtype=np.int32)
    video_batch = np.array([video_to_idx[vid] for vid in valid_videos], dtype=np.int32)
    
    # Predecir scores
    predictions = model.predict(
        {'user_id': user_batch, 'video_id': video_batch},
        batch_size=512,
        verbose=0
    )
    
    scores = predictions.flatten()
    
    # Crear lista de (video_id, score)
    video_scores = list(zip(valid_videos, scores))
    
    # Ordenar por score descendente
    video_scores.sort(key=lambda x: x[1], reverse=True)
    
    # Extraer video_ids ordenados
    ranked_videos = [vid for vid, _ in video_scores]
    
    # Añadir al final los videos que no estaban en el modelo
    videos_not_in_model = [vid for vid in video_ids if vid not in video_to_idx]
    ranked_videos.extend(videos_not_in_model)
    
    return ranked_videos


def batch_recommendations(
    user_ids: List[int],
    top_n: int = 10,
    model_path: str = 'backend/IA/tf_saved_model/'
) -> Dict[int, List[int]]:
    """
    Genera recomendaciones para múltiples usuarios (batch).
    Útil para pre-cómputo o tareas en background.
    
    Args:
        user_ids: Lista de user_ids
        top_n: Número de recomendaciones por usuario
        model_path: Ruta del modelo
        
    Returns:
        Dict {user_id: [video_ids]}
    """
    results = {}
    
    for uid in user_ids:
        try:
            recommendations = get_recommendations_for_user(
                user_id=uid,
                top_n=top_n,
                model_path=model_path
            )
            results[uid] = recommendations
        except Exception as e:
            print(f"Error al generar recomendaciones para usuario {uid}: {e}")
            results[uid] = []
    
    return results
