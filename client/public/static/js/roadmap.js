// Roadmap Section Animations
document.addEventListener('DOMContentLoaded', function() {
    const roadmapItems = document.querySelectorAll('.roadmap-item');
    
    // Single Intersection Observer
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    roadmapItems.forEach(item => {
        observer.observe(item);
    });
});
