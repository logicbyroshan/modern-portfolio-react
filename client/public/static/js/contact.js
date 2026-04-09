// Contact Section - Toggle functionality
function initContactSection() {
    const toggleSwitch = document.querySelector('.toggle-switch');
    const urgentWarning = document.querySelector('.urgent-warning');
    
    if (toggleSwitch && urgentWarning) {
        toggleSwitch.addEventListener('click', function() {
            toggleSwitch.classList.toggle('active');
            urgentWarning.classList.toggle('show');
        });
    }

    function showContactNotice(message, isError) {
        const existing = document.querySelector('.contact-api-notice');
        if (existing) {
            existing.remove();
        }

        const notice = document.createElement('div');
        notice.className = `contact-api-notice ${isError ? 'is-error' : 'is-success'}`;
        notice.textContent = message;

        const formWrapper = document.querySelector('.contact-form-wrapper');
        if (formWrapper) {
            formWrapper.prepend(notice);
        }
    }

    // Real API-backed form submission
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const submitBtn = contactForm.querySelector('.form-submit-btn');
            const originalBtnLabel = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>Sending...</span><i class="fas fa-spinner fa-spin"></i>';
            }

            const formData = {
                full_name: document.getElementById('contact-name').value,
                email: document.getElementById('contact-email').value,
                message: document.getElementById('contact-message').value,
                isUrgent: Boolean(toggleSwitch && toggleSwitch.classList.contains('active'))
            };

            try {
                const response = await fetch('/api/contact/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        full_name: formData.full_name,
                        email: formData.email,
                        message: formData.message,
                        is_urgent: formData.isUrgent,
                    })
                });

                if (!response.ok) {
                    let message = 'Unable to send message right now. Please try again.';

                    try {
                        const payload = await response.json();
                        if (payload && payload.message) {
                            message = payload.message;
                        }
                    } catch (jsonErr) {
                        // Ignore JSON parse failures and use default message.
                    }

                    throw new Error(message);
                }

                showContactNotice('Thank you. Your message was sent successfully.', false);

                contactForm.reset();
                if (toggleSwitch) {
                    toggleSwitch.classList.remove('active');
                }
                if (urgentWarning) {
                    urgentWarning.classList.remove('show');
                }
            } catch (error) {
                showContactNotice(error.message || 'Failed to send message.', true);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnLabel;
                }
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactSection, { once: true });
} else {
    initContactSection();
}
