from django.contrib import admin
from .models import (
    Project,
    Category,
    UserProfile,
    ProjectScreenshot,
    Experience,
    ExperienceImage,
    Skill,
    Achievement,
    ContactMessage,
)

# Register your models here.


class ProjectScreenshotInline(admin.TabularInline):
    model = ProjectScreenshot
    extra = 1
    fields = ["image", "caption", "order"]


class ExperienceImageInline(admin.TabularInline):
    model = ExperienceImage
    extra = 1
    fields = ["image", "caption", "order"]


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "status", "created_at", "updated_at"]
    list_filter = ["category", "status", "created_at"]
    search_fields = ["title", "description", "project_name"]
    prepopulated_fields = {"slug": ("title",)}
    inlines = [ProjectScreenshotInline]


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "category_type",
        "icon",
        "color",
        "item_count",
        "created_at",
    ]
    search_fields = ["name", "description"]
    prepopulated_fields = {"slug": ("name",)}
    list_filter = ["category_type", "created_at"]

    def item_count(self, obj):
        return obj.item_count()

    item_count.short_description = "Items"


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ["full_name", "email", "status", "work_type", "updated_at"]
    list_filter = [
        "status",
        "work_type",
        "open_to_opportunities",
        "available_for_freelance",
    ]
    search_fields = ["full_name", "email", "title"]
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = (
        (
            "Personal Information",
            {"fields": ("full_name", "email", "phone", "location", "title", "bio")},
        ),
        ("Profile Image", {"fields": ("profile_image",)}),
        (
            "Social Links",
            {
                "fields": (
                    "github",
                    "linkedin",
                    "twitter",
                    "instagram",
                    "youtube",
                    "website",
                )
            },
        ),
        ("Documents", {"fields": ("resume", "cover_letter", "video_resume")}),
        ("SEO & Meta", {"fields": ("meta_title", "meta_description", "meta_keywords")}),
        (
            "Availability & Preferences",
            {
                "fields": (
                    "status",
                    "work_type",
                    "hourly_rate",
                    "experience_years",
                    "open_to_opportunities",
                    "available_for_freelance",
                )
            },
        ),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )


@admin.register(Experience)
class ExperienceAdmin(admin.ModelAdmin):
    list_display = [
        "position",
        "company_name",
        "employment_type",
        "employment_status",
        "start_date",
        "end_date",
        "is_active",
        "is_draft",
    ]
    list_filter = ["employment_type", "employment_status", "is_active", "is_draft"]
    search_fields = ["position", "company_name", "short_description"]
    prepopulated_fields = {"slug": ("position",)}
    inlines = [ExperienceImageInline]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "skill_level",
        "proficiency",
        "is_active",
        "is_draft",
        "created_at",
    ]
    list_filter = ["skill_level", "is_active", "is_draft"]
    search_fields = ["name", "description"]
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ["created_at", "updated_at"]
    fieldsets = (
        (
            "Basic Information",
            {
                "fields": (
                    "name",
                    "slug",
                    "skill_level",
                    "proficiency",
                    "description",
                )
            },
        ),
        (
            "Icon Options",
            {"fields": ("icon_type", "icon_image", "icon_class")},
        ),
        (
            "Certificate Options",
            {"fields": ("certificate_type", "certificate_file", "certificate_url")},
        ),
        (
            "Status & Ordering",
            {"fields": ("is_active", "is_draft", "order")},
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at")},
        ),
    )


@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "category",
        "issuing_organization",
        "achievement_date",
        "is_active",
        "is_draft",
        "created_at",
    ]
    list_filter = ["category", "is_active", "is_draft", "achievement_date"]
    search_fields = ["title", "issuing_organization", "short_description"]
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ["created_at", "updated_at"]
    fieldsets = (
        (
            "Basic Information",
            {
                "fields": (
                    "title",
                    "slug",
                    "category",
                    "issuing_organization",
                    "achievement_date",
                    "expiration_date",
                    "no_expiration",
                )
            },
        ),
        (
            "Description",
            {"fields": ("short_description", "full_description")},
        ),
        (
            "Credential Options",
            {"fields": ("credential_type", "credential_file", "credential_url", "credential_id")},
        ),
        (
            "Additional Info",
            {"fields": ("related_link",)},
        ),
        (
            "Status & Ordering",
            {"fields": ("is_active", "is_draft", "order")},
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at")},
        ),
    )


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = [
        "full_name",
        "email",
        "is_urgent",
        "is_read",
        "created_at",
    ]
    list_filter = ["is_urgent", "is_read", "created_at"]
    search_fields = ["full_name", "email", "message"]
    readonly_fields = ["ip_address", "user_agent", "created_at"]
    fieldsets = (
        (
            "Sender",
            {"fields": ("full_name", "email")},
        ),
        (
            "Message",
            {"fields": ("message", "is_urgent", "is_read")},
        ),
        (
            "Request Metadata",
            {"fields": ("source", "ip_address", "user_agent", "created_at")},
        ),
    )
