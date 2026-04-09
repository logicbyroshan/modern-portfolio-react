from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.conf import settings
from django.db.models import Count, Prefetch, Q
from django.utils import timezone
from datetime import timedelta
import ipaddress
import re
import secrets
from .models import (
    ContactMessage,
    Project,
    ProjectScreenshot,
    Experience,
    ExperienceImage,
    Skill,
    Achievement,
    Category,
    UserProfile,
)
from .serializers import (
    ProjectSerializer,
    ExperienceSerializer,
    SkillSerializer,
    AchievementSerializer,
    CategorySerializer,
    UserProfileSerializer,
    PortfolioSummarySerializer,
    ContactMessageCreateSerializer,
)


class ReadOnlyPermission(permissions.BasePermission):
    """
    Custom permission to only allow read operations (GET, HEAD, OPTIONS).
    No write operations allowed from external sources.
    """
    def has_permission(self, request, view):
        # Only allow safe methods (GET, HEAD, OPTIONS)
        return request.method in permissions.SAFE_METHODS


class APIKeyPermission(permissions.BasePermission):
    """
    Optional API key permission.

    If settings.API_KEY is configured, requests must include matching
    X-API-Key header. If API_KEY is empty, the check is skipped.
    """
    def has_permission(self, request, view):
        configured_key = (getattr(settings, 'API_KEY', '') or '').strip()
        if not configured_key:
            return True

        api_key = (request.headers.get('X-API-Key') or '').strip()
        if not api_key:
            return False
        return secrets.compare_digest(api_key, configured_key)


def extract_client_ip(request):
    candidates = []

    if getattr(settings, 'TRUST_X_FORWARDED_FOR', False):
        forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR', '')
        if forwarded_for:
            candidates.append(forwarded_for.split(',')[0].strip())

    candidates.append(request.META.get('REMOTE_ADDR'))

    for candidate in candidates:
        if not candidate:
            continue
        try:
            return str(ipaddress.ip_address(candidate))
        except ValueError:
            continue

    return None


def category_with_counts_queryset():
    return Category.objects.with_item_counts().only(
        "id",
        "name",
        "slug",
        "category_type",
        "description",
        "icon",
        "color",
        "created_at",
        "updated_at",
    )


def bootstrap_profile_queryset():
    return UserProfile.objects.only(
        "id",
        "full_name",
        "email",
        "phone",
        "location",
        "title",
        "bio",
        "profile_image",
        "github",
        "linkedin",
        "twitter",
        "instagram",
        "youtube",
        "website",
        "video_resume",
        "meta_title",
        "meta_description",
        "meta_keywords",
        "status",
        "work_type",
        "hourly_rate",
        "experience_years",
        "open_to_opportunities",
        "available_for_freelance",
        "created_at",
        "updated_at",
    )


def bootstrap_projects_queryset():
    return (
        Project.objects.filter(is_active=True, is_featured=True)
        .exclude(status="draft")
        .only(
            "id",
            "title",
            "slug",
            "description",
            "project_name",
            "documentation",
            "category_id",
            "technologies",
            "thumbnail",
            "github_url",
            "live_url",
            "demo_url",
            "other_url",
            "start_date",
            "end_date",
            "client",
            "status",
            "is_active",
            "is_featured",
            "views",
            "likes",
            "order",
            "created_at",
            "updated_at",
        )
        .prefetch_related(
            Prefetch("category", queryset=category_with_counts_queryset()),
            Prefetch(
                "screenshots",
                queryset=ProjectScreenshot.objects.only(
                    "id",
                    "project_id",
                    "image",
                    "caption",
                    "order",
                    "uploaded_at",
                ).order_by("order", "-uploaded_at"),
            ),
        )
        .order_by("-order", "-created_at")
    )


def bootstrap_skills_queryset():
    return (
        Skill.objects.filter(is_active=True, is_draft=False)
        .only(
            "id",
            "name",
            "slug",
            "skill_level",
            "category_id",
            "proficiency",
            "description",
            "icon_type",
            "icon_image",
            "icon_class",
            "certificate_type",
            "certificate_file",
            "certificate_url",
            "is_active",
            "is_draft",
            "order",
            "created_at",
            "updated_at",
        )
        .prefetch_related(Prefetch("category", queryset=category_with_counts_queryset()))
        .order_by("-proficiency", "name")
    )


def bootstrap_experience_queryset():
    return (
        Experience.objects.filter(is_active=True, is_draft=False)
        .only(
            "id",
            "position",
            "slug",
            "employment_type",
            "employment_status",
            "category_id",
            "location",
            "company_name",
            "company_about",
            "company_website",
            "company_logo",
            "start_date",
            "end_date",
            "currently_working",
            "short_description",
            "detailed_description",
            "is_active",
            "is_draft",
            "order",
            "created_at",
            "updated_at",
        )
        .prefetch_related(
            Prefetch("category", queryset=category_with_counts_queryset()),
            Prefetch(
                "images",
                queryset=ExperienceImage.objects.only(
                    "id",
                    "experience_id",
                    "image",
                    "caption",
                    "order",
                ).order_by("order"),
            ),
        )
        .order_by("-order", "-start_date")
    )


class ProjectViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for projects (READ ONLY).
    
    GET /api/projects/ - List all active projects
    GET /api/projects/{id}/ - Get single project
    GET /api/projects/featured/ - Get featured projects
    """
    serializer_class = ProjectSerializer
    permission_classes = [ReadOnlyPermission, APIKeyPermission]
    lookup_field = 'slug'
    
    def get_queryset(self):
        """Return only active projects."""
        queryset = (
            Project.objects.filter(is_active=True)
            .exclude(status='draft')
            .only(
                'id',
                'title',
                'slug',
                'description',
                'project_name',
                'documentation',
                'category_id',
                'technologies',
                'thumbnail',
                'github_url',
                'live_url',
                'demo_url',
                'other_url',
                'start_date',
                'end_date',
                'client',
                'status',
                'is_active',
                'is_featured',
                'views',
                'likes',
                'order',
                'created_at',
                'updated_at',
            )
            .prefetch_related(
                Prefetch('category', queryset=category_with_counts_queryset()),
                Prefetch(
                    'screenshots',
                    queryset=ProjectScreenshot.objects.only(
                        'id',
                        'project_id',
                        'image',
                        'caption',
                        'order',
                        'uploaded_at',
                    ).order_by('order', '-uploaded_at'),
                ),
            )
        )
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category__slug=category)
        
        # Filter by status
        project_status = self.request.query_params.get('status', None)
        if project_status:
            queryset = queryset.filter(status=project_status)

        featured = self.request.query_params.get('featured', None)
        if featured is not None:
            is_featured = str(featured).lower() in {'1', 'true', 'yes'}
            queryset = queryset.filter(is_featured=is_featured)
        
        return queryset.order_by('-order', '-created_at')
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get top 6 featured active projects."""
        projects = self.get_queryset().filter(is_featured=True)[:6]
        serializer = self.get_serializer(projects, many=True)
        return Response(serializer.data)


class ExperienceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for experience (READ ONLY).
    
    GET /api/experience/ - List all active experience
    GET /api/experience/{id}/ - Get single experience
    """
    serializer_class = ExperienceSerializer
    permission_classes = [ReadOnlyPermission, APIKeyPermission]
    lookup_field = 'slug'
    
    def get_queryset(self):
        """Return only active, non-draft experience"""
        queryset = (
            Experience.objects.filter(
                is_active=True,
                is_draft=False,
            )
            .only(
                'id',
                'position',
                'slug',
                'employment_type',
                'employment_status',
                'category_id',
                'location',
                'company_name',
                'company_about',
                'company_website',
                'company_logo',
                'start_date',
                'end_date',
                'currently_working',
                'short_description',
                'detailed_description',
                'is_active',
                'is_draft',
                'order',
                'created_at',
                'updated_at',
            )
            .prefetch_related(
                Prefetch('category', queryset=category_with_counts_queryset()),
                Prefetch(
                    'images',
                    queryset=ExperienceImage.objects.only(
                        'id',
                        'experience_id',
                        'image',
                        'caption',
                        'order',
                    ).order_by('order'),
                ),
            )
        )

        employment_type = self.request.query_params.get('employment_type', None)
        if employment_type:
            queryset = queryset.filter(employment_type=employment_type)

        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category__slug=category)

        return queryset.order_by('-order', '-start_date')


class SkillViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for skills (READ ONLY).
    
    GET /api/skills/ - List all active skills
    GET /api/skills/{id}/ - Get single skill
    GET /api/skills/top/ - Get top skills by proficiency
    """
    serializer_class = SkillSerializer
    permission_classes = [ReadOnlyPermission, APIKeyPermission]
    lookup_field = 'slug'
    
    def get_queryset(self):
        """Return only active, non-draft skills"""
        queryset = (
            Skill.objects.filter(is_active=True, is_draft=False)
            .only(
                'id',
                'name',
                'slug',
                'skill_level',
                'category_id',
                'proficiency',
                'description',
                'icon_type',
                'icon_image',
                'icon_class',
                'certificate_type',
                'certificate_file',
                'certificate_url',
                'is_active',
                'is_draft',
                'order',
                'created_at',
                'updated_at',
            )
            .prefetch_related(Prefetch('category', queryset=category_with_counts_queryset()))
        )
        
        level = self.request.query_params.get('level', None)
        if level:
            queryset = queryset.filter(skill_level=level)

        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category__slug=category)
        
        return queryset.order_by('-proficiency', 'name')
    
    @action(detail=False, methods=['get'])
    def top(self, request):
        """Get top 10 skills by proficiency"""
        skills = self.get_queryset()[:10]
        serializer = self.get_serializer(skills, many=True)
        return Response(serializer.data)


class AchievementViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for achievements (READ ONLY).
    
    GET /api/achievements/ - List all active achievements
    GET /api/achievements/{id}/ - Get single achievement
    """
    serializer_class = AchievementSerializer
    permission_classes = [ReadOnlyPermission, APIKeyPermission]
    lookup_field = 'slug'
    
    def get_queryset(self):
        """Return only active, non-draft achievements"""
        queryset = (
            Achievement.objects.filter(is_active=True, is_draft=False)
            .only(
                'id',
                'title',
                'slug',
                'category_id',
                'issuing_organization',
                'achievement_date',
                'expiration_date',
                'no_expiration',
                'short_description',
                'full_description',
                'credential_type',
                'credential_file',
                'credential_url',
                'credential_id',
                'related_link',
                'is_active',
                'is_draft',
                'order',
                'created_at',
                'updated_at',
            )
            .prefetch_related(Prefetch('category', queryset=category_with_counts_queryset()))
        )
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category__slug=category)
        
        return queryset.order_by('-achievement_date', '-created_at')


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for categories (READ ONLY).
    
    GET /api/categories/ - List all categories
    GET /api/categories/{slug}/ - Get single category
    """
    serializer_class = CategorySerializer
    permission_classes = [ReadOnlyPermission, APIKeyPermission]
    lookup_field = 'slug'
    
    def get_queryset(self):
        """Return all categories"""
        queryset = category_with_counts_queryset()
        
        # Filter by type
        category_type = self.request.query_params.get('type', None)
        if category_type:
            queryset = queryset.filter(category_type=category_type)
        
        return queryset.order_by('category_type', 'name')


class UserProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for user profile (READ ONLY).
    
    GET /api/profile/ - Get user profile
    """
    serializer_class = UserProfileSerializer
    permission_classes = [ReadOnlyPermission, APIKeyPermission]
    
    def get_queryset(self):
        """Return user profile (only one)"""
        return bootstrap_profile_queryset()[:1]
    
    def list(self, request, *args, **kwargs):
        """Return single profile instead of list"""
        profile = UserProfile.objects.first()
        if profile:
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        return Response({}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([ReadOnlyPermission, APIKeyPermission])
def portfolio_summary(request):
    """
    Get portfolio summary statistics.
    
    GET /api/summary/ - Get overall portfolio stats
    """
    project_counts = Project.objects.aggregate(
        total=Count('id'),
        active=Count('id', filter=Q(is_active=True) & ~Q(status='draft')),
    )
    experience_counts = Experience.objects.aggregate(
        total=Count('id'),
        active=Count('id', filter=Q(is_active=True, is_draft=False)),
    )
    skill_counts = Skill.objects.aggregate(
        total=Count('id'),
        active=Count('id', filter=Q(is_active=True, is_draft=False)),
    )
    achievement_counts = Achievement.objects.aggregate(
        total=Count('id'),
        active=Count('id', filter=Q(is_active=True, is_draft=False)),
    )
    years_of_experience = UserProfile.objects.values_list('experience_years', flat=True).first() or 0

    data = {
        'total_projects': project_counts['total'],
        'total_experience': experience_counts['total'],
        'total_skills': skill_counts['total'],
        'total_achievements': achievement_counts['total'],
        'active_projects': project_counts['active'],
        'active_experience': experience_counts['active'],
        'active_skills': skill_counts['active'],
        'active_achievements': achievement_counts['active'],
        'years_of_experience': years_of_experience,
    }
    
    serializer = PortfolioSummarySerializer(data)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([ReadOnlyPermission, APIKeyPermission])
def portfolio_bootstrap(request):
    """
    Return key portfolio payload in one response for fast frontend hydration.

    GET /api/bootstrap/
    """
    serializer_context = {"request": request}

    profile = bootstrap_profile_queryset().first()
    featured_projects = bootstrap_projects_queryset()[:6]
    top_skills = bootstrap_skills_queryset()[:10]
    recent_experience = bootstrap_experience_queryset()[:6]

    return Response(
        {
            "profile": (
                UserProfileSerializer(profile, context=serializer_context).data
                if profile
                else None
            ),
            "projects": ProjectSerializer(
                featured_projects,
                many=True,
                context=serializer_context,
            ).data,
            "skills": SkillSerializer(
                top_skills,
                many=True,
                context=serializer_context,
            ).data,
            "experience": ExperienceSerializer(
                recent_experience,
                many=True,
                context=serializer_context,
            ).data,
        }
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def api_health_check(request):
    """
    Health check endpoint to verify API is running.
    
    GET /api/health/ - Check API health
    """
    return Response({
        'status': 'healthy',
        'message': 'Portfolio API is running',
        'version': '1.0.0',
        'read_only': True,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def create_contact_message(request):
    """
    Public endpoint for contact form submissions.

    POST /api/contact/
    """
    full_name = str(request.data.get('full_name', '')).strip()
    email = str(request.data.get('email', '')).strip().lower()
    raw_message = str(request.data.get('message', '')).strip()

    # Basic anti-spam checks before serializer validation.
    if len(full_name) < 2:
        return Response(
            {'success': False, 'message': 'Please enter your full name.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(raw_message) < 10:
        return Response(
            {'success': False, 'message': 'Message is too short.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(raw_message) > 5000:
        return Response(
            {'success': False, 'message': 'Message is too long.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    url_hits = len(re.findall(r'https?://|www\.', raw_message, flags=re.IGNORECASE))
    if url_hits > 2:
        return Response(
            {'success': False, 'message': 'Too many links in message.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    spam_patterns = [
        r'\bcrypto\b',
        r'\bcasino\b',
        r'\bviagra\b',
        r'\bseo\s+service\b',
        r'\bbuy\s+backlinks\b',
    ]
    if any(re.search(pattern, raw_message, flags=re.IGNORECASE) for pattern in spam_patterns):
        return Response(
            {'success': False, 'message': 'Message rejected by spam protection.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = ContactMessageCreateSerializer(
        data={
            'full_name': full_name,
            'email': email,
            'message': raw_message,
            'is_urgent': str(request.data.get('is_urgent', '')).strip().lower() in {
                '1',
                'true',
                'yes',
                'on',
            },
        }
    )
    serializer.is_valid(raise_exception=True)

    ip_address = extract_client_ip(request)

    now = timezone.now()
    recent_window = now - timedelta(minutes=10)
    duplicate_window = now - timedelta(hours=24)

    if ip_address:
        ip_count = ContactMessage.objects.filter(
            ip_address=ip_address,
            created_at__gte=recent_window,
        ).count()
        if ip_count >= 10:
            return Response(
                {
                    'success': False,
                    'message': 'Too many requests. Please wait a few minutes before sending again.',
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

    email_count = ContactMessage.objects.filter(
        email=email,
        created_at__gte=recent_window,
    ).count()
    if email_count >= 5:
        return Response(
            {
                'success': False,
                'message': 'Too many requests for this email. Please try again later.',
            },
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    is_duplicate = ContactMessage.objects.filter(
        email=email,
        message=raw_message,
        created_at__gte=duplicate_window,
    ).exists()
    if is_duplicate:
        return Response(
            {
                'success': False,
                'message': 'Duplicate message detected. Please wait for a response.',
            },
            status=status.HTTP_409_CONFLICT,
        )

    message = serializer.save(
        source='portfolio_site',
        ip_address=ip_address,
        user_agent=(request.META.get('HTTP_USER_AGENT') or '')[:255],
    )

    return Response(
        {
            'success': True,
            'id': message.id,
            'message': 'Thank you for reaching out. Your message has been received.',
        },
        status=status.HTTP_201_CREATED,
    )
