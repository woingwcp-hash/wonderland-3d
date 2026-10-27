/********************************************************************
         * [FILE: js/audio.js]
         * 2. PURE WEB AUDIO MUSICAL SYNTHESIZER (TTS VOICE COMPLETELY DISABLED)
         ********************************************************************/
        let audioCtx = null;

        function ensureAudioCtx() {
            if (!gameState.sfxEnabled) return;
            if (!audioCtx) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (AudioContextClass) {
                    audioCtx = new AudioContextClass();
                }
            }
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
        }

        function toggleSfx() {
            gameState.sfxEnabled = !gameState.sfxEnabled;
            const btn = document.getElementById('btn-sfx-toggle');
            const icon = document.getElementById('sfx-icon');
            const label = document.getElementById('sfx-label');
            if (gameState.sfxEnabled) {
                btn.className = 'btn-toy-sm flex items-center gap-1 bg-sky-500 hover:bg-sky-400 text-white font-bold px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl border-2 border-sky-300 text-xs sm:text-sm';
                icon.className = 'fa-solid fa-music text-sm sm:text-base';
                label.textContent = '音效：開';
                playPopSound(520);
            } else {
                btn.className = 'btn-toy-sm flex items-center gap-1 bg-slate-400 hover:bg-slate-500 text-white font-bold px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl border-2 border-slate-300 text-xs sm:text-sm';
                icon.className = 'fa-solid fa-volume-xmark text-sm sm:text-base';
                label.textContent = '音效：關';
            }
        }

        // Play cheerful wooden/clay pop sound on tap
        function playPopSound(freq = 420) {
            if (!gameState.sfxEnabled) return;
            try {
                ensureAudioCtx();
                if (!audioCtx) return;
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(freq * 1.8, audioCtx.currentTime + 0.12);
                gain.gain.setValueAtTime(0.22, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.13);
            } catch (e) {}
        }

        // Classic Mario-style Jump "Boing!" Sound
        function playMarioJumpSound() {
            if (!gameState.sfxEnabled) return;
            try {
                ensureAudioCtx();
                if (!audioCtx) return;
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(180, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(620, audioCtx.currentTime + 0.18);
                gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.19);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.2);
            } catch (e) {}
        }

        // Classic Mario Coin "Bling!" Sound (B5 -> E6)
        function playCoinSound() {
            if (!gameState.sfxEnabled) return;
            try {
                ensureAudioCtx();
                if (!audioCtx) return;
                const now = audioCtx.currentTime;
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(987.77, now); // B5
                osc.frequency.setValueAtTime(1318.51, now + 0.075); // E6
                gain.gain.setValueAtTime(0.24, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.36);
            } catch (e) {}
        }

        // Classic Stage Clear Fanfare when Hero reaches the Goal Flagpole
        function playStageClearFanfare() {
            if (!gameState.sfxEnabled) return;
            try {
                ensureAudioCtx();
                if (!audioCtx) return;
                const melody = [
                    { f: 523.25, t: 0, d: 0.12 },
                    { f: 659.25, t: 0.12, d: 0.12 },
                    { f: 783.99, t: 0.24, d: 0.12 },
                    { f: 1046.50, t: 0.36, d: 0.22 },
                    { f: 783.99, t: 0.58, d: 0.14 },
                    { f: 1046.50, t: 0.72, d: 0.42 }
                ];
                melody.forEach(n => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = 'triangle';
                    const st = audioCtx.currentTime + n.t;
                    osc.frequency.setValueAtTime(n.f, st);
                    gain.gain.setValueAtTime(0.25, st);
                    gain.gain.exponentialRampToValueAtTime(0.001, st + n.d);
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.start(st);
                    osc.stop(st + n.d + 0.02);
                });
            } catch (e) {}
        }

        // Musical xylophone scale for counting 1 to 10
        const SCALE_FREQS = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50, 1174.66, 1318.51];
        function playCountingNote(index) {
            if (!gameState.sfxEnabled) return;
            try {
                ensureAudioCtx();
                if (!audioCtx) return;
                const freq = SCALE_FREQS[(index - 1) % SCALE_FREQS.length];
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
                gain.gain.setValueAtTime(0.28, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.36);
            } catch (e) {}
        }

        // Cheerful chime for correct answer
        function playSuccessChime() {
            if (!gameState.sfxEnabled) return;
            try {
                ensureAudioCtx();
                if (!audioCtx) return;
                const notes = [523.25, 659.25, 783.99, 1046.50];
                notes.forEach((freq, idx) => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = 'triangle';
                    const startTime = audioCtx.currentTime + idx * 0.08;
                    osc.frequency.setValueAtTime(freq, startTime);
                    gain.gain.setValueAtTime(0.22, startTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.start(startTime);
                    osc.stop(startTime + 0.36);
                });
            } catch (e) {}
        }

        // Gentle soft wobble sound (no harsh buzzer!)
        function playGentleNudge() {
            if (!gameState.sfxEnabled) return;
            try {
                ensureAudioCtx();
                if (!audioCtx) return;
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, audioCtx.currentTime);
                osc.frequency.linearRampToValueAtTime(250, audioCtx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.22);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.24);
            } catch (e) {}
        }

        // Cute Train Whistle ("Choo-Choo!")
        function playTrainWhistle() {
            if (!gameState.sfxEnabled) return;
            try {
                ensureAudioCtx();
                if (!audioCtx) return;
                [0, 0.28].forEach(offset => {
                    [587.33, 739.99].forEach(freq => {
                        const osc = audioCtx.createOscillator();
                        const gain = audioCtx.createGain();
                        osc.type = 'triangle';
                        const st = audioCtx.currentTime + offset;
                        osc.frequency.setValueAtTime(freq, st);
                        gain.gain.setValueAtTime(0.14, st);
                        gain.gain.exponentialRampToValueAtTime(0.001, st + 0.22);
                        osc.connect(gain);
                        gain.connect(audioCtx.destination);
                        osc.start(st);
                        osc.stop(st + 0.23);
                    });
                });
            } catch (e) {}
        }

        // Magical Treasure Chest Unlock Arpeggio Sound
        function playChestOpenSound() {
            if (!gameState.sfxEnabled) return;
            try {
                ensureAudioCtx();
                if (!audioCtx) return;
                const notes = [392.00, 493.88, 587.33, 783.99, 987.77, 1174.66];
                notes.forEach((freq, i) => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = 'triangle';
                    const st = audioCtx.currentTime + i * 0.065;
                    osc.frequency.setValueAtTime(freq, st);
                    gain.gain.setValueAtTime(0.24, st);
                    gain.gain.exponentialRampToValueAtTime(0.001, st + 0.32);
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.start(st);
                    osc.stop(st + 0.33);
                });
            } catch (e) {}
        }

        // No-op stub: Speech synthesis completely removed as requested by user
        function speakCantonese() {
            // Intentionally empty: TTS voice readout disabled
        }
