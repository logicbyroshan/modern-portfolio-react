function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

async function parseJsonResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await response.json() : {};

    return { ok: response.ok, status: response.status, data };
}

document.addEventListener('DOMContentLoaded', function() {
    const csrftoken = getCookie('csrftoken');
    const toggleSwitches = document.querySelectorAll('.project-toggle');
    const deleteButtons = document.querySelectorAll('.btn-delete[data-project-id]');
    const modal = document.getElementById('delete-confirm-modal');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const confirmBtn = document.getElementById('modal-confirm-btn');

    let currentProjectId = null;
    let currentDeleteTarget = null;

    function closeDeleteModal() {
        if (!modal) {
            return;
        }

        modal.classList.remove('active');
        document.body.style.overflow = '';
        currentProjectId = null;
        currentDeleteTarget = null;
    }

    function showDeleteModal(projectTitle) {
        if (!modal) {
            return;
        }

        const modalBodyText = modal.querySelector('.modal-body p');
        if (modalBodyText) {
            if (projectTitle) {
                modalBodyText.textContent = `Are you sure you want to permanently delete "${projectTitle}"? This action cannot be undone.`;
            } else {
                modalBodyText.textContent = 'Are you sure you want to permanently delete this project? This action cannot be undone.';
            }
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    async function toggleProjectStatus(projectId, isActive, toggleElement) {
        const formData = new FormData();
        formData.append('project_id', projectId);
        formData.append('is_active', isActive);

        try {
            const response = await fetch('/projects/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrftoken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: formData,
            });

            const { ok, data } = await parseJsonResponse(response);
            if (!ok || !data.success) {
                throw new Error(data.message || 'Failed to update project status.');
            }

            const card = toggleElement.closest('.blog-card');
            if (card) {
                card.classList.toggle('inactive', !isActive);
            }
            showNotification('Project status updated successfully!', 'success');
        } catch (error) {
            toggleElement.checked = !isActive;
            showNotification(error.message || 'An error occurred while updating project status.', 'error');
        }
    }

    function updateCountAfterDelete(projectCard) {
        const section = projectCard.closest('section');
        const grid = section?.querySelector('.blog-grid');
        const countElement = section?.querySelector('.blog-count');

        if (countElement) {
            const currentCount = parseInt(countElement.textContent.match(/\d+/)?.[0] || '0', 10);
            countElement.textContent = `(${Math.max(0, currentCount - 1)})`;
        }

        if (!grid) {
            return;
        }

        const remainingCards = grid.querySelectorAll('.blog-card').length;
        if (remainingCards === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <p>No projects yet. Create your first project!</p>
                    <a href="/projects/create/" class="btn-primary">
                        <i class="fas fa-plus-circle"></i> Create Project
                    </a>
                </div>
            `;
        }
    }

    async function deleteProject(projectId) {
        if (!confirmBtn) {
            return;
        }

        confirmBtn.disabled = true;
        const originalConfirmText = confirmBtn.textContent;
        confirmBtn.textContent = 'Deleting...';

        try {
            const response = await fetch(`/projects/${projectId}/delete/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrftoken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            const { ok, data } = await parseJsonResponse(response);
            if (!ok || !data.success) {
                throw new Error(data.message || 'Failed to delete project.');
            }

            closeDeleteModal();

            if (currentDeleteTarget) {
                const projectCard = currentDeleteTarget;
                projectCard.style.opacity = '0';
                projectCard.style.transform = 'scale(0.9)';
                projectCard.style.transition = 'all 0.3s ease-out';

                setTimeout(() => {
                    projectCard.remove();
                    updateCountAfterDelete(projectCard);
                }, 300);
            }

            showNotification(data.message || 'Project deleted successfully!', 'success');
        } catch (error) {
            showNotification(error.message || 'An error occurred while deleting project.', 'error');
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.textContent = originalConfirmText;
        }
    }

    toggleSwitches.forEach((toggle) => {
        toggle.addEventListener('change', function() {
            const projectId = this.dataset.projectId;
            const isActive = this.checked;
            toggleProjectStatus(projectId, isActive, this);
        });
    });

    deleteButtons.forEach((button) => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            currentProjectId = this.dataset.projectId;
            currentDeleteTarget = this.closest('.blog-card');
            showDeleteModal(this.dataset.projectTitle);
        });
    });

    if (cancelBtn) {
        cancelBtn.addEventListener('click', function(event) {
            event.preventDefault();
            closeDeleteModal();
        });
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', function(event) {
            event.preventDefault();
            if (currentProjectId) {
                deleteProject(currentProjectId);
            }
        });
    }

    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeDeleteModal();
            }
        });

        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && modal.classList.contains('active')) {
                closeDeleteModal();
            }
        });
    }
});

