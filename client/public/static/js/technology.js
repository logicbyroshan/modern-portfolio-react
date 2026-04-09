// Technology Section Animations
function initTechnologySection() {
    // Single Intersection Observer for all elements
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe tech cards
    const techCards = document.querySelectorAll('.tech-card');
    techCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });

    // Observe badge and heading
    const techBadge = document.querySelector('.tech-badge');
    const techHeading = document.querySelector('.tech-heading');
    
    if (techBadge) {
        techBadge.style.opacity = '0';
        techBadge.style.transform = 'translateY(20px)';
        techBadge.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(techBadge);
    }

    if (techHeading) {
        techHeading.style.opacity = '0';
        techHeading.style.transform = 'translateY(20px)';
        techHeading.style.transition = 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s';
        observer.observe(techHeading);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTechnologySection, { once: true });
} else {
    initTechnologySection();
}
