from django.urls import path
from . import views
from django.views.generic import TemplateView
from django.contrib.admin.views.decorators import staff_member_required


def admin_staff_view(view_func):
    return staff_member_required(view_func, login_url="/admin/login/")

urlpatterns = [
    # Dashboard
    path("", admin_staff_view(views.dashboard), name="dashboard"),
    # API Documentation
    path("api-docs/", TemplateView.as_view(template_name="api_documentation.html"), name="api_documentation"),
    # Projects
    path("projects/", admin_staff_view(views.manage_projects), name="manage_projects"),
    path("projects/create/", admin_staff_view(views.create_project), name="create_project"),
    path("projects/<int:project_id>/edit/", admin_staff_view(views.edit_project), name="edit_project"),
    path(
        "projects/<int:project_id>/delete/", admin_staff_view(views.delete_project), name="delete_project"
    ),
    path("projects/list/", admin_staff_view(views.list_projects), name="list_projects"),
    # Experience
    path("experience/", admin_staff_view(views.manage_experience), name="manage_experience"),
    path("experience/create/", admin_staff_view(views.create_experience), name="create_experience"),
    path(
        "experience/<int:experience_id>/edit/",
        admin_staff_view(views.edit_experience),
        name="edit_experience",
    ),
    path(
        "experience/<int:experience_id>/delete/",
        admin_staff_view(views.delete_experience),
        name="delete_experience",
    ),
    path("experience/list/", admin_staff_view(views.list_experience), name="list_experience"),
    # Skills
    path("skills/", admin_staff_view(views.manage_skills), name="manage_skills"),
    path("skills/create/", admin_staff_view(views.create_skill), name="create_skill"),
    path("skills/<int:skill_id>/edit/", admin_staff_view(views.edit_skill), name="edit_skill"),
    path("skills/<int:skill_id>/delete/", admin_staff_view(views.delete_skill), name="delete_skill"),
    path("skills/list/", admin_staff_view(views.list_skills), name="list_skills"),
    # Achievements
    path("achievements/", admin_staff_view(views.manage_achievements), name="manage_achievements"),
    path("achievements/create/", admin_staff_view(views.create_achievement), name="create_achievement"),
    path("achievements/<int:achievement_id>/edit/", admin_staff_view(views.edit_achievement), name="edit_achievement"),
    path("achievements/<int:achievement_id>/delete/", admin_staff_view(views.delete_achievement), name="delete_achievement"),
    path("achievements/list/", admin_staff_view(views.list_achievements), name="list_achievements"),
    # Categories
    path("categories/", admin_staff_view(views.manage_categories), name="manage_categories"),
    # Details
    path("details/", admin_staff_view(views.manage_details), name="manage_details"),
]
