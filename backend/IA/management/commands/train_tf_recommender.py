"""
Comando Django para entrenar el modelo de recomendaciones con TensorFlow
"""
from django.core.management.base import BaseCommand
import os


class Command(BaseCommand):
    help = 'Entrena el modelo de recomendaciones con TensorFlow usando datos reales de la BD'

    def add_arguments(self, parser):
        parser.add_argument(
            '--model-path',
            type=str,
            default='backend/IA/tf_saved_model/',
            help='Ruta donde guardar el modelo entrenado'
        )
        parser.add_argument(
            '--epochs',
            type=int,
            default=50,
            help='Número de épocas de entrenamiento'
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=256,
            help='Tamaño del batch'
        )
        parser.add_argument(
            '--embedding-dim',
            type=int,
            default=64,
            help='Dimensión de los embeddings'
        )
        parser.add_argument(
            '--negative-ratio',
            type=int,
            default=4,
            help='Ratio de ejemplos negativos por positivo'
        )
        parser.add_argument(
            '--learning-rate',
            type=float,
            default=0.001,
            help='Learning rate para Adam optimizer'
        )
        parser.add_argument(
            '--dropout',
            type=float,
            default=0.3,
            help='Tasa de dropout'
        )

    def handle(self, *args, **options):
        model_path = options['model_path']
        epochs = options['epochs']
        batch_size = options['batch_size']
        embedding_dim = options['embedding_dim']
        negative_ratio = options['negative_ratio']
        learning_rate = options['learning_rate']
        dropout = options['dropout']

        self.stdout.write(self.style.SUCCESS('\n' + '='*80))
        self.stdout.write(self.style.SUCCESS('ENTRENAMIENTO DE MODELO DE RECOMENDACIONES'))
        self.stdout.write(self.style.SUCCESS('='*80))
        
        try:
            # Importar módulos del sistema IA
            from IA import data_preparation, tf_model
            
            # Paso 1: Preparar dataset
            self.stdout.write('\n[1/4] Preparando dataset de interacciones...')
            user_ids, video_ids, labels, user_to_idx, video_to_idx = data_preparation.build_interaction_dataset(
                negative_ratio=negative_ratio
            )
            
            # Guardar mappings
            self.stdout.write('\n[2/4] Guardando mappings...')
            mappings_path = os.path.dirname(model_path)
            data_preparation.save_mappings(user_to_idx, video_to_idx, output_path=mappings_path)
            
            # Paso 2: Crear modelo
            self.stdout.write('\n[3/4] Creando modelo NCF...')
            num_users = len(user_to_idx)
            num_videos = len(video_to_idx)
            
            model = tf_model.create_ncf_model(
                num_users=num_users,
                num_videos=num_videos,
                embedding_dim=embedding_dim,
                dropout_rate=dropout,
                learning_rate=learning_rate
            )
            
            tf_model.print_model_summary(model)
            
            self.stdout.write(self.style.SUCCESS(f'✓ Modelo creado'))
            self.stdout.write(f'  - Usuarios: {num_users}')
            self.stdout.write(f'  - Videos: {num_videos}')
            self.stdout.write(f'  - Embedding dim: {embedding_dim}')
            self.stdout.write(f'  - Parámetros: {model.count_params():,}')
            
            # Paso 3: Entrenar
            self.stdout.write(f'\n[4/4] Entrenando modelo ({epochs} épocas)...')
            self.stdout.write(self.style.WARNING('Esto puede tardar varios minutos...\n'))
            
            history = tf_model.train_model(
                model=model,
                user_ids=user_ids,
                video_ids=video_ids,
                labels=labels,
                epochs=epochs,
                batch_size=batch_size,
                validation_split=0.2,
                verbose=1
            )
            
            # Mostrar resultados finales
            final_loss = history.history['loss'][-1]
            final_val_loss = history.history['val_loss'][-1]
            final_accuracy = history.history['accuracy'][-1]
            final_val_accuracy = history.history['val_accuracy'][-1]
            
            self.stdout.write(self.style.SUCCESS('\n✓ Entrenamiento completado'))
            self.stdout.write(f'  - Loss final: {final_loss:.4f}')
            self.stdout.write(f'  - Val Loss: {final_val_loss:.4f}')
            self.stdout.write(f'  - Accuracy: {final_accuracy:.4f}')
            self.stdout.write(f'  - Val Accuracy: {final_val_accuracy:.4f}')
            
            # Paso 4: Guardar modelo
            self.stdout.write(f'\n[5/5] Guardando modelo en: {model_path}')
            tf_model.save_model(model, output_path=model_path)
            
            self.stdout.write(self.style.SUCCESS('\n' + '='*80))
            self.stdout.write(self.style.SUCCESS('✓ ENTRENAMIENTO EXITOSO'))
            self.stdout.write(self.style.SUCCESS('='*80))
            self.stdout.write(self.style.SUCCESS(f'\nModelo guardado en: {model_path}'))
            self.stdout.write(self.style.SUCCESS(f'Mappings guardados en: {mappings_path}/mappings.joblib'))
            self.stdout.write('\nPara usar el modelo en producción:')
            self.stdout.write('  1. El endpoint /api/catalogodigital/public/videos/recomendaciones/ ya lo usará automáticamente')
            self.stdout.write('  2. Ejecuta este comando periódicamente para reentrenar con nuevos datos')
            self.stdout.write('  3. Considera usar cache (Redis) para mejorar performance\n')
            
        except RuntimeError as e:
            self.stderr.write(self.style.ERROR(f'\n✗ Error durante entrenamiento:'))
            self.stderr.write(self.style.ERROR(str(e)))
            self.stderr.write('\nPosibles soluciones:')
            self.stderr.write('  - Asegúrate de tener suficientes interacciones en la BD (>100)')
            self.stderr.write('  - Verifica que haya videos publicados')
            self.stderr.write('  - Instala dependencias: pip install -r backend/IA/requirements.txt\n')
            raise
        except Exception as e:
            self.stderr.write(self.style.ERROR(f'\n✗ Error inesperado:'))
            self.stderr.write(self.style.ERROR(str(e)))
            raise
