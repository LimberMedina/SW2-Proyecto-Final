from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.conf import settings
import os
import random
import datetime

User = get_user_model()

class Command(BaseCommand):
    help = 'Genera interacciones dummy (visualizaciones, likes, comentarios, guardados, compartidos) para pruebas de entrenamiento'

    def add_arguments(self, parser):
        parser.add_argument('--target', type=int, default=200, help='Número total objetivo de interacciones (positivas)')
        parser.add_argument('--create-videos', action='store_true', help='Crear videos de prueba si no hay videos publicados')
        parser.add_argument('--videos', type=int, default=10, help='Número de videos a crear si --create-videos')
        parser.add_argument('--users', type=int, default=10, help='Número de usuarios a crear si hay pocos usuarios')

    def handle(self, *args, **options):
        target = options['target']
        create_videos_flag = options['create_videos']
        videos_to_create = options['videos']
        users_to_create = options['users']

        from catalogodigital.models import (
            Video, VisualizacionVideo, LikeVideo, ComentarioVideo, VideoGuardado, CompartirVideo,
            Catalogo, Categoria, Capitulo
        )

        # Contar interacciones existentes
        total_interactions = 0
        total_interactions += VisualizacionVideo.objects.count()
        total_interactions += LikeVideo.objects.count()
        total_interactions += ComentarioVideo.objects.count()
        total_interactions += VideoGuardado.objects.count()
        total_interactions += CompartirVideo.objects.count()

        self.stdout.write(f"Interacciones existentes: {total_interactions}")

        if total_interactions >= target:
            self.stdout.write(self.style.SUCCESS(f"Ya hay {total_interactions} interacciones (>= target {target}), no se necesita generar más."))
            return

        # Asegurar suficientes usuarios
        users = list(User.objects.all())
        if len(users) < 3:
            self.stdout.write(f"Usuarios actuales: {len(users)}. Creando {users_to_create} usuarios de prueba...")
            for i in range(users_to_create):
                username = f"ia_test_user_{i}_{random.randint(1000,9999)}"
                try:
                    user = User.objects.create_user(username=username, email=f"{username}@example.com", password='password123')
                    users.append(user)
                except Exception as e:
                    self.stderr.write(f"No se pudo crear usuario {username}: {e}")
            self.stdout.write(self.style.SUCCESS(f"Usuarios totales ahora: {len(users)}"))

        # Obtener videos publicados
        videos_qs = Video.objects.filter(activo=True, estado='PUBLICADO')
        videos = list(videos_qs)

        if not videos and create_videos_flag:
            self.stdout.write("No hay videos publicados: creando videos de prueba...")
            # Crear estructura mínima: catalogo->categoria->capitulo
            admin_user = users[0] if users else None
            if not admin_user:
                self.stderr.write("No hay usuarios disponibles para asignar como autor/administrador.")
                return
            catalogo, _ = Catalogo.objects.get_or_create(nombre='Catalogo IA', defaults={'activo': True, 'administrador': admin_user})
            categoria, _ = Categoria.objects.get_or_create(catalogo=catalogo, codigo='IA', defaults={'nombre': 'Categoria IA', 'administrador': admin_user, 'activo': True})
            capitulo, _ = Capitulo.objects.get_or_create(categoria=categoria, nombre='Capitulo IA', defaults={'administrador': admin_user, 'activo': True})

            media_root = getattr(settings, 'MEDIA_ROOT', os.path.join(os.path.dirname(settings.BASE_DIR), 'media'))
            ia_dir = os.path.join(media_root, 'IA_dummy')
            os.makedirs(ia_dir, exist_ok=True)

            dummy_file_path = os.path.join(ia_dir, 'dummy_video.mp4')
            # Crear archivo binario pequeño si no existe
            if not os.path.exists(dummy_file_path):
                with open(dummy_file_path, 'wb') as f:
                    f.write(os.urandom(1024))

            for i in range(videos_to_create):
                title = f"Video de prueba IA {i}"
                try:
                    v = Video.objects.create(
                        titulo=title,
                        descripcion='Video creado para pruebas de IA',
                        estado='PUBLICADO',
                        archivo_video=os.path.join('IA_dummy', 'dummy_video.mp4'),
                        capitulo=capitulo,
                        autor=users[i % len(users)],
                        fecha_publicacion=datetime.datetime.now(),
                        activo=True
                    )
                    videos.append(v)
                except Exception as e:
                    self.stderr.write(f"No se pudo crear video '{title}': {e}")
            self.stdout.write(self.style.SUCCESS(f"Videos de prueba creados: {len(videos)}"))

        if not videos:
            self.stderr.write("No hay videos disponibles. Ejecuta con --create-videos o sube videos reales antes de generar interacciones.")
            return

        # Generar interacciones aleatorias hasta alcanzar target
        existing_pairs = set(VisualizacionVideo.objects.values_list('usuario_id', 'video_id'))
        created = 0

        users_ids = [u.id for u in users]
        video_ids = [v.id for v in videos]

        # Mientras falten interacciones
        attempts = 0
        max_attempts = target * 10
        while total_interactions < target and attempts < max_attempts:
            attempts += 1
            uid = random.choice(users_ids)
            vid = random.choice(video_ids)
            # Crear visualización si no existe
            try:
                with transaction.atomic():
                    if not VisualizacionVideo.objects.filter(usuario_id=uid, video_id=vid).exists():
                        VisualizacionVideo.objects.create(usuario_id=uid, video_id=vid, progreso=random.uniform(20.0, 100.0), completado=random.choice([True, False]))
                        total_interactions += 1
                        created += 1
                    # A veces crear like
                    if random.random() < 0.4 and not LikeVideo.objects.filter(usuario_id=uid, video_id=vid).exists():
                        LikeVideo.objects.create(usuario_id=uid, video_id=vid)
                        total_interactions += 1
                    # A veces crear guardado
                    if random.random() < 0.2 and not VideoGuardado.objects.filter(usuario_id=uid, video_id=vid).exists():
                        VideoGuardado.objects.create(usuario_id=uid, video_id=vid)
                        total_interactions += 1
                    # A veces crear comentario
                    if random.random() < 0.15:
                        ComentarioVideo.objects.create(usuario_id=uid, video_id=vid, texto='Comentario de prueba generado por IA')
                        total_interactions += 1
                    # A veces crear compartir
                    if random.random() < 0.1:
                        CompartirVideo.objects.create(usuario_id=uid, video_id=vid, tipo='LINK', ip_address='127.0.0.1')
                        total_interactions += 1
            except IntegrityError:
                # duplicado por unique_together, ignorar
                continue

        self.stdout.write(self.style.SUCCESS(f"Generadas ~{created} nuevas visualizaciones. Total de interacciones: {total_interactions}"))
        if total_interactions < target:
            self.stdout.write(self.style.WARNING(f"No se alcanzó el objetivo ({target}). Considera aumentar el número de usuarios o videos creados."))
        else:
            self.stdout.write(self.style.SUCCESS(f"Objetivo alcanzado: {total_interactions} interacciones."))
