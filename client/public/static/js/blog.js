// Blog Section Animations
document.addEventListener('DOMContentLoaded', function() {
    // Single Intersection Observer
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

    // Observe blog cards
    const blogCards = document.querySelectorAll('.blog-card');
    blogCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(40px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.15}s, transform 0.6s ease ${index * 0.15}s`;
        observer.observe(card);
    });

    // Observe badge and heading
    const blogBadge = document.querySelector('.blog-badge');
    const blogHeading = document.querySelector('.blog-heading');
    
    if (blogBadge) {
        blogBadge.style.opacity = '0';
        blogBadge.style.transform = 'translateY(20px)';
        blogBadge.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(blogBadge);
    }

    if (blogHeading) {
        blogHeading.style.opacity = '0';
        blogHeading.style.transform = 'translateY(20px)';
        blogHeading.style.transition = 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s';
        observer.observe(blogHeading);
    }
});
