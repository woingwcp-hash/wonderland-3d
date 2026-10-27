/********************************************************************
         * [FILE: js/main.js]
         * 7. CORE GAMEPLAY LOGIC & MODES (扭蛋尋寶 / 數字小火車 / 自由點讀 / 數字大冒險)
         ********************************************************************/
        function getPoolFromRange(rangeStr) {
            if (rangeStr === '1-5') return [1, 2, 3, 4, 5];
            if (rangeStr === '6-10') return [6, 7, 8, 9, 10];
            return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        }

        function switchMode(newMode) {
            playPopSound(520);
            gameState.mode = newMode;
            gameState.isBusy = false;

            // Update Top Mode Buttons UI
            ['gacha', 'train', 'explore', 'mario'].forEach(m => {
                const btn = document.getElementById(`mode-btn-${m}`);
                if (!btn) return;
                if (m === newMode) {
                    btn.className = 'btn-toy-sm flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl font-bold text-sm sm:text-base border-2 border-amber-400 bg-amber-400 text-amber-950';
                } else {
                    btn.className = 'btn-toy-sm flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl font-bold text-sm sm:text-base border-2 border-white/80 bg-white/90 text-slate-700 hover:bg-sky-50';
                }
            });

            // Toggle visibility of 3D centerpieces & Mario Controls
            gachaMachineGroup.visible = (newMode === 'gacha');
            trainGroup.visible = (newMode === 'train');
            marioStageGroup.visible = (newMode === 'mario');

            const marioControls = document.getElementById('mario-controls-bar');
            const marioBadge = document.getElementById('mario-stage-badge');
            if (newMode === 'mario') {
                marioControls.classList.remove('hidden');
                marioControls.classList.add('flex');
                marioBadge.classList.remove('hidden');
                marioBadge.classList.add('flex');
            } else {
                marioControls.classList.add('hidden');
                marioControls.classList.remove('flex');
                marioBadge.classList.add('hidden');
                marioBadge.classList.remove('flex');
            }

            document.getElementById('btn-visual-hint').style.display = (newMode === 'explore') ? 'none' : 'flex';

            // Update Right Action Button label
            const rightLabel = document.getElementById('right-btn-label');
            const rightIcon = document.getElementById('right-btn-icon');
            if (newMode === 'explore') {
                rightLabel.textContent = gameState.explorePage === '1-5' ? '切換 6-10' : '切換 1-5';
                rightIcon.className = 'fa-solid fa-repeat';
            } else {
                rightLabel.textContent = '下一關';
                rightIcon.className = 'fa-solid fa-forward-step';
            }

            startNewRound();
        }

        function updateTargetBadgeUI(num, isExplore = false) {
            const numEl = document.getElementById('target-badge-num');
            const dotsEl = document.getElementById('target-badge-dots');
            if (isExplore) {
                numEl.textContent = '1-10';
                dotsEl.textContent = '🎨 點讀';
                return;
            }
            numEl.textContent = String(num);
            dotsEl.textContent = '●'.repeat(Math.min(num, 5)) + (num > 5 ? '\n' + '●'.repeat(num - 5) : '');
        }

        function handleRightActionBtn() {
            playPopSound(480);
            if (gameState.mode === 'explore') {
                gameState.explorePage = (gameState.explorePage === '1-5') ? '6-10' : '1-5';
                document.getElementById('right-btn-label').textContent =
                    gameState.explorePage === '1-5' ? '切換 6-10' : '切換 1-5';
                startNewRound();
            } else {
                startNewRound();
            }
        }

        function startNewRound() {
            clearTimeout(autoPromptTimer);
            clearCountingObjects();
            numberBlocksGroup.clear();
            interactiveBlocks = [];
            gameState.isBusy = false;

            if (gameState.mode === 'explore') {
                setupExploreMode();
                return;
            }

            const pool = getPoolFromRange(gameState.settings.range);
            const target = pool[Math.floor(Math.random() * pool.length)];
            gameState.targetNumber = target;
            updateTargetBadgeUI(target, false);

            // Build options array based on 1, 2, or 3 choices setting
            const numChoices = gameState.settings.choices;
            const distractors = pool.filter(n => n !== target).sort(() => Math.random() - 0.5);
            const choices = [target, ...distractors.slice(0, numChoices - 1)].sort(() => Math.random() - 0.5);
            gameState.currentOptions = choices;

            const hkWord = NUMBER_WORDS_HK[target];

            if (gameState.mode === 'mario') {
                setupMarioRound(choices, target, hkWord);
                scheduleAutoVisualPrompt();
                return;
            }

            // Place 3D Number Character Blocks in Foreground for Gacha & Train modes
            const spacing = numChoices === 1 ? 0 : (numChoices === 2 ? 3.4 : 3.1);
            const startX = -((numChoices - 1) * spacing) / 2;

            choices.forEach((num, idx) => {
                const xPos = startX + idx * spacing;
                const block = create3DNumberCharacter(num, xPos, 1.35, 1.08);
                interactiveBlocks.push(block);
            });

            if (gameState.mode === 'gacha') {
                setPromptUI(
                    `請搵出數字「${target}」（${hkWord}）扭蛋尋寶！`,
                    `可對照左方目標卡，輕觸畫面中的立體數字「${target}」`
                );
            } else if (gameState.mode === 'train') {
                updateTrainSignTexture(target);
                trainAnimState.currentX = -12;
                trainAnimState.targetX = 0;
                playTrainWhistle();
                setPromptUI(
                    `小火車載住數字「${target}」（${hkWord}），請搵出一樣嘅數字！`,
                    `字形配對：請輕觸與火車牌相同的立體數字「${target}」`
                );
            }

            // Start 6-second Auto Visual Prompt Timer if enabled
            scheduleAutoVisualPrompt();
        }

        function setupMarioRound(choices, target, hkWord) {
            document.getElementById('mario-stage-text').textContent = `1-${gameState.marioStage}`;
            updateMarioMissionSign(target);

            const numChoices = choices.length;
            const spacing = numChoices === 1 ? 0 : (numChoices === 2 ? 3.1 : 2.75);
            const startX = -((numChoices - 1) * spacing) / 2;

            choices.forEach((num, idx) => {
                const xPos = startX + idx * spacing;
                const brick = create3DMarioBrick(num, xPos, 3.05, 0.8);
                interactiveBlocks.push(brick);
            });

            // Reset Mario Hero position under middle/first brick & reset Flagpole
            gameState.marioSelectedIdx = Math.floor((numChoices - 1) / 2);
            const startBrickX = interactiveBlocks[gameState.marioSelectedIdx].baseX;
            marioHero.currentX = -4.0; // Emerge from near the green pipe
            marioHero.targetX = startBrickX;
            marioHero.currentY = marioHero.baseY;
            marioHero.isJumping = false;
            marioHero.autoJumpOnArrive = false;
            marioHero.runningToFlag = false;
            marioHero.flagSlideY = 3.35;
            if (marioHero.flagMesh) marioHero.flagMesh.position.y = 3.35;

            setPromptUI(
                `🍄 關卡 1-${gameState.marioStage}：請頂開數字「${target}」（${hkWord}）嘅金磚塊！`,
                `直接點擊空中數字磚塊，或用下方按鈕移動並跳起頂磚塊`
            );
        }

        function setupExploreMode() {
            updateTargetBadgeUI(1, true);
            const nums = gameState.explorePage === '1-5' ? [1, 2, 3, 4, 5] : [6, 7, 8, 9, 10];
            const spacing = 2.25;
            const startX = -((nums.length - 1) * spacing) / 2;

            nums.forEach((num, idx) => {
                const xPos = startX + idx * spacing;
                const zPos = 0.6 + Math.abs(idx - 2) * 0.35; // Gentle 3D arc
                const block = create3DNumberCharacter(num, xPos, zPos, 0.92);
                interactiveBlocks.push(block);
            });

            setPromptUI(
                `自由點讀（數字 ${gameState.explorePage}）：隨便撳下任何一個數字公仔啦！`,
                `探索模式：輕觸立體數字即會彈出對應數量的 3D 紅蘋果與音階`
            );
        }

        // Mario Adventure Mode Controls (Buttons, Direct Tap & Keyboard)
        function marioMoveStep(dir) {
            if (gameState.mode !== 'mario' || gameState.isBusy || marioHero.isJumping || interactiveBlocks.length === 0) return;
            playPopSound(440);
            const nextIdx = Math.max(0, Math.min(interactiveBlocks.length - 1, gameState.marioSelectedIdx + dir));
            gameState.marioSelectedIdx = nextIdx;
            marioHero.targetX = interactiveBlocks[nextIdx].baseX;
            marioHero.autoJumpOnArrive = false;
        }

        function marioJumpAction() {
            if (gameState.mode !== 'mario' || gameState.isBusy || marioHero.isJumping || interactiveBlocks.length === 0) return;
            const targetBrick = interactiveBlocks[gameState.marioSelectedIdx];
            if (!targetBrick) return;
            marioHero.targetX = targetBrick.baseX;
            marioHero.pendingBrick = targetBrick;
            if (Math.abs(marioHero.currentX - targetBrick.baseX) < 0.25) {
                startHeroJump(targetBrick);
            } else {
                marioHero.autoJumpOnArrive = true;
            }
        }

        function startHeroJump(brickWrapper) {
            if (marioHero.isJumping) return;
            playMarioJumpSound();
            marioHero.isJumping = true;
            marioHero.hitTriggered = false;
            marioHero.jumpVel = 9.2;
            marioHero.pendingBrick = brickWrapper;
            marioHero.autoJumpOnArrive = false;
        }

        function onWindowKeyDown(e) {
            if (gameState.mode !== 'mario') return;
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                marioMoveStep(-1);
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                marioMoveStep(1);
            } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'Enter') {
                e.preventDefault();
                marioJumpAction();
            }
        }

        // Visual Prompting (無挫敗感視覺提示)
        function scheduleAutoVisualPrompt() {
            clearTimeout(autoPromptTimer);
            if (!gameState.settings.autoPrompt || gameState.mode === 'explore') return;
            autoPromptTimer = setTimeout(() => {
                triggerVisualHint(false);
            }, 6000);
        }

        function triggerVisualHint(manualClick = false) {
            if (gameState.mode === 'explore' || gameState.isBusy) return;
            const rightBlock = interactiveBlocks.find(b => b.num === gameState.targetNumber);
            if (rightBlock) {
                rightBlock.state = 'hint';
                rightBlock.haloMesh.material.opacity = 0.85;
                if (manualClick) playPopSound(660);
            }
        }

        /********************************************************************
         * 8. RAYCASTER TOUCH / CLICK INTERACTION HANDLER
         ********************************************************************/
        function onCanvasPointerDown(event) {
            ensureAudioCtx();
            const rect = renderer.domElement.getBoundingClientRect();
            pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(pointer, camera);

            // Check if child tapped a 3D Number Block or Mario Floating Brick
            const meshes = interactiveBlocks.map(b => b.bodyMesh);
            const intersects = raycaster.intersectObjects(meshes, false);

            if (intersects.length > 0) {
                const tappedWrapper = intersects[0].object.userData.parentWrapper;
                if (tappedWrapper) {
                    if (gameState.mode === 'mario') {
                        // In Mario Mode: tapping a floating brick makes the hero run under it and jump!
                        if (gameState.isBusy || marioHero.isJumping) return;
                        const idx = interactiveBlocks.indexOf(tappedWrapper);
                        if (idx !== -1) gameState.marioSelectedIdx = idx;
                        marioHero.targetX = tappedWrapper.baseX;
                        marioHero.pendingBrick = tappedWrapper;
                        if (Math.abs(marioHero.currentX - tappedWrapper.baseX) < 0.25) {
                            startHeroJump(tappedWrapper);
                        } else {
                            playPopSound(500);
                            marioHero.autoJumpOnArrive = true;
                        }
                    } else {
                        handleBlockTapped(tappedWrapper);
                    }
                }
            }
        }

        function handleBlockTapped(block) {
            if (gameState.isBusy) return;
            clearTimeout(autoPromptTimer);

            const tappedNum = block.num;
            const hkWord = NUMBER_WORDS_HK[tappedNum];

            // Mode 3: Free Exploration Mode
            if (gameState.mode === 'explore') {
                playSuccessChime();
                block.state = 'celebrate';
                block.celebrateTimer = 1.2;
                emitStarParticles(block.group.position);
                setPromptUI(
                    `呢個係數字 ${tappedNum}（${hkWord}）！有 ${tappedNum} 個紅蘋果！`,
                    `再撳其他數字公仔探索下啦！`
                );
                runQuantityCountingSequence(tappedNum, false, false);
                return;
            }

            // Mode 1, Mode 2 & Mode 4 (Mario): Check if Correct Answer
            if (tappedNum === gameState.targetNumber) {
                gameState.isBusy = true;
                block.state = 'celebrate';
                block.haloMesh.material.opacity = 0;
                emitStarParticles(block.group.position);

                const isMario = (gameState.mode === 'mario');
                if (isMario) {
                    playCoinSound();
                    block.bumpOffset = 0.55;
                    gameState.marioStage += 1;
                } else if (gameState.mode === 'gacha') {
                    playSuccessChime();
                    gachaSpinTimer = 1.2;
                } else if (gameState.mode === 'train') {
                    playSuccessChime();
                    playTrainWhistle();
                }

                awardStarProgress();

                if (gameState.settings.countObjects) {
                    const itemLabel = isMario ? '粒閃亮金幣' : '個紅蘋果';
                    setPromptUI(
                        `答啱喇！係數字 ${tappedNum}（${hkWord}）！一齊數下有幾多${itemLabel}！`,
                        `數與量結合：1 至 ${tappedNum}`
                    );
                    runQuantityCountingSequence(tappedNum, true, isMario);
                } else {
                    setPromptUI(
                        `好叻呀！答啱喇，呢個係數字 ${tappedNum}（${hkWord}）！`,
                        `準備進入下一關...`
                    );
                    if (isMario) {
                        triggerMarioGoalRun();
                    } else {
                        setTimeout(() => {
                            if (!isToyModalOpen()) startNewRound();
                        }, 2200);
                    }
                }
            } else {
                // Wrong Answer: Gentle wobble, slight dim (No harsh red X!)
                playGentleNudge();
                block.state = 'wrong';
                block.wrongTimer = 0.7;
                if (block.isMarioBrick) {
                    block.bumpOffset = 0.25;
                }
                block.bodyMesh.material.forEach(m => {
                    m.transparent = true;
                    m.opacity = 0.55;
                });

                const targetHK = NUMBER_WORDS_HK[gameState.targetNumber];
                setPromptUI(
                    `呢個係 ${tappedNum}，唔緊要，我哋再搵下數字 ${gameState.targetNumber}（${targetHK}）啦！`,
                    `無挫敗感提示：請再試一次`
                );

                // Trigger visual hint on the right block shortly after a wrong tap
                setTimeout(() => {
                    triggerVisualHint(false);
                }, 900);
            }
        }

        // Trigger Hero running to the Goal Flagpole in Mario Mode
        function triggerMarioGoalRun() {
            marioHero.runningToFlag = true;
            marioHero.targetX = 4.55; // Right in front of the flagpole
            playStageClearFanfare();
            emitStarParticles(new THREE.Vector3(5.1, 3.5, 0.8));
            setTimeout(() => {
                if (!isToyModalOpen()) startNewRound();
            }, 2200);
        }

        // Sequential 1..N 3D Object Spawning (Apples or Mario Gold Coins)
        function runQuantityCountingSequence(num, autoAdvanceAfter, isCoin = false) {
            clearCountingObjects();
            const hkWord = NUMBER_WORDS_HK[num];

            const banner = document.getElementById('counting-banner');
            const dotsContainer = document.getElementById('counting-dots');
            const emojiEl = document.getElementById('counting-emoji');
            emojiEl.textContent = isCoin ? '🪙' : '🍎';
            banner.classList.remove('hidden');
            dotsContainer.innerHTML = '';

            const spacing = num > 6 ? 1.12 : 1.35;
            const startX = -((num - 1) * spacing) / 2;
            const zPos = isCoin ? 2.25 : 3.15;

            for (let i = 1; i <= num; i++) {
                const t = setTimeout(() => {
                    const xPos = startX + (i - 1) * spacing;
                    createSingleCounting3DItem(i, num, xPos, zPos, isCoin);
                    if (isCoin) {
                        playCoinSound();
                    } else {
                        playCountingNote(i);
                    }

                    // Add number badge to bottom banner
                    const badge = document.createElement('span');
                    badge.className = 'inline-flex items-center justify-center bg-orange-100 text-orange-600 px-2.5 py-0.5 rounded-xl text-lg sm:text-2xl font-black star-earned';
                    badge.textContent = i;
                    dotsContainer.appendChild(badge);
                }, 450 + (i - 1) * 520);
                activeCountingTimeouts.push(t);
            }

            const totalDuration = 450 + num * 520 + 650;
            const endTimer = setTimeout(() => {
                const unitText = isCoin ? '粒金幣' : '個紅蘋果';
                setPromptUI(
                    `好叻呀！總共有 ${num}（${hkWord}）${unitText}！`,
                    autoAdvanceAfter ? `準備進入下一關...` : `繼續點擊其他數字探索啦！`
                );
                if (autoAdvanceAfter) {
                    if (gameState.mode === 'mario') {
                        triggerMarioGoalRun();
                    } else {
                        const nextTimer = setTimeout(() => {
                            if (gameState.mode === 'train') {
                                trainAnimState.targetX = 14; // Drive train off to right
                            }
                            setTimeout(() => {
                                if (!isToyModalOpen()) startNewRound();
                            }, 700);
                        }, 1200);
                        activeCountingTimeouts.push(nextTimer);
                    }
                } else {
                    gameState.isBusy = false;
                }
            }, totalDuration);
            activeCountingTimeouts.push(endTimer);
        }

        /********************************************************************
         * 9. REWARD STARS & TOY CABINET SYSTEM (獎勵玩具收集櫃)
         ********************************************************************/
        function awardStarProgress() {
            gameState.stars = Math.min(5, gameState.stars + 1);
            renderStarsBar();

            if (gameState.stars >= 5) {
                // Unlock next toy in catalog
                const nextToy = TOY_CATALOG.find(t => !gameState.unlockedToys.includes(t.num));
                const unlocked = nextToy || TOY_CATALOG[Math.floor(Math.random() * TOY_CATALOG.length)];
                if (!gameState.unlockedToys.includes(unlocked.num)) {
                    gameState.unlockedToys.push(unlocked.num);
                }

                setTimeout(() => {
                    gameState.stars = 0;
                    renderStarsBar();
                    showNewToyRewardModal(unlocked);
                }, 1600);
            }
        }

        function renderStarsBar() {
            const container = document.getElementById('stars-bar');
            container.innerHTML = '';
            for (let i = 1; i <= 5; i++) {
                const star = document.createElement('i');
                if (i <= gameState.stars) {
                    star.className = 'fa-solid fa-star text-amber-400 drop-shadow star-earned';
                } else {
                    star.className = 'fa-solid fa-star text-slate-200';
                }
                container.appendChild(star);
            }
            document.getElementById('toy-count-badge').textContent = String(gameState.unlockedToys.length);
        }

        function showNewToyRewardModal(toyObj) {
            playStageClearFanfare();
            const banner = document.getElementById('new-reward-banner');
            const nameEl = document.getElementById('new-reward-name');
            banner.classList.remove('hidden');
            nameEl.textContent = `${toyObj.icon} ${toyObj.name}`;
            renderToyCabinetGrid();
            document.getElementById('toy-modal').classList.remove('hidden');
        }

        function renderToyCabinetGrid() {
            const grid = document.getElementById('toy-grid');
            grid.innerHTML = '';
            TOY_CATALOG.forEach(toy => {
                const isUnlocked = gameState.unlockedToys.includes(toy.num);
                const card = document.createElement('button');
                if (isUnlocked) {
                    card.className = 'btn-toy-sm bg-gradient-to-b from-pink-50 to-amber-50 hover:from-amber-100 hover:to-pink-100 border-2 border-pink-300 rounded-2xl p-3 flex flex-col items-center justify-center gap-1 text-center';
                    card.onclick = () => {
                        playCoinSound();
                    };
                    card.innerHTML = `
                        <span class="text-4xl sm:text-5xl mb-1">${toy.icon}</span>
                        <span class="text-xs sm:text-sm font-black text-slate-800">${toy.name}</span>
                        <span class="text-[11px] font-bold text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full">✨ 已收集</span>
                    `;
                } else {
                    card.className = 'bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl p-3 flex flex-col items-center justify-center gap-1 text-center opacity-70 cursor-default';
                    card.innerHTML = `
                        <span class="text-3xl sm:text-4xl text-slate-400 mb-1">🔒</span>
                        <span class="text-xs sm:text-sm font-bold text-slate-400">第 ${toy.num} 號玩具</span>
                        <span class="text-[11px] text-slate-400">集齊5星解鎖</span>
                    `;
                }
                grid.appendChild(card);
            });
        }

        function isToyModalOpen() {
            return !document.getElementById('toy-modal').classList.contains('hidden');
        }

        function toggleToyModal(show) {
            playPopSound(500);
            if (show) {
                document.getElementById('new-reward-banner').classList.add('hidden');
                renderToyCabinetGrid();
                document.getElementById('toy-modal').classList.remove('hidden');
            } else {
                document.getElementById('toy-modal').classList.add('hidden');
                if (gameState.isBusy) {
                    startNewRound();
                }
            }
        }

        /********************************************************************
         * 10. TEACHER / PARENT SETTINGS MODAL CONTROLS
         ********************************************************************/
        function toggleSettingsModal(show) {
            playPopSound(480);
            const modal = document.getElementById('settings-modal');
            if (show) {
                syncSettingsUI();
                modal.classList.remove('hidden');
            } else {
                modal.classList.add('hidden');
            }
        }

        function updateSetting(key, value) {
            playPopSound(540);
            gameState.settings[key] = value;

            // Apply Background Distraction Mode immediately
            if (key === 'lowDistraction') {
                environmentGroup.visible = !value;
                scene.background = new THREE.Color(value ? '#F8FAFC' : '#CBEBFB');
                const floor = scene.getObjectByName('mainFloor');
                if (floor) {
                    floor.material.color.set(value ? '#E2E8F0' : '#9AE66E');
                }
            }

            syncSettingsUI();
            startNewRound();
        }

        function syncSettingsUI() {
            const s = gameState.settings;
            const activeClass = 'setting-pill py-3 px-3 rounded-2xl font-black text-sm sm:text-base border-2 border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm';
            const inactiveClass = 'setting-pill py-3 px-3 rounded-2xl font-bold text-sm sm:text-base border-2 border-slate-200 bg-white text-slate-600 hover:bg-slate-50';

            ['1-5', '6-10', '1-10'].forEach(r => {
                const el = document.getElementById(`set-range-${r}`);
                if (el) el.className = (s.range === r) ? activeClass : inactiveClass;
            });

            [1, 2, 3].forEach(c => {
                const el = document.getElementById(`set-choices-${c}`);
                if (el) el.className = (s.choices === c) ? activeClass : inactiveClass;
            });

            document.getElementById('set-bg-rich').className = !s.lowDistraction ? activeClass : inactiveClass;
            document.getElementById('set-bg-calm').className = s.lowDistraction ? activeClass : inactiveClass;

            // Toggle switches
            const apBtn = document.getElementById('toggle-autoprompt');
            apBtn.className = `w-14 h-8 rounded-full transition-colors p-1 flex items-center ${s.autoPrompt ? 'bg-emerald-500' : 'bg-slate-300'}`;
            apBtn.firstElementChild.className = `w-6 h-6 rounded-full bg-white shadow transform transition-transform ${s.autoPrompt ? 'translate-x-6' : 'translate-x-0'}`;

            const cntBtn = document.getElementById('toggle-counting');
            cntBtn.className = `w-14 h-8 rounded-full transition-colors p-1 flex items-center ${s.countObjects ? 'bg-emerald-500' : 'bg-slate-300'}`;
            cntBtn.firstElementChild.className = `w-6 h-6 rounded-full bg-white shadow transform transition-transform ${s.countObjects ? 'translate-x-6' : 'translate-x-0'}`;
        }

        function setPromptUI(mainText, subText) {
            document.getElementById('prompt-text').textContent = mainText;
            if (subText) {
                document.getElementById('sub-prompt-text').textContent = subText;
            }
        }

        /********************************************************************
         * 11. MAIN ANIMATION LOOP (THREE.JS 60FPS)
         ********************************************************************/
        function animate() {
            requestAnimationFrame(animate);
            const dt = Math.min(clock.getDelta(), 0.1);
            const elapsed = clock.getElapsedTime();

            // 1. Gently drift 3D clouds in background
            cloudsList.forEach(cloud => {
                cloud.position.x = cloud.userData.baseX + Math.sin(elapsed * cloud.userData.speed) * 1.4;
            });

            // 2. Spin Gachapon Dial when celebrating
            if (gachaSpinTimer > 0 && gachaDialMesh) {
                gachaSpinTimer -= dt;
                gachaDialMesh.rotation.z += dt * 10;
            }

            // 3. Animate Cartoon Train arrival & wheel rotation
            if (trainGroup.visible) {
                const mover = trainGroup.getObjectByName('trainMover');
                if (mover) {
                    const diff = trainAnimState.targetX - trainAnimState.currentX;
                    trainAnimState.currentX += diff * Math.min(1, dt * 4.2);
                    mover.position.x = trainAnimState.currentX;
                    mover.position.y = 0.45 + Math.abs(Math.sin(elapsed * 8)) * (Math.abs(diff) > 0.1 ? 0.06 : 0.015);
                    trainAnimState.wheels.forEach(w => {
                        w.rotation.z -= diff * dt * 2.5;
                    });
                }
            }

            // 4. Animate 3D Number Character Blocks & Mario Floating Bricks
            interactiveBlocks.forEach(block => {
                block.animTime += dt;

                // Decay Mario brick bump offset smoothly
                if (block.bumpOffset && block.bumpOffset > 0) {
                    block.bumpOffset = Math.max(0, block.bumpOffset - dt * 2.2);
                }
                const bumpY = block.bumpOffset ? Math.sin(block.bumpOffset * Math.PI) * 0.55 : 0;

                if (block.state === 'idle') {
                    block.group.position.y = block.baseY + Math.sin(block.animTime * 2.4) * 0.07 + bumpY;
                    block.group.rotation.z = Math.sin(block.animTime * 1.5) * 0.025;
                    block.group.rotation.y = THREE.MathUtils.lerp(block.group.rotation.y, 0, dt * 5);
                    block.group.scale.setScalar(THREE.MathUtils.lerp(block.group.scale.x, block.baseScale, dt * 6));
                } else if (block.state === 'hint') {
                    // Noticeable bouncy Visual Prompt + Golden Halo pulse
                    block.group.position.y = block.baseY + Math.abs(Math.sin(block.animTime * 6.5)) * 0.42 + bumpY;
                    const pulseScale = block.baseScale * (1.12 + Math.sin(block.animTime * 6.5) * 0.07);
                    block.group.scale.setScalar(pulseScale);
                    block.haloMesh.rotation.z += dt * 2.5;
                } else if (block.state === 'wrong') {
                    // Gentle non-frustrating horizontal wobble
                    block.wrongTimer -= dt;
                    block.group.position.y = block.baseY + bumpY;
                    block.group.rotation.z = Math.sin(block.animTime * 28) * 0.16;
                    if (block.wrongTimer <= 0) {
                        block.state = 'idle';
                        block.group.rotation.z = 0;
                    }
                } else if (block.state === 'celebrate') {
                    // Happy jump & spin
                    if (block.isMarioBrick) {
                        block.group.position.y = block.baseY + bumpY;
                        block.group.scale.setScalar(block.baseScale * 1.08);
                    } else {
                        block.group.position.y = block.baseY + 0.55 + Math.abs(Math.sin(block.animTime * 8)) * 0.45;
                        block.group.rotation.y += dt * 6.5;
                    }
                    if (gameState.mode === 'explore') {
                        block.celebrateTimer -= dt;
                        if (block.celebrateTimer <= 0) {
                            block.state = 'idle';
                        }
                    }
                }
            });

            // 4B. Animate Mario 3D Hero Character Movement, Jump & Flagpole Victory
            if (marioStageGroup.visible && marioHero.group) {
                const dx = marioHero.targetX - marioHero.currentX;
                if (Math.abs(dx) > 0.03) {
                    const moveSpeed = marioHero.runningToFlag ? 6.5 : 8.5;
                    marioHero.currentX += Math.sign(dx) * Math.min(Math.abs(dx), dt * moveSpeed);
                    marioHero.walkCycle += dt * 16;
                    // Face direction of movement slightly
                    marioHero.group.rotation.y = THREE.MathUtils.lerp(
                        marioHero.group.rotation.y,
                        dx > 0 ? 0.35 : -0.35,
                        dt * 10
                    );
                } else {
                    marioHero.currentX = marioHero.targetX;
                    marioHero.group.rotation.y = THREE.MathUtils.lerp(marioHero.group.rotation.y, 0, dt * 10);
                    if (marioHero.autoJumpOnArrive && marioHero.pendingBrick) {
                        startHeroJump(marioHero.pendingBrick);
                    }
                }

                // Vertical Jump Physics & Brick Headbutt Detection
                if (marioHero.isJumping) {
                    marioHero.currentY += marioHero.jumpVel * dt;
                    marioHero.jumpVel -= 22.0 * dt; // Gravity

                    // Check if Hero headbutts the brick at apex
                    if (!marioHero.hitTriggered && marioHero.currentY >= 1.52) {
                        marioHero.hitTriggered = true;
                        marioHero.jumpVel = -2.5; // Bounce downward after hitting brick
                        if (marioHero.pendingBrick) {
                            handleBlockTapped(marioHero.pendingBrick);
                        }
                    }

                    // Land back on grass platform
                    if (marioHero.currentY <= marioHero.baseY) {
                        marioHero.currentY = marioHero.baseY;
                        marioHero.isJumping = false;
                        marioHero.jumpVel = 0;
                    }
                } else {
                    // Subtle running/idle bounce
                    const isMoving = Math.abs(dx) > 0.04;
                    marioHero.currentY = marioHero.baseY + (isMoving ? Math.abs(Math.sin(marioHero.walkCycle)) * 0.14 : Math.sin(elapsed * 3) * 0.03);
                }

                marioHero.group.position.x = marioHero.currentX;
                marioHero.group.position.y = marioHero.currentY;

                // Keep spotlight ring under currently targeted brick
                if (marioHero.selectionRing && interactiveBlocks[gameState.marioSelectedIdx]) {
                    const ringTargetX = interactiveBlocks[gameState.marioSelectedIdx].baseX;
                    marioHero.selectionRing.position.x = THREE.MathUtils.lerp(marioHero.selectionRing.position.x, ringTargetX, dt * 12);
                    marioHero.selectionRing.rotation.z += dt * 1.8;
                }

                // Slide Goal Flag down when stage is cleared
                if (marioHero.runningToFlag && marioHero.flagMesh) {
                    marioHero.flagSlideY = Math.max(0.85, marioHero.flagSlideY - dt * 2.4);
                    marioHero.flagMesh.position.y = marioHero.flagSlideY;
                }
            }

            // 5. Animate Spawned 3D Counting Apples/Coins & Sync 2D Number Badges
            spawnedCountingItems.forEach(item => {
                item.currentScale = THREE.MathUtils.lerp(item.currentScale, item.targetScale, dt * 10);
                item.bouncePhase += dt * 4;
                item.group.scale.setScalar(item.currentScale);
                item.group.position.y = (item.baseY || 0.55) + Math.abs(Math.sin(item.bouncePhase)) * 0.15;
                item.group.rotation.y += dt * 2.2;

                // Project 3D position to 2D screen coordinates for the number badge above the apple/coin
                const proj = item.group.position.clone();
                proj.y += 0.72;
                proj.project(camera);
                const sx = (proj.x * 0.5 + 0.5) * window.innerWidth;
                const sy = (-proj.y * 0.5 + 0.5) * window.innerHeight;
                item.labelEl.style.left = `${sx}px`;
                item.labelEl.style.top = `${sy}px`;
            });

            // 6. Update Star Burst Particles
            for (let i = activeParticles.length - 1; i >= 0; i--) {
                const p = activeParticles[i];
                p.life -= dt;
                p.vy -= 9.8 * dt;
                p.mesh.position.x += p.vx * dt;
                p.mesh.position.y += p.vy * dt;
                p.mesh.position.z += p.vz * dt;
                p.mesh.rotation.x += dt * 5;
                p.mesh.rotation.y += dt * 5;
                p.mesh.scale.setScalar(Math.max(0.01, p.life));

                if (p.life <= 0) {
                    particlesGroup.remove(p.mesh);
                    activeParticles.splice(i, 1);
                }
            }

            renderer.render(scene, camera);
        }

        // Start Application on Window Load
        window.onload = function () {
            initThreeScene();
            renderStarsBar();
            switchMode('gacha');
            animate();
        };
