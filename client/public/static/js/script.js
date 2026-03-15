// JavaScript for interactivity
console.log("Portfolio UI Loaded");

document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu functionality
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    
    function toggleMobileMenu() {
        hamburgerMenu.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        mobileOverlay.classList.toggle('active');
        hamburgerMenu.setAttribute('aria-expanded', mobileMenu.classList.contains('active') ? 'true' : 'false');
        document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    }
    
    function closeMobileMenu() {
        hamburgerMenu.classList.remove('active');
        mobileMenu.classList.remove('active');
        mobileOverlay.classList.remove('active');
        hamburgerMenu.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }
    
    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', toggleMobileMenu);
    }
    
    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', closeMobileMenu);
    }
    
    // Close menu when clicking a nav link
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Scroll to Top
    const scrollTopBtn = document.getElementById('scrollTopBtn');

    window.addEventListener('scroll', function () {
        if (window.scrollY > 400) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });

    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});
