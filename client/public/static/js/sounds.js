/* =====================================================
   Sound Engine — Web Audio API (no external library)
   All sounds generated procedurally.
   ===================================================== */
(function () {
    'use strict';

    let ctx = null;
    let masterBgGain = null;
    let bgStarted = false;
    let audioReady = false;
    const BG_VOLUME = 0.07;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let isMuted = localStorage.getItem('portfolioMuted') === 'true' || prefersReducedMotion;
    let soundBindingsReady = false;

    /* ── Create / resume AudioContext ── */
    function getCtx() {
        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    /* ── Init (must run on a user gesture first) ── */
    function initAudio() {
        if (isMuted) return;
        if (audioReady) return;
        audioReady = true;
        getCtx();
        startBgMusic();
    }

    /* ════════════════════════════════════════════════
       BACKGROUND MUSIC — Dark Cinematic Score
       ─────────────────────────────────────────────
       Architecture (all synthesized, no files):
         1. Convolution reverb  — 4-second cathedral IR
         2. Sub-bass foundation — E1 (41hz) breathing drone
         3. Cello/string pad    — detuned sawtooths through
                                  slowly-sweeping LPF
         4. Deep heartbeat      — 36 BPM filtered-noise thump
         5. FM dark stings      — inharmonic brass/bell hits
                                  from E Phrygian, random 8-15s
       ════════════════════════════════════════════════ */
    function startBgMusic() {
        if (bgStarted) return;
        bgStarted = true;
        var c = getCtx();

        // Master gain — 5-second cinematic fade-in
        masterBgGain = c.createGain();
        masterBgGain.gain.setValueAtTime(0, c.currentTime);
        masterBgGain.gain.linearRampToValueAtTime(BG_VOLUME, c.currentTime + 5);
        masterBgGain.connect(c.destination);

        /* ── Convolution reverb ────────────────────────────
           Synthesize a 4-second exponentially-decaying noise
           impulse response — simulates a large dark concert
           hall / scoring stage. This is what separates
           "computer bleeps" from "cinematic atmosphere."
        ─────────────────────────────────────────────────── */
        var reverb   = c.createConvolver();
        var irSec    = 4.0;
        var irLen    = Math.floor(c.sampleRate * irSec);
        var irBuf    = c.createBuffer(2, irLen, c.sampleRate);
        for (var ch = 0; ch < 2; ch++) {
            var d = irBuf.getChannelData(ch);
            for (var i = 0; i < irLen; i++) {
                // Exponential decay noise — real room IR shape
                d[i] = (Math.random() * 2 - 1) * Math.exp(-3.8 * i / irLen);
            }
        }
        reverb.buffer = irBuf;

        var revWet = c.createGain();
        revWet.gain.value = 0.58;
        reverb.connect(revWet);
        revWet.connect(masterBgGain);

        var revDry = c.createGain();
        revDry.gain.value = 0.42;
        revDry.connect(masterBgGain);

        // Helper — sends to both dry path and into convolution reverb
        function toMix(node) {
            node.connect(reverb);
            node.connect(revDry);
        }

        /* ── Layer 1: Sub-bass foundation ────────────────
           E1 = 41.2 Hz sine — felt more than heard.
           Slow 11-second breathing LFO for organic movement.
           Bypasses reverb (prevents low-end mud).
        ─────────────────────────────────────────────────── */
        var sub   = c.createOscillator();
        sub.type  = 'sine';
        sub.frequency.value = 41.2;
        var subG  = c.createGain();
        subG.gain.value = 0.62;
        sub.connect(subG);
        subG.connect(masterBgGain); // direct — no reverb on sub

        var breathLfo = c.createOscillator();
        var breathAmt = c.createGain();
        breathLfo.frequency.value = 0.09; // ~11s breath
        breathAmt.gain.value      = 0.15;
        breathLfo.connect(breathAmt);
        breathAmt.connect(subG.gain);
        breathLfo.start();
        sub.start();

        /* ── Layer 2: Dark string / cello pad ────────────
           Six detuned sawtooths — E2 cluster + fifth + octave.
           Through a low-pass filter with a 20-second LFO
           sweep (380 → 900 → 380 Hz). Result: sounds like a
           bowing cello/viola section swelling in a dark hall.
        ─────────────────────────────────────────────────── */
        var padFeed = c.createGain();
        padFeed.gain.value = 0.09;
        var padLPF  = c.createBiquadFilter();
        padLPF.type = 'lowpass';
        padLPF.frequency.value = 380;
        padLPF.Q.value         = 0.75;

        // E2 tight cluster + B2 fifth + E3 octave
        [82.41, 82.18, 82.64, 123.47, 123.22, 164.81].forEach(function(f) {
            var o   = c.createOscillator();
            o.type  = 'sawtooth';
            o.frequency.value = f;
            o.connect(padLPF);
            o.start();
        });
        padLPF.connect(padFeed);
        toMix(padFeed);

        // Filter sweep — slow dramatic swell
        var filterLfo = c.createOscillator();
        var filterAmt = c.createGain();
        filterLfo.frequency.value = 0.05; // 20-second cycle
        filterAmt.gain.value      = 290;  // ±290 Hz sweep
        filterLfo.connect(filterAmt);
        filterAmt.connect(padLPF.frequency);
        filterLfo.start();

        /* ── Layer 3: Deep heartbeat ─────────────────────
           Filtered noise burst — 36 BPM (1 beat / 1.67 s).
           Sits below 120 Hz, sounds like a dungeon drum,
           giant's heartbeat, or Inception half-speed BRAARM.
           Direct to master — no reverb (preserves punch).
        ─────────────────────────────────────────────────── */
        function thump() {
            var now = c.currentTime;
            var len = Math.floor(c.sampleRate * 0.24);
            var buf = c.createBuffer(1, len, c.sampleRate);
            var bd  = buf.getChannelData(0);
            for (var j = 0; j < len; j++) {
                bd[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / len, 2.4);
            }
            var src = c.createBufferSource();
            src.buffer = buf;
            var thumpLPF = c.createBiquadFilter();
            thumpLPF.type = 'lowpass';
            thumpLPF.frequency.value = 115;
            var tg = c.createGain();
            tg.gain.setValueAtTime(0.52, now);
            tg.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
            src.connect(thumpLPF);
            thumpLPF.connect(tg);
            tg.connect(masterBgGain);
            src.start(now);
        }
        thump();
        var thumpTimer = setInterval(function() {
            if (!bgStarted) { clearInterval(thumpTimer); return; }
            thump();
        }, 1667); // 36 BPM

        /* ── Layer 4: FM dark stings ─────────────────────
           Inharmonic FM ratio (2.15×) on E Phrygian notes
           gives a metallic, ominous brass/bell timbre — like
           a low brass cluster chord hit in a dark score.
           Fires randomly every 8–15 seconds into the reverb.
        ─────────────────────────────────────────────────── */
        var stingPool = [41.2, 43.65, 49.0, 55.0, 58.27, 65.41, 73.42];
        function sting() {
            var now  = c.currentTime;
            var freq = stingPool[Math.floor(Math.random() * stingPool.length)];
            var car  = c.createOscillator();
            var mod  = c.createOscillator();
            var mAmt = c.createGain();
            var env  = c.createGain();
            car.type = 'sine';
            mod.type = 'sine';
            car.frequency.value = freq;
            mod.frequency.value = freq * 2.15; // inharmonic → ominous metallic colour
            mAmt.gain.value     = freq * 2.2;
            mod.connect(mAmt);
            mAmt.connect(car.frequency);
            env.gain.setValueAtTime(0, now);
            env.gain.linearRampToValueAtTime(0.28, now + 0.07);
            env.gain.exponentialRampToValueAtTime(0.001, now + 5.5);
            car.connect(env);
            toMix(env);
            car.start(now); mod.start(now);
            car.stop(now + 6.0); mod.stop(now + 6.0);
        }

        // First sting after 2.5 s, then random 8–15 s intervals
        setTimeout(sting, 2500);
        (function nextSting() {
            setTimeout(function() {
                if (!bgStarted) return;
                sting();
                nextSting();
            }, 8000 + Math.random() * 7000);
        })();
    }

    /* ════════════════════════════════════════════════
       SFX — CLICK  (soft high-freq tick)
       ════════════════════════════════════════════════ */
    function playClick() {
        if (isMuted) return;
        const c = getCtx();
        const osc = c.createOscillator();
        const g   = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1100, c.currentTime);
        osc.frequency.exponentialRampToValueAtTime(700, c.currentTime + 0.05);
        g.gain.setValueAtTime(0.07, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.07);
        osc.connect(g);
        g.connect(c.destination);
        osc.start(c.currentTime);
        osc.stop(c.currentTime + 0.08);
    }

    /* ════════════════════════════════════════════════
       SFX — SLIDE  (filtered noise whoosh)
       direction: 1 = next (high→low), -1 = prev (low→high)
       ════════════════════════════════════════════════ */
    function playSlide(direction) {
        if (isMuted) return;
        const c      = getCtx();
        const dur    = 0.2;
        const bufLen = Math.floor(c.sampleRate * dur);
        const buf    = c.createBuffer(1, bufLen, c.sampleRate);
        const data   = buf.getChannelData(0);

        // White noise with natural amplitude envelope
        for (let i = 0; i < bufLen; i++) {
            const env = Math.pow(1 - i / bufLen, 1.8);
            data[i]   = (Math.random() * 2 - 1) * env;
        }

        const src    = c.createBufferSource();
        src.buffer   = buf;

        const filter = c.createBiquadFilter();
        filter.type  = 'bandpass';
        filter.Q.value = 2.5;

        if (direction >= 0) {
            filter.frequency.setValueAtTime(1400, c.currentTime);
            filter.frequency.exponentialRampToValueAtTime(180, c.currentTime + dur);
        } else {
            filter.frequency.setValueAtTime(180, c.currentTime);
            filter.frequency.exponentialRampToValueAtTime(1400, c.currentTime + dur);
        }

        const g = c.createGain();
        g.gain.setValueAtTime(0.14, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);

        src.connect(filter);
        filter.connect(g);
        g.connect(c.destination);
        src.start();
    }

    /* ════════════════════════════════════════════════
       SFX — POP  (FAQ accordion open / close)
       opening = true  → ascending  chirp
       opening = false → descending chirp
       ════════════════════════════════════════════════ */
    function playPop(opening) {
        if (isMuted) return;
        const c = getCtx();
        const osc = c.createOscillator();
        const g   = c.createGain();
        osc.type  = 'sine';

        if (opening) {
            osc.frequency.setValueAtTime(320, c.currentTime);
            osc.frequency.exponentialRampToValueAtTime(680, c.currentTime + 0.09);
        } else {
            osc.frequency.setValueAtTime(680, c.currentTime);
            osc.frequency.exponentialRampToValueAtTime(280, c.currentTime + 0.09);
        }

        g.gain.setValueAtTime(0.06, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.1);
        osc.connect(g);
        g.connect(c.destination);
        osc.start(c.currentTime);
        osc.stop(c.currentTime + 0.12);
    }

    /* ════════════════════════════════════════════════
       SFX — HOVER TICK  (very faint, optional)
       ════════════════════════════════════════════════ */
    function playHover() {
        if (isMuted) return;
        const c = getCtx();
        const osc = c.createOscillator();
        const g   = c.createGain();
        osc.type  = 'sine';
        osc.frequency.value = 1400;
        g.gain.setValueAtTime(0.025, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.04);
        osc.connect(g);
        g.connect(c.destination);
        osc.start(c.currentTime);
        osc.stop(c.currentTime + 0.045);
    }

    /* ════════════════════════════════════════════════
       WIRE UP ALL INTERACTIONS
       ════════════════════════════════════════════════ */
    function wireSoundInteractions() {
        if (soundBindingsReady) return;
        soundBindingsReady = true;

        const soundToggleBtn = document.getElementById('soundToggleBtn');

        function updateSoundToggleUI() {
            if (!soundToggleBtn) return;
            soundToggleBtn.classList.toggle('is-muted', isMuted);
            soundToggleBtn.setAttribute('aria-pressed', (!isMuted).toString());
            soundToggleBtn.innerHTML = isMuted
                ? '<i class="fas fa-volume-mute"></i>'
                : '<i class="fas fa-volume-up"></i>';
        }

        function applyMuteState() {
            if (masterBgGain) {
                const c = getCtx();
                masterBgGain.gain.cancelScheduledValues(c.currentTime);
                masterBgGain.gain.setValueAtTime(isMuted ? 0 : BG_VOLUME, c.currentTime);
            }
            localStorage.setItem('portfolioMuted', String(isMuted));
            updateSoundToggleUI();
        }

        if (soundToggleBtn) {
            soundToggleBtn.addEventListener('click', () => {
                isMuted = !isMuted;

                if (!isMuted && !audioReady) {
                    initAudio();
                }

                applyMuteState();
            });
        }

        updateSoundToggleUI();

        // ── General button / link clicks ──
        const clickSelectors = [
            '.btn',
            '.nav-link',
            '.mobile-nav-link',
            '.faq-tab',
            '.scroll-top-btn',
            '.hamburger-menu',
            '.github-btn',
            '.mobile-nav-actions .btn',
        ];
        document.querySelectorAll(clickSelectors.join(', ')).forEach(el => {
            el.addEventListener('click', () => {
                initAudio();
                playClick();
            });
        });

        // ── Hover tick on nav links (very subtle) ──
        document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(el => {
            el.addEventListener('mouseenter', () => {
                if (!audioReady) return;
                playHover();
            });
        });

        // ── Project card prev / next ──
        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                initAudio();
                playSlide(-1);
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                initAudio();
                playSlide(1);
            });
        }

        // ── FAQ accordion open/close ──
        // Use capture:true so we read the class BEFORE faq.js toggles it
        document.querySelectorAll('.faq-question').forEach(q => {
            q.addEventListener('click', () => {
                initAudio();
                const opening = !q.closest('.faq-item').classList.contains('active');
                playPop(opening);
            }, true); // capture phase — fires before faq.js bubble handler
        });

        // ── Scroll-to-top button ──
        const scrollBtn = document.getElementById('scrollTopBtn');
        if (scrollBtn) {
            scrollBtn.addEventListener('click', () => {
                initAudio();
                playClick();
            });
        }

        if (isMuted) {
            applyMuteState();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', wireSoundInteractions, { once: true });
    } else {
        wireSoundInteractions();
    }

    // Expose for debugging
    window._SoundEngine = { initAudio, playClick, playSlide, playPop };

})();
