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
            explore: '🎨 自由探索',
            treasure: '🗺️ 尋寶小英雄'
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

                // Show the 5th mode (尋寶小英雄) ONLY when inside Number Wonderland (🔢 數字樂園)
                const treasureCard = document.getElementById('lobby-card-treasure');
                if (treasureCard) {
                    if (gameState.subject === 'number') {
                        treasureCard.classList.remove('hidden');
                        treasureCard.classList.add('flex');
                    } else {
                        treasureCard.classList.add('hidden');
                        treasureCard.classList.remove('flex');
                    }
                }

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

            // If user switches to Color or Shape while inside number-exclusive Treasure mode, switch to Gacha
            if (newSubject !== 'number' && gameState.mode === 'treasure') {
                gameState.mode = 'gacha';
            }

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

            // Toggle visibility of 3D centerpieces & Mode-specific Controllers
            gachaMachineGroup.visible = (newMode === 'gacha');
            trainGroup.visible = (newMode === 'train');
            marioStageGroup.visible = (newMode === 'mario');
            treasureIslandGroup.visible = (newMode === 'treasure');
            environmentGroup.visible = (newMode !== 'treasure') && !gameState.settings.lowDistraction;
            const mainFloor = scene.getObjectByName('mainFloor');
            if (mainFloor) mainFloor.visible = (newMode !== 'treasure');    

            const marioControls = document.getElementById('mario-controls-bar');
            const marioBadge = document.getElementById('mario-stage-badge');
            const treasureDpad = document.getElementById('treasure-dpad-bar');

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

            if (treasureDpad) {
                if (newMode === 'treasure') {
                    treasureDpad.classList.remove('hidden');
                    treasureDpad.classList.add('flex');
                } else {
                    treasureDpad.classList.add('hidden');
                    treasureDpad.classList.remove('flex');
                }
            }

            document.getElementById('btn-visual-hint').style.display = (newMode === 'explore') ? 'none' : 'flex';
            updateCameraForAspect();
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

            if (gameState.mode === 'treasure') {
                setupTreasureRound(choices, target, meta);
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

       // Setup Mode 5: Staggered Maze Alcoves (中央大道永遠暢通，寶箱分佈於前後迷宮灣位！)
        function setupTreasureRound(choices, target, meta) {
            if (!treasureHero.storyChapter) treasureHero.storyChapter = 1;
            const ch = treasureHero.storyChapter;
            treasureHero.activeChestPos = null;
            treasureHero.cameraFocusGate = null;
            treasureHero.castleFinale = false;

            // 徹底取消中間 X=0「路霸寶箱」！
            // 每個區域嘅 3 個寶箱都分佈喺迷宮矮牆隔開嘅「左前灣、右後灣、左後／右前灣」（前後錯落）：
            const zoneChests = {
                1: [ // 第 1 站：🌳 精靈森林迷宮 (繞過綠樹籬進入唔同小灣)
                    { x: -5.4, z: 6.1 }, // 左南果園灣
                    { x: 5.4,  z: 3.3 }, // 右北花叢灣
                    { x: -5.4, z: 3.3 }  // 左北秘密灣
                ],
                2: [ // 第 2 站：🏜️ 黃金遺跡迷宮 (穿過拱門直行完全無阻擋！)
                    { x: -5.4, z: 0.65 }, // 左南沙洲灣
                    { x: 5.4,  z: 0.65 }, // 右南沙洲灣
                    { x: 5.4,  z: -1.95 } // 右北金字塔灣
                ],
                3: [ // 第 3 站：🏰 皇冠城堡迷宮 (過彩虹橋直行完全無阻擋！)
                    { x: -5.4, z: -6.1 }, // 左前皇家花園灣
                    { x: 5.4,  z: -8.3 }, // 右後城堡高台灣
                    { x: -5.4, z: -8.3 }  // 左後城堡高台灣
                ]
            };

            const poolCoords = zoneChests[Math.min(3, ch)] || zoneChests[1];
            const activeCoords = poolCoords.slice(0, choices.length);

            choices.forEach((itemKey, idx) => {
                const pt = activeCoords[idx] || poolCoords[0];
                const chest = create3DTreasureChest(itemKey, pt.x, pt.z);
                interactiveBlocks.push(chest);
            });

            if (typeof spawnTreasureMiniCoins === 'function') {
                spawnTreasureMiniCoins();
            }

            if (!treasureHero.keepHeroPosition) {
                treasureHero.currentX = 0;
                treasureHero.currentZ = 6.9;
                treasureHero.facingAngle = Math.PI;
                if (treasureHero.group) {
                    treasureHero.group.position.set(0, 0.32, 6.9);
                    treasureHero.group.rotation.y = Math.PI;
                }
                if (treasureHero.compassRing) {
                    treasureHero.compassRing.position.set(0, 0.35, 6.9);
                }
            }
            treasureHero.keepHeroPosition = false;
            treasureHero.jumpY = 0;
            treasureHero.jumpVel = 0;
            treasureHero.targetX = null;
            treasureHero.targetZ = null;
            treasureHero.moveDirX = 0;
            treasureHero.moveDirZ = 0;
            treasureHero.pendingChest = null;
            if (treasureHero.clickMarker) {
                treasureHero.clickMarker.visible = false;
            }

            if (ch === 1) {
                setPromptUI(
                    `🌳 第 1 站【精靈森林迷宮】：轉入迷宮小灣搵「${meta.title}」寶箱！`,
                    `踩中「⚡ 閃電星星板」可以加速衝刺！答啱就會飛出金鎖匙打開森林大門！`
                );
            } else if (ch === 2) {
                setPromptUI(
                    `🏜️ 大門開咗喇！第 2 站【黃金遺跡迷宮】：過門去搵「${meta.title}」寶箱！`,
                    `中央大路已經打通！穿過拱門再轉入左右沙洲秘境搵寶箱啦！`
                );
            } else {
                setPromptUI(
                    `🏰 彩虹橋升起喇！第 3 站【皇冠城堡花園】：過河搵「${meta.title}」寶箱！`,
                    `行過七彩浮橋進入城堡花園，解開最後一個皇家寶箱放煙花啦！`
                );
            }
        }

        function setTreasureMoveDir(dx, dz) {
            if (gameState.mode !== 'treasure' || gameState.isBusy) {
                treasureHero.moveDirX = 0;
                treasureHero.moveDirZ = 0;
                return;
            }
            treasureHero.moveDirX = dx;
            treasureHero.moveDirZ = dz;
            if (dx !== 0 || dz !== 0) {
                treasureHero.targetX = null;
                treasureHero.targetZ = null;
                treasureHero.pendingChest = null;
                if (treasureHero.clickMarker) treasureHero.clickMarker.visible = false;
            }
        }

        function nudgeTreasureHero(dx, dz) {
            if (gameState.mode !== 'treasure' || gameState.isBusy) return;
            playPopSound(440);
            treasureHero.targetX = Math.max(-7.2, Math.min(7.2, treasureHero.currentX + dx * 1.6));
            treasureHero.targetZ = Math.max(-8.8, Math.min(7.4, treasureHero.currentZ + dz * 1.6));
            treasureHero.pendingChest = null;
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
            if (gameState.mode === 'mario') {
                if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                    marioMoveStep(-1);
                } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                    marioMoveStep(1);
                } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'Enter') {
                    e.preventDefault();
                    marioJumpAction();
                }
            } else if (gameState.mode === 'treasure') {
                if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                    setTreasureMoveDir(-1, treasureHero.moveDirZ);
                } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                    setTreasureMoveDir(1, treasureHero.moveDirZ);
                } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                    e.preventDefault();
                    setTreasureMoveDir(treasureHero.moveDirX, -1);
                } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                    e.preventDefault();
                    setTreasureMoveDir(treasureHero.moveDirX, 1);
                }
            }
        }

        function onWindowKeyUp(e) {
            if (gameState.mode !== 'treasure') return;
            if (['ArrowLeft', 'a', 'A', 'ArrowRight', 'd', 'D'].includes(e.key)) {
                setTreasureMoveDir(0, treasureHero.moveDirZ);
            }
            if (['ArrowUp', 'w', 'W', 'ArrowDown', 's', 'S'].includes(e.key)) {
                setTreasureMoveDir(treasureHero.moveDirX, 0);
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
                rightBlock.haloMesh.material.opacity = 0.88;
                if (manualClick) {
                    playPopSound(660);
                }
            }
        }

        function setPromptUI(mainText, subText) {
            document.getElementById('prompt-text').textContent = mainText;
            document.getElementById('sub-prompt-text').textContent = subText;
        }

        /********************************************************************
         * 8. SINGLE-FINGER TOUCH & CLICK INTERACTION (RAYCASTER)
         ********************************************************************/
        function onCanvasPointerDown(event) {
            if (gameState.isBusy || gameState.inLobby) return;
            ensureAudioCtx();

            const rect = renderer.domElement.getBoundingClientRect();
            pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(pointer, camera);

            const meshes = [];
            interactiveBlocks.forEach(b => {
                if (b.extraHitMeshes) {
                    meshes.push(...b.extraHitMeshes);
                } else if (b.bodyMesh) {
                    meshes.push(b.bodyMesh);
                }
            });
            const intersects = raycaster.intersectObjects(meshes, false);

            if (intersects.length > 0) {
                const tappedWrapper = intersects[0].object.userData.parentWrapper;
                if (tappedWrapper) {
                    if (gameState.mode === 'mario') {
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
                    } else if (gameState.mode === 'treasure') {
                        if (gameState.isBusy) return;
                        playPopSound(520);
                        treasureHero.moveDirX = 0;
                        treasureHero.moveDirZ = 0;
                        treasureHero.targetX = tappedWrapper.baseX;
                        treasureHero.targetZ = tappedWrapper.baseZ + 1.05;
                        treasureHero.pendingChest = tappedWrapper;
                        if (treasureHero.clickMarker) {
                            treasureHero.clickMarker.position.set(tappedWrapper.baseX, 0.36, tappedWrapper.baseZ + 1.05);
                            treasureHero.clickMarker.visible = true;
                        }
                    } else {
                        handleBlockTapped(tappedWrapper);
                    }
                    return;
                }
            }

            if (gameState.mode === 'treasure' && !gameState.isBusy) {
                const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.3);
                const hitPt = new THREE.Vector3();
                if (raycaster.ray.intersectPlane(groundPlane, hitPt)) {
                    playPopSound(460);
                    treasureHero.moveDirX = 0;
                    treasureHero.moveDirZ = 0;
                    treasureHero.pendingChest = null;
                    treasureHero.targetX = THREE.MathUtils.clamp(hitPt.x, -9.2, 9.2);
                    treasureHero.targetZ = THREE.MathUtils.clamp(hitPt.z, -7.5, 7.2);
                    if (treasureHero.clickMarker) {
                        treasureHero.clickMarker.position.set(treasureHero.targetX, 0.36, treasureHero.targetZ);
                        treasureHero.clickMarker.visible = true;
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

            // Check if Correct Answer
            if (tappedKey === gameState.targetKey) {
                gameState.isBusy = true;
                block.state = 'celebrate';
                block.haloMesh.material.opacity = 0;
                emitStarParticles(block.group.position);

                const isMario = (gameState.mode === 'mario');
                const isTreasure = (gameState.mode === 'treasure');
                if (isMario) {
                    playCoinSound();
                    block.bumpOffset = 0.55;
                    gameState.marioStage += 1;
                } else if (isTreasure) {
                    playChestOpenSound();
                    block.lidOpen = true;
                    // 第 1 段鏡頭：先特寫對準打開嗰個寶箱數紅寶石（唔好即刻開門住，等小朋友睇清數寶石先！）
                    treasureHero.activeChestPos = { x: block.baseX, z: block.baseZ };
                    treasureHero.cameraFocusGate = null;
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
                        isTreasure
                            ? `打開寶箱喇！係「${tappedMeta.title}」！一齊數下寶箱頂彈出嚟嘅紅寶石！`
                            : `答啱喇！係「${tappedMeta.title}」！一齊數下彈出嚟嘅 3D 寶物！`,
                        `認知強化：${tappedMeta.title}`
                    );
                    runQuantityCountingSequence(tappedKey, true, isMario || isTreasure);
                } else {
                    setPromptUI(
                        `好叻呀！答啱喇，呢個係「${tappedMeta.title}」！`,
                        `準備進入下一關...`
                    );
                    if (isMario) {
                        triggerMarioGoalRun();
                    } else if (isTreasure) {
                        triggerTreasureCutsceneAfterCount();
                    } else {
                        setTimeout(() => {
                            if (!isToyModalOpen()) startNewRound();
                        }, 2200);
                    }
                }
            } else {
                playGentleNudge();
                block.state = 'wrong';
                block.wrongTimer = 0.7;
                if (block.isMarioBrick || block.isTreasureChest) {
                    block.bumpOffset = 0.25;
                }
                if (block.bodyMesh && Array.isArray(block.bodyMesh.material)) {
                    block.bodyMesh.material.forEach(m => {
                        m.transparent = true;
                        m.opacity = 0.6;
                    });
                }
                if (gameState.mode === 'treasure') {
                    treasureHero.moveDirX = 0;
                    treasureHero.moveDirZ = 0;
                    treasureHero.pendingChest = null;
                    treasureHero.targetX = treasureHero.currentX;
                    treasureHero.targetZ = treasureHero.currentZ + 1.1;
                }

                const targetMeta = getCognitiveItemMeta(gameState.targetKey);
                setPromptUI(
                    `呢個係「${tappedMeta.title}」，唔緊要，我哋再搵下「${targetMeta.title}」啦！`,
                    `無挫敗感提示：請跟住腳下橙色箭咀搵正確寶箱`
                );

                setTimeout(() => {
                    triggerVisualHint(false);
                }, 900);
            }
        }

        // 🎬 第 2 段電影感分鏡：數完紅寶石之後，鏡頭轉去中央大門，親眼睇住金鎖匙飛過去開門／升彩虹橋／放城堡煙花！
        function triggerTreasureCutsceneAfterCount() {
            clearCountingObjects();
            const currentCh = treasureHero.storyChapter || 1;

            if (currentCh < 3) {
                const targetGate = treasureHero.gates[currentCh];
                // 將鏡頭焦點移去中央大門 / 彩虹橋
                treasureHero.cameraFocusGate = { x: 0, z: targetGate ? targetGate.zPos : 0 };

                if (treasureHero.flyingKey && targetGate && treasureHero.activeChestPos) {
                    const fk = treasureHero.flyingKey;
                    fk.active = true;
                    fk.progress = 0;
                    fk.targetGateId = currentCh;
                    fk.startPos.set(treasureHero.activeChestPos.x, 1.8, treasureHero.activeChestPos.z);
                    fk.endPos.set(0, 1.35, targetGate.zPos);
                    fk.mesh.position.copy(fk.startPos);
                    fk.mesh.visible = true;
                }

                setPromptUI(
                    currentCh === 1
                        ? `🔑 睇下！魔法金鎖匙飛緊去打開「🌸 森林雙開大門」喇！`
                        : `🌉 睇下！金鎖匙打開咗皇家大門，七彩浮橋由河面升緊起喇！`,
                    `請留意畫面中央嘅魔法機關！`
                );

                // 當金鎖匙飛抵大門（0.7秒後）先正式推開大門與升起彩虹橋！
                const unlockTimer = setTimeout(() => {
                    treasureHero.storyChapter = currentCh + 1;
                    treasureHero.keepHeroPosition = true;
                    playStageClearFanfare();
                }, 700);
                activeCountingTimeouts.push(unlockTimer);

                const nextRoundTimer = setTimeout(() => {
                    treasureHero.cameraFocusGate = null;
                    if (!isToyModalOpen()) startNewRound();
                }, 2200);
                activeCountingTimeouts.push(nextRoundTimer);
            } else {
                // 🎆 第 3 站終點：皇冠大城堡漫天煙花慶典！
                treasureHero.castleFinale = true;
                treasureHero.cameraFocusGate = { x: 0, z: -8.5 };
                playStageClearFanfare();
                setPromptUI(
                    `👑 恭喜闖關成功！你已經解開晒三大迷宮嘅所有寶箱喇！`,
                    `一齊欣賞皇冠大城堡嘅勝利煙花匯演啦！🎉`
                );

                // 連續喺皇冠城堡上空發射 5 發七彩星星煙花！
                [
                    [-2.5, 3.8, -9.5],
                    [2.5,  3.8, -9.5],
                    [0,    4.5, -9.8],
                    [-3.5, 3.2, -8.5],
                    [3.5,  3.2, -8.5]
                ].forEach(([fx, fy, fz], idx) => {
                    const fwTimer = setTimeout(() => {
                        playCoinSound();
                        emitStarParticles(new THREE.Vector3(fx, fy, fz));
                    }, idx * 350);
                    activeCountingTimeouts.push(fwTimer);
                });

                const finishTimer = setTimeout(() => {
                    treasureHero.castleFinale = false;
                    treasureHero.cameraFocusGate = null;
                    treasureHero.storyChapter = 1;
                    treasureHero.keepHeroPosition = false;
                    if (!isToyModalOpen()) startNewRound();
                }, 2800);
                activeCountingTimeouts.push(finishTimer);
            }
        }

        function triggerMarioGoalRun() {
            marioHero.runningToFlag = true;
            marioHero.targetX = 4.55;
            playStageClearFanfare();
            emitStarParticles(new THREE.Vector3(5.1, 3.5, 0.8));
            setTimeout(() => {
                if (!isToyModalOpen()) startNewRound();
            }, 2200);
        }

        // 數與量點數動畫（尋寶模式改為「彩虹拱形」懸浮喺數字牌上方，絕不遮擋寶箱數字！）
        function runQuantityCountingSequence(itemKey, autoAdvanceAfter, isCoin = false) {
            clearCountingObjects();
            const meta = getCognitiveItemMeta(itemKey);
            const count = meta.spawnCount;

            const banner = document.getElementById('counting-banner');
            const dotsContainer = document.getElementById('counting-dots');
            const emojiEl = document.getElementById('counting-emoji');
            emojiEl.textContent = (meta.subject === 'number' && isCoin)
                ? (gameState.mode === 'treasure' ? '💎' : '🪙')
                : meta.itemEmoji;
            banner.classList.remove('hidden');
            dotsContainer.innerHTML = '';

            const isTreasureChestOpen = (gameState.mode === 'treasure' && treasureHero.activeChestPos);
            const centerX = isTreasureChestOpen ? treasureHero.activeChestPos.x : 0;
            const spacing = isTreasureChestOpen
                ? (count > 5 ? 0.62 : 0.78)
                : (count > 6 ? 1.12 : 1.45);
            const startX = centerX - ((count - 1) * spacing) / 2;
            const zPos = isTreasureChestOpen
                ? (treasureHero.activeChestPos.z + 0.25)
                : (isCoin ? 2.25 : 3.15);

            for (let i = 1; i <= count; i++) {
                const t = setTimeout(() => {
                    const xPos = startX + (i - 1) * spacing;
                    createSingleCounting3DItem(i, count, xPos, zPos, isCoin, itemKey);

                    // 尋寶模式：將紅寶石排成「彩虹半圓拱形」升到數字牌頂部上方 (Y = 3.05 ~ 3.45)，100% 唔會遮住寶箱個數字！
                    if (isTreasureChestOpen && spawnedCountingItems.length > 0) {
                        const newest = spawnedCountingItems[spawnedCountingItems.length - 1];
                        const progress = count > 1 ? (i - 1) / (count - 1) : 0.5;
                        const arcBoost = Math.sin(progress * Math.PI) * 0.42;
                        newest.baseY = 3.02 + arcBoost;
                        newest.group.position.y = newest.baseY;
                    }

                    if (isCoin) {
                        playCoinSound();
                    } else {
                        playCountingNote(i);
                    }

                    const badge = document.createElement('span');
                    badge.className = 'inline-flex items-center justify-center bg-orange-100 text-orange-600 px-2.5 py-0.5 rounded-xl text-base sm:text-xl font-black star-earned';
                    badge.textContent = meta.subject === 'number' ? String(i) : `${meta.title} ×${i}`;
                    dotsContainer.appendChild(badge);
                }, 380 + (i - 1) * 450);
                activeCountingTimeouts.push(t);
            }

            const totalDuration = 380 + count * 450 + 600;
            const endTimer = setTimeout(() => {
                if (meta.subject === 'number') {
                    const unitText = isCoin ? (gameState.mode === 'treasure' ? '粒紅寶石' : '粒金幣') : '個紅蘋果';
                    setPromptUI(
                        `好叻呀！總共有 ${count}（${NUMBER_WORDS_HK[count]}）${unitText}！`,
                        autoAdvanceAfter ? `準備打開魔法機關...` : `繼續點擊其他立體公仔探索啦！`
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
                    } else if (gameState.mode === 'treasure') {
                        // 數完紅寶石後，進入「金鎖匙飛去開門／彩虹橋升起／城堡放煙花」特寫演出！
                        triggerTreasureCutsceneAfterCount();
                    } else {
                        const nextTimer = setTimeout(() => {
                            if (gameState.mode === 'train') {
                                trainAnimState.targetX = 14;
                            }
                            setTimeout(() => {
                                if (!isToyModalOpen()) startNewRound();
                            }, 650);
                        }, 1100);
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
            const activeClass = 'bg-indigo-600 text-white border-indigo-600 shadow-md';
            const inactiveClass = 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100';

            // Subject pills in Settings
            ['number', 'color', 'shape'].forEach(subj => {
                const el = document.getElementById(`set-subj-${subj}`);
                if (el) el.className = `setting-pill py-3 px-2 rounded-2xl font-bold text-sm sm:text-base border-2 transition-all ${gameState.subject === subj ? activeClass : inactiveClass}`;
            });

            // Range pills
            ['1-5', '6-10', '1-10'].forEach(r => {
                const el = document.getElementById(`set-range-${r}`);
                if (el) el.className = `setting-pill py-3 px-3 rounded-2xl font-bold text-sm sm:text-base border-2 transition-all ${s.range === r ? activeClass : inactiveClass}`;
            });

            // Choices pills
            [1, 2, 3].forEach(c => {
                const el = document.getElementById(`set-choices-${c}`);
                if (el) el.className = `setting-pill py-3 px-2 rounded-2xl font-bold text-sm sm:text-base border-2 transition-all ${s.choices === c ? activeClass : inactiveClass}`;
            });

            // Background distraction pills
            document.getElementById('set-bg-rich').className = `setting-pill py-3 px-3 rounded-2xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-2 ${!s.lowDistraction ? activeClass : inactiveClass}`;
            document.getElementById('set-bg-calm').className = `setting-pill py-3 px-3 rounded-2xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-2 ${s.lowDistraction ? activeClass : inactiveClass}`;

            // Toggle switches
            const autoBtn = document.getElementById('toggle-autoprompt');
            autoBtn.className = `w-14 h-8 rounded-full transition-colors p-1 flex items-center ${s.autoPrompt ? 'bg-emerald-500' : 'bg-slate-300'}`;
            autoBtn.firstElementChild.className = `w-6 h-6 rounded-full bg-white shadow transform transition-transform ${s.autoPrompt ? 'translate-x-6' : 'translate-x-0'}`;

            const countBtn = document.getElementById('toggle-counting');
            countBtn.className = `w-14 h-8 rounded-full transition-colors p-1 flex items-center ${s.countObjects ? 'bg-emerald-500' : 'bg-slate-300'}`;
            countBtn.firstElementChild.className = `w-6 h-6 rounded-full bg-white shadow transform transition-transform ${s.countObjects ? 'translate-x-6' : 'translate-x-0'}`;
        }

        /********************************************************************
         * 11. MAIN 60FPS 3D ANIMATION LOOP
         ********************************************************************/
        function animate() {
            requestAnimationFrame(animate);
            const dt = Math.min(clock.getDelta(), 0.1);
            const elapsed = clock.getElapsedTime();

            // 1. Drift Clouds Gently
            cloudsList.forEach(c => {
                c.position.x = c.userData.baseX + Math.sin(elapsed * c.userData.speed) * 1.4;
            });

            // 2. Spin Gachapon Dial when active
            if (gachaSpinTimer > 0 && gachaDialMesh) {
                gachaSpinTimer -= dt;
                gachaDialMesh.rotation.z += dt * 10;
            }

            // 3. Move 3D Cartoon Train smoothly
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

            // 4. Animate 3D Number Character Blocks, Mario Floating Bricks & 3D Treasure Chests
            interactiveBlocks.forEach(block => {
                block.animTime += dt;

                // Smoothly swing open Treasure Chest lid when unlocked
                if (block.isTreasureChest && block.lidPivot) {
                    const targetLidRot = block.lidOpen ? -1.25 : 0;
                    block.lidPivot.rotation.x = THREE.MathUtils.lerp(block.lidPivot.rotation.x, targetLidRot, dt * 8);
                }

                // Decay Mario brick bump offset smoothly
                if (block.bumpOffset && block.bumpOffset > 0) {
                    block.bumpOffset = Math.max(0, block.bumpOffset - dt * 2.2);
                }
                const bumpY = block.bumpOffset ? Math.sin(block.bumpOffset * Math.PI) * 0.55 : 0;

                if (block.state === 'idle') {
                    if (block.isTreasureChest) {
                        block.group.position.y = block.baseY + bumpY * 0.4;
                        block.bodyMesh.position.y = 1.98 + Math.sin(block.animTime * 2.6) * 0.08;
                    } else {
                        block.group.position.y = block.baseY + Math.sin(block.animTime * 2.4) * 0.07 + bumpY;
                        block.group.rotation.z = Math.sin(block.animTime * 1.5) * 0.025;
                        block.group.rotation.y = THREE.MathUtils.lerp(block.group.rotation.y, 0, dt * 5);
                    }
                    block.group.scale.setScalar(THREE.MathUtils.lerp(block.group.scale.x, block.baseScale, dt * 6));
                } else if (block.state === 'hint') {
                    // Noticeable bouncy Visual Prompt + Golden Halo pulse
                    if (block.isTreasureChest) {
                        block.group.position.y = block.baseY + Math.abs(Math.sin(block.animTime * 6.5)) * 0.25;
                        block.haloMesh.rotation.z += dt * 2.5;
                    } else {
                        block.group.position.y = block.baseY + Math.abs(Math.sin(block.animTime * 6.5)) * 0.42 + bumpY;
                        block.haloMesh.rotation.z += dt * 2.5;
                    }
                    const pulseScale = block.baseScale * (1.12 + Math.sin(block.animTime * 6.5) * 0.07);
                    block.group.scale.setScalar(pulseScale);
                } else if (block.state === 'wrong') {
                    // Gentle non-frustrating horizontal wobble
                    block.wrongTimer -= dt;
                    block.group.position.y = block.baseY + bumpY;
                    block.group.rotation.z = Math.sin(block.animTime * 28) * 0.14;
                    if (block.wrongTimer <= 0) {
                        block.state = 'idle';
                        block.group.rotation.z = 0;
                    }
                } else if (block.state === 'celebrate') {
                    // Happy jump & spin
                    if (block.isMarioBrick || block.isTreasureChest) {
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

            // 4C. Animate Treasure Island (迷宮矮牆繞行 + 星星加速板 + 兩段式電影特寫鏡頭)
            if (treasureIslandGroup.visible && treasureHero.group) {
                const ch = treasureHero.storyChapter || 1;

                // 1. 🔑 3D 魔法金鎖匙拋物線飛翔動畫
                if (treasureHero.flyingKey && treasureHero.flyingKey.active) {
                    const fk = treasureHero.flyingKey;
                    fk.progress = Math.min(1, fk.progress + dt * 1.4);
                    fk.mesh.position.lerpVectors(fk.startPos, fk.endPos, fk.progress);
                    fk.mesh.position.y += Math.sin(fk.progress * Math.PI) * 2.5;
                    fk.mesh.rotation.y += dt * 14;
                    if (fk.progress >= 1) {
                        fk.active = false;
                        fk.mesh.visible = false;
                        playSuccessChime();
                        emitStarParticles(fk.endPos);
                    }
                }

                // 2. 🌸 雙扇魔法大門向左右兩邊推開動畫
                if (treasureHero.gates) {
                    [1, 2].forEach(gId => {
                        const gate = treasureHero.gates[gId];
                        if (gate) {
                            const isUnlocked = (gId === 1 && ch >= 2) || (gId === 2 && ch >= 3);
                            const targetAngle = isUnlocked ? 1.75 : 0;
                            gate.leftPivot.rotation.y = THREE.MathUtils.lerp(gate.leftPivot.rotation.y, -targetAngle, dt * 5);
                            gate.rightPivot.rotation.y = THREE.MathUtils.lerp(gate.rightPivot.rotation.y, targetAngle, dt * 5);
                            if (gate.lockGroup) {
                                gate.lockGroup.visible = !isUnlocked;
                            }
                        }
                    });
                }

                // 3. 🌉 彩虹浮橋一格一格升起
                if (treasureHero.bridgePlanks) {
                    const bridgeUnlocked = (ch >= 3);
                    treasureHero.bridgePlanks.forEach(bp => {
                        const targetY = bridgeUnlocked ? 0.28 : -0.45;
                        bp.mesh.position.y = THREE.MathUtils.lerp(bp.mesh.position.y, targetY, dt * (4 + bp.index * 0.8));
                    });
                }

                // 4. ⚡ 星星加速板旋轉與踩中加速衝刺
                if (treasureHero.speedBoostTimer > 0) {
                    treasureHero.speedBoostTimer = Math.max(0, treasureHero.speedBoostTimer - dt);
                }
                if (treasureHero.speedPads) {
                    treasureHero.speedPads.forEach(pad => {
                        if (pad.userData.starCore) {
                            pad.userData.starCore.rotation.y += dt * 4.5;
                        }
                        if (!gameState.isBusy && treasureHero.speedBoostTimer <= 0.2) {
                            if (Math.hypot(treasureHero.currentX - pad.userData.x, treasureHero.currentZ - pad.userData.z) < 0.85) {
                                treasureHero.speedBoostTimer = 1.1;
                                playPopSound(780);
                                emitStarParticles(pad.position);
                            }
                        }
                    });
                }

                // 5. 小英雄移動與「迷宮矮牆自動順滑繞行」
                let vx = 0;
                let vz = 0;
                const baseSpeed = 6.5;
                const walkSpeed = treasureHero.speedBoostTimer > 0 ? baseSpeed * 1.45 : baseSpeed;

                if (treasureHero.moveDirX !== 0 || treasureHero.moveDirZ !== 0) {
                    vx = treasureHero.moveDirX * walkSpeed;
                    vz = treasureHero.moveDirZ * walkSpeed;
                } else if (treasureHero.targetX !== null && treasureHero.targetZ !== null) {
                    const dx = treasureHero.targetX - treasureHero.currentX;
                    const dz = treasureHero.targetZ - treasureHero.currentZ;
                    const dist = Math.hypot(dx, dz);
                    if (dist > 0.15) {
                        vx = (dx / dist) * walkSpeed;
                        vz = (dz / dist) * walkSpeed;
                    } else {
                        treasureHero.targetX = null;
                        treasureHero.targetZ = null;
                        if (treasureHero.clickMarker) treasureHero.clickMarker.visible = false;
                    }
                }

                const isWalking = Math.hypot(vx, vz) > 0.05;
                if (isWalking) {
                    const minAllowedZ = (ch === 1) ? 2.55 : (ch === 2 ? -2.75 : -8.8);
                    let nextX = Math.max(-6.9, Math.min(6.9, treasureHero.currentX + vx * dt));
                    let nextZ = Math.max(minAllowedZ, Math.min(7.3, treasureHero.currentZ + vz * dt));

                    // 檢查是否經過第1道大門或第2道彩虹橋，自動引導入中央拱門
                    const inGate1Zone = (nextZ >= 1.55 && nextZ <= 2.45);
                    const inBridgeZone = (nextZ >= -5.25 && nextZ <= -2.85);

                    if ((inGate1Zone || inBridgeZone) && Math.abs(nextX) > 1.35) {
                        const steerDir = -Math.sign(treasureHero.currentX);
                        treasureHero.currentX += steerDir * walkSpeed * dt;
                        vx = steerDir * walkSpeed;
                    } else {
                        // 檢查是否碰到迷宮分隔矮牆；如碰到，自動順滑引導去中央走廊 (X = 0) 繞過去！
                        const heroR = 0.45;
                        const dividers = treasureHero.mazeDividers || [];
                        let blockedX = false;
                        let blockedZ = false;

                        for (let i = 0; i < dividers.length; i++) {
                            const d = dividers[i];
                            if (Math.abs(nextX - d.x) < d.halfW + heroR && Math.abs(treasureHero.currentZ - d.z) < d.halfD + heroR) {
                                blockedX = true;
                            }
                            if (Math.abs(treasureHero.currentX - d.x) < d.halfW + heroR && Math.abs(nextZ - d.z) < d.halfD + heroR) {
                                blockedZ = true;
                            }
                        }

                        if (!blockedX) treasureHero.currentX = nextX;
                        if (!blockedZ) {
                            treasureHero.currentZ = nextZ;
                        } else if (Math.abs(vx) < 2.0) {
                            // 撞到橫向迷宮矮牆時，自動往中央主幹道滑動繞過矮牆！
                            const slideDir = -Math.sign(treasureHero.currentX) || 1;
                            treasureHero.currentX += slideDir * walkSpeed * 0.85 * dt;
                        }
                    }

                    treasureHero.walkCycle += dt * (treasureHero.speedBoostTimer > 0 ? 22 : 16);
                    treasureHero.facingAngle = Math.atan2(vx, vz);
                }

                const walkBounce = isWalking ? Math.abs(Math.sin(treasureHero.walkCycle)) * 0.18 : Math.sin(elapsed * 3) * 0.03;
                treasureHero.group.position.set(
                    treasureHero.currentX,
                    0.32 + walkBounce,
                    treasureHero.currentZ
                );
                treasureHero.group.rotation.y = THREE.MathUtils.lerp(treasureHero.group.rotation.y, treasureHero.facingAngle, dt * 10);

                // 6. 🎥 三段式智能鏡頭：
                // (A) 鎖匙開門／城堡煙花時 -> 對準中央大門或城堡！
                // (B) 開箱數紅寶石時 -> 對準該寶箱！
                // (C) 平時探索時 -> 跟住小英雄！
                let camTargetX, camTargetY, camTargetZ, lookX, lookY, lookZ;
                if (treasureHero.cameraFocusGate) {
                    camTargetX = 0;
                    camTargetY = treasureHero.castleFinale ? 7.8 : 7.4;
                    camTargetZ = treasureHero.cameraFocusGate.z + 8.6;
                    lookX = 0;
                    lookY = treasureHero.castleFinale ? 2.2 : 1.2;
                    lookZ = treasureHero.cameraFocusGate.z;
                } else if (gameState.isBusy && treasureHero.activeChestPos) {
                    camTargetX = treasureHero.activeChestPos.x * 0.82;
                    camTargetY = 6.8;
                    camTargetZ = treasureHero.activeChestPos.z + 7.4;
                    lookX = treasureHero.activeChestPos.x;
                    lookY = 1.65;
                    lookZ = treasureHero.activeChestPos.z;
                } else {
                    camTargetX = treasureHero.currentX * 0.65;
                    camTargetY = 9.8;
                    camTargetZ = treasureHero.currentZ + 8.2;
                    lookX = treasureHero.currentX * 0.7;
                    lookY = 0.4;
                    lookZ = treasureHero.currentZ - 1.5;
                }
                camera.position.x = THREE.MathUtils.lerp(camera.position.x, camTargetX, dt * 4.5);
                camera.position.y = THREE.MathUtils.lerp(camera.position.y, camTargetY, dt * 4.5);
                camera.position.z = THREE.MathUtils.lerp(camera.position.z, camTargetZ, dt * 4.5);
                camera.lookAt(lookX, lookY, lookZ);

                // 7. 🧭 腳下黃金指南針指向正確目標寶箱
                if (treasureHero.compassRing) {
                    treasureHero.compassRing.position.set(treasureHero.currentX, 0.35, treasureHero.currentZ);
                    const rightChest = interactiveBlocks.find(b => b.itemKey === gameState.targetKey);
                    if (rightChest) {
                        treasureHero.compassRing.rotation.y = Math.atan2(
                            rightChest.baseX - treasureHero.currentX,
                            rightChest.baseZ - treasureHero.currentZ
                        );
                    }
                }

                // 8. 🎵 執沿途引路金幣
                if (treasureHero.miniCoins) {
                    treasureHero.miniCoins.forEach((coin, cIdx) => {
                        if (!coin.userData.collected) {
                            coin.rotation.z += dt * 3.5;
                            coin.position.y = coin.userData.baseY + Math.sin(elapsed * 4 + cIdx) * 0.08;
                            if (Math.hypot(treasureHero.currentX - coin.position.x, treasureHero.currentZ - coin.position.z) < 0.95) {
                                coin.userData.collected = true;
                                playCountingNote(coin.userData.noteIndex || 1);
                                emitStarParticles(coin.position);
                            }
                        } else if (coin.scale.x > 0.05) {
                            coin.position.y += dt * 4;
                            coin.scale.multiplyScalar(0.85);
                        } else {
                            coin.visible = false;
                        }
                    });
                }

                // 9. 🎈 寶箱氣球飄浮 + 360度開箱判定
                interactiveBlocks.forEach(chest => {
                    if (chest.isTreasureChest && chest.balloonGroup) {
                        chest.balloonGroup.position.y = Math.sin(elapsed * 2.5 + chest.animTime) * 0.15;
                    }
                });

                if (!gameState.isBusy) {
                    for (let i = 0; i < interactiveBlocks.length; i++) {
                        const chest = interactiveBlocks[i];
                        if (chest.isTreasureChest && chest.state !== 'wrong') {
                            const distToChest = Math.hypot(
                                treasureHero.currentX - chest.baseX,
                                treasureHero.currentZ - chest.baseZ
                            );
                            if (distToChest < 1.55) {
                                treasureHero.targetX = null;
                                treasureHero.targetZ = null;
                                treasureHero.pendingChest = null;
                                handleBlockTapped(chest);
                                break;
                            }
                        }
                    }
                }
            }
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
