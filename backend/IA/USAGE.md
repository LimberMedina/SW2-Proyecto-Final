# Guía de Uso - Sistema de Recomendaciones

## 🚀 Inicio Rápido

### 1. Instalación de Dependencias

```powershell
# Desde el virtualenv del backend
cd backend
pip install -r IA/requirements.txt
```

**Nota GPU (opcional)**: Si tienes GPU NVIDIA con CUDA:

```powershell
pip install tensorflow[and-cuda]
```

### 2. Entrenar el Modelo

Necesitas al menos **100 interacciones** en la base de datos (visualizaciones, likes, comentarios, guardados, compartidos).

```powershell
# Entrenamiento básico (50 épocas, recomendado para inicio)
python manage.py train_tf_recommender

# Entrenamiento personalizado
python manage.py train_tf_recommender --epochs 100 --batch-size 512 --embedding-dim 128
```

Salida esperada:

```
================================================================================
ENTRENAMIENTO DE MODELO DE RECOMENDACIONES
================================================================================

[1/4] Preparando dataset de interacciones...
✓ Interacciones positivas: 523
Generando 2092 ejemplos negativos...
✓ Ejemplos negativos generados: 2092
✓ Dataset total: 2615 ejemplos
  - Usuarios únicos: 45
  - Videos únicos: 89
  - Ratio positivos/negativos: 523/2092

[2/4] Guardando mappings...
✓ Mappings guardados en: backend/IA/mappings.joblib

[3/4] Creando modelo NCF...
Model: "NCF_Model"
...
✓ Modelo creado
  - Usuarios: 45
  - Videos: 89
  - Embedding dim: 64
  - Parámetros: 23,169

[4/4] Entrenando modelo (50 épocas)...
Epoch 1/50
...
✓ Entrenamiento completado
  - Loss final: 0.3245
  - Val Loss: 0.3512
  - Accuracy: 0.8532
  - Val Accuracy: 0.8421

[5/5] Guardando modelo en: backend/IA/tf_saved_model/
✓ Modelo guardado en: backend/IA/tf_saved_model/

================================================================================
✓ ENTRENAMIENTO EXITOSO
================================================================================
```

### 3. Verificar que Funciona

#### Desde Python/Django shell:

```python
python manage.py shell

>>> from IA.inference import get_recommendations_for_user
>>> recommendations = get_recommendations_for_user(user_id=1, top_n=5)
>>> print(recommendations)
[12, 45, 23, 67, 34]  # IDs de videos recomendados
```

#### Desde el Frontend:

1. Inicia el backend: `python manage.py runserver`
2. Inicia el frontend: `npm run dev` (en carpeta frontend)
3. Inicia sesión en la aplicación
4. Ve al Catálogo
5. Deberías ver una sección **"Recomendados para ti"** al inicio

#### Desde API REST:

```bash
# Obtener token
curl -X POST http://localhost:8000/api/usuarios/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'

# Usar token para recomendaciones
curl -X GET "http://localhost:8000/api/catalogodigital/public/videos/recomendaciones/?limit=10" \
  -H "Authorization: Bearer <tu_access_token>"
```

Respuesta:

```json
{
  "results": [
    {
      "id": 12,
      "titulo": "Introducción a Python",
      "descripcion": "...",
      "url_video": "...",
      "total_likes": 34,
      ...
    },
    ...
  ],
  "count": 10,
  "message": "Recomendaciones personalizadas basadas en tu historial"
}
```

## 📊 Parámetros de Entrenamiento

### Básicos

- `--epochs`: Número de épocas (default: 50)

  - Más épocas = mejor ajuste pero más tiempo
  - Recomendado: 30-100

- `--batch-size`: Tamaño del batch (default: 256)

  - Mayor = más rápido pero más memoria
  - Recomendado: 128-512

- `--embedding-dim`: Dimensión de embeddings (default: 64)
  - Mayor = más expresivo pero más parámetros
  - Recomendado: 32-128

### Avanzados

- `--negative-ratio`: Ejemplos negativos por positivo (default: 4)

  - Mayor = más ejemplos negativos para entrenar
  - Recomendado: 3-6

- `--learning-rate`: Learning rate (default: 0.001)

  - Menor = más lento pero más estable
  - Recomendado: 0.0001-0.01

- `--dropout`: Tasa de dropout (default: 0.3)
  - Mayor = más regularización
  - Recomendado: 0.2-0.5

### Ejemplos

```powershell
# Entrenamiento rápido (pruebas)
python manage.py train_tf_recommender --epochs 20 --batch-size 128

# Entrenamiento balanceado (recomendado)
python manage.py train_tf_recommender --epochs 50 --batch-size 256 --embedding-dim 64

# Entrenamiento intensivo (mejor calidad, más tiempo)
python manage.py train_tf_recommender --epochs 100 --batch-size 512 --embedding-dim 128 --dropout 0.4
```

## 🔄 Reentrenamiento Periódico

El modelo debe reentrenarse periódicamente para incorporar nuevas interacciones.

### Opción 1: Manual

```powershell
# Ejecutar cuando tengas nuevos datos
python manage.py train_tf_recommender
```

### Opción 2: Cron (Linux/Mac)

```bash
# Crontab para reentrenar cada domingo a las 3 AM
0 3 * * 0 cd /path/to/backend && /path/to/venv/bin/python manage.py train_tf_recommender
```

### Opción 3: Windows Task Scheduler

1. Abre "Programador de tareas"
2. Crear tarea básica
3. Acción: Ejecutar programa
4. Programa: `C:\path\to\venv\Scripts\python.exe`
5. Argumentos: `manage.py train_tf_recommender`
6. Directorio: `C:\path\to\backend`

### Opción 4: Celery Beat (recomendado para producción)

```python
# En tu celerybeat_schedule:
from celery.schedules import crontab

app.conf.beat_schedule = {
    'retrain-recommender': {
        'task': 'IA.tasks.retrain_model',
        'schedule': crontab(hour=3, minute=0, day_of_week=0),  # Domingo 3 AM
    },
}
```

## 🐛 Troubleshooting

### Error: "Insufficient data for training"

**Causa**: Menos de 100 interacciones en la BD.

**Solución**:

1. Agrega más videos al catálogo
2. Genera interacciones de prueba:
   ```python
   python manage.py shell
   >>> from catalogodigital.models import *
   >>> from usuarios.models import User
   >>> # Crear usuarios y videos de prueba, luego interacciones
   ```

### Error: "No module named tensorflow"

**Solución**:

```powershell
pip install tensorflow>=2.14.0
```

### Error: "Model not found"

**Causa**: No has entrenado el modelo aún.

**Solución**:

```powershell
python manage.py train_tf_recommender
```

### Recomendaciones poco relevantes

**Posibles causas y soluciones**:

1. **Pocos datos**: Entrena con más interacciones
2. **Hiperparámetros**: Prueba aumentar `--embedding-dim` a 128
3. **Épocas**: Aumenta `--epochs` a 100
4. **Pesos**: Ajusta pesos en `backend/IA/data_preparation.py`:
   ```python
   def get_interaction_weights():
       return {
           'view': 1.0,
           'like': 5.0,  # Aumentar importancia de likes
           'comment': 4.0,
           'saved': 3.0,
           'share': 3.0,
       }
   ```

### Modelo lento al predecir

**Solución 1**: Cache en Redis

```python
# En tu view o servicio
import redis
r = redis.Redis()

def get_cached_recommendations(user_id):
    cache_key = f'recs:{user_id}'
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)

    # Calcular y cachear
    recs = get_recommendations_for_user(user_id)
    r.setex(cache_key, 3600, json.dumps(recs))  # TTL 1 hora
    return recs
```

**Solución 2**: Precomputar embeddings

```python
# Guardar embeddings de videos una vez
# Luego solo calcular producto punto (muy rápido)
```

## 📈 Monitoreo y Métricas

### Métricas durante entrenamiento

El comando imprime automáticamente:

- Loss de entrenamiento y validación
- Accuracy
- AUC (Area Under Curve)
- Precision y Recall

### Métricas en producción (recomendado implementar)

1. **Click-Through Rate (CTR)**:

   ```python
   CTR = clicks_recomendaciones / impresiones_recomendaciones
   ```

2. **Tiempo de engagement**:

   - Duración promedio de videos recomendados vs. no recomendados

3. **Diversidad**:

   - Número de categorías únicas en recomendaciones

4. **Coverage**:
   - % de videos del catálogo que se recomiendan al menos una vez

## 🎯 Próximos Pasos (Mejoras Opcionales)

1. **Collaborative Filtering avanzado**: Usar ALS (Alternating Least Squares)
2. **Features de contenido**: Incorporar texto (título, descripción) con embeddings
3. **Modelos secuenciales**: LSTM/Transformer para capturar orden temporal
4. **A/B Testing**: Comparar modelo vs. reglas simples
5. **Cold start**: Estrategias para usuarios/videos nuevos
6. **Multi-objetivo**: Balancear relevancia, diversidad y novedad

## 📚 Referencias

- [TensorFlow Recommenders](https://www.tensorflow.org/recommenders)
- [Neural Collaborative Filtering Paper](https://arxiv.org/abs/1708.05031)
- [Building Recommendation Systems](https://www.manning.com/books/practical-recommender-systems)
