# Sistema de Recomendaciones con TensorFlow

Este módulo implementa un sistema de recomendaciones basado en **Neural Collaborative Filtering (NCF)** usando embeddings de usuarios y videos.

## Características

- **Modelo entrenable**: Aprende de interacciones reales (visualizaciones, likes, comentarios, guardados, compartidos)
- **TensorFlow/Keras**: Arquitectura de embeddings + MLP para capturar patrones no lineales
- **Negative sampling**: Genera ejemplos negativos para entrenar con feedback implícito
- **Pesos personalizables**: Diferentes valores para cada tipo de interacción
- **SavedModel**: Exportación estándar de TensorFlow para serving

## Instalación

Desde el virtualenv del backend:

```powershell
pip install -r backend/IA/requirements.txt
```

**Nota Windows + GPU**: Si tienes GPU NVIDIA y quieres usar CUDA:

```powershell
pip install tensorflow[and-cuda]
```

## Uso

### 1. Entrenar el modelo

Desde la raíz del proyecto (donde está `manage.py`):

```powershell
python manage.py train_tf_recommender --epochs 50 --batch-size 256 --embedding-dim 64
```

Parámetros:

- `--epochs`: Número de épocas de entrenamiento (default: 50)
- `--batch-size`: Tamaño del batch (default: 256)
- `--embedding-dim`: Dimensión de embeddings (default: 64)
- `--model-path`: Ruta donde guardar el modelo (default: `backend/IA/tf_saved_model/`)
- `--negative-ratio`: Ratio de ejemplos negativos por positivo (default: 4)
- `--learning-rate`: Learning rate para Adam (default: 0.001)

### 2. Obtener recomendaciones (desde código)

```python
from IA.inference import get_recommendations_for_user

# Obtener top 10 recomendaciones para usuario
video_ids = get_recommendations_for_user(
    user_id=123,
    top_n=10,
    model_path='backend/IA/tf_saved_model/'
)
```

### 3. Endpoint API

El endpoint `/api/catalogodigital/public/videos/recomendaciones/` devuelve videos recomendados:

```bash
GET /api/catalogodigital/public/videos/recomendaciones/?limit=10
Authorization: Bearer <token>
```

## Arquitectura del Modelo

```
Input: (user_id, video_id)
    ↓
[User Embedding (64)] ⊕ [Video Embedding (64)]
    ↓
[Concat] → [Dense(128, ReLU)] → [Dropout(0.3)]
    ↓
[Dense(64, ReLU)] → [Dropout(0.2)]
    ↓
[Dense(1, sigmoid)] → score ∈ [0, 1]
```

## Pesos de Interacciones

Por defecto (ajustables en `data_preparation.py`):

- Visualización: 1.0
- Like: 4.0
- Comentario: 3.0
- Guardado: 2.5
- Compartido: 2.5

## Producción

**Recomendaciones**:

- Ejecutar entrenamiento periódicamente (cron/Celery Beat) cuando haya nuevos datos
- Precomputar embeddings de videos y usar búsqueda ANN (FAISS/Annoy) para escalabilidad
- Cachear recomendaciones en Redis (TTL ~1 hora)
- Considerar TF-Serving para serving dedicado si tienes alto tráfico
- Monitorear métricas: CTR, tiempo de engagement, diversidad de recomendaciones

## Estructura de Archivos

```
backend/IA/
├── __init__.py
├── requirements.txt
├── README.md
├── data_preparation.py      # Construcción dataset de entrenamiento
├── tf_model.py              # Arquitectura del modelo TensorFlow
├── inference.py             # Carga modelo y genera recomendaciones
├── management/
│   └── commands/
│       └── train_tf_recommender.py  # Comando Django para entrenar
└── tf_saved_model/          # Modelo entrenado (generado tras train)
    ├── saved_model.pb
    ├── variables/
    └── assets/
```

## Troubleshooting

**Error: "No module named tensorflow"**
→ Instalar: `pip install tensorflow`

**Error: "Insufficient data for training"**
→ Necesitas al menos ~100 interacciones para entrenar. Agrega datos de prueba o espera acumulación.

**Recomendaciones poco relevantes**
→ Ajustar pesos en `data_preparation.py`, aumentar `embedding_dim`, o entrenar más épocas.

**Lentitud al predecir**
→ Precomputar embeddings de videos y usar búsqueda vectorial (FAISS).
