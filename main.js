/********************************************************************
         * [FILE: main.js]
         * 7. CORE GAMEPLAY LOGIC, LOBBY NAVIGATION & MODES
         ********************************************************************/
        const SUBJECT_DISPLAY_META = {
            number: { icon: '🔢', title: '數字樂園', short: '🔢 數字' },
            color: { icon: '🎨', title: '顏色樂園', short: '🎨 顏色' },
            shape: { icon: '🔺', title: '形狀樂園', short: '🔺 形狀' }
        };

        const MODE_DISPLAY_META = {
            gacha: '🔮 扭蛋尋寶',
            train: '🚂 認知小火車',
            mario: '🍄 認知大冒險',
            explore: '🎨 自由探索'
        };

        // Open the 2-Step Lobby Overlay ('subject' = Step 1, 'mode' = Step 2)
        function openLobby(step = 'subject') {
            playPopSound(520);
            gameState.inLobby = true;
            clearTimeout(autoPromptTimer);

            const overlay = document.getElementById('lobby-overlay');
            const stepSubj = document.getElementById('lobby-step-subject');
            const stepMode = document.getElementById('lobby-step-mode');

            overlay.classList.remove('hidden');

            if (step === 'subject') {
                stepSubj.classList.remove('hidden');
                stepMode.classList.add('hidden');
            } else {
                const meta = SUBJECT_DISPLAY_META[gameState.subject] || SUBJECT_DISPLAY_META.number;
                document.getElementById('lobby-selected-subj-icon').textContent = meta.icon;
                document.getElementById('lobby-selected-subj-title').textContent = meta.title;
                stepSubj.classList.add('hidden');
                stepMode.classList.remove('hidden');
            }
        }

        // Step 1 -> Step 2: User clicked Numbers, Colors, or Shapes card
        function selectSubjectFromLobby(subjectKey) {
            playPopSound(600);
            gameState.subject = subjectKey;
            updateTopStatusBadge();
            openLobby('mode');
        }

        // Step 2 -> Start Gameplay: User clicked one of the 4 game cards
        function startGameFromLobby(modeKey) {
            playSuccessChime();
            gameState.inLobby = false;
            document.getElementById('lobby-overlay').classList.add('hidden');
            switchMode(modeKey);
        }

        function updateTopStatusBadge() {
            const sMeta = SUBJECT_DISPLAY_META[gameState.subject] || SUBJECT_DISPLAY_META.number;
            const mText = MODE_DISPLAY_META[gameState.mode] || MODE_DISPLAY_META.gacha;
            const subjBadge = document.getElementById('status-subj-badge');
            const modeBadge = document.getElementById('status-mode-badge');
            if (subjBadge) subjBadge.textContent = sMeta.short;
            if (modeBadge) modeBadge.textContent = mText;
        }

        function getPoolForCurrentSubject() {
            if (gameState.subject === 'color') {
                return COLOR_CURRICULUM.map(c => c.id);
            }
            if (gameState.subject === 'shape') {
                return SHAPE_CURRICULUM.map(s => s.id);
            }
            // Default: 'number'
            const rangeStr = gameState.settings.range;
            if (rangeStr === '1-5') return [1, 2, 3, 4, 5];
            if (rangeStr === '6-10') return [6, 7, 8, 9, 10];
            return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        }

        // Switch between Numbers (數字), Colors (顏色), and Shapes (形狀)
        function switchSubject(newSubject) {
            playPopSound(560);
            gameState.subject = newSubject;
            gameState.isBusy = false;

            updateTopStatusBadge();
            updateRightButtonForMode();
            startNewRound();
        }

        function updateRightButtonForMode() {
            const rightLabel = document.getElementById('right-btn-label');
            const rightIcon = document.getElementById('right-btn-icon');
            if (gameState.mode === 'explore') {
                if (gameState.subject === 'number') {
                    rightLabel.textContent = gameState.explorePage === '1-5' ? '切換 6-10' : '切換 1-5';
                    rightIcon.className = 'fa-solid fa-repeat';
                } else {
                    rightLabel.textContent = '重新排列';
                    rightIcon.className = 'fa-solid fa-rotate';
                }
            } else {
                rightLabel.textContent = '下一關';
                rightIcon.className = 'fa-solid fa-forward-step';
            }
        }

        function switchMode(newMode) {
            playPopSound(520);
            gameState.mode = newMode;
            gameState.isBusy = false;

            updateTopStatusBadge();

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
            updateRightButtonForMode();
            startNewRound();
        }

        function updateTargetBadgeUI(targetKey, isExplore = false) {
            const cardEl = document.getElementById('target-number-card');
            const numEl = document.getElementById('target-badge-num');
            const dotsEl = document.getElementById('target-badge-dots');

            if (isExplore) {
                cardEl.style.background = 'linear-gradient(to bottom, #FCD34D, #F59E0B)';
                cardEl.style.color = '#0F172A';
                numEl.textContent = gameState.subject === 'number' ? '1-10' : (gameState.subject === 'color' ? '🎨' : '🔺');
                dotsEl.textContent = '自由探索';
                return;
            }

            const meta = getCognitiveItemMeta(targetKey);
            if (meta.subject === 'color') {
                cardEl.style.background = meta.hex;
                cardEl.style.color = (meta.key === 'yellow') ? '#0F172A' : '#FFFFFF';
                numEl.textContent = meta.shortLabel;
                dotsEl.textContent = meta.title;
                dotsEl.className = 'text-[11px] sm:text-xs font-black tracking-tighter mt-0.5';
            } else if (meta.subject === 'shape') {
                cardEl.style.background = 'linear-gradient(to bottom, #FFFBEB, #FEF3C7)';
                cardEl.style.color = meta.hex;
                numEl.textContent = meta.badgeSymbol;
                dotsEl.textContent = meta.title;
                dotsEl.className = 'text-[11px] sm:text-xs font-black text-slate-800 tracking-tighter mt-0.5';
            } else {
                cardEl.style.background = 'linear-gradient(to bottom, #FCD34D, #FBBF24)';
                cardEl.style.color = '#0F172A';
                numEl.textContent = String(meta.key);
                dotsEl.textContent = meta.subBadge;
                dotsEl.className = 'text-[10px] sm:text-xs font-black text-amber-900 tracking-tighter mt-0.5';
            }
        }

        function handleRightActionBtn() {
            playPopSound(480);
            if (gameState.mode === 'explore' && gameState.subject === 'number') {
                gameState.explorePage = (gameState.explorePage === '1-5') ? '6-10' : '1-5';
                updateRightButtonForMode();
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

            const pool = getPoolForCurrentSubject();
            const target = pool[Math.floor(Math.random() * pool.length)];
            gameState.targetKey = target;
            gameState.targetNumber = target;
            updateTargetBadgeUI(target, false);

            // Build options array based on 1, 2, or 3 choices setting
            const numChoices = gameState.settings.choices;
            const distractors = pool.filter(k => k !== target).sort(() => Math.random() - 0.5);
            const choices = [target, ...distractors.slice(0, numChoices - 1)].sort(() => Math.random() - 0.5);
            gameState.currentOptions = choices;

            const meta = getCognitiveItemMeta(target);

            if (gameState.mode === 'mario') {
                setupMarioRound(choices, target, meta);
                scheduleAutoVisualPrompt();
                return;
            }

            // Place 3D Cognitive Character Blocks in Foreground for Gacha & Train modes
            const spacing = numChoices === 1 ? 0 : (numChoices === 2 ? 3.4 : 3.1);
            const startX = -((numChoices - 1) * spacing) / 2;

            choices.forEach((itemKey, idx) => {
                const xPos = startX + idx * spacing;
                const block = create3DNumberCharacter(itemKey, xPos, 1.35, 1.08);
                interactiveBlocks.push(block);
            });

            if (gameState.mode === 'gacha') {
                setPromptUI(
                    `請搵出「${meta.title}」扭蛋尋寶！`,
                    `可對照左方目標提示卡，輕觸畫面中的立體「${meta.title}」公仔`
                );
            } else if (gameState.mode === 'train') {
                updateTrainSignTexture(target);
                trainAnimState.currentX = -12;
                trainAnimState.targetX = 0;
                playTrainWhistle();
                setPromptUI(
                    `小火車載住「${meta.title}」，請搵出一樣嘅積木公仔！`,
                    `視覺配對：請輕觸與火車牌相同的立體「${meta.title}」`
                );
            }

            // Start 6-second Auto Visual Prompt Timer if enabled
            if (!gameState.inLobby) {
                scheduleAutoVisualPrompt();
            }
        }

        function setupMarioRound(choices, target, meta) {
            document.getElementById('mario-stage-text').textContent = `1-${gameState.marioStage}`;
            updateMarioMissionSign(target);

            const numChoices = choices.length;
            const spacing = numChoices === 1 ? 0 : (numChoices === 2 ? 3.1 : 2.75);
            const startX = -((numChoices - 1) * spacing) / 2;

            choices.forEach((itemKey, idx) => {
                const xPos = startX + idx * spacing;
                const brick = create3DMarioBrick(itemKey, xPos, 3.05, 0.8);
                interactiveBlocks.push(brick);
            });

            // Reset Mario Hero position under middle/first brick & reset Flagpole
            gameState.marioSelectedIdx = Math.floor((numChoices - 1) / 2);
            const startBrickX = interactiveBlocks[gameState.marioSelectedIdx].baseX;
            marioHero.currentX = -4.0;
            marioHero.targetX = startBrickX;
            marioHero.currentY = marioHero.baseY;
            marioHero.isJumping = false;
            marioHero.autoJumpOnArrive = false;
            marioHero.runningToFlag = false;
            marioHero.flagSlideY = 3.35;
            if (marioHero.flagMesh) marioHero.flagMesh.position.y = 3.35;

            setPromptUI(
                `🍄 關卡 1-${gameState.marioStage}：請頂開「${meta.title}」嘅金磚塊！`,
                `直接點擊空中磚塊，或用下方按鈕移動並跳起頂磚塊`
            );
        }

        function setupExploreMode() {
            updateTargetBadgeUI(null, true);
            let items = [];
            if (gameState.subject === 'number') {
                items = gameState.explorePage === '1-5' ? [1, 2, 3, 4, 5] : [6, 7, 8, 9, 10];
            } else {
                items = getPoolForCurrentSubject();
            }

            const spacing = items.length > 5 ? 1.92 : 2.25;
            const startX = -((items.length - 1) * spacing) / 2;

            items.forEach((itemKey, idx) => {
                const xPos = startX + idx * spacing;
                const centerIdx = (items.length - 1) / 2;
                const zPos = 0.55 + Math.abs(idx - centerIdx) * 0.28;
                const blockScale = items.length > 5 ? 0.84 : 0.92;
                const block = create3DNumberCharacter(itemKey, xPos, zPos, blockScale);
                interactiveBlocks.push(block);
            });

            const subjLabel = gameState.subject === 'number'
                ? `數字 ${gameState.explorePage}`
                : (gameState.subject === 'color' ? '6 種基礎顏色' : '6 種立體形狀');

            setPromptUI(
                `自由探索（${subjLabel}）：隨便撳下任何一個立體公仔啦！`,
                `探索模式：輕觸公仔即會彈出對應嘅 3D 實物與悅耳音階`
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
            const rightBlock = interactiveBlocks.find(b => b.itemKey === gameState.targetKey);
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

            const tappedKey = block.itemKey;
            const tappedMeta = getCognitiveItemMeta(tappedKey);

            // Mode 3: Free Exploration Mode
            if (gameState.mode === 'explore') {
                playSuccessChime();
                block.state = 'celebrate';
                block.celebrateTimer = 1.2;
                emitStarParticles(block.group.position);
                setPromptUI(
                    `呢個係「${tappedMeta.title}」！一齊睇下 ${tappedMeta.itemEmoji} ${tappedMeta.itemName}！`,
                    `再撳其他立體公仔探索下啦！`
                );
                runQuantityCountingSequence(tappedKey, false, false);
                return;
            }

            // Mode 1, Mode 2 & Mode 4 (Mario): Check if Correct Answer
            if (tappedKey === gameState.targetKey) {
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
                    setPromptUI(
                        `答啱喇！係「${tappedMeta.title}」！一齊數下彈出嚟嘅 3D 寶物！`,
                        `認知強化：${tappedMeta.title}`
                    );
                    runQuantityCountingSequence(tappedKey, true, isMario);
                } else {
                    setPromptUI(
                        `好叻呀！答啱喇，呢個係「${tappedMeta.title}」！`,
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

                const targetMeta = getCognitiveItemMeta(gameState.targetKey);
                setPromptUI(
                    `呢個係「${tappedMeta.title}」，唔緊要，我哋再搵下「${targetMeta.title}」啦！`,
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

        // Sequential 3D Object Spawning (1..N Apples/Coins for Numbers, 3 Matching 3D Objects for Colors/Shapes)
        function runQuantityCountingSequence(itemKey, autoAdvanceAfter, isCoin = false) {
            clearCountingObjects();
            const meta = getCognitiveItemMeta(itemKey);
            const count = meta.spawnCount;

            const banner = document.getElementById('counting-banner');
            const dotsContainer = document.getElementById('counting-dots');
            const emojiEl = document.getElementById('counting-emoji');
            emojiEl.textContent = (meta.subject === 'number' && isCoin) ? '🪙' : meta.itemEmoji;
            banner.classList.remove('hidden');
            dotsContainer.innerHTML = '';

            const spacing = count > 6 ? 1.12 : 1.45;
            const startX = -((count - 1) * spacing) / 2;
            const zPos = isCoin ? 2.25 : 3.15;

            for (let i = 1; i <= count; i++) {
                const t = setTimeout(() => {
                    const xPos = startX + (i - 1) * spacing;
                    createSingleCounting3DItem(i, count, xPos, zPos, isCoin, itemKey);
                    if (isCoin) {
                        playCoinSound();
                    } else {
                        playCountingNote(i);
                    }

                    // Add badge to bottom banner
                    const badge = document.createElement('span');
                    badge.className = 'inline-flex items-center justify-center bg-orange-100 text-orange-600 px-2.5 py-0.5 rounded-xl text-base sm:text-xl font-black star-earned';
                    badge.textContent = meta.subject === 'number' ? String(i) : `${meta.title} ×${i}`;
                    dotsContainer.appendChild(badge);
                }, 420 + (i - 1) * 500);
                activeCountingTimeouts.push(t);
            }

            const totalDuration = 420 + count * 500 + 650;
            const endTimer = setTimeout(() => {
                if (meta.subject === 'number') {
                    const unitText = isCoin ? '粒金幣' : '個紅蘋果';
                    setPromptUI(
                        `好叻呀！總共有 ${count}（${NUMBER_WORDS_HK[count]}）${unitText}！`,
                        autoAdvanceAfter ? `準備進入下一關...` : `繼續點擊其他立體公仔探索啦！`
                    );
                } else {
                    setPromptUI(
                        `好叻呀！呢個就係「${meta.title}」！（${meta.itemEmoji} ${meta.itemName}）`,
                        autoAdvanceAfter ? `準備進入下一關...` : `繼續點擊其他立體公仔探索啦！`
                    );
                }
                if (autoAdvanceAfter) {
                    if (gameState.mode === 'mario') {
                        triggerMarioGoalRun();
                    } else {
                        const nextTimer = setTimeout(() => {
                            if (gameState.mode === 'train') {
                                trainAnimState.targetX = 14;
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
            const activeClass = 'setting-pill py-3 px-2 rounded-2xl font-black text-sm sm:text-base border-2 border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm';
            const inactiveClass = 'setting-pill py-3 px-2 rounded-2xl font-bold text-sm sm:text-base border-2 border-slate-200 bg-white text-slate-600 hover:bg-slate-50';

            ['number', 'color', 'shape'].forEach(subj => {
                const el = document.getElementById(`set-subj-${subj}`);
                if (el) el.className = (gameState.subject === subj) ? activeClass : inactiveClass;
            });

            // Dim number range selector if currently in Color or Shape mode
            const rangeBox = document.getElementById('setting-number-range-box');
            if (rangeBox) {
                rangeBox.style.opacity = gameState.subject === 'number' ? '1' : '0.45';
            }

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
            openLobby('subject');
            animate();
        };
