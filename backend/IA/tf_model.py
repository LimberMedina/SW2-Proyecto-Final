"""
Arquitectura del modelo de recomendaciones con TensorFlow
Neural Collaborative Filtering (NCF) con embeddings
"""
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, Model
import numpy as np
from typing import Tuple


def create_ncf_model(
    num_users: int,
    num_videos: int,
    embedding_dim: int = 64,
    dropout_rate: float = 0.3,
    learning_rate: float = 0.001
) -> Model:
    """
    Crea modelo NCF (Neural Collaborative Filtering).
    
    Arquitectura:
    - Embeddings separados para usuarios y videos
    - Concatenación de embeddings
    - MLP con capas densas y dropout
    - Salida sigmoid para score de interacción
    
    Args:
        num_users: Número total de usuarios en el dataset
        num_videos: Número total de videos en el dataset
        embedding_dim: Dimensión de los embeddings
        dropout_rate: Tasa de dropout para regularización
        learning_rate: Learning rate para el optimizador Adam
        
    Returns:
        Modelo compilado de Keras
    """
    # Inputs
    user_input = layers.Input(shape=(), dtype=tf.int32, name='user_id')
    video_input = layers.Input(shape=(), dtype=tf.int32, name='video_id')
    
    # Embeddings
    user_embedding = layers.Embedding(
        input_dim=num_users,
        output_dim=embedding_dim,
        embeddings_regularizer=keras.regularizers.l2(1e-6),
        name='user_embedding'
    )(user_input)
    
    video_embedding = layers.Embedding(
        input_dim=num_videos,
        output_dim=embedding_dim,
        embeddings_regularizer=keras.regularizers.l2(1e-6),
        name='video_embedding'
    )(video_input)
    
    # Flatten embeddings
    user_vec = layers.Flatten(name='user_flatten')(user_embedding)
    video_vec = layers.Flatten(name='video_flatten')(video_embedding)
    
    # Concatenar embeddings
    concat = layers.Concatenate(name='concat')([user_vec, video_vec])
    
    # MLP layers
    dense1 = layers.Dense(128, activation='relu', name='dense1')(concat)
    dropout1 = layers.Dropout(dropout_rate, name='dropout1')(dense1)
    
    dense2 = layers.Dense(64, activation='relu', name='dense2')(dropout1)
    dropout2 = layers.Dropout(dropout_rate * 0.7, name='dropout2')(dense2)
    
    # Output layer
    output = layers.Dense(1, activation='sigmoid', name='output')(dropout2)
    
    # Construir modelo
    model = Model(inputs=[user_input, video_input], outputs=output, name='NCF_Model')
    
    # Compilar
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=learning_rate),
        loss='binary_crossentropy',
        metrics=[
            keras.metrics.BinaryAccuracy(name='accuracy'),
            keras.metrics.AUC(name='auc'),
            keras.metrics.Precision(name='precision'),
            keras.metrics.Recall(name='recall')
        ]
    )
    
    return model


def train_model(
    model: Model,
    user_ids: np.ndarray,
    video_ids: np.ndarray,
    labels: np.ndarray,
    epochs: int = 50,
    batch_size: int = 256,
    validation_split: float = 0.2,
    verbose: int = 1
) -> keras.callbacks.History:
    """
    Entrena el modelo NCF.
    
    Args:
        model: Modelo de Keras a entrenar
        user_ids: Array de IDs de usuarios (índices)
        video_ids: Array de IDs de videos (índices)
        labels: Array de labels (0 o 1)
        epochs: Número de épocas
        batch_size: Tamaño del batch
        validation_split: Fracción de datos para validación
        verbose: Nivel de verbosidad (0, 1, 2)
        
    Returns:
        Historia del entrenamiento
    """
    # Callbacks
    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=5,
            restore_best_weights=True,
            verbose=1
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=3,
            min_lr=1e-6,
            verbose=1
        )
    ]
    
    # Entrenar
    history = model.fit(
        x={'user_id': user_ids, 'video_id': video_ids},
        y=labels,
        epochs=epochs,
        batch_size=batch_size,
        validation_split=validation_split,
        callbacks=callbacks,
        verbose=verbose
    )
    
    return history


def save_model(model: Model, output_path: str = 'backend/IA/tf_saved_model/'):
    """
    Guarda el modelo entrenado en formato SavedModel de TensorFlow.
    
    Args:
        model: Modelo entrenado
        output_path: Ruta donde guardar el modelo
    """
    import os
    
    os.makedirs(output_path, exist_ok=True)
    model.save(output_path, save_format='tf')
    print(f"✓ Modelo guardado en: {output_path}")


def load_model(model_path: str = 'backend/IA/tf_saved_model/') -> Model:
    """
    Carga un modelo entrenado desde disco.
    
    Args:
        model_path: Ruta del modelo SavedModel
        
    Returns:
        Modelo de Keras cargado
    """
    model = keras.models.load_model(model_path)
    return model


def print_model_summary(model: Model):
    """Imprime resumen del modelo"""
    print("\n" + "="*80)
    print("ARQUITECTURA DEL MODELO")
    print("="*80)
    model.summary()
    print("="*80 + "\n")
