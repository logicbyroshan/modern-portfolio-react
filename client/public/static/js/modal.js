/* ══════════════════════════════════════════
   MODAL — Shared open/close logic + Rexi chat
   ══════════════════════════════════════════ */

(function () {
    'use strict';

    // ── Open / Close ──────────────────────────────────────────────────────────

    function openModal(id) {
        const overlay = document.getElementById(id);
        if (!overlay) return;
        // Lock both <html> and <body> so the page is completely inactive
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        overlay.classList.add('modal-visible');
        overlay.querySelector('.modal-close')?.focus();
    }

    function closeModal(overlay) {
        overlay.classList.remove('modal-visible');
        // Restore scroll only when ALL modals are closed
        if (!document.querySelector('.modal-overlay.modal-visible')) {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        }
    }

    // ── Wire trigger buttons ──────────────────────────────────────────────────

    document.addEventListener('click', function (e) {
        const trigger = e.target.closest('[data-modal]');
        if (trigger) {
            e.preventDefault();
            openModal(trigger.dataset.modal);
            return;
        }

        // close button inside modal
        const closeBtn = e.target.closest('.modal-close');
        if (closeBtn) {
            const overlay = closeBtn.closest('.modal-overlay');
            if (overlay) closeModal(overlay);
            return;
        }

        // click on the backdrop (not the card itself)
        if (e.target.classList.contains('modal-overlay')) {
            closeModal(e.target);
        }
    });

    // Escape key closes topmost visible modal
    document.addEventListener('keydown', function (e) {
        if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.matches('[data-modal][role="button"]')) {
            e.preventDefault();
            openModal(e.target.dataset.modal);
            return;
        }

        if (e.key !== 'Escape') return;
        const open = document.querySelector('.modal-overlay.modal-visible');
        if (open) closeModal(open);
    });

    // ── Rexi Chat ─────────────────────────────────────────────────────────────

    const REXI_KNOWLEDGE = {
        name:       'Roshan Damor',
        role:       'Full-Stack Developer & AI Engineer',
        location:   'Mumbai, Maharashtra, India',
        tech:       'React, Node.js, Django, AWS, TypeScript, Python, MongoDB, PostgreSQL',
        dsa:        '1300+ DSA problems solved across LeetCode, CodeForces and HackerRank',
        projects:   'AI-powered web apps, NFT marketplace, real-time chat system, cloud infrastructure',
        experience: 'Internships in software engineering; built and shipped production applications',
        contact:    'Available via LinkedIn or the contact form on this site',
        education:  'B.Tech Computer Science with specialisation in AI & Machine Learning',
        hobbies:    'Competitive programming, open-source contributions, exploring new AI tools',
    };

    const REXI_RESPONSES = [
        {
            pattern: /name|who|roshan/i,
            reply:   `Roshan Damor is a ${REXI_KNOWLEDGE.role} based in ${REXI_KNOWLEDGE.location}. A builder at heart with a love for clean code and hard problems. 🚀`,
        },
        {
            pattern: /role|job|work|does|what/i,
            reply:   `He's a ${REXI_KNOWLEDGE.role} — building AI-powered solutions and scalable web apps. Full-stack through and through. 💻`,
        },
        {
            pattern: /tech|stack|skill|language|framework/i,
            reply:   `His core stack: **${REXI_KNOWLEDGE.tech}**. He picks the right tool for every job. 🛠️`,
        },
        {
            pattern: /dsa|algorithm|leetcode|problem|competitive/i,
            reply:   `${REXI_KNOWLEDGE.dsa}. Strong in dynamic programming, graphs, and system design. 🧠`,
        },
        {
            pattern: /project/i,
            reply:   `He's built: ${REXI_KNOWLEDGE.projects}. Check the Projects section for live demos! 🔭`,
        },
        {
            pattern: /experience|intern|work history/i,
            reply:   `${REXI_KNOWLEDGE.experience}. His experience spans frontend, backend, AI, and cloud. ☁️`,
        },
        {
            pattern: /contact|reach|email|hire/i,
            reply:   `${REXI_KNOWLEDGE.contact}. He's open to exciting opportunities! 📩`,
        },
        {
            pattern: /education|college|degree|study/i,
            reply:   `${REXI_KNOWLEDGE.education}. Always learning, always building. 🎓`,
        },
        {
            pattern: /hobby|interest|free time|passion/i,
            reply:   `${REXI_KNOWLEDGE.hobbies}. Never a dull moment! 🎮`,
        },
        {
            pattern: /location|where|city/i,
            reply:   `Based in ${REXI_KNOWLEDGE.location}. Open to remote and on-site opportunities worldwide. 🌍`,
        },
        {
            pattern: /hello|hi|hey|howdy|greet/i,
            reply:   `Hey there! 👋 I'm Rexi. Ask me anything about Roshan — his skills, projects, experience, or how to reach him!`,
        },
        {
            pattern: /thanks|thank you|thx/i,
            reply:   `You're welcome! 😊 Anything else you'd like to know?`,
        },
    ];

    function getRexiReply(text) {
        for (const entry of REXI_RESPONSES) {
            if (entry.pattern.test(text)) return entry.reply;
        }
        return `Hmm, I'm not sure about that one. Try asking about Roshan's skills, projects, experience, tech stack, or how to contact him! 🤔`;
    }

    function appendMessage(container, text, isUser) {
        const msgEl = document.createElement('div');
        msgEl.className = 'chat-msg ' + (isUser ? 'chat-msg-user' : 'chat-msg-bot');

        const avatarEl = document.createElement('div');
        avatarEl.className = 'chat-avatar';
        avatarEl.innerHTML = isUser ? '<i class="fas fa-user"></i>' : '<i class="fas fa-dragon"></i>';

        const bubbleEl = document.createElement('div');
        bubbleEl.className = 'chat-bubble';
        bubbleEl.textContent = text;

        if (isUser) {
            msgEl.appendChild(bubbleEl);
            msgEl.appendChild(avatarEl);
        } else {
            msgEl.appendChild(avatarEl);
            msgEl.appendChild(bubbleEl);
        }

        container.appendChild(msgEl);
        container.scrollTop = container.scrollHeight;
        return msgEl;
    }

    function showTyping(container) {
        const typingEl = document.createElement('div');
        typingEl.className = 'chat-msg chat-msg-bot chat-typing';

        const avatarEl = document.createElement('div');
        avatarEl.className = 'chat-avatar';
        avatarEl.innerHTML = '<i class="fas fa-dragon"></i>';

        const bubbleEl = document.createElement('div');
        bubbleEl.className = 'chat-bubble';
        bubbleEl.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';

        typingEl.appendChild(avatarEl);
        typingEl.appendChild(bubbleEl);
        container.appendChild(typingEl);
        container.scrollTop = container.scrollHeight;
        return typingEl;
    }

    function initRexi() {
        const input      = document.getElementById('rexi-input');
        const sendBtn    = document.getElementById('rexi-send');
        const messages   = document.getElementById('rexi-messages');
        if (!input || !sendBtn || !messages) return;

        function sendMessage() {
            const text = input.value.trim();
            if (!text) return;

            input.value = '';
            sendBtn.disabled = true;

            appendMessage(messages, text, true);

            const typingEl = showTyping(messages);

            const delay = 700 + Math.random() * 600;
            setTimeout(function () {
                typingEl.remove();
                appendMessage(messages, getRexiReply(text), false);
                sendBtn.disabled = false;
                input.focus();
            }, delay);
        }

        sendBtn.addEventListener('click', sendMessage);

        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // init after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRexi);
    } else {
        initRexi();
    }
}());
