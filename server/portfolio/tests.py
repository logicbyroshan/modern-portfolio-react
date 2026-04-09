from datetime import date

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase, override_settings
from django.urls import reverse

from .models import Achievement, Category, Experience, Project, Skill
from .views import generate_unique_slug


@override_settings(API_KEY="", SECURE_SSL_REDIRECT=False)
class ProjectApiVisibilityTests(TestCase):
	def setUp(self):
		self.category = Category.objects.create(
			name="Web Development",
			slug="web-development",
			category_type="project",
		)
		Project.objects.create(
			title="Published Project",
			slug="published-project",
			description="Visible project",
			technologies="Django, React",
			category=self.category,
			status="active",
			is_active=True,
		)
		Project.objects.create(
			title="Draft Project",
			slug="draft-project",
			description="Should stay hidden",
			technologies="Django",
			category=self.category,
			status="draft",
			is_active=True,
		)

	def test_projects_list_excludes_drafts(self):
		response = self.client.get(reverse("api-projects-list"))
		self.assertEqual(response.status_code, 200)

		payload = response.json()
		results = payload.get("results", payload)
		slugs = {item["slug"] for item in results}

		self.assertIn("published-project", slugs)
		self.assertNotIn("draft-project", slugs)

	def test_summary_excludes_drafts_from_active_count(self):
		response = self.client.get(reverse("api-summary"))
		self.assertEqual(response.status_code, 200)

		payload = response.json()
		self.assertEqual(payload["active_projects"], 1)
		self.assertEqual(payload["total_projects"], 2)


@override_settings(API_KEY="", SECURE_SSL_REDIRECT=False)
class SlugGenerationTests(TestCase):
	def test_generate_unique_slug_for_skill(self):
		Skill.objects.create(name="Python", slug="python", proficiency=90)
		self.assertEqual(generate_unique_slug(Skill, "Python"), "python-1")

	def test_generate_unique_slug_for_achievement(self):
		Achievement.objects.create(
			title="AWS Certified",
			slug="aws-certified",
			issuing_organization="AWS",
			achievement_date=date.today(),
			short_description="Cloud certification",
		)
		self.assertEqual(
			generate_unique_slug(Achievement, "AWS Certified"),
			"aws-certified-1",
		)

	def test_create_skill_view_handles_slug_collisions(self):
		Skill.objects.create(name="JavaScript", slug="javascript", proficiency=80)

		user_model = get_user_model()
		user = user_model.objects.create_user(username="admin", password="pass1234")
		self.client.force_login(user)

		response = self.client.post(
			reverse("create_skill"),
			{
				"name": "JavaScript",
				"skill_level": "advanced",
				"proficiency": 85,
				"description": "Frontend language",
				"icon_type": "fontawesome",
				"icon_class": "fab fa-js",
				"certificate_type": "link",
				"certificate_url": "https://example.com/cert",
				"is_active": "on",
				"is_draft": "",
				"order": 0,
			},
			follow=True,
		)

		self.assertEqual(response.status_code, 200)
		self.assertTrue(Skill.objects.filter(slug="javascript-1").exists())


@override_settings(API_KEY="", SECURE_SSL_REDIRECT=False)
class CategoryItemCountTests(TestCase):
	def test_skill_and_experience_category_item_counts(self):
		skill_category = Category.objects.create(
			name="Languages",
			slug="languages",
			category_type="skill",
		)
		experience_category = Category.objects.create(
			name="Full Time",
			slug="full-time-experience",
			category_type="experience",
		)

		Skill.objects.create(
			name="Go",
			slug="go",
			category=skill_category,
			proficiency=75,
		)
		Experience.objects.create(
			position="Backend Engineer",
			slug="backend-engineer",
			category=experience_category,
			company_name="Example Inc",
			start_date=date(2024, 1, 1),
			short_description="Built APIs",
			is_active=True,
			is_draft=False,
		)

		self.assertEqual(skill_category.item_count(), 1)
		self.assertEqual(experience_category.item_count(), 1)


@override_settings(API_KEY="", SECURE_SSL_REDIRECT=False)
class SkillValidationTests(TestCase):
	def test_proficiency_above_100_is_invalid(self):
		skill = Skill(name="Invalid High", slug="invalid-high", proficiency=101)
		with self.assertRaises(ValidationError):
			skill.full_clean()

	def test_proficiency_below_0_is_invalid(self):
		skill = Skill(name="Invalid Low", slug="invalid-low", proficiency=-1)
		with self.assertRaises(ValidationError):
			skill.full_clean()


@override_settings(API_KEY="test-api-key", SECURE_SSL_REDIRECT=False)
class APIKeyPermissionTests(TestCase):
	def setUp(self):
		category = Category.objects.create(
			name="Backend",
			slug="backend",
			category_type="project",
		)
		Project.objects.create(
			title="API Service",
			slug="api-service",
			description="Public API",
			technologies="Django",
			category=category,
			status="active",
			is_active=True,
		)

	def test_request_without_api_key_is_forbidden_when_configured(self):
		response = self.client.get(reverse("api-projects-list"))
		self.assertIn(response.status_code, {401, 403})

	def test_request_with_api_key_is_allowed(self):
		response = self.client.get(
			reverse("api-projects-list"),
			HTTP_X_API_KEY="test-api-key",
		)
		self.assertEqual(response.status_code, 200)


@override_settings(API_KEY="", SECURE_SSL_REDIRECT=False)
class AdminSubdomainAccessTests(TestCase):
	def test_intended_admin_subdomain_reaches_login(self):
		response = self.client.get("/", HTTP_HOST="admin.roshandmaor.me")

		self.assertEqual(response.status_code, 302)
		self.assertIn("/admin/login/", response["Location"])

	def test_legacy_admin_subdomain_still_reaches_login(self):
		response = self.client.get("/", HTTP_HOST="admin.roshandamor.me")

		self.assertEqual(response.status_code, 302)
		self.assertIn("/admin/login/", response["Location"])
