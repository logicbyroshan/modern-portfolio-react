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
    const data = contentType.includes('application/json') ? await response.json() : {};
    return { ok: response.ok, data };
}

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const sortSelect = document.getElementById('sort-select');
    const experienceGrid = document.getElementById('all-experience-grid');
    const noResults = document.getElementById('no-results');

    if (!experienceGrid) {
        return;
    }

    const experienceCards = Array.from(experienceGrid.querySelectorAll('.experience-card'));
    const toggleSwitches = document.querySelectorAll('.experience-toggle');
    const deleteButtons = document.querySelectorAll('.btn-delete[data-experience-id]');
    const modal = document.getElementById('delete-confirm-modal');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const confirmBtn = document.getElementById('modal-confirm-btn');

    const urlParams = new URLSearchParams(window.location.search);
    let currentFilter = urlParams.get('filter') || 'all';

    let currentExperienceId = null;
    let currentDeleteTarget = null;

    function closeDeleteModal() {
        if (!modal) {
            return;
        }
        modal.classList.remove('active');
        document.body.style.overflow = '';
        currentExperienceId = null;
        currentDeleteTarget = null;
    }

    function showDeleteModal(experienceTitle) {
        if (!modal) {
            return;
        }

        const bodyText = modal.querySelector('.modal-body p');
        if (bodyText) {
            bodyText.textContent = experienceTitle
                ? `Are you sure you want to permanently delete "${experienceTitle}"? This action cannot be undone.`
                : 'Are you sure you want to permanently delete this experience entry? This action cannot be undone.';
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function updateInactiveBadge(card, isActive) {
        const badgesContainer = card.querySelector('.status-badges');
        if (!badgesContainer) {
            return;
        }

        let inactiveBadge = Array.from(badgesContainer.querySelectorAll('.status-badge')).find(
            (badge) => badge.textContent.trim().toLowerCase() === 'inactive'
        );

        if (isActive) {
            if (inactiveBadge) {
                inactiveBadge.remove();
            }
            card.classList.remove('inactive');
            return;
        }

        card.classList.add('inactive');
        if (!inactiveBadge) {
            inactiveBadge = document.createElement('span');
            inactiveBadge.className = 'status-badge status-inactive';
            inactiveBadge.textContent = 'Inactive';
            badgesContainer.appendChild(inactiveBadge);
        }
    }

    async function toggleExperienceStatus(experienceId, isActive, toggleElement) {
        try {
            const response = await fetch('/experience/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: `experience_id=${encodeURIComponent(experienceId)}&is_active=${encodeURIComponent(isActive)}`,
            });

            const { ok, data } = await parseJsonResponse(response);
            if (!ok || !data.success) {
                throw new Error(data.message || 'Failed to update experience status.');
            }

            const card = toggleElement.closest('.experience-card');
            if (card) {
                updateInactiveBadge(card, isActive);
            }
            showNotification('Experience status updated successfully!', 'success');
        } catch (error) {
            toggleElement.checked = !isActive;
            showNotification(error.message || 'An error occurred while updating status.', 'error');
        }
    }

    async function deleteExperience(experienceId) {
        if (!confirmBtn) {
            return;
        }

        confirmBtn.disabled = true;
        const originalText = confirmBtn.textContent;
        confirmBtn.textContent = 'Deleting...';

        try {
            const response = await fetch(`/experience/${experienceId}/delete/`, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
            });

            const { ok, data } = await parseJsonResponse(response);
            if (!ok || !data.success) {
                throw new Error(data.message || 'Failed to delete experience.');
            }

            closeDeleteModal();

            if (currentDeleteTarget) {
                const card = currentDeleteTarget;
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95)';
                card.style.transition = 'all 0.3s ease-out';

                setTimeout(() => {
                    card.remove();
                    const index = experienceCards.indexOf(card);
                    if (index > -1) {
                        experienceCards.splice(index, 1);
                    }
                    filterAndSort();
                }, 300);
            }

            showNotification(data.message || 'Experience deleted successfully!', 'success');
        } catch (error) {
            showNotification(error.message || 'An error occurred while deleting experience.', 'error');
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.textContent = originalText;
        }
    }

    function filterAndSort() {
        const searchTerm = (searchInput?.value || '').toLowerCase();

        const visibleCards = experienceCards.filter((card) => {
            const title = (card.dataset.title || '').toLowerCase();
            const company = card.querySelector('.company-name')?.textContent.toLowerCase() || '';
            const status = card.dataset.status;

            const matchesSearch = title.includes(searchTerm) || company.includes(searchTerm);
            const matchesFilter = currentFilter === 'all' || status === currentFilter;

            card.style.display = matchesSearch && matchesFilter ? '' : 'none';
            return matchesSearch && matchesFilter;
        });

        if (noResults) {
            const hasResults = visibleCards.length > 0;
            noResults.style.display = hasResults ? 'none' : 'flex';
            experienceGrid.style.display = hasResults ? 'grid' : 'none';
        }

        const sortValue = sortSelect?.value || 'newest';
        visibleCards.sort((a, b) => {
            if (sortValue === 'newest') return new Date(b.dataset.date) - new Date(a.dataset.date);
            if (sortValue === 'oldest') return new Date(a.dataset.date) - new Date(b.dataset.date);
            if (sortValue === 'title-az') return (a.dataset.title || '').localeCompare(b.dataset.title || '');
            if (sortValue === 'title-za') return (b.dataset.title || '').localeCompare(a.dataset.title || '');
            return 0;
        });

        visibleCards.forEach((card) => experienceGrid.appendChild(card));
    }

    toggleSwitches.forEach((toggle) => {
        toggle.addEventListener('change', function() {
            toggleExperienceStatus(this.dataset.experienceId, this.checked, this);
        });
    });

    deleteButtons.forEach((button) => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            currentExperienceId = this.dataset.experienceId;
            currentDeleteTarget = this.closest('.experience-card');
            showDeleteModal(this.dataset.experienceTitle);
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
            if (currentExperienceId) {
                deleteExperience(currentExperienceId);
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

    if (searchInput) {
        searchInput.addEventListener('input', filterAndSort);
    }

    filterButtons.forEach((button) => {
        button.addEventListener('click', function() {
            filterButtons.forEach((item) => item.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter || currentFilter;
            filterAndSort();
        });
    });

    if (sortSelect) {
        sortSelect.addEventListener('change', filterAndSort);
    }

    filterAndSort();
});
