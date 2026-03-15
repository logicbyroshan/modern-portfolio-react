// Projects Section Slider
document.addEventListener('DOMContentLoaded', function() {
    const projectCards = document.querySelectorAll('.project-card');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    let currentIndex = 0;

    function showProject(index) {
        projectCards.forEach((card, i) => {
            card.classList.remove('active');
            if (i === index) {
                setTimeout(() => {
                    card.classList.add('active');
                }, 100);
            }
        });
    }

    function nextProject() {
        const oldIndex = currentIndex;
        currentIndex = (currentIndex + 1) % projectCards.length;
        
        // Add slide out animation to current card
        projectCards[oldIndex].classList.add('slide-out-left');
        
        setTimeout(() => {
            projectCards[oldIndex].classList.remove('active', 'slide-out-left');
            projectCards[currentIndex].classList.add('active', 'slide-in-right');
            
            setTimeout(() => {
                projectCards[currentIndex].classList.remove('slide-in-right');
            }, 600);
        }, 300);
    }

    function prevProject() {
        const oldIndex = currentIndex;
        currentIndex = (currentIndex - 1 + projectCards.length) % projectCards.length;
        
        // Add slide out animation to current card
        projectCards[oldIndex].classList.add('slide-out-right');
        
        setTimeout(() => {
            projectCards[oldIndex].classList.remove('active', 'slide-out-right');
            projectCards[currentIndex].classList.add('active', 'slide-in-left');
            
            setTimeout(() => {
                projectCards[currentIndex].classList.remove('slide-in-left');
            }, 600);
        }, 300);
    }

    // Event listeners for navigation buttons
    if (nextBtn) {
        nextBtn.addEventListener('click', nextProject);
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', prevProject);
    }

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        const target = e.target;
        const isTyping = target && (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable
        );

        const isModalOpen = Boolean(document.querySelector('.modal-overlay.modal-visible'));
        if (isTyping || isModalOpen) {
            return;
        }

        if (e.key === 'ArrowLeft') {
            prevProject();
        } else if (e.key === 'ArrowRight') {
            nextProject();
        }
    });

    // Initialize first project
    showProject(0);
});
