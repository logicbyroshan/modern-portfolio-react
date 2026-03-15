// FAQ Section Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Accordion functionality
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            // Close other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle current item
            item.classList.toggle('active');
        });
    });

    // Tab functionality
    const faqTabs = document.querySelectorAll('.faq-tab');

    function applyCategoryFilter(category) {
        faqItems.forEach(item => {
            const itemCategories = (item.dataset.category || '').split(/\s+/).filter(Boolean);
            const isVisible = category === 'all' || itemCategories.includes(category);

            item.classList.toggle('faq-item-hidden', !isVisible);
            if (!isVisible) {
                item.classList.remove('active');
            }
        });
    }
    
    faqTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            faqTabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            
            // Add active class to clicked tab
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            
            // Get category
            const category = tab.getAttribute('data-category');

            applyCategoryFilter(category || 'all');
        });
    });

    // Initialize with currently active tab.
    const activeTab = document.querySelector('.faq-tab.active');
    applyCategoryFilter(activeTab ? activeTab.getAttribute('data-category') : 'all');

    // Single Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = entry.target.classList.contains('faq-image') 
                    ? 'scale(1)' 
                    : 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe FAQ elements
    const elementsToObserve = [
        { el: document.querySelector('.faq-badge'), delay: 0 },
        { el: document.querySelector('.faq-heading'), delay: 0.1 },
        { el: document.querySelector('.faq-description'), delay: 0.2 },
        { el: document.querySelector('.faq-tabs'), delay: 0.3 },
        { el: document.querySelector('.faq-accordion'), delay: 0.4 },
        { el: document.querySelector('.faq-image'), delay: 0.3, isImage: true }
    ];

    elementsToObserve.forEach(({ el, delay, isImage }) => {
        if (el) {
            el.style.opacity = '0';
            el.style.transform = isImage ? 'scale(0.9)' : 'translateY(20px)';
            el.style.transition = `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`;
            observer.observe(el);
        }
    });
});
