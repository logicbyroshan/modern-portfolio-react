// About Section Animations
document.addEventListener('DOMContentLoaded', function() {
    // Single Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = entry.target.classList.contains('about-image-item') 
                    ? 'scale(1) translateY(0)' 
                    : 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe about elements
    const aboutBadge = document.querySelector('.about-badge');
    const aboutHeading = document.querySelector('.about-heading');
    const aboutImages = document.querySelectorAll('.about-image-item');
    const aboutDescription = document.querySelector('.about-description');
    const aboutSubdescription = document.querySelector('.about-subdescription');
    const aboutBtn = document.querySelector('.about-btn');

    if (aboutBadge) {
        aboutBadge.style.opacity = '0';
        aboutBadge.style.transform = 'translateY(20px)';
        aboutBadge.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(aboutBadge);
    }

    if (aboutHeading) {
        aboutHeading.style.opacity = '0';
        aboutHeading.style.transform = 'translateY(20px)';
        aboutHeading.style.transition = 'opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s';
        observer.observe(aboutHeading);
    }

    // Animate images with stagger
    aboutImages.forEach((img, index) => {
        img.style.opacity = '0';
        img.style.transform = 'scale(0.9) translateY(20px)';
        img.style.transition = `opacity 0.6s ease ${0.2 + index * 0.1}s, transform 0.6s ease ${0.2 + index * 0.1}s`;
        observer.observe(img);
    });

    if (aboutDescription) {
        aboutDescription.style.opacity = '0';
        aboutDescription.style.transform = 'translateY(20px)';
        aboutDescription.style.transition = 'opacity 0.6s ease 0.8s, transform 0.6s ease 0.8s';
        observer.observe(aboutDescription);
    }

    if (aboutSubdescription) {
        aboutSubdescription.style.opacity = '0';
        aboutSubdescription.style.transform = 'translateY(20px)';
        aboutSubdescription.style.transition = 'opacity 0.6s ease 0.9s, transform 0.6s ease 0.9s';
        observer.observe(aboutSubdescription);
    }

    if (aboutBtn) {
        aboutBtn.style.opacity = '0';
        aboutBtn.style.transform = 'translateY(20px)';
        aboutBtn.style.transition = 'opacity 0.6s ease 1s, transform 0.6s ease 1s';
        observer.observe(aboutBtn);
    }
});
