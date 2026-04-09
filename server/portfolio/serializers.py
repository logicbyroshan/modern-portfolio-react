from rest_framework import serializers

from .models import (
    Achievement,
    Category,
    ContactMessage,
    Experience,
    ExperienceImage,
    Project,
    ProjectScreenshot,
    Skill,
    UserProfile,
)


class ProjectScreenshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectScreenshot
        fields = ["id", "image", "caption", "order", "uploaded_at"]


class ExperienceImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExperienceImage
        fields = ["id", "image", "caption", "order"]


class CategorySerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()
    category_type_display = serializers.CharField(
        source="get_category_type_display", read_only=True
    )

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "category_type",
            "category_type_display",
            "description",
            "icon",
            "color",
            "item_count",
            "created_at",
            "updated_at",
        ]

    def get_item_count(self, obj):
        return obj.item_count()


class ProjectSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    screenshots = ProjectScreenshotSerializer(many=True, read_only=True)
    technologies_list = serializers.ListField(source="tech_list", read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "project_name",
            "documentation",
            "category",
            "technologies",
            "technologies_list",
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
            "screenshots",
            "created_at",
            "updated_at",
        ]


class ExperienceSerializer(serializers.ModelSerializer):
    images = ExperienceImageSerializer(many=True, read_only=True)
    duration = serializers.CharField(read_only=True)
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Experience
        fields = [
            "id",
            "position",
            "slug",
            "employment_type",
            "employment_status",
            "category",
            "location",
            "company_name",
            "company_about",
            "company_website",
            "company_logo",
            "start_date",
            "end_date",
            "currently_working",
            "duration",
            "short_description",
            "detailed_description",
            "is_active",
            "is_draft",
            "order",
            "images",
            "created_at",
            "updated_at",
        ]


class SkillSerializer(serializers.ModelSerializer):
    skill_level_display = serializers.CharField(
        source="get_skill_level_display", read_only=True
    )
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Skill
        fields = [
            "id",
            "name",
            "slug",
            "skill_level",
            "skill_level_display",
            "category",
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
        ]


class AchievementSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    icon = serializers.SerializerMethodField()

    class Meta:
        model = Achievement
        fields = [
            "id",
            "title",
            "slug",
            "category",
            "icon",
            "issuing_organization",
            "achievement_date",
            "expiration_date",
            "no_expiration",
            "short_description",
            "full_description",
            "credential_type",
            "credential_file",
            "credential_url",
            "credential_id",
            "related_link",
            "is_active",
            "is_draft",
            "order",
            "created_at",
            "updated_at",
        ]

    def get_icon(self, obj):
        return obj.get_icon()


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
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
        ]


class PortfolioSummarySerializer(serializers.Serializer):
    total_projects = serializers.IntegerField()
    total_experience = serializers.IntegerField()
    total_skills = serializers.IntegerField()
    total_achievements = serializers.IntegerField()
    active_projects = serializers.IntegerField()
    active_experience = serializers.IntegerField()
    active_skills = serializers.IntegerField()
    active_achievements = serializers.IntegerField()
    years_of_experience = serializers.IntegerField()


class ContactMessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["full_name", "email", "message", "is_urgent"]
