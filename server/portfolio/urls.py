from django.urls import path
from . import views
from django.views.generic import TemplateView
from django.contrib.auth.decorators import login_required

urlpatterns = [
    # Dashboard
    path("", login_required(views.dashboard), name="dashboard"),
    # API Documentation
    path("api-docs/", TemplateView.as_view(template_name="api_documentation.html"), name="api_documentation"),
    # Projects
    path("projects/", login_required(views.manage_projects), name="manage_projects"),
    path("projects/create/", login_required(views.create_project), name="create_project"),
    path("projects/<int:project_id>/edit/", login_required(views.edit_project), name="edit_project"),
    path(
        "projects/<int:project_id>/delete/", login_required(views.delete_project), name="delete_project"
    ),
    path("projects/list/", login_required(views.list_projects), name="list_projects"),
    # Experience
    path("experience/", login_required(views.manage_experience), name="manage_experience"),
    path("experience/create/", login_required(views.create_experience), name="create_experience"),
    path(
        "experience/<int:experience_id>/edit/",
        login_required(views.edit_experience),
        name="edit_experience",
    ),
    path(
        "experience/<int:experience_id>/delete/",
        login_required(views.delete_experience),
        name="delete_experience",
    ),
    path("experience/list/", login_required(views.list_experience), name="list_experience"),
    # Skills
    path("skills/", login_required(views.manage_skills), name="manage_skills"),
    path("skills/create/", login_required(views.create_skill), name="create_skill"),
    path("skills/<int:skill_id>/edit/", login_required(views.edit_skill), name="edit_skill"),
    path("skills/<int:skill_id>/delete/", login_required(views.delete_skill), name="delete_skill"),
    path("skills/list/", login_required(views.list_skills), name="list_skills"),
    # Achievements
    path("achievements/", login_required(views.manage_achievements), name="manage_achievements"),
    path("achievements/create/", login_required(views.create_achievement), name="create_achievement"),
    path("achievements/<int:achievement_id>/edit/", login_required(views.edit_achievement), name="edit_achievement"),
    path("achievements/<int:achievement_id>/delete/", login_required(views.delete_achievement), name="delete_achievement"),
    path("achievements/list/", login_required(views.list_achievements), name="list_achievements"),
    # Categories
    path("categories/", login_required(views.manage_categories), name="manage_categories"),
    # Details
    path("details/", login_required(views.manage_details), name="manage_details"),
]
