from django.conf import settings


def global_settings(_request):
    return {
        'tinymce_api_key': settings.TINYMCE_API_KEY,
    }
