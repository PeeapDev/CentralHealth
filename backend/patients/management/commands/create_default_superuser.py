from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import IntegrityError

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates a default superuser'

    def handle(self, *args, **options):
        try:
            superuser = User.objects.create_superuser(
                username='admin@hospital.com',
                email='admin@hospital.com',
                password='Hospital@123',
                first_name='Admin',
                last_name='User'
            )
            self.stdout.write(self.style.SUCCESS('Successfully created superuser'))
        except IntegrityError:
            self.stdout.write(self.style.WARNING('Superuser already exists'))
