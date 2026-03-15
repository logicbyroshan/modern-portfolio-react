from django.core.management.base import BaseCommand
from portfolio.models import Category


class Command(BaseCommand):
    help = 'Add all achievement categories with appropriate icons'

    def handle(self, *args, **kwargs):
        achievement_categories = [
            {
                'name': 'Certification',
                'slug': 'certification',
                'icon': 'fas fa-certificate',
                'color': '#3b82f6',
                'description': 'Professional certifications and qualifications'
            },
            {
                'name': 'Award',
                'slug': 'award',
                'icon': 'fas fa-trophy',
                'color': '#f59e0b',
                'description': 'Awards and honors received'
            },
            {
                'name': 'Competition',
                'slug': 'competition',
                'icon': 'fas fa-medal',
                'color': '#10b981',
                'description': 'Competition wins and achievements'
            },
            {
                'name': 'Recognition',
                'slug': 'recognition',
                'icon': 'fas fa-award',
                'color': '#8b5cf6',
                'description': 'Recognition and acknowledgments'
            },
            {
                'name': 'Publication',
                'slug': 'publication',
                'icon': 'fas fa-book',
                'color': '#06b6d4',
                'description': 'Published works and papers'
            },
            {
                'name': 'Patent',
                'slug': 'patent',
                'icon': 'fas fa-lightbulb',
                'color': '#ec4899',
                'description': 'Patents and intellectual property'
            },
        ]

        created_count = 0
        updated_count = 0

        for cat_data in achievement_categories:
            category, created = Category.objects.update_or_create(
                slug=cat_data['slug'],
                category_type='achievement',
                defaults={
                    'name': cat_data['name'],
                    'icon': cat_data['icon'],
                    'color': cat_data['color'],
                    'description': cat_data['description']
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(
                    f'✓ Created category: {category.name} ({category.icon})'
                ))
            else:
                updated_count += 1
                self.stdout.write(self.style.WARNING(
                    f'↻ Updated category: {category.name} ({category.icon})'
                ))

        self.stdout.write(self.style.SUCCESS(
            f'\nCompleted: {created_count} created, {updated_count} updated'
        ))
