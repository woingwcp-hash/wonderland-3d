/********************************************************************
 * [FILE: main.js]
 * 7. CORE GAMEPLAY LOGIC, LOBBY, 9x9 MAZE PARADE & 3-POD ADDITION ARENA
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
    treasure: '🗺️ 迷宮救兵大巡遊',
    addition: '🛸 小兵合體大作戰',
    shapebridge: '🌉 形狀修橋大作戰'
};

// 自動喺大廳加入「🛸 小兵合體大作戰（數字專屬）」與「🌉 馬利奧形狀修橋大作戰（形狀專屬）」
function ensureAdditionLobbyCard() {
    const treasureCard = document.getElementById('lobby-card-treasure');
    if (!treasureCard) return;

    treasureCard.classList.remove('sm:col-span-2');

    if (!document.getElementById('lobby-card-addition')) {
        const addCard = document.createElement('button');
        addCard.id = 'lobby-card-addition';
        addCard.onclick = () => startGameFromLobby('addition');
        addCard.className = 'btn-toy group bg-gradient-to-r from-purple-100 via-pink-50 to-rose-100 hover:from-purple-200 hover:to-rose-200 p-5 rounded-3xl border-4 border-purple-400 items-center gap-4 text-left shadow-lg flex';
        addCard.innerHTML = `
            <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 text-white flex items-center justify-center text-4xl sm:text-5xl shadow-md group-hover:scale-110 transition-transform flex-shrink-0">
                🛸
            </div>
            <div class="flex-1">
                <div class="flex flex-wrap items-center justify-between gap-1">
                    <span class="text-lg sm:text-2xl font-black text-slate-800">小兵合體大作戰</span>
                    <span class="text-xs font-black bg-gradient-to-r from-purple-600 to-pink-500 text-white px-2.5 py-1 rounded-full shadow-sm">➕➖ 加減算式大砲</span>
                </div>
                <p class="text-xs sm:text-sm font-bold text-slate-600 mt-1">
                    三台並列清晰算式（A ± B = C）！控制馬利奧落場捉柱方形數字小兵開炮射飛碟！
                </p>
            </div>
        `;
        treasureCard.parentNode.appendChild(addCard);
    }

    if (!document.getElementById('lobby-card-shapebridge')) {
        const bridgeCard = document.createElement('button');
        bridgeCard.id = 'lobby-card-shapebridge';
        bridgeCard.onclick = () => startGameFromLobby('shapebridge');
        bridgeCard.className = 'btn-toy group sm:col-span-2 bg-gradient-to-r from-cyan-100 via-sky-50 to-teal-100 hover:from-cyan-200 hover:to-teal-200 p-5 rounded-3xl border-4 border-teal-400 items-center gap-4 text-left shadow-lg hidden';
        bridgeCard.innerHTML = `
            <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-sky-600 text-white flex items-center justify-center text-4xl sm:text-5xl shadow-md group-hover:scale-110 transition-transform flex-shrink-0">
                🌉
            </div>
            <div class="flex-1">
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="text-lg sm:text-2xl font-black text-slate-800">馬利奧形狀修橋大作戰（3D 捉小兵塞橋窿）</span>
                    <span class="text-xs font-black bg-gradient-to-r from-teal-500 to-sky-600 text-white px-3 py-1 rounded-full shadow-sm">🔺 形狀樂園王牌新玩法</span>
                </div>
                <p class="text-xs sm:text-sm font-bold text-slate-600 mt-1">
                    通往城堡嘅大橋有唔同形狀嘅穿窿缺口！控制馬利奧捉住對應嘅立體形狀小兵，親手行去塞入橋面缺口修好條橋過關！
                </p>
            </div>
        `;
        treasureCard.parentNode.appendChild(bridgeCard);
    }
}

function openLobby(step = 'subject') {
    playPopSound(520);
    gameState.inLobby = true;
    clearTimeout(autoPromptTimer);
    ensureAdditionLobbyCard();

    const overlay = document.getElementById('lobby-overlay');
    const stepSubj = document.getElementById('lobby-step-subject');
    const stepMode = document.getElementById('lobby-step-mode');

    const tierBar = document.getElementById('maze-tier-bar');
    if (tierBar) tierBar.style.display = 'none';
    const eqHud = document.getElementById('addition-equation-hud');
    if (eqHud) eqHud.style.display = 'none';
    const addFireBtn = document.getElementById('addition-fire-btn');
    if (addFireBtn) addFireBtn.classList.add('hidden');

    overlay.classList.remove('hidden');

    if (step === 'subject') {
        stepSubj.classList.remove('hidden');
        stepMode.classList.add('hidden');
    } else {
        const meta = SUBJECT_DISPLAY_META[gameState.subject] || SUBJECT_DISPLAY_META.number;
        document.getElementById('lobby-selected-subj-icon').textContent = meta.icon;
        document.getElementById('lobby-selected-subj-title').textContent = meta.title;

        ['lobby-card-treasure', 'lobby-card-addition'].forEach(id => {
            const card = document.getElementById(id);
            if (card) {
                if (gameState.subject === 'number') {
                    card.classList.remove('hidden');
                    card.classList.add('flex');
                } else {
                    card.classList.add('hidden');
                    card.classList.remove('flex');
                }
            }
        });

        const shapeBridgeCard = document.getElementById('lobby-card-shapebridge');
        if (shapeBridgeCard) {
            if (gameState.subject === 'shape') {
                shapeBridgeCard.classList.remove('hidden');
                shapeBridgeCard.classList.add('flex');
            } else {
                shapeBridgeCard.classList.add('hidden');
                shapeBridgeCard.classList.remove('flex');
            }
        }

        stepSubj.classList.add('hidden');
        stepMode.classList.remove('hidden');
    }
}

function selectSubjectFromLobby(subjectKey) {
    playPopSound(600);
    gameState.subject = subjectKey;
    updateTopStatusBadge();
    openLobby('mode');
}

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
    const rangeStr = gameState.settings.range;
    if (rangeStr === '1-5') return [1, 2, 3, 4, 5];
    if (rangeStr === '6-10') return [6, 7, 8, 9, 10];
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
}

function switchSubject(newSubject) {
    playPopSound(560);
    gameState.subject = newSubject;
    gameState.isBusy = false;

    if (newSubject !== 'number' && (gameState.mode === 'treasure' || gameState.mode === 'addition')) {
        gameState.mode = 'gacha';
    }
    if (newSubject !== 'shape' && gameState.mode === 'shapebridge') {
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
    } else if (gameState.mode === 'treasure') {
        rightLabel.textContent = '換新迷宮';
        rightIcon.className = 'fa-solid fa-map';
    } else if (gameState.mode === 'shapebridge') {
        rightLabel.textContent = '換新大橋';
        rightIcon.className = 'fa-solid fa-bridge';
    } else {
        rightLabel.textContent = '下一關';
        rightIcon.className = 'fa-solid fa-forward-step';
    }
}

function switchMode(newMode) {
    playPopSound(520);
    gameState.mode = newMode;
    gameState.isBusy = false;
    if (newMode === 'shapebridge') gameState.subject = 'shape';
    if (typeof ensure3DAdditionArenaBuilt === 'function') ensure3DAdditionArenaBuilt();
    if (typeof ensure3DShapeBridgeBuilt === 'function') ensure3DShapeBridgeBuilt();

    updateTopStatusBadge();

    const isCustomStage = (newMode === 'treasure' || newMode === 'addition' || newMode === 'shapebridge');
    gachaMachineGroup.visible = (newMode === 'gacha');
    trainGroup.visible = (newMode === 'train');
    marioStageGroup.visible = (newMode === 'mario');
    treasureIslandGroup.visible = (newMode === 'treasure');
    if (typeof additionArenaGroup !== 'undefined') additionArenaGroup.visible = (newMode === 'addition');
    if (typeof shapeBridgeGroup !== 'undefined') shapeBridgeGroup.visible = (newMode === 'shapebridge');

    environmentGroup.visible = !isCustomStage && !gameState.settings.lowDistraction;
    const mainFloor = scene ? scene.getObjectByName('mainFloor') : null;
    if (mainFloor) mainFloor.visible = !isCustomStage;

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

    ensureMazeCompactHUD();
    if (treasureDpad) {
        if (isCustomStage) {
            treasureDpad.classList.remove('hidden');
            treasureDpad.classList.add('flex');
        } else {
            treasureDpad.classList.add('hidden');
            treasureDpad.classList.remove('flex');
        }
    }

    const eqHud = document.getElementById('addition-equation-hud');
    if (eqHud) eqHud.style.display = (newMode === 'addition' && !gameState.inLobby) ? 'flex' : 'none';

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
    } else if (gameState.mode === 'treasure') {
        treasureHero.mazeLevelIdx = (treasureHero.mazeLevelIdx || 0) + 1;
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

    const addFireBtn = document.getElementById('addition-fire-btn');
    if (addFireBtn) addFireBtn.classList.add('hidden');

    if (gameState.mode === 'explore') {
        setupExploreMode();
        return;
    }

    if (gameState.mode === 'addition') {
        setupAdditionRound();
        scheduleAutoVisualPrompt();
        return;
    }

    if (gameState.mode === 'shapebridge') {
        setupShapeBridgeRound();
        scheduleAutoVisualPrompt();
        return;
    }

    const pool = getPoolForCurrentSubject();
    const target = pool[Math.floor(Math.random() * pool.length)];
    gameState.targetKey = target;
    gameState.targetNumber = target;
    updateTargetBadgeUI(target, false);

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
        return;
    }

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

// ==================== Mode 5: 【1-2-3-4-5 迷宮救兵大巡遊 (5大教學層次 + 清爽HUD)】 ====================
const MAZE_COUNTING_TIERS = [
    { id: 'forward',  label: '🌱 1.基礎順數', desc: '由 1 順數到 5' },
    { id: 'count_on', label: '🧩 2.中途接數', desc: '由中間數字接龍順數' },
    { id: 'missing',  label: '🕵️ 3.失蹤填空', desc: '搵出隊伍中間失蹤嘅數字插隊' },
    { id: 'backward', label: '🚀 4.火箭倒數', desc: '由大至細倒數 5➔4➔3➔2➔1' },
    { id: 'skip',     label: '⚡ 5.單雙跳數', desc: '挑戰雙數 2,4,6,8,10 或單數 1,3,5,7,9' }
];

function ensureMazeCompactHUD() {
    const dpad = document.getElementById('treasure-dpad-bar');
    if (dpad && !dpad.dataset.compactMoved) {
        dpad.dataset.compactMoved = 'true';
        document.body.appendChild(dpad);
        dpad.className = 'fixed right-3 sm:right-6 bottom-24 sm:bottom-28 z-30 pointer-events-auto items-center justify-center gap-1.5 sm:gap-2 bg-slate-900/75 backdrop-blur-md p-2 sm:p-3 rounded-3xl border-2 border-amber-400 shadow-xl hidden';
        const infoBox = dpad.querySelector('div.border-r');
        if (infoBox) infoBox.className = 'hidden';
    }

    let tierBar = document.getElementById('maze-tier-bar');
    if (!tierBar) {
        tierBar = document.createElement('div');
        tierBar.id = 'maze-tier-bar';
        tierBar.className = 'fixed top-14 sm:top-16 inset-x-0 z-30 flex flex-wrap items-center justify-center gap-1.5 px-2 pointer-events-none';
        document.body.appendChild(tierBar);
    }
    if (gameState.mode === 'addition') {
        renderAdditionTierBarUI();
    } else {
        renderMazeTierBarUI();
    }
}

function renderMazeTierBarUI() {
    const tierBar = document.getElementById('maze-tier-bar');
    if (!tierBar) return;
    const curTier = treasureHero.countingTier || 'forward';
    const isBlind = Boolean(treasureHero.blindMode);

    let html = `<div class="pointer-events-auto flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border-2 border-sky-300 shadow-lg">`;
    MAZE_COUNTING_TIERS.forEach(t => {
        const active = (curTier === t.id);
        const btnCls = active
            ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-sm scale-105'
            : 'bg-slate-100 hover:bg-sky-50 text-slate-600 border-slate-200';
        html += `<button onclick="selectMazeCountingTier('${t.id}')" class="btn-toy-sm px-2.5 py-1 rounded-xl font-black text-xs sm:text-sm border ${btnCls}">${t.label}</button>`;
    });

    const blindCls = isBlind
        ? 'bg-purple-600 text-white border-purple-400'
        : 'bg-emerald-500 text-white border-emerald-300';
    html += `<button onclick="toggleMazeBlindMode()" class="btn-toy-sm px-2.5 py-1 rounded-xl font-black text-xs sm:text-sm border ml-1 ${blindCls}" title="切換顯示或隱藏下一個目標數字提示">
        ${isBlind ? '❓ 挑戰：自己諗' : '👁️ 提示：開'}
    </button></div>`;
    tierBar.innerHTML = html;
}

function selectMazeCountingTier(tierId) {
    playPopSound(580);
    treasureHero.countingTier = tierId;
    treasureHero.blindMode = (tierId === 'missing');
    renderMazeTierBarUI();
    startNewRound();
}

function toggleMazeBlindMode() {
    playPopSound(520);
    treasureHero.blindMode = !treasureHero.blindMode;
    renderMazeTierBarUI();
    updateParadeProgressBanner();
    refreshMazeGuideDots();
    syncMazeTargetCardDisplay();
}

function syncMazeTargetCardDisplay() {
    if (gameState.mode !== 'treasure') return;
    if (treasureHero.blindMode && !treasureHero.hintRevealedThisStep && !treasureHero.allRescued) {
        const cardEl = document.getElementById('target-number-card');
        const numEl = document.getElementById('target-badge-num');
        const dotsEl = document.getElementById('target-badge-dots');
        if (cardEl && numEl && dotsEl) {
            cardEl.style.background = 'linear-gradient(to bottom, #A855F7, #7E22CE)';
            cardEl.style.color = '#FFFFFF';
            numEl.textContent = '？';
            dotsEl.textContent = '撳💡提示';
            dotsEl.className = 'text-[10px] sm:text-xs font-black text-purple-100 mt-0.5';
        }
    } else {
        updateTargetBadgeUI(gameState.targetKey, false);
    }
}

function updateParadeProgressBanner() {
    const banner = document.getElementById('counting-banner');
    const dotsContainer = document.getElementById('counting-dots');
    const emojiEl = document.getElementById('counting-emoji');
    if (!banner || !dotsContainer) return;

    banner.classList.remove('hidden');
    if (dotsContainer.previousElementSibling) {
        dotsContainer.previousElementSibling.style.display = (gameState.mode === 'treasure') ? 'none' : 'block';
    }
    emojiEl.textContent = '🐣';
    emojiEl.className = 'text-xl sm:text-2xl';
    dotsContainer.innerHTML = '';

    const seq = treasureHero.sequence || [1, 2, 3, 4, 5];
    const rescuedSet = treasureHero.rescuedSet || new Set();
    const hideNumber = treasureHero.blindMode && !treasureHero.hintRevealedThisStep;

    seq.forEach(num => {
        const isRescued = rescuedSet.has(num);
        const isCurrent = (!treasureHero.allRescued && num === gameState.targetKey);
        const pill = document.createElement('span');
        if (isRescued) {
            pill.className = 'inline-flex items-center justify-center bg-emerald-500 text-white px-2 py-0.5 rounded-lg text-xs sm:text-base font-black shadow-sm star-earned';
            pill.textContent = `✓${num}`;
        } else if (isCurrent) {
            pill.className = 'inline-flex items-center justify-center bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-lg text-sm sm:text-lg font-black border-2 border-orange-500 animate-bounce shadow';
            pill.textContent = hideNumber ? '🎯？' : `🎯${num}`;
        } else {
            pill.className = 'inline-flex items-center justify-center bg-slate-100 text-slate-400 px-2 py-0.5 rounded-lg text-xs sm:text-sm font-bold';
            pill.textContent = (treasureHero.countingTier === 'missing' || hideNumber) ? '？' : String(num);
        }
        dotsContainer.appendChild(pill);
    });
}

function refreshMazeGuideDots() {
    if (!treasureHero.pathDots) return;
    treasureHero.pathDots.forEach(d => { d.visible = false; });

    const showAssist = !treasureHero.blindMode || treasureHero.hintRevealedThisStep || treasureHero.allRescued;
    const heroCell = mazeWorldToGrid(treasureHero.currentX, treasureHero.currentZ);
    let goalCol = 4;
    let goalRow = 0;

    if (!treasureHero.allRescued) {
        const targetBlock = interactiveBlocks.find(b => !b.rescued && b.itemKey === gameState.targetKey);
        if (!targetBlock) return;
        goalCol = targetBlock.gridCol;
        goalRow = targetBlock.gridRow;

        interactiveBlocks.forEach(b => {
            if (!b.rescued) {
                const shouldGlow = showAssist && (b.itemKey === gameState.targetKey);
                b.state = shouldGlow ? 'hint' : 'idle';
                if (b.haloMesh) b.haloMesh.material.opacity = shouldGlow ? 0.9 : 0.0;
            }
        });
    }

    if (!showAssist) return;

    const path = findMazePathBFS(heroCell.col, heroCell.row, goalCol, goalRow);
    path.slice(0, treasureHero.pathDots.length).forEach((pt, idx) => {
        const dot = treasureHero.pathDots[idx];
        dot.position.set(pt.x, 0.34, pt.z);
        dot.visible = true;
    });
}

function setupTreasureRound() {
    ensureMazeCompactHUD();
    if (!treasureHero.countingTier) treasureHero.countingTier = 'forward';
    if (typeof treasureHero.mazeLevelIdx !== 'number') treasureHero.mazeLevelIdx = 0;

    const lvlIdx = treasureHero.mazeLevelIdx % MAZE_LEVEL_DESIGNS.length;
    const lvl = MAZE_LEVEL_DESIGNS[lvlIdx];
    rebuild3DMazeWalls(lvlIdx);

    const tier = treasureHero.countingTier;
    const useHighRange = (gameState.settings.range === '6-10') || (gameState.settings.range === '1-10' && lvlIdx % 2 === 1);

    let seq = [1, 2, 3, 4, 5];
    let preRescuedNums = [];
    let distractors = [];

    if (tier === 'forward') {
        seq = useHighRange ? [6, 7, 8, 9, 10] : [1, 2, 3, 4, 5];
    } else if (tier === 'count_on') {
        const startN = [2, 3, 4, 5, 6][Math.floor(Math.random() * 5)];
        seq = [startN, startN + 1, startN + 2, startN + 3, startN + 4];
    } else if (tier === 'missing') {
        seq = useHighRange ? [6, 7, 8, 9, 10] : [1, 2, 3, 4, 5];
        preRescuedNums = [seq[0], seq[2], seq[4]];
        const allNums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        distractors = allNums.filter(n => !seq.includes(n)).sort(() => Math.random() - 0.5).slice(0, 3);
    } else if (tier === 'backward') {
        seq = useHighRange ? [10, 9, 8, 7, 6] : [5, 4, 3, 2, 1];
    } else if (tier === 'skip') {
        const isEven = (lvlIdx % 2 === 0);
        seq = isEven ? [2, 4, 6, 8, 10] : [1, 3, 5, 7, 9];
    }

    treasureHero.sequence = seq;
    treasureHero.rescuedSet = new Set(preRescuedNums);
    treasureHero.paradeFollowers = [];
    treasureHero.trail = [];
    treasureHero.pathQueue = [];
    treasureHero.allRescued = false;
    treasureHero.castleVictoryTriggered = false;
    treasureHero.hintRevealedThisStep = false;

    const startPos = mazeGridToWorld(4, 7);
    treasureHero.currentX = startPos.x;
    treasureHero.currentZ = startPos.z;
    treasureHero.moveDirX = 0;
    treasureHero.moveDirZ = 0;
    treasureHero.facingAngle = Math.PI;

    for (let i = 0; i < 75; i++) {
        treasureHero.trail.push({ x: startPos.x, z: startPos.z + (i % 3) * 0.02, angle: Math.PI });
    }

    preRescuedNums.forEach(num => {
        const friend = create3DMazeNumberFriend(num, 4, 7);
        friend.rescued = true;
        friend.state = 'idle';
        if (friend.haloMesh) friend.haloMesh.material.opacity = 0;
        friend.group.scale.setScalar(0.56);
        friend.bodyMesh.rotation.x = 0;
        interactiveBlocks.push(friend);
        treasureHero.paradeFollowers.push(friend);
    });

    const toSpawnInMaze = [...seq.filter(n => !treasureHero.rescuedSet.has(n)), ...distractors];
    const shuffledSpots = [...lvl.spots].sort(() => Math.random() - 0.5);
    toSpawnInMaze.slice(0, shuffledSpots.length).forEach((num, idx) => {
        const spot = shuffledSpots[idx];
        const friend = create3DMazeNumberFriend(num, spot.col, spot.row);
        interactiveBlocks.push(friend);
    });

    const firstTarget = seq.find(n => !treasureHero.rescuedSet.has(n));
    gameState.targetKey = firstTarget;
    gameState.targetNumber = firstTarget;

    if (treasureHero.group) {
        treasureHero.group.position.set(startPos.x, 0.3, startPos.z);
        treasureHero.group.rotation.y = Math.PI;
    }
    if (treasureHero.compassRing) {
        treasureHero.compassRing.position.set(startPos.x, 0.34, startPos.z);
    }
    if (treasureHero.clickMarker) {
        treasureHero.clickMarker.visible = false;
    }

    renderMazeTierBarUI();
    updateParadeProgressBanner();
    refreshMazeGuideDots();
    syncMazeTargetCardDisplay();

    const firstMeta = getCognitiveItemMeta(firstTarget);
    const shownTitle = (treasureHero.blindMode && !treasureHero.hintRevealedThisStep) ? '神秘數字（？）' : firstMeta.title;

    if (tier === 'missing') {
        setPromptUI(
            `🕵️ 失蹤填空：隊伍有 ${preRescuedNums.join('、')}，中間缺咗邊個？請搵出嚟插隊！`,
            `觀察進度條 [ ✓${seq[0]} ➔ 🎯？ ➔ ✓${seq[2]} ]，喺迷宮搵出正確數字補返入隊伍啦！`
        );
    } else if (tier === 'backward') {
        setPromptUI(
            `🚀 火箭倒數挑戰（${seq[0]} 倒數去 ${seq[4]}）：請先救「${shownTitle}」！`,
            `由大至細倒數：${seq.join(' ➔ ')}，帶佢哋去皇冠城堡發射煙花！`
        );
    } else if (tier === 'skip') {
        const oddEvenLabel = (seq[0] % 2 === 0) ? '雙數小隊 (2,4,6,8,10)' : '單數小隊 (1,3,5,7,9)';
        setPromptUI(
            `⚡ 跳數挑戰【${oddEvenLabel}】：請先去救「${shownTitle}」！`,
            `兩個一數：${seq.join(' ➔ ')}，試下直接撳迷宮入面嘅數字自動轉彎行過去！`
        );
    } else if (tier === 'count_on') {
        setPromptUI(
            `🧩 中途接數（由 ${seq[0]} 開始順數）：請先去救「${shownTitle}」！`,
            `接龍任務：${seq.join(' ➔ ')}，可按右下角方向掣或直接撳數字公仔！`
        );
    } else {
        setPromptUI(
            `${lvl.name}：請先去救「${shownTitle}」組隊巡遊！`,
            `順序搵出 ${seq.join(' ➔ ')} 排隊跟尾！（頂部可隨時切換 5 種數數難度層次）`
        );
    }
}

function setTreasureMoveDir(dx, dz) {
    if (gameState.mode === 'shapebridge') {
        if (gameState.isBusy || shapeBridgeState.phase !== 'repair') {
            shapeBridgeState.moveDirX = 0;
            shapeBridgeState.moveDirZ = 0;
            return;
        }
        shapeBridgeState.moveDirX = dx;
        shapeBridgeState.moveDirZ = dz;
        if (dx !== 0 || dz !== 0) {
            shapeBridgeState.targetX = null;
            shapeBridgeState.targetZ = null;
            if (shapeBridgeState.clickMarker) shapeBridgeState.clickMarker.visible = false;
        }
        return;
    }
    if (gameState.mode === 'addition') {
        if (gameState.isBusy || additionState.phase !== 'catch') {
            additionState.moveDirX = 0;
            additionState.moveDirZ = 0;
            return;
        }
        additionState.moveDirX = dx;
        additionState.moveDirZ = dz;
        if (dx !== 0 || dz !== 0) {
            additionState.targetX = null;
            additionState.targetZ = null;
            if (additionState.clickMarker) additionState.clickMarker.visible = false;
        }
        return;
    }
    if (gameState.mode !== 'treasure' || gameState.isBusy) {
        treasureHero.moveDirX = 0;
        treasureHero.moveDirZ = 0;
        return;
    }
    treasureHero.moveDirX = dx;
    treasureHero.moveDirZ = dz;
    if (dx !== 0 || dz !== 0) {
        treasureHero.pathQueue = [];
        if (treasureHero.clickMarker) treasureHero.clickMarker.visible = false;
    }
}

function nudgeTreasureHero(dx, dz) {
    if (gameState.mode === 'shapebridge') {
        if (gameState.isBusy || shapeBridgeState.phase !== 'repair') return;
        playPopSound(440);
        shapeBridgeState.targetX = Math.max(-6.2, Math.min(6.2, shapeBridgeState.heroX + dx * 1.5));
        shapeBridgeState.targetZ = Math.max(0.2, Math.min(5.6, shapeBridgeState.heroZ + dz * 1.5));
        return;
    }
    if (gameState.mode === 'addition') {
        if (gameState.isBusy || additionState.phase !== 'catch') return;
        playPopSound(440);
        additionState.targetX = Math.max(-5.8, Math.min(5.8, additionState.heroX + dx * 1.5));
        additionState.targetZ = Math.max(0.8, Math.min(5.6, additionState.heroZ + dz * 1.5));
        return;
    }
    if (gameState.mode !== 'treasure' || gameState.isBusy) return;
    playPopSound(440);
    const cur = mazeWorldToGrid(treasureHero.currentX, treasureHero.currentZ);
    const nextCol = cur.col + dx;
    const nextRow = cur.row + dz;
    if (isMazeCellWalkable(nextCol, nextRow)) {
        treasureHero.pathQueue = [mazeGridToWorld(nextCol, nextRow)];
    }
}

// ==================== Mode 7: 【🌉 馬利奧形狀修橋大作戰 (4大空間幾何層次)】 ====================
const SHAPE_BRIDGE_TIERS = [
    { id: 'single',  label: '🌱 1.單孔入門 (1個缺口)' },
    { id: 'three',   label: '🧩 2.三孔修橋 (捉小兵對準塞)' },
    { id: 'shadow',  label: '🕵️ 3.影子神秘缺口 (純黑影)' },
    { id: 'rotated', label: '🔄 4.旋轉形狀挑戰 (轉向配對)' }
];

function renderShapeBridgeTierBarUI() {
    const tierBar = document.getElementById('maze-tier-bar');
    if (!tierBar) return;
    const cur = shapeBridgeState.tier || 'three';
    let html = `<div class="pointer-events-auto flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border-2 border-teal-400 shadow-lg">`;
    SHAPE_BRIDGE_TIERS.forEach(t => {
        const active = (cur === t.id);
        const cls = active
            ? 'bg-gradient-to-r from-teal-500 to-sky-600 text-white border-teal-600 shadow-sm scale-105'
            : 'bg-slate-100 hover:bg-teal-50 text-slate-600 border-slate-200';
        html += `<button onclick="selectShapeBridgeTier('${t.id}')" class="btn-toy-sm px-2.5 py-1 rounded-xl font-black text-xs sm:text-sm border ${cls}">${t.label}</button>`;
    });
    html += `</div>`;
    tierBar.innerHTML = html;
}

function selectShapeBridgeTier(tierId) {
    playPopSound(580);
    shapeBridgeState.tier = tierId;
    renderShapeBridgeTierBarUI();
    startNewRound();
}

function updateShapeBridgeBanner() {
    const banner = document.getElementById('counting-banner');
    const dotsContainer = document.getElementById('counting-dots');
    const emojiEl = document.getElementById('counting-emoji');
    if (!banner || !dotsContainer) return;

    banner.classList.remove('hidden');
    if (dotsContainer.previousElementSibling) {
        dotsContainer.previousElementSibling.style.display = 'none';
    }
    emojiEl.textContent = '🌉';
    emojiEl.className = 'text-xl sm:text-2xl';
    dotsContainer.innerHTML = '';

    shapeBridgeState.slots.forEach(slot => {
        const meta = getCognitiveItemMeta(slot.shapeId, 'shape');
        const pill = document.createElement('span');
        const isTargetCarried = shapeBridgeState.carryingMinion && shapeBridgeState.carryingMinion.itemKey === slot.shapeId && !slot.filled;
        if (slot.filled) {
            pill.className = 'inline-flex items-center gap-1 bg-emerald-500 text-white px-2.5 py-0.5 rounded-xl text-xs sm:text-base font-black shadow-sm star-earned';
            pill.textContent = `✓ ${meta.badgeSymbol}${meta.title}`;
        } else if (isTargetCarried) {
            pill.className = 'inline-flex items-center gap-1 bg-amber-400 text-slate-950 px-3 py-0.5 rounded-xl text-sm sm:text-lg font-black border-2 border-orange-500 animate-bounce shadow';
            pill.textContent = `🎯 塞入${meta.title}窿！`;
        } else {
            pill.className = 'inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-xl text-xs sm:text-sm font-bold border border-slate-300';
            pill.textContent = (shapeBridgeState.tier === 'shadow') ? `❓ 神秘缺口` : `${meta.badgeSymbol} ${meta.title}`;
        }
        dotsContainer.appendChild(pill);
    });
}

function setupShapeBridgeRound() {
    gameState.subject = 'shape';
    ensure3DShapeBridgeBuilt();
    ensureMazeCompactHUD();
    renderShapeBridgeTierBarUI();

    shapeBridgeState.slotsContainer.clear();
    shapeBridgeState.slots = [];
    shapeBridgeState.carryingMinion = null;
    shapeBridgeState.jumpingAnim = null;
    shapeBridgeState.phase = 'repair';

    const tier = shapeBridgeState.tier || 'three';
    const allShapes = SHAPE_CURRICULUM.map(s => s.id).sort(() => Math.random() - 0.5);
    const slotCount = (tier === 'single') ? 1 : 3;
    const chosenShapes = allShapes.slice(0, slotCount);
    const xPositions = (slotCount === 1) ? [0] : [-3.5, 0, 3.5];

    chosenShapes.forEach((shId, idx) => {
        const slot = createBridgeSlotObject(idx, xPositions[idx], shId, tier);
        shapeBridgeState.slots.push(slot);
    });

    gameState.targetKey = chosenShapes[0];
    updateTargetBadgeUI(chosenShapes[0], false);
    updateShapeBridgeBanner();

    // 重置馬利奧於南岸草地中央
    shapeBridgeState.heroX = 0;
    shapeBridgeState.heroZ = 4.2;
    shapeBridgeState.targetX = null;
    shapeBridgeState.targetZ = null;
    shapeBridgeState.moveDirX = 0;
    shapeBridgeState.moveDirZ = 0;
    shapeBridgeState.facingAngle = Math.PI;
    if (shapeBridgeState.heroMesh) {
        shapeBridgeState.heroMesh.position.set(0, 0.36, 4.2);
        shapeBridgeState.heroMesh.rotation.y = Math.PI;
    }
    if (shapeBridgeState.compassRing) {
        shapeBridgeState.compassRing.position.set(0, 0.38, 4.2);
    }

    // 喺南岸草地生成散步嘅立體形狀小兵（包含橋面需要嘅形狀 + 干擾形狀）
    const distractors = allShapes.filter(s => !chosenShapes.includes(s)).slice(0, slotCount === 1 ? 2 : 1);
    const roamShapes = [...chosenShapes, ...distractors].sort(() => Math.random() - 0.5);
    const startCoords = [
        { x: -4.2, z: 2.0 },
        { x: 4.2,  z: 2.0 },
        { x: -2.2, z: 4.0 },
        { x: 2.2,  z: 4.0 },
        { x: 0,    z: 2.5 }
    ];

    roamShapes.forEach((shId, idx) => {
        const pt = startCoords[idx % startCoords.length];
        const minion = create3DNumberCharacter(shId, pt.x, pt.z, 0.72);
        minion.isArenaMinion = true;
        const ang = (idx / roamShapes.length) * Math.PI * 2 + 0.4;
        minion.vx = Math.cos(ang) * 1.45;
        minion.vz = Math.sin(ang) * 1.15;
        interactiveBlocks.push(minion);
    });

    if (tier === 'single') {
        const m0 = getCognitiveItemMeta(chosenShapes[0], 'shape');
        setPromptUI(
            `🌉 斷橋搶修任務：橋中間有個「${m0.title}」缺口！快啲去捉「${m0.title}小兵」塞落去！`,
            `控制馬利奧去捉場內嘅「${m0.badgeSymbol} ${m0.title}」立體小兵修好大橋啦！`
        );
    } else if (tier === 'shadow') {
        setPromptUI(
            `🕵️ 影子神秘缺口：觀察橋上 3 個「黑影輪廓」有幾多條邊同角？`,
            `先控制馬利奧捉住對應嘅形狀小兵，再帶佢行去橋邊對準個黑影缺口塞落去！`
        );
    } else if (tier === 'rotated') {
        setPromptUI(
            `🔄 旋轉形狀挑戰：橋面缺口嘅形狀轉咗彎喎！你認唔認得係邊個形狀？`,
            `捉住正確嘅形狀小兵，再帶佢行去橋邊塞入對應嘅旋轉缺口啦！`
        );
    } else {
        setPromptUI(
            `🌉 三孔修橋大作戰：請捉住場上嘅形狀小兵，帶去塞入對應嘅橋面缺口！`,
            `第 1 步：掂一掂形狀小兵帶住佢行 ➔ 第 2 步：行去橋邊（或直接撳橋窿）塞落去！`
        );
    }
}

// 當馬利奧喺南岸捉到一隻散步形狀小兵時觸發
function handleShapeBridgeMinionCaught(minion) {
    if (gameState.isBusy || shapeBridgeState.phase !== 'repair' || !minion.isArenaMinion) return;
    const shId = minion.itemKey;
    const meta = getCognitiveItemMeta(shId, 'shape');

    // 檢查橋上面有無未填補嘅呢種形狀缺口
    const matchingSlot = shapeBridgeState.slots.find(s => !s.filled && s.shapeId === shId);
    if (!matchingSlot) {
        playGentleNudge();
        minion.state = 'wrong';
        minion.wrongTimer = 0.6;
        shapeBridgeState.targetX = null;
        shapeBridgeState.targetZ = null;
        setPromptUI(
            `呢隻係「${meta.title}小兵」，但橋上面無「${meta.title}」缺口喎！`,
            `請再望下河面大橋上面嘅缺口係咩形狀啦！`
        );
        return;
    }

    playCoinSound();
    minion.isArenaMinion = false;
    minion.state = 'idle';
    if (minion.haloMesh) minion.haloMesh.material.opacity = 0;
    shapeBridgeState.carryingMinion = minion;
    gameState.targetKey = shId;
    updateTargetBadgeUI(shId, false);
    updateShapeBridgeBanner();

    // 點亮橋面所有未填缺口嘅提示箭咀
    shapeBridgeState.slots.forEach(s => {
        if (s.arrowMesh) s.arrowMesh.visible = !s.filled;
    });

    // 如果係「🌱 1.單孔入門」，一捉到正確小兵即刻凌空翻筋斗飛入橋中間缺口！
    if (shapeBridgeState.tier === 'single') {
        triggerPlugMinionIntoBridgeSlot(matchingSlot);
        return;
    }

    setPromptUI(
        `🎉 捉到「${meta.badgeSymbol} ${meta.title}小兵」跟住你喇！快啲帶佢去橋邊塞入「${meta.title}缺口」！`,
        `請控制馬利奧向上行去河邊對應嘅缺口，或者直接用手指撳橋面嘅「${meta.title}缺口」！`
    );
}

// 當馬利奧帶住形狀小兵行近（或點擊）某個橋面缺口時觸發
function triggerPlugMinionIntoBridgeSlot(slot) {
    const carried = shapeBridgeState.carryingMinion;
    if (!carried || slot.filled || shapeBridgeState.phase !== 'repair') return;

    const carriedMeta = getCognitiveItemMeta(carried.itemKey, 'shape');
    const slotMeta = getCognitiveItemMeta(slot.shapeId, 'shape');

    // 檢查小兵形狀同個橋窿係咪吻合！
    if (carried.itemKey !== slot.shapeId) {
        playGentleNudge();
        slot.group.position.y = 0.55;
        setTimeout(() => { slot.group.position.y = 0.36; }, 220);
        shapeBridgeState.targetX = null;
        shapeBridgeState.targetZ = null;
        shapeBridgeState.heroZ = Math.max(1.2, shapeBridgeState.heroZ);
        setPromptUI(
            `哎呀！「${carriedMeta.title}小兵」塞唔入呢個缺口喎！`,
            `請帶住「${carriedMeta.title}小兵」去隔離啱形狀嘅橋面缺口啦！`
        );
        return;
    }

    // 形狀完全吻合！啟動小兵凌空 360 度翻筋斗「咚—啪！」塞入橋窿動畫！
    playMarioJumpSound();
    shapeBridgeState.phase = 'jumping';
    shapeBridgeState.carryingMinion = null;
    shapeBridgeState.moveDirX = 0;
    shapeBridgeState.moveDirZ = 0;
    shapeBridgeState.targetX = null;
    shapeBridgeState.targetZ = null;

    shapeBridgeState.slots.forEach(s => {
        if (s.arrowMesh) s.arrowMesh.visible = false;
    });

    shapeBridgeState.jumpingAnim = {
        minion: carried,
        slot: slot,
        progress: 0,
        startPos: carried.group.position.clone(),
        endPos: new THREE.Vector3(slot.x, 0.55, slot.z)
    };
}

// ==================== Mode 6: 【🛸 3D 競技場：加減法小兵大作戰 (三台並列 A ± B = C 完整算式版)】 ====================
const ADDITION_OPS = [
    { id: 'add', label: '➕ 加法' },
    { id: 'sub', label: '➖ 減法' },
    { id: 'mix', label: '🔄 加減混合' }
];

const ADDITION_TIERS = [
    { id: 'sum5',    label: '🌱 1.五以內' },
    { id: 'sum10',   label: '🧩 2.十以內' },
    { id: 'sum12',   label: '🚀 3.十二以內 (如12-6)' },
    { id: 'missing', label: '🕵️ 4.補數 (A±?=C)' },
    { id: 'free2',   label: '🔥 5.自由湊數 (?±?=C)' }
];

// 後備安全定義：建立「？ 號半透明目標框」
if (typeof createQuestionSlotMinion !== 'function') {
    window.createQuestionSlotMinion = function (x, z, borderColorHex = '#F59E0B') {
        const group = new THREE.Group();
        group.position.set(x, 1.35, z);
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFBEB';
        roundRectCanvas(ctx, 10, 10, 236, 236, 40);
        ctx.fill();
        ctx.lineWidth = 14;
        ctx.setLineDash([22, 14]);
        ctx.strokeStyle = borderColorHex;
        roundRectCanvas(ctx, 18, 18, 220, 220, 32);
        ctx.stroke();
        ctx.fillStyle = borderColorHex;
        ctx.font = '900 150px "Fredoka", "Noto Sans TC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', 128, 134);
        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.92 });
        const sideMat = new THREE.MeshStandardMaterial({ color: 0xFEF08A, transparent: true, opacity: 0.55 });
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.55, 0.65), [sideMat, sideMat, sideMat, sideMat, mat, sideMat]);
        group.add(mesh);
        numberBlocksGroup.add(group);
        return group;
    };
}

// 升級版能量球顯示：加法顯示兩堆發光球；減法會將「被減走嘅球」變成半透明暗灰色，突顯剩低幾多粒！
window.spawnAdditionEnergyDots = function (countA, countB, isSub = false) {
    if (!additionState.energyDotsGroup) return;
    additionState.energyDotsGroup.clear();

    const makeDots = (count, centerX, colorHex, fadedCount = 0) => {
        if (!count || count <= 0) return;
        const perRow = Math.min(count, 6);
        const spacing = 0.36;
        for (let i = 0; i < count; i++) {
            const row = Math.floor(i / 6);
            const col = i % 6;
            const rowCount = (row > 0) ? Math.min(6, count - row * 6) : perRow;
            const startX = centerX - ((rowCount - 1) * spacing) / 2;

            // 喺減法模式，最後 fadedCount 粒球變成半透明灰色，代表「俾人拿走咗」！
            const isTakenAway = isSub && fadedCount > 0 && (i >= count - fadedCount);
            const mat = isTakenAway
                ? new THREE.MeshStandardMaterial({ color: 0x94A3B8, roughness: 0.6, transparent: true, opacity: 0.32 })
                : new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.2, emissive: colorHex, emissiveIntensity: 0.32 });

            const ball = new THREE.Mesh(new THREE.SphereGeometry(isTakenAway ? 0.12 : 0.15, 16, 16), mat);
            ball.position.set(startX + col * spacing, 2.55 + row * 0.36, -1.8);
            additionState.energyDotsGroup.add(ball);
        }
    };

    if (isSub) {
        const takeAway = countB || (additionState.caughtSum !== null && countA ? Math.max(0, countA - additionState.caughtSum) : 0);
        makeDots(countA, -3.7, 0xF43F5E, takeAway);
        makeDots(countB, 0.0, 0x0EA5E9, 0);
    } else {
        makeDots(countA, -3.7, 0xF43F5E, 0);
        makeDots(countB, 0.0, 0x0EA5E9, 0);
    }
};

function updateAdditionEquationHUD(leftVal, rightVal, sumVal) {
    let board = document.getElementById('addition-equation-hud');
    if (!board) {
        board = document.createElement('div');
        board.id = 'addition-equation-hud';
        board.className = 'fixed top-28 sm:top-28 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-300';
        document.body.appendChild(board);
    }
    if (gameState.mode !== 'addition' || gameState.inLobby) {
        board.style.display = 'none';
        return;
    }
    board.style.display = 'flex';

    const isSub = (additionState.currentOp === 'sub');
    const opSymbol = isSub ? '−' : '+';
    const opColor = isSub ? 'text-sky-600' : 'text-amber-500';
    const borderColor = isSub ? 'border-sky-400' : 'border-purple-400';

    const boxStyle = (val, bgCls) => {
        const isQ = (val === '?');
        return `<span class="inline-flex items-center justify-center min-w-[44px] sm:min-w-[58px] h-11 sm:h-14 px-3 rounded-2xl font-black text-2xl sm:text-4xl border-4 shadow-md ${isQ ? 'bg-amber-300 text-slate-950 border-orange-500 animate-bounce' : bgCls}">${val}</span>`;
    };

    board.innerHTML = `
        <div class="bg-white/95 backdrop-blur-md px-4 sm:px-6 py-2 rounded-3xl border-4 ${borderColor} shadow-2xl flex items-center gap-2 sm:gap-3.5">
            ${boxStyle(leftVal, 'bg-rose-500 text-white border-rose-200')}
            <span class="text-3xl sm:text-5xl font-black ${opColor} px-1">${opSymbol}</span>
            ${boxStyle(rightVal, 'bg-sky-500 text-white border-sky-200')}
            <span class="text-2xl sm:text-4xl font-black text-slate-600">=</span>
            ${boxStyle(sumVal, 'bg-emerald-500 text-white border-emerald-200')}
        </div>
    `;
}

function renderAdditionTierBarUI() {
    const tierBar = document.getElementById('maze-tier-bar');
    if (!tierBar) return;
    const curOp = additionState.opMode || 'add';
    const curTier = additionState.tier || 'sum5';

    let html = `<div class="pointer-events-auto flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border-2 border-purple-400 shadow-lg">`;

    // 左側：加法 / 減法 / 混合 切換掣
    ADDITION_OPS.forEach(op => {
        const active = (curOp === op.id);
        const cls = active
            ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm scale-105'
            : 'bg-slate-100 hover:bg-amber-50 text-slate-600 border-slate-200';
        html += `<button onclick="selectAdditionOpMode('${op.id}')" class="btn-toy-sm px-2.5 py-1 rounded-xl font-black text-xs sm:text-sm border ${cls}">${op.label}</button>`;
    });

    html += `<span class="text-slate-300 font-black px-0.5">|</span>`;

    // 右側：5 大難度層次切換掣
    ADDITION_TIERS.forEach(t => {
        const active = (curTier === t.id);
        const cls = active
            ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white border-purple-600 shadow-sm scale-105'
            : 'bg-slate-100 hover:bg-purple-50 text-slate-600 border-slate-200';
        html += `<button onclick="selectAdditionTier('${t.id}')" class="btn-toy-sm px-2.5 py-1 rounded-xl font-black text-xs sm:text-sm border ${cls}">${t.label}</button>`;
    });
    html += `</div>`;
    tierBar.innerHTML = html;
}

function selectAdditionOpMode(opId) {
    playPopSound(600);
    additionState.opMode = opId;
    renderAdditionTierBarUI();
    startNewRound();
}

function selectAdditionTier(tierId) {
    playPopSound(580);
    additionState.tier = tierId;
    renderAdditionTierBarUI();
    startNewRound();
}

function ensureAdditionFireButton() {
    let btn = document.getElementById('addition-fire-btn');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'addition-fire-btn';
        btn.onclick = () => fireAdditionCannon();
        btn.className = 'fixed bottom-28 sm:bottom-32 left-1/2 -translate-x-1/2 z-40 pointer-events-auto btn-toy bg-gradient-to-r from-red-500 via-orange-500 to-amber-400 hover:from-red-400 hover:to-amber-300 text-white font-black px-7 py-3.5 rounded-3xl border-4 border-white shadow-2xl flex items-center gap-3 text-xl sm:text-2xl animate-bounce hidden';
        btn.innerHTML = `<span>🔥</span><span>點火發射答案小兵！</span><span>🚀</span>`;
        document.body.appendChild(btn);
    }
    return btn;
}

// 刷新後排三座算式台 [ 左台 A (-3.7) ] ± [ 中台 B (0.0) ] = [ 右台 C (+3.7) ]
function refreshAdditionStagePods() {
    ['leftPodMinion', 'midPodMinion', 'rightPodMinion', 'slotA', 'slotB', 'slotC'].forEach(k => {
        if (additionState[k]) {
            if (additionState[k].group) numberBlocksGroup.remove(additionState[k].group);
            else numberBlocksGroup.remove(additionState[k]);
            additionState[k] = null;
        }
    });

    const isSub = (additionState.currentOp === 'sub');

    // 將舞台上嘅 3D 立體「＋」號自動切換成「－」減號（隱藏垂直柱 children[1]）！
    if (additionState.plusSignMesh && additionState.plusSignMesh.children.length > 1) {
        additionState.plusSignMesh.children[1].visible = !isSub;
    }

    // 1. 左邊粉紅台 (-3.7, -1.8)
    if (additionState.caughtA !== null) {
        const mA = create3DNumberCharacter(additionState.caughtA, -3.7, -1.8, 0.72);
        mA.isPodMinion = true;
        if (additionState.caughtA >= 10) mA.group.scale.set(0.82, 0.72, 0.72);
        additionState.leftPodMinion = mA;
    } else {
        additionState.slotA = createQuestionSlotMinion(-3.7, -1.8, '#F43F5E');
    }

    // 2. 中間天藍台 (0.0, -1.8)
    if (additionState.caughtB !== null) {
        const mB = create3DNumberCharacter(additionState.caughtB, 0.0, -1.8, 0.72);
        mB.isPodMinion = true;
        additionState.midPodMinion = mB;
    } else {
        additionState.slotB = createQuestionSlotMinion(0.0, -1.8, '#0EA5E9');
    }

    // 3. 右邊金色答案台 (+3.7, -1.8)
    if (additionState.caughtSum !== null) {
        const mC = create3DNumberCharacter(additionState.caughtSum, 3.7, -1.8, 0.86);
        mC.isPodMinion = true;
        if (additionState.caughtSum >= 10) {
            mC.group.scale.set(0.95, 0.86, 0.86);
        }
        const crown = new THREE.Mesh(
            new THREE.ConeGeometry(0.42, 0.52, 6),
            new THREE.MeshStandardMaterial({ color: 0xFACC15, roughness: 0.2, metalness: 0.6 })
        );
        crown.position.set(0, 1.32, 0);
        mC.group.add(crown);
        additionState.rightPodMinion = mC;
    } else {
        additionState.slotC = createQuestionSlotMinion(3.7, -1.8, '#F59E0B');
    }

    if (typeof spawnAdditionEnergyDots === 'function') {
        spawnAdditionEnergyDots(additionState.caughtA || 0, additionState.caughtB || 0, isSub);
    }
    updateAdditionEquationHUD(
        additionState.caughtA !== null ? String(additionState.caughtA) : '?',
        additionState.caughtB !== null ? String(additionState.caughtB) : '?',
        additionState.caughtSum !== null ? String(additionState.caughtSum) : '?'
    );
}

function syncAdditionBottomCard() {
    const cardEl = document.getElementById('target-number-card');
    const numEl = document.getElementById('target-badge-num');
    const dotsEl = document.getElementById('target-badge-dots');
    if (!cardEl || !numEl || !dotsEl) return;

    const isSub = (additionState.currentOp === 'sub');
    const opChar = isSub ? '-' : '+';
    const aStr = additionState.caughtA !== null ? additionState.caughtA : '?';
    const bStr = additionState.caughtB !== null ? additionState.caughtB : '?';
    const cStr = additionState.caughtSum !== null ? additionState.caughtSum : '?';

    cardEl.style.background = isSub
        ? 'linear-gradient(to bottom, #0284C7, #0369A1)'
        : 'linear-gradient(to bottom, #A855F7, #7E22CE)';
    cardEl.style.color = '#FFFFFF';
    numEl.textContent = (additionState.phase === 'catch') ? (isSub ? '➖' : '➕') : String(additionState.targetSum);
    dotsEl.textContent = `${aStr}${opChar}${bStr}=${cStr}`;
    dotsEl.className = 'text-[11px] sm:text-xs font-black text-amber-200 tracking-tighter mt-0.5';
}

function setupAdditionRound() {
    if (typeof ensureExtendedNumbersConfig === 'function') ensureExtendedNumbersConfig();
    if (typeof ensure3DAdditionArenaBuilt === 'function') ensure3DAdditionArenaBuilt();
    ensureMazeCompactHUD();
    ensureAdditionFireButton().classList.add('hidden');

    if (!additionState.opMode) additionState.opMode = 'add';
    const isSub = (additionState.opMode === 'sub') || (additionState.opMode === 'mix' && Math.random() < 0.5);
    additionState.currentOp = isSub ? 'sub' : 'add';
    additionState.opChar = isSub ? '-' : '+';

    renderAdditionTierBarUI();

    const tier = additionState.tier || 'sum5';
    let a = 2, b = 3, sum = 5; // 在減法模式：a (左台被減數) - b (中台減數) = sum (右台差數答案)

    if (!isSub) {
        // ➕ 加法出題 (a + b = sum)
        if (tier === 'sum5') {
            sum = 2 + Math.floor(Math.random() * 4); // 2..5
            a = 1 + Math.floor(Math.random() * (sum - 1));
            b = sum - a;
        } else if (tier === 'sum10') {
            sum = 6 + Math.floor(Math.random() * 5); // 6..10
            a = 1 + Math.floor(Math.random() * (sum - 1));
            b = sum - a;
        } else if (tier === 'sum12') {
            const pairs = [[6, 6], [5, 6], [6, 5], [7, 5], [5, 7], [6, 7], [7, 7], [8, 4], [8, 6], [9, 3]];
            const pick = pairs[Math.floor(Math.random() * pairs.length)];
            a = pick[0];
            b = pick[1];
            sum = a + b;
        } else if (tier === 'missing') {
            sum = 4 + Math.floor(Math.random() * 7); // 4..10
            a = 1 + Math.floor(Math.random() * (sum - 1));
            b = sum - a;
        } else if (tier === 'free2') {
            sum = 4 + Math.floor(Math.random() * 7); // 4..10
            a = null;
            b = null;
        }
    } else {
        // ➖ 減法出題 (a - b = sum，保證結果 >= 1)
        if (tier === 'sum5') {
            a = 2 + Math.floor(Math.random() * 4); // 2..5
            b = 1 + Math.floor(Math.random() * (a - 1));
            sum = a - b;
        } else if (tier === 'sum10') {
            a = 6 + Math.floor(Math.random() * 5); // 6..10
            b = 1 + Math.floor(Math.random() * (a - 1));
            sum = a - b;
        } else if (tier === 'sum12') {
            const subPairs = [[12, 6], [12, 5], [12, 4], [11, 5], [11, 6], [13, 6], [14, 7], [15, 7], [16, 8]];
            const pick = subPairs[Math.floor(Math.random() * subPairs.length)];
            a = pick[0];
            b = pick[1];
            sum = a - b;
        } else if (tier === 'missing') {
            a = 4 + Math.floor(Math.random() * 7); // 4..10
            b = 1 + Math.floor(Math.random() * (a - 1));
            sum = a - b;
        } else if (tier === 'free2') {
            sum = 1 + Math.floor(Math.random() * 6); // 目標差數 1..6
            a = null;
            b = null;
        }
    }

    additionState.numA = a;
    additionState.numB = b;
    additionState.targetSum = sum;

    if (tier === 'sum5' || tier === 'sum10' || tier === 'sum12') {
        additionState.caughtA = a;
        additionState.caughtB = b;
        additionState.caughtSum = null;
        gameState.targetKey = sum;
    } else if (tier === 'missing') {
        additionState.caughtA = a;
        additionState.caughtB = null;
        additionState.caughtSum = sum;
        gameState.targetKey = b;
    } else if (tier === 'free2') {
        additionState.caughtA = null;
        additionState.caughtB = null;
        additionState.caughtSum = sum;
        gameState.targetKey = sum;
    }

    additionState.phase = 'catch';
    additionState.fuseTimer = 0;
    additionState.fireProgress = 0;
    additionState.ufoHitTimer = 0;

    additionState.heroX = 0;
    additionState.heroZ = 4.2;
    additionState.targetX = null;
    additionState.targetZ = null;
    additionState.moveDirX = 0;
    additionState.moveDirZ = 0;
    additionState.facingAngle = Math.PI;
    if (additionState.heroMesh) {
        additionState.heroMesh.position.set(0, 0.36, 4.2);
        additionState.heroMesh.rotation.y = Math.PI;
    }
    if (additionState.compassRing) {
        additionState.compassRing.position.set(0, 0.38, 4.2);
    }

    refreshAdditionStagePods();
    syncAdditionBottomCard();

    // 生成前排散步嘅候選柱方形小兵
    let roamList = [];
    const opChar = additionState.opChar;

    if (tier === 'sum5' || tier === 'sum10' || tier === 'sum12') {
        const candidates = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].filter(n => n !== sum && Math.abs(n - sum) <= 4);
        candidates.sort(() => Math.random() - 0.5);
        roamList = [sum, candidates[0], candidates[1], candidates[2]].sort(() => Math.random() - 0.5);
        if (isSub) {
            setPromptUI(
                `➖ 減法算式【 ${a} - ${b} = ? 】：${a} 拿走 ${b} 仲剩返幾多？請去捉答案小兵！`,
                `數下左台 ${a} 號頭頂仲有幾多粒發光紅球（灰色球代表拿走咗），捉正確小兵企上右邊答案台！`
            );
        } else {
            setPromptUI(
                `➕ 加法算式【 ${a} + ${b} = ? 】：請捉住正確答案小兵企上右邊金色「？」台！`,
                `左台係 ${a}、中間台係 ${b}，加埋總共係幾多？控制馬利奧去捉正確數字小兵啦！`
            );
        }
    } else if (tier === 'missing') {
        const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => n !== b).sort(() => Math.random() - 0.5);
        roamList = [b, pool[0], pool[1], pool[2]].sort(() => Math.random() - 0.5);
        setPromptUI(
            `🕵️ 補數挑戰【 ${a} ${opChar} ? = ${sum} 】：左台係 ${a}，右台答案係 ${sum}，中間缺咗邊個？`,
            isSub
                ? `${a} 減走幾多會剩返 ${sum}？（數下左台頭頂有幾多粒灰色球就知喇！）`
                : `請控制馬利奧捉住正確嘅柱方形小兵，填上中間天藍台嘅「？」位啦！`
        );
    } else if (tier === 'free2') {
        if (!isSub) {
            const p1 = Math.max(1, Math.floor(sum / 2));
            const p2 = sum - p1;
            const p3 = 1;
            const p4 = sum - 1;
            const extra = Math.max(1, (sum + 2) % 9);
            roamList = [p1, p2, p3, p4, extra].sort(() => Math.random() - 0.5);
            setPromptUI(
                `🔥 自由加法【 ? + ? = ${sum} 】：右台目標係 ${sum}，請捉 2 隻加埋等於 ${sum} 嘅小兵！`,
                `先捉第 1 隻小兵企上左邊粉紅台，再捉第 2 隻小兵企上中間天藍台！`
            );
        } else {
            const p1 = sum + 2;
            const p2 = 2;
            const p3 = Math.min(10, sum + 4);
            const p4 = p3 - sum;
            const extra = Math.max(1, sum + 1);
            roamList = [p1, p2, p3, p4, extra].sort(() => Math.random() - 0.5);
            setPromptUI(
                `🔥 自由減法【 ? - ? = ${sum} 】：右台目標係 ${sum}，請捉 2 隻相減等於 ${sum} 嘅小兵！`,
                `先捉 1 隻大過 ${sum} 嘅小兵企上左邊粉紅台，再捉減數小兵企上中間天藍台！`
            );
        }
    }

    const startCoords = [
        { x: -4.2, z: 1.6 },
        { x: 4.2,  z: 1.6 },
        { x: -2.4, z: 3.6 },
        { x: 2.4,  z: 3.6 },
        { x: 0,    z: 2.2 }
    ];
    roamList.forEach((num, idx) => {
        const pt = startCoords[idx % startCoords.length];
        const minion = create3DNumberCharacter(num, pt.x, pt.z, 0.72);
        minion.isArenaMinion = true;
        if (num >= 10) minion.group.scale.set(0.82, 0.72, 0.72);
        const ang = (idx / roamList.length) * Math.PI * 2 + 0.5;
        minion.vx = Math.cos(ang) * 1.5;
        minion.vz = Math.sin(ang) * 1.2;
        interactiveBlocks.push(minion);
    });
}

function handleAdditionMinionCaught(minion) {
    if (gameState.isBusy || additionState.phase !== 'catch' || !minion.isArenaMinion) return;
    const num = minion.itemKey;
    const tier = additionState.tier;
    const sum = additionState.targetSum;
    const isSub = (additionState.currentOp === 'sub');
    const opChar = additionState.opChar || '+';

    if (tier === 'free2') {
        if (additionState.caughtA === null) {
            if (!isSub && num >= sum) {
                playGentleNudge();
                minion.state = 'wrong';
                minion.wrongTimer = 0.6;
                setPromptUI(`呢隻係 ${num} 號，已經大過或等於目標 ${sum} 喇！請揀細啲嘅數字小兵先！`, `我哋要捉 2 隻小兵加埋等於 ${sum}`);
                return;
            }
            if (isSub && num <= sum) {
                playGentleNudge();
                minion.state = 'wrong';
                minion.wrongTimer = 0.6;
                setPromptUI(`減法左台第一個數要大過答案 ${sum} 先夠減㗎！請揀大過 ${sum} 嘅小兵先！`, `目標算式：? - ? = ${sum}`);
                return;
            }
            playCoinSound();
            additionState.caughtA = num;
            minion.isArenaMinion = false;
            minion.group.visible = false;
            refreshAdditionStagePods();
            syncAdditionBottomCard();

            const needed = isSub ? (num - sum) : (sum - num);
            gameState.targetKey = needed;
            setPromptUI(
                `👍 左台企好「${num}」號喇！【 ${num} ${opChar} ? = ${sum} 】中間台應該填幾多？`,
                `快啲去捉「數字 ${needed}」小兵企上中間天藍台，完成整條算式啦！`
            );

            const hasNeeded = interactiveBlocks.some(b => b.isArenaMinion && b.group.visible && b.itemKey === needed);
            if (!hasNeeded) {
                const newM = create3DNumberCharacter(needed, 0, 2.2, 0.72);
                newM.isArenaMinion = true;
                newM.vx = 1.4;
                newM.vz = 1.1;
                interactiveBlocks.push(newM);
            }
            return;
        } else {
            const isCorrectPair = isSub
                ? (additionState.caughtA - num === sum)
                : (additionState.caughtA + num === sum);
            if (isCorrectPair) {
                playCoinSound();
                additionState.caughtB = num;
                minion.isArenaMinion = false;
                minion.group.visible = false;
                refreshAdditionStagePods();
                syncAdditionBottomCard();
                startMinionFusionSequence();
            } else {
                const needed = isSub ? (additionState.caughtA - sum) : (sum - additionState.caughtA);
                playGentleNudge();
                minion.state = 'wrong';
                minion.wrongTimer = 0.6;
                additionState.targetX = null;
                additionState.targetZ = null;
                setPromptUI(
                    `${additionState.caughtA} ${opChar} ${num} 唔等於右台嘅 ${sum} 喎！`,
                    `算式提示：${additionState.caughtA} ${opChar} ${needed} = ${sum}，請去捉「數字 ${needed}」小兵啦！`
                );
            }
            return;
        }
    }

    const expectedNum = (tier === 'missing') ? additionState.numB : sum;
    if (num === expectedNum) {
        playCoinSound();
        minion.isArenaMinion = false;
        minion.group.visible = false;
        if (tier === 'missing') {
            additionState.caughtB = num;
        } else {
            additionState.caughtSum = num;
        }
        refreshAdditionStagePods();
        syncAdditionBottomCard();
        startMinionFusionSequence();
    } else {
        playGentleNudge();
        minion.state = 'wrong';
        minion.wrongTimer = 0.6;
        additionState.targetX = null;
        additionState.targetZ = null;
        setPromptUI(
            `呢隻係「數字 ${num}」小兵，未啱喎！請睇下頂部算式板再數一次！`,
            isSub
                ? `減法小貼士：數下左台頭頂仲有幾多粒發光紅球，或者撳右上角「💡提示」！`
                : `加法小貼士：將左台同中台頭頂嘅能量球合埋一齊數，或者撳右上角「💡提示」！`
        );
    }
}

function startMinionFusionSequence() {
    additionState.phase = 'fusing';
    additionState.fuseTimer = 0;
    additionState.moveDirX = 0;
    additionState.moveDirZ = 0;
    additionState.targetX = null;
    additionState.targetZ = null;

    interactiveBlocks.forEach(b => {
        if (b.isArenaMinion) b.group.visible = false;
    });

    const a = additionState.caughtA;
    const b = additionState.caughtB;
    const sum = additionState.targetSum;
    const opChar = additionState.opChar || '+';
    playChestOpenSound();
    emitStarParticles(new THREE.Vector3(3.7, 1.8, -1.8));

    setPromptUI(
        `🎉 算式完成！【 ${a} ${opChar} ${b} = ${sum} 】三隻小兵齊齊整整企晒喺度喇！`,
        `快啲撳中間嘅「🔥 點火發射答案小兵！」按鈕，將右台嘅「${sum} 號皇冠小兵」射向飛碟啦！`
    );
}

function fireAdditionCannon() {
    if (gameState.mode !== 'addition' || additionState.phase !== 'readyToFire') return;
    additionState.phase = 'firing';
    additionState.fireProgress = 0;
    ensureAdditionFireButton().classList.add('hidden');
    playMarioJumpSound();
    emitStarParticles(new THREE.Vector3(3.7, 1.8, -2.5));
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
    } else if (gameState.mode === 'treasure' || gameState.mode === 'addition') {
        if (gameState.mode === 'addition' && additionState.phase === 'readyToFire' && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            fireAdditionCannon();
            return;
        }
        const curZ = gameState.mode === 'addition' ? additionState.moveDirZ : treasureHero.moveDirZ;
        const curX = gameState.mode === 'addition' ? additionState.moveDirX : treasureHero.moveDirX;
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            setTreasureMoveDir(-1, curZ);
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            setTreasureMoveDir(1, curZ);
        } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            e.preventDefault();
            setTreasureMoveDir(curX, -1);
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            e.preventDefault();
            setTreasureMoveDir(curX, 1);
        }
    }
}

function onWindowKeyUp(e) {
    if (gameState.mode !== 'treasure' && gameState.mode !== 'addition') return;
    const curZ = gameState.mode === 'addition' ? additionState.moveDirZ : treasureHero.moveDirZ;
    const curX = gameState.mode === 'addition' ? additionState.moveDirX : treasureHero.moveDirX;
    if (['ArrowLeft', 'a', 'A', 'ArrowRight', 'd', 'D'].includes(e.key)) {
        setTreasureMoveDir(0, curZ);
    }
    if (['ArrowUp', 'w', 'W', 'ArrowDown', 's', 'S'].includes(e.key)) {
        setTreasureMoveDir(curX, 0);
    }
}

function scheduleAutoVisualPrompt() {
    clearTimeout(autoPromptTimer);
    if (!gameState.settings.autoPrompt || gameState.mode === 'explore') return;
    autoPromptTimer = setTimeout(() => {
        triggerVisualHint(false);
    }, 6000);
}

function triggerVisualHint(manualClick = false) {
    if (gameState.mode === 'explore' || gameState.isBusy) return;
    if (gameState.mode === 'treasure') {
        treasureHero.hintRevealedThisStep = true;
        updateParadeProgressBanner();
        refreshMazeGuideDots();
        syncMazeTargetCardDisplay();
    }
    const rightBlock = interactiveBlocks.find(b => !b.rescued && !b.isPodMinion && b.group.visible && b.itemKey === gameState.targetKey);
    if (rightBlock) {
        rightBlock.state = 'hint';
        if (rightBlock.haloMesh) rightBlock.haloMesh.material.opacity = 0.88;
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

    // 🌉 形狀修橋模式：如果馬利奧已經帶住形狀小兵，檢查小朋友係咪直接撳咗橋面缺口！
    if (gameState.mode === 'shapebridge' && shapeBridgeState.phase === 'repair' && shapeBridgeState.carryingMinion) {
        const slotMeshes = shapeBridgeState.slots.filter(s => !s.filled && s.hitMesh).map(s => s.hitMesh);
        const slotHits = raycaster.intersectObjects(slotMeshes, false);
        if (slotHits.length > 0 && slotHits[0].object.userData.slotObj) {
            const targetSlot = slotHits[0].object.userData.slotObj;
            playPopSound(560);
            shapeBridgeState.moveDirX = 0;
            shapeBridgeState.moveDirZ = 0;
            shapeBridgeState.targetX = targetSlot.x;
            shapeBridgeState.targetZ = 0.45;
            return;
        }
    }

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
            } else if (gameState.mode === 'shapebridge') {
                if (gameState.isBusy || shapeBridgeState.phase !== 'repair' || !tappedWrapper.isArenaMinion) return;
                playPopSound(540);
                shapeBridgeState.moveDirX = 0;
                shapeBridgeState.moveDirZ = 0;
                shapeBridgeState.targetX = tappedWrapper.group.position.x;
                shapeBridgeState.targetZ = tappedWrapper.group.position.z;
            } else if (gameState.mode === 'addition') {
            } else if (gameState.mode === 'addition') {
                if (additionState.phase === 'readyToFire') {
                    fireAdditionCannon();
                    return;
                }
                if (gameState.isBusy || additionState.phase !== 'catch' || !tappedWrapper.isArenaMinion) return;
                playPopSound(540);
                additionState.moveDirX = 0;
                additionState.moveDirZ = 0;
                additionState.targetX = tappedWrapper.group.position.x;
                additionState.targetZ = tappedWrapper.group.position.z;
            } else if (gameState.mode === 'treasure') {
                if (gameState.isBusy || tappedWrapper.rescued) return;
                playPopSound(540);
                treasureHero.moveDirX = 0;
                treasureHero.moveDirZ = 0;
                const heroCell = mazeWorldToGrid(treasureHero.currentX, treasureHero.currentZ);
                const path = findMazePathBFS(heroCell.col, heroCell.row, tappedWrapper.gridCol, tappedWrapper.gridRow);
                treasureHero.pathQueue = path.length > 0 ? path : [{ x: tappedWrapper.baseX, z: tappedWrapper.baseZ }];
                if (treasureHero.clickMarker) {
                    treasureHero.clickMarker.position.set(tappedWrapper.baseX, 0.35, tappedWrapper.baseZ);
                    treasureHero.clickMarker.visible = true;
                }
            } else {
                handleBlockTapped(tappedWrapper);
            }
            return;
        }
    }

    if (gameState.mode === 'addition' && !gameState.isBusy) {
        if (additionState.phase === 'readyToFire') {
            fireAdditionCannon();
            return;
        }
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.35);
        const hitPt = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(groundPlane, hitPt)) {
            playPopSound(460);
            additionState.moveDirX = 0;
            additionState.moveDirZ = 0;
            additionState.targetX = THREE.MathUtils.clamp(hitPt.x, -5.8, 5.8);
            additionState.targetZ = THREE.MathUtils.clamp(hitPt.z, 0.8, 5.6);
            if (additionState.clickMarker) {
                additionState.clickMarker.position.set(additionState.targetX, 0.38, additionState.targetZ);
                additionState.clickMarker.visible = true;
            }
        }
        return;
    }

    if (gameState.mode === 'treasure' && !gameState.isBusy) {
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.3);
        const hitPt = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(groundPlane, hitPt)) {
            const heroCell = mazeWorldToGrid(treasureHero.currentX, treasureHero.currentZ);
            let targetCell = mazeWorldToGrid(hitPt.x, hitPt.z);

            if (treasureHero.allRescued && hitPt.z < -5.2) {
                targetCell = { col: 4, row: 0 };
            }

            if (isMazeCellWalkable(targetCell.col, targetCell.row)) {
                playPopSound(460);
                treasureHero.moveDirX = 0;
                treasureHero.moveDirZ = 0;
                const path = findMazePathBFS(heroCell.col, heroCell.row, targetCell.col, targetCell.row);
                treasureHero.pathQueue = path;
                const worldPt = mazeGridToWorld(targetCell.col, targetCell.row);
                if (treasureHero.clickMarker) {
                    treasureHero.clickMarker.position.set(worldPt.x, 0.35, worldPt.z);
                    treasureHero.clickMarker.visible = true;
                }
            }
        }
    }
}

function handleBlockTapped(block) {
    if (gameState.isBusy) return;
    clearTimeout(autoPromptTimer);

    const tappedKey = block.itemKey;
    const tappedMeta = getCognitiveItemMeta(tappedKey);

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

    // Mode 5: 【1-2-3-4-5 迷宮救兵大巡遊】
    if (gameState.mode === 'treasure') {
        if (block.rescued) return;

        if (tappedKey === gameState.targetKey) {
            block.rescued = true;
            block.state = 'idle';
            if (block.haloMesh) block.haloMesh.material.opacity = 0;
            block.group.scale.setScalar(0.56);
            block.bodyMesh.rotation.x = 0;

            const seq = treasureHero.sequence || [1, 2, 3, 4, 5];
            if (!treasureHero.rescuedSet) treasureHero.rescuedSet = new Set();
            treasureHero.rescuedSet.add(tappedKey);

            treasureHero.paradeFollowers.push(block);
            treasureHero.paradeFollowers.sort((a, b) => seq.indexOf(a.itemKey) - seq.indexOf(b.itemKey));

            treasureHero.hintRevealedThisStep = false;
            const noteIdx = (treasureHero.countingTier === 'backward')
                ? (seq.length - seq.indexOf(tappedKey))
                : (seq.indexOf(tappedKey) + 1);
            playCountingNote(Math.max(1, noteIdx));
            playCoinSound();
            emitStarParticles(block.group.position);

            const nextTarget = seq.find(n => !treasureHero.rescuedSet.has(n));
            if (nextTarget !== undefined) {
                gameState.targetKey = nextTarget;
                gameState.targetNumber = nextTarget;
                updateParadeProgressBanner();
                refreshMazeGuideDots();
                syncMazeTargetCardDisplay();

                const nextMeta = getCognitiveItemMeta(nextTarget);
                const nextTitle = treasureHero.blindMode ? '下一個失蹤數字（？）' : nextMeta.title;
                setPromptUI(
                    `🎉 好叻呀！「${tappedMeta.title}」成功歸隊！接住請搵「${nextTitle}」！`,
                    `睇下身後嘅數字小隊同埋進度條，繼續喺迷宮搵出下一位朋友啦！`
                );
            } else {
                treasureHero.allRescued = true;
                interactiveBlocks.forEach(b => {
                    if (!b.rescued) b.group.visible = false;
                });
                playChestOpenSound();
                updateParadeProgressBanner();
                refreshMazeGuideDots();
                updateTargetBadgeUI(tappedKey, false);

                setPromptUI(
                    `🏰 全隊集結完畢（${seq.join(' ➔ ')}）！北面「皇冠城堡大門」已經打開！`,
                    `快啲帶住身後整齊嘅數字巡遊隊伍，衝入最北面嘅城堡大門放煙花啦！`
                );
                const heroCell = mazeWorldToGrid(treasureHero.currentX, treasureHero.currentZ);
                treasureHero.pathQueue = findMazePathBFS(heroCell.col, heroCell.row, 4, 0);
            }
        } else {
            playGentleNudge();
            block.state = 'wrong';
            block.wrongTimer = 0.6;
            treasureHero.pathQueue = [];
            treasureHero.moveDirX = 0;
            treasureHero.moveDirZ = 0;

            const targetMeta = getCognitiveItemMeta(gameState.targetKey);
            const hintName = (treasureHero.blindMode && !treasureHero.hintRevealedThisStep)
                ? '正確嘅下一個數字（可撳右上角💡提示）'
                : `「${targetMeta.title}」`;
            setPromptUI(
                `呢個係「${tappedMeta.title}」，未輪到佢住喎！我哋先去救${hintName}啦！`,
                `小提示：請對照下方進度條順序，搵出正確嘅數字朋友`
            );
        }
        return;
    }

    // Mode 1, Mode 2 & Mode 4:
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
        playGentleNudge();
        block.state = 'wrong';
        block.wrongTimer = 0.7;
        if (block.isMarioBrick) {
            block.bumpOffset = 0.25;
        }
        if (block.bodyMesh && Array.isArray(block.bodyMesh.material)) {
            block.bodyMesh.material.forEach(m => {
                m.transparent = true;
                m.opacity = 0.6;
            });
        }

        const targetMeta = getCognitiveItemMeta(gameState.targetKey);
        setPromptUI(
            `呢個係「${tappedMeta.title}」，唔緊要，我哋再搵下「${targetMeta.title}」啦！`,
            `無挫敗感提示：請再試一次`
        );

        setTimeout(() => {
            triggerVisualHint(false);
        }, 900);
    }
}

function triggerMazeCastleVictory() {
    if (treasureHero.castleVictoryTriggered) return;
    treasureHero.castleVictoryTriggered = true;
    gameState.isBusy = true;
    treasureHero.moveDirX = 0;
    treasureHero.moveDirZ = 0;
    treasureHero.pathQueue = [];

    playStageClearFanfare();
    awardStarProgress();

    const seqStr = (treasureHero.sequence || [1, 2, 3, 4, 5]).join(' ➔ ');
    setPromptUI(
        `👑 巡遊大成功！你已經帶齊 ${seqStr} 進入奇幻皇冠城堡喇！`,
        `準備前往下一座全新迷宮島... 🎉`
    );

    [
        [-2.4, 3.5, -7.8],
        [2.4,  3.5, -7.8],
        [0,    4.2, -8.2],
        [-3.2, 3.0, -6.8],
        [3.2,  3.0, -6.8]
    ].forEach(([fx, fy, fz], idx) => {
        const fwTimer = setTimeout(() => {
            playCoinSound();
            emitStarParticles(new THREE.Vector3(fx, fy, fz));
        }, idx * 320);
        activeCountingTimeouts.push(fwTimer);
    });

    const nextMazeTimer = setTimeout(() => {
        treasureHero.mazeLevelIdx = (treasureHero.mazeLevelIdx || 0) + 1;
        if (!isToyModalOpen()) startNewRound();
    }, 2700);
    activeCountingTimeouts.push(nextMazeTimer);
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

            const badge = document.createElement('span');
            badge.className = 'inline-flex items-center justify-center bg-orange-100 text-orange-600 px-2.5 py-0.5 rounded-xl text-base sm:text-xl font-black star-earned';
            badge.textContent = meta.subject === 'number' ? String(i) : `${meta.title} ×${i}`;
            dotsContainer.appendChild(badge);
        }, 400 + (i - 1) * 460);
        activeCountingTimeouts.push(t);
    }

    const totalDuration = 400 + count * 460 + 600;
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
 * 9. REWARD STARS & TOY CABINET SYSTEM
 ********************************************************************/
function awardStarProgress() {
    gameState.stars = Math.min(5, gameState.stars + 1);
    renderStarsBar();

    if (gameState.stars >= 5) {
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

    if (key === 'lowDistraction') {
        environmentGroup.visible = !value && (gameState.mode !== 'treasure' && gameState.mode !== 'addition');
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

    ['number', 'color', 'shape'].forEach(subj => {
        const el = document.getElementById(`set-subj-${subj}`);
        if (el) el.className = `setting-pill py-3 px-2 rounded-2xl font-bold text-sm sm:text-base border-2 transition-all ${gameState.subject === subj ? activeClass : inactiveClass}`;
    });

    ['1-5', '6-10', '1-10'].forEach(r => {
        const el = document.getElementById(`set-range-${r}`);
        if (el) el.className = `setting-pill py-3 px-3 rounded-2xl font-bold text-sm sm:text-base border-2 transition-all ${s.range === r ? activeClass : inactiveClass}`;
    });

    [1, 2, 3].forEach(c => {
        const el = document.getElementById(`set-choices-${c}`);
        if (el) el.className = `setting-pill py-3 px-2 rounded-2xl font-bold text-sm sm:text-base border-2 transition-all ${s.choices === c ? activeClass : inactiveClass}`;
    });

    document.getElementById('set-bg-rich').className = `setting-pill py-3 px-3 rounded-2xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-2 ${!s.lowDistraction ? activeClass : inactiveClass}`;
    document.getElementById('set-bg-calm').className = `setting-pill py-3 px-3 rounded-2xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-2 ${s.lowDistraction ? activeClass : inactiveClass}`;

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

    cloudsList.forEach(c => {
        c.position.x = c.userData.baseX + Math.sin(elapsed * c.userData.speed) * 1.4;
    });

    if (gachaSpinTimer > 0 && gachaDialMesh) {
        gachaSpinTimer -= dt;
        gachaDialMesh.rotation.z += dt * 10;
    }

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

    interactiveBlocks.forEach(block => {
        block.animTime += dt;

        if (block.isMazeFriend && block.rescued) {
            return;
        }

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
            block.group.position.y = block.baseY + Math.abs(Math.sin(block.animTime * 6.5)) * 0.28 + bumpY;
            if (block.haloMesh) block.haloMesh.rotation.z += dt * 2.5;
            const pulseScale = block.baseScale * (1.1 + Math.sin(block.animTime * 6.5) * 0.06);
            block.group.scale.setScalar(pulseScale);
        } else if (block.state === 'wrong') {
            block.wrongTimer -= dt;
            block.group.position.y = block.baseY + bumpY;
            block.group.rotation.z = Math.sin(block.animTime * 28) * 0.14;
            if (block.wrongTimer <= 0) {
                block.state = 'idle';
                block.group.rotation.z = 0;
            }
        } else if (block.state === 'celebrate') {
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

    // 4C. Animate 【1-2-3-4-5 迷宮救兵大巡遊】
    if (treasureIslandGroup.visible && treasureHero.group) {
        if (treasureHero.castleGate) {
            const gate = treasureHero.castleGate;
            const targetAngle = treasureHero.allRescued ? 1.75 : 0;
            gate.leftPivot.rotation.y = THREE.MathUtils.lerp(gate.leftPivot.rotation.y, -targetAngle, dt * 5);
            gate.rightPivot.rotation.y = THREE.MathUtils.lerp(gate.rightPivot.rotation.y, targetAngle, dt * 5);
            if (gate.lockMesh) gate.lockMesh.visible = !treasureHero.allRescued;
        }

        let vx = 0;
        let vz = 0;
        const walkSpeed = 6.2;

        if (treasureHero.moveDirX !== 0 || treasureHero.moveDirZ !== 0) {
            vx = treasureHero.moveDirX * walkSpeed;
            vz = treasureHero.moveDirZ * walkSpeed;
        } else if (treasureHero.pathQueue && treasureHero.pathQueue.length > 0) {
            const nextPt = treasureHero.pathQueue[0];
            const dx = nextPt.x - treasureHero.currentX;
            const dz = nextPt.z - treasureHero.currentZ;
            const dist = Math.hypot(dx, dz);
            if (dist > 0.12) {
                vx = (dx / dist) * walkSpeed;
                vz = (dz / dist) * walkSpeed;
            } else {
                treasureHero.currentX = nextPt.x;
                treasureHero.currentZ = nextPt.z;
                treasureHero.pathQueue.shift();
                if (treasureHero.pathQueue.length === 0 && treasureHero.clickMarker) {
                    treasureHero.clickMarker.visible = false;
                }
            }
        }

        const isWalking = Math.hypot(vx, vz) > 0.05;
        if (isWalking && !gameState.isBusy) {
            const heroRadius = 0.42;
            const canStandAt = (wx, wz) => {
                const corners = [
                    [wx - heroRadius, wz - heroRadius],
                    [wx + heroRadius, wz - heroRadius],
                    [wx - heroRadius, wz + heroRadius],
                    [wx + heroRadius, wz + heroRadius]
                ];
                return corners.every(([cx, cz]) => {
                    const cell = mazeWorldToGrid(cx, cz);
                    return isMazeCellWalkable(cell.col, cell.row);
                });
            };

            const nextX = treasureHero.currentX + vx * dt;
            const nextZ = treasureHero.currentZ + vz * dt;
            const curCell = mazeWorldToGrid(treasureHero.currentX, treasureHero.currentZ);
            const cellCenter = mazeGridToWorld(curCell.col, curCell.row);

            if (canStandAt(nextX, treasureHero.currentZ)) {
                treasureHero.currentX = nextX;
                if (Math.abs(vz) < 0.1) {
                    treasureHero.currentZ = THREE.MathUtils.lerp(treasureHero.currentZ, cellCenter.z, dt * 8);
                }
            } else if (Math.abs(vx) > 0.1) {
                treasureHero.currentZ = THREE.MathUtils.lerp(treasureHero.currentZ, cellCenter.z, dt * 12);
            }

            if (canStandAt(treasureHero.currentX, nextZ)) {
                treasureHero.currentZ = nextZ;
                if (Math.abs(vx) < 0.1) {
                    treasureHero.currentX = THREE.MathUtils.lerp(treasureHero.currentX, cellCenter.x, dt * 8);
                }
            } else if (Math.abs(vz) > 0.1) {
                treasureHero.currentX = THREE.MathUtils.lerp(treasureHero.currentX, cellCenter.x, dt * 12);
            }

            treasureHero.walkCycle += dt * 16;
            treasureHero.facingAngle = Math.atan2(vx, vz);

            const lastTrail = treasureHero.trail[0];
            if (!lastTrail || Math.hypot(treasureHero.currentX - lastTrail.x, treasureHero.currentZ - lastTrail.z) > 0.11) {
                treasureHero.trail.unshift({
                    x: treasureHero.currentX,
                    z: treasureHero.currentZ,
                    angle: treasureHero.facingAngle
                });
                if (treasureHero.trail.length > 90) treasureHero.trail.pop();
                refreshMazeGuideDots();
            }
        }

        const walkBounce = isWalking ? Math.abs(Math.sin(treasureHero.walkCycle)) * 0.16 : Math.sin(elapsed * 3) * 0.03;
        treasureHero.group.position.set(
            treasureHero.currentX,
            0.3 + walkBounce,
            treasureHero.currentZ
        );
        treasureHero.group.rotation.y = THREE.MathUtils.lerp(treasureHero.group.rotation.y, treasureHero.facingAngle, dt * 12);

        if (treasureHero.paradeFollowers && treasureHero.paradeFollowers.length > 0) {
            treasureHero.paradeFollowers.forEach((follower, idx) => {
                const trailIdx = Math.min(treasureHero.trail.length - 1, (idx + 1) * 10);
                const targetPt = treasureHero.trail[trailIdx] || { x: treasureHero.currentX, z: treasureHero.currentZ + (idx + 1) * 1.1, angle: 0 };
                follower.group.position.x = THREE.MathUtils.lerp(follower.group.position.x, targetPt.x, dt * 10);
                follower.group.position.z = THREE.MathUtils.lerp(follower.group.position.z, targetPt.z, dt * 10);
                const hop = isWalking ? Math.abs(Math.sin(treasureHero.walkCycle - idx * 1.1)) * 0.22 : Math.sin(elapsed * 4 + idx) * 0.05;
                follower.group.position.y = 0.72 + hop;
                follower.group.rotation.y = THREE.MathUtils.lerp(follower.group.rotation.y, targetPt.angle, dt * 8);
            });
        }

        const tierBarEl = document.getElementById('maze-tier-bar');
        if (tierBarEl) {
            tierBarEl.style.display = (!gameState.inLobby && gameState.mode === 'treasure') ? 'flex' : 'none';
        }

        const camTargetX = treasureHero.currentX * 0.32;
        const camTargetY = treasureHero.castleVictoryTriggered ? 9.2 : 14.8;
        const camTargetZ = treasureHero.castleVictoryTriggered ? -1.2 : (treasureHero.currentZ * 0.35 + 9.4);
        const lookX = treasureHero.currentX * 0.28;
        const lookY = treasureHero.castleVictoryTriggered ? 1.8 : 0.2;
        const lookZ = treasureHero.castleVictoryTriggered ? -7.2 : (treasureHero.currentZ * 0.3 + 1.15);

        camera.position.x = THREE.MathUtils.lerp(camera.position.x, camTargetX, dt * 4.5);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, camTargetY, dt * 4.5);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, camTargetZ, dt * 4.5);
        camera.lookAt(lookX, lookY, lookZ);

        if (treasureHero.compassRing) {
            treasureHero.compassRing.position.set(treasureHero.currentX, 0.34, treasureHero.currentZ);
            let aimX = 0;
            let aimZ = -6.6;
            if (!treasureHero.allRescued) {
                const nextFriend = interactiveBlocks.find(b => !b.rescued && b.itemKey === gameState.targetKey);
                if (nextFriend) {
                    aimX = nextFriend.baseX;
                    aimZ = nextFriend.baseZ;
                }
            }
            treasureHero.compassRing.rotation.y = Math.atan2(aimX - treasureHero.currentX, aimZ - treasureHero.currentZ);
        }

        if (!gameState.isBusy) {
            if (treasureHero.allRescued) {
                if (Math.hypot(treasureHero.currentX - 0, treasureHero.currentZ - (-6.6)) < 1.35) {
                    triggerMazeCastleVictory();
                }
            } else {
                for (let i = 0; i < interactiveBlocks.length; i++) {
                    const friend = interactiveBlocks[i];
                    if (!friend.rescued && friend.state !== 'wrong') {
                        const dist = Math.hypot(treasureHero.currentX - friend.baseX, treasureHero.currentZ - friend.baseZ);
                        if (dist < 1.15) {
                            handleBlockTapped(friend);
                            break;
                        }
                    }
                }
            }
        }
    }

    // 隱藏非加法模式時嘅頂部大算式板
    const eqHudEl = document.getElementById('addition-equation-hud');
    if (eqHudEl && (gameState.mode !== 'addition' || gameState.inLobby)) {
        eqHudEl.style.display = 'none';
    }

    // 4D. Animate 【🛸 3D 競技場：馬利奧捉小兵合體大作戰 (三台並列 A + B = C 版)】
    if (typeof additionArenaGroup !== 'undefined' && additionArenaGroup.visible && additionState.heroMesh) {
        const tierBarEl = document.getElementById('maze-tier-bar');
        if (tierBarEl) {
            tierBarEl.style.display = (!gameState.inLobby && gameState.mode === 'addition') ? 'flex' : tierBarEl.style.display;
        }

        if (additionState.plusSignMesh) {
            additionState.plusSignMesh.rotation.z = Math.sin(elapsed * 3) * 0.08;
        }
        if (additionState.equalSignMesh) {
            additionState.equalSignMesh.position.y = 1.35 + Math.sin(elapsed * 3) * 0.05;
        }
        ['slotA', 'slotB', 'slotC'].forEach(k => {
            if (additionState[k]) {
                const s = 1.0 + Math.sin(elapsed * 5) * 0.05;
                additionState[k].scale.setScalar(s);
            }
        });

        if (additionState.ufoGroup) {
            if (additionState.ufoHitTimer > 0) {
                additionState.ufoHitTimer -= dt;
                additionState.ufoGroup.rotation.y += dt * 18;
                additionState.ufoGroup.position.y = 4.5 + Math.sin(elapsed * 30) * 0.35;
            } else {
                additionState.ufoGroup.position.x = Math.sin(elapsed * 1.2) * 2.4;
                additionState.ufoGroup.position.y = 4.5 + Math.sin(elapsed * 2.8) * 0.18;
                additionState.ufoGroup.rotation.z = Math.sin(elapsed * 1.2) * 0.06;
            }
        }

        // 前排散步小兵自由行路（嚴格限制喺前排 Z = 1.4 ~ 4.8，絕不撞入後排算式台！）
        interactiveBlocks.forEach(b => {
            if (b.isArenaMinion && b.group.visible && additionState.phase === 'catch') {
                b.baseX += (b.vx || 1.2) * dt;
                b.baseZ += (b.vz || 1.1) * dt;
                if (b.baseX < -5.4 || b.baseX > 5.4) b.vx = -(b.vx || 1.2);
                if (b.baseZ < 1.4 || b.baseZ > 4.8) b.vz = -(b.vz || 1.1);
                b.baseX = Math.max(-5.5, Math.min(5.5, b.baseX));
                b.baseZ = Math.max(1.4, Math.min(4.8, b.baseZ));
                b.group.position.x = b.baseX;
                b.group.position.z = b.baseZ;
                b.group.position.y = 0.95 + Math.abs(Math.sin(elapsed * 7 + b.animTime)) * 0.22;
                b.group.rotation.y = Math.atan2(b.vx, b.vz) * 0.25;
            }
        });

        let vx = 0, vz = 0;
        const speed = 6.8;
        if (additionState.phase === 'catch' && !gameState.isBusy) {
            if (additionState.moveDirX !== 0 || additionState.moveDirZ !== 0) {
                vx = additionState.moveDirX * speed;
                vz = additionState.moveDirZ * speed;
            } else if (additionState.targetX !== null && additionState.targetZ !== null) {
                const dx = additionState.targetX - additionState.heroX;
                const dz = additionState.targetZ - additionState.heroZ;
                const dist = Math.hypot(dx, dz);
                if (dist > 0.15) {
                    vx = (dx / dist) * speed;
                    vz = (dz / dist) * speed;
                } else {
                    additionState.targetX = null;
                    additionState.targetZ = null;
                    if (additionState.clickMarker) additionState.clickMarker.visible = false;
                }
            }
        }

        const isWalking = Math.hypot(vx, vz) > 0.05;
        if (isWalking) {
            additionState.heroX = Math.max(-6.2, Math.min(6.2, additionState.heroX + vx * dt));
            additionState.heroZ = Math.max(0.6, Math.min(5.8, additionState.heroZ + vz * dt));
            additionState.walkCycle += dt * 16;
            additionState.facingAngle = Math.atan2(vx, vz);
        }

        const hop = isWalking ? Math.abs(Math.sin(additionState.walkCycle)) * 0.18 : Math.sin(elapsed * 3) * 0.03;
        additionState.heroMesh.position.set(additionState.heroX, 0.36 + hop, additionState.heroZ);
        additionState.heroMesh.rotation.y = THREE.MathUtils.lerp(additionState.heroMesh.rotation.y, additionState.facingAngle, dt * 12);
        if (additionState.compassRing) {
            additionState.compassRing.position.set(additionState.heroX, 0.38, additionState.heroZ);
        }

        if (additionState.phase === 'catch' && !gameState.isBusy) {
            for (let i = 0; i < interactiveBlocks.length; i++) {
                const m = interactiveBlocks[i];
                if (m.isArenaMinion && m.group.visible && m.state !== 'wrong') {
                    if (Math.hypot(additionState.heroX - m.group.position.x, additionState.heroZ - m.group.position.z) < 1.25) {
                        handleAdditionMinionCaught(m);
                        break;
                    }
                }
            }
        }

        if (additionState.phase === 'fusing') {
            additionState.fuseTimer += dt * 2.0;
            const p = Math.min(1, additionState.fuseTimer);
            if (additionState.leftPodMinion) {
                additionState.leftPodMinion.group.position.y = 1.15 + Math.abs(Math.sin(p * Math.PI * 2)) * 0.45;
            }
            if (additionState.midPodMinion) {
                additionState.midPodMinion.group.position.y = 1.15 + Math.abs(Math.sin(p * Math.PI * 2)) * 0.45;
            }
            if (additionState.rightPodMinion) {
                const s = THREE.MathUtils.lerp(0.86, 1.12, p);
                additionState.rightPodMinion.group.scale.setScalar(s);
                additionState.rightPodMinion.group.position.y = 1.25 + Math.sin(p * Math.PI) * 0.6;
            }
            if (p >= 1) {
                playSuccessChime();
                additionState.phase = 'readyToFire';
                ensureAdditionFireButton().classList.remove('hidden');
            }
        }

        if (additionState.phase === 'firing' && additionState.rightPodMinion && additionState.ufoGroup) {
            additionState.fireProgress = Math.min(1, additionState.fireProgress + dt * 2.2);
            const fp = additionState.fireProgress;
            const ufoPos = additionState.ufoGroup.position;
            const ansMinion = additionState.rightPodMinion.group;
            ansMinion.position.x = THREE.MathUtils.lerp(3.7, ufoPos.x, fp);
            ansMinion.position.y = THREE.MathUtils.lerp(1.35, ufoPos.y, fp) + Math.sin(fp * Math.PI) * 1.8;
            ansMinion.position.z = THREE.MathUtils.lerp(-1.8, ufoPos.z, fp);
            ansMinion.rotation.x += dt * 14;

            if (fp >= 1) {
                ansMinion.visible = false;
                additionState.phase = 'celebrate';
                additionState.ufoHitTimer = 1.8;
                gameState.isBusy = true;
                playStageClearFanfare();
                emitStarParticles(ufoPos.clone());
                awardStarProgress();

                const a = additionState.caughtA;
                const b = additionState.caughtB;
                const sum = additionState.targetSum;
                setPromptUI(
                    `💥 轟隆！正中目標！【 ${a} ${additionState.opChar || '+'} ${b} = ${sum} 】${sum} 號皇冠小兵成功擊退飛碟！`,
                    `準備進入下一題加法合體挑戰... 🎉`
                );
                const nextTimer = setTimeout(() => {
                    if (!isToyModalOpen()) startNewRound();
                }, 2200);
                activeCountingTimeouts.push(nextTimer);
            }
        }

        camera.position.x = THREE.MathUtils.lerp(camera.position.x, additionState.heroX * 0.22, dt * 4);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 9.2, dt * 4);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, 12.4, dt * 4);
        camera.lookAt(additionState.heroX * 0.15, 1.3, -1.2);
    }

    // 4E. Animate 【🌉 馬利奧形狀修橋大作戰】
    if (typeof shapeBridgeGroup !== 'undefined' && shapeBridgeGroup.visible && shapeBridgeState.heroMesh) {
        const tierBarEl = document.getElementById('maze-tier-bar');
        if (tierBarEl) {
            tierBarEl.style.display = (!gameState.inLobby && gameState.mode === 'shapebridge') ? 'flex' : tierBarEl.style.display;
        }

        // 1. 橋面缺口提示箭咀上下彈跳
        shapeBridgeState.slots.forEach(s => {
            if (!s.filled && s.arrowMesh && s.arrowMesh.visible) {
                s.arrowMesh.position.y = 1.45 + Math.sin(elapsed * 6) * 0.22;
            }
        });

        // 2. 南岸散步立體形狀小兵自由行路
        interactiveBlocks.forEach(b => {
            if (b.isArenaMinion && b.group.visible && shapeBridgeState.phase === 'repair') {
                b.baseX += (b.vx || 1.3) * dt;
                b.baseZ += (b.vz || 1.1) * dt;
                if (b.baseX < -5.5 || b.baseX > 5.5) b.vx = -(b.vx || 1.3);
                if (b.baseZ < 1.3 || b.baseZ > 4.9) b.vz = -(b.vz || 1.1);
                b.baseX = Math.max(-5.6, Math.min(5.6, b.baseX));
                b.baseZ = Math.max(1.3, Math.min(4.9, b.baseZ));
                b.group.position.x = b.baseX;
                b.group.position.z = b.baseZ;
                b.group.position.y = 0.95 + Math.abs(Math.sin(elapsed * 7 + b.animTime)) * 0.22;
                b.group.rotation.y = Math.atan2(b.vx, b.vz) * 0.25;
            }
        });

        // 3. 控制馬利奧奔跑（捉小兵 & 帶小兵去橋邊缺口）
        let vx = 0, vz = 0;
        const speed = 6.8;
        if (shapeBridgeState.phase === 'repair' && !gameState.isBusy) {
            if (shapeBridgeState.moveDirX !== 0 || shapeBridgeState.moveDirZ !== 0) {
                vx = shapeBridgeState.moveDirX * speed;
                vz = shapeBridgeState.moveDirZ * speed;
            } else if (shapeBridgeState.targetX !== null && shapeBridgeState.targetZ !== null) {
                const dx = shapeBridgeState.targetX - shapeBridgeState.heroX;
                const dz = shapeBridgeState.targetZ - shapeBridgeState.heroZ;
                const dist = Math.hypot(dx, dz);
                if (dist > 0.15) {
                    vx = (dx / dist) * speed;
                    vz = (dz / dist) * speed;
                } else {
                    shapeBridgeState.targetX = null;
                    shapeBridgeState.targetZ = null;
                }
            }
        } else if (shapeBridgeState.phase === 'crossing') {
            // 大橋修好後，馬利奧自動沿住修好嘅大橋衝過河直達北岸形狀大城堡！
            const targetX = 0;
            const targetZ = -5.2;
            const dx = targetX - shapeBridgeState.heroX;
            const dz = targetZ - shapeBridgeState.heroZ;
            const dist = Math.hypot(dx, dz);
            if (dist > 0.2) {
                vx = (dx / dist) * 7.2;
                vz = (dz / dist) * 7.2;
            } else {
                shapeBridgeState.phase = 'celebrate';
                playStageClearFanfare();
                awardStarProgress();
                setPromptUI(
                    `👑 大橋修築完成！馬利奧成功過河抵達奇幻形狀大城堡喇！`,
                    `一齊欣賞城堡上空嘅勝利煙花啦！🎉`
                );
                [[-2.5, 3.8, -6.8], [2.5, 3.8, -6.8], [0, 4.4, -7.2], [-3.2, 3.2, -5.8], [3.2, 3.2, -5.8]].forEach(([fx, fy, fz], idx) => {
                    const fw = setTimeout(() => {
                        playCoinSound();
                        emitStarParticles(new THREE.Vector3(fx, fy, fz));
                    }, idx * 300);
                    activeCountingTimeouts.push(fw);
                });
                const nextT = setTimeout(() => {
                    if (!isToyModalOpen()) startNewRound();
                }, 2600);
                activeCountingTimeouts.push(nextT);
            }
        }

        const isWalking = Math.hypot(vx, vz) > 0.05;
        if (isWalking) {
            const minZ = (shapeBridgeState.phase === 'crossing') ? -5.5 : 0.35;
            shapeBridgeState.heroX = Math.max(-6.2, Math.min(6.2, shapeBridgeState.heroX + vx * dt));
            shapeBridgeState.heroZ = Math.max(minZ, Math.min(5.8, shapeBridgeState.heroZ + vz * dt));
            shapeBridgeState.walkCycle += dt * 16;
            shapeBridgeState.facingAngle = Math.atan2(vx, vz);
        }

        const hop = isWalking ? Math.abs(Math.sin(shapeBridgeState.walkCycle)) * 0.18 : Math.sin(elapsed * 3) * 0.03;
        shapeBridgeState.heroMesh.position.set(shapeBridgeState.heroX, 0.36 + hop, shapeBridgeState.heroZ);
        shapeBridgeState.heroMesh.rotation.y = THREE.MathUtils.lerp(shapeBridgeState.heroMesh.rotation.y, shapeBridgeState.facingAngle, dt * 12);

        // 跟住馬利奧行緊嘅形狀小兵動畫 + 腳下黃金指南針指向目標缺口
        if (shapeBridgeState.carryingMinion) {
            const cm = shapeBridgeState.carryingMinion;
            cm.group.position.x = THREE.MathUtils.lerp(cm.group.position.x, shapeBridgeState.heroX, dt * 12);
            cm.group.position.z = THREE.MathUtils.lerp(cm.group.position.z, shapeBridgeState.heroZ + 0.95, dt * 12);
            cm.group.position.y = 1.05 + Math.abs(Math.sin(elapsed * 10)) * 0.25;
            cm.group.rotation.y = shapeBridgeState.heroMesh.rotation.y;
        }

        if (shapeBridgeState.compassRing) {
            shapeBridgeState.compassRing.position.set(shapeBridgeState.heroX, 0.38, shapeBridgeState.heroZ);
            let aimX = 0, aimZ = -1.5;
            if (shapeBridgeState.carryingMinion) {
                const matchSlot = shapeBridgeState.slots.find(s => !s.filled && s.shapeId === shapeBridgeState.carryingMinion.itemKey);
                if (matchSlot) { aimX = matchSlot.x; aimZ = matchSlot.z; }
            } else {
                const nextSlot = shapeBridgeState.slots.find(s => !s.filled);
                if (nextSlot) {
                    const matchMinion = interactiveBlocks.find(b => b.isArenaMinion && b.group.visible && b.itemKey === nextSlot.shapeId);
                    if (matchMinion) { aimX = matchMinion.group.position.x; aimZ = matchMinion.group.position.z; }
                }
            }
            shapeBridgeState.compassRing.rotation.y = Math.atan2(aimX - shapeBridgeState.heroX, aimZ - shapeBridgeState.heroZ);
        }

        // 4. 判定：捉散步小兵 OR 行去河邊缺口塞小兵！
        if (shapeBridgeState.phase === 'repair' && !gameState.isBusy) {
            if (!shapeBridgeState.carryingMinion) {
                for (let i = 0; i < interactiveBlocks.length; i++) {
                    const m = interactiveBlocks[i];
                    if (m.isArenaMinion && m.group.visible && m.state !== 'wrong') {
                        if (Math.hypot(shapeBridgeState.heroX - m.group.position.x, shapeBridgeState.heroZ - m.group.position.z) < 1.25) {
                            handleShapeBridgeMinionCaught(m);
                            break;
                        }
                    }
                }
            } else if (shapeBridgeState.heroZ < 0.85) {
                // 馬利奧帶住小兵行到河邊，檢查最接近邊個未填嘅橋面缺口
                for (let i = 0; i < shapeBridgeState.slots.length; i++) {
                    const slot = shapeBridgeState.slots[i];
                    if (!slot.filled && Math.abs(shapeBridgeState.heroX - slot.x) < 1.45) {
                        triggerPlugMinionIntoBridgeSlot(slot);
                        break;
                    }
                }
            }
        }

        // 5. 小兵凌空 360 度翻筋斗「咚—啪！」塞入橋面缺口動畫
        if (shapeBridgeState.phase === 'jumping' && shapeBridgeState.jumpingAnim) {
            const ja = shapeBridgeState.jumpingAnim;
            ja.progress = Math.min(1, ja.progress + dt * 2.2);
            const p = ja.progress;
            ja.minion.group.position.lerpVectors(ja.startPos, ja.endPos, p);
            ja.minion.group.position.y += Math.sin(p * Math.PI) * 2.4;
            ja.minion.group.rotation.x = p * Math.PI * 2;

            if (p >= 1) {
                ja.slot.filled = true;
                ja.slot.cavityGroup.visible = false;
                ja.slot.repairedGroup.visible = true;
                // 小兵企喺修好嘅橋板旁邊揮手歡呼！
                ja.minion.group.rotation.set(0, 0, 0);
                ja.minion.group.scale.setScalar(0.52);
                ja.minion.group.position.set(ja.slot.x - 0.78, 0.95, ja.slot.z);

                playChestOpenSound();
                emitStarParticles(ja.endPos);
                updateShapeBridgeBanner();

                const nextUnfilled = shapeBridgeState.slots.find(s => !s.filled);
                if (nextUnfilled) {
                    shapeBridgeState.phase = 'repair';
                    shapeBridgeState.jumpingAnim = null;
                    gameState.targetKey = nextUnfilled.shapeId;
                    updateTargetBadgeUI(nextUnfilled.shapeId, false);
                    const nextMeta = getCognitiveItemMeta(nextUnfilled.shapeId, 'shape');
                    setPromptUI(
                        `✨ 咚—啪！成功修好一格橋板！仲有缺口未修好，快啲去捉下一隻形狀小兵啦！`,
                        `請喺草地搵出對應缺口形狀嘅立體小兵（如 ${nextMeta.badgeSymbol} ${nextMeta.title}）！`
                    );
                } else {
                    // 所有橋面缺口全部塞滿晒！全橋打通，馬利奧跑過大橋去城堡！
                    shapeBridgeState.phase = 'crossing';
                    shapeBridgeState.jumpingAnim = null;
                    gameState.isBusy = true;
                    interactiveBlocks.forEach(b => {
                        if (b.isArenaMinion) b.group.visible = false;
                    });
                    playSuccessChime();
                }
            }
        }

        // 鏡頭平滑跟隨（過橋時自動推進去北岸形狀大城堡！）
        const camX = shapeBridgeState.heroX * 0.25;
        const camY = (shapeBridgeState.phase === 'crossing' || shapeBridgeState.phase === 'celebrate') ? 8.2 : 9.8;
        const camZ = (shapeBridgeState.phase === 'crossing' || shapeBridgeState.phase === 'celebrate') ? 5.8 : 11.8;
        const lookZ = (shapeBridgeState.phase === 'crossing' || shapeBridgeState.phase === 'celebrate') ? -4.5 : -1.0;
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, camX, dt * 4);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, camY, dt * 4);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, camZ, dt * 4);
        camera.lookAt(shapeBridgeState.heroX * 0.18, 0.8, lookZ);
    }
    // 4B. Animate Mario 3D Hero Character Movement, Jump & Flagpole Victory
    if (marioStageGroup.visible && marioHero.group) {
        const dx = marioHero.targetX - marioHero.currentX;
        if (Math.abs(dx) > 0.03) {
            const moveSpeed = marioHero.runningToFlag ? 6.5 : 8.5;
            marioHero.currentX += Math.sign(dx) * Math.min(Math.abs(dx), dt * moveSpeed);
            marioHero.walkCycle += dt * 16;
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

        if (marioHero.isJumping) {
            marioHero.currentY += marioHero.jumpVel * dt;
            marioHero.jumpVel -= 22.0 * dt;

            if (!marioHero.hitTriggered && marioHero.currentY >= 1.52) {
                marioHero.hitTriggered = true;
                marioHero.jumpVel = -2.5;
                if (marioHero.pendingBrick) {
                    handleBlockTapped(marioHero.pendingBrick);
                }
            }

            if (marioHero.currentY <= marioHero.baseY) {
                marioHero.currentY = marioHero.baseY;
                marioHero.isJumping = false;
                marioHero.jumpVel = 0;
            }
        } else {
            const isMoving = Math.abs(dx) > 0.04;
            marioHero.currentY = marioHero.baseY + (isMoving ? Math.abs(Math.sin(marioHero.walkCycle)) * 0.14 : Math.sin(elapsed * 3) * 0.03);
        }

        marioHero.group.position.x = marioHero.currentX;
        marioHero.group.position.y = marioHero.currentY;

        if (marioHero.selectionRing && interactiveBlocks[gameState.marioSelectedIdx]) {
            const ringTargetX = interactiveBlocks[gameState.marioSelectedIdx].baseX;
            marioHero.selectionRing.position.x = THREE.MathUtils.lerp(marioHero.selectionRing.position.x, ringTargetX, dt * 12);
            marioHero.selectionRing.rotation.z += dt * 1.8;
        }

        if (marioHero.runningToFlag && marioHero.flagMesh) {
            marioHero.flagSlideY = Math.max(0.85, marioHero.flagSlideY - dt * 2.4);
            marioHero.flagMesh.position.y = marioHero.flagSlideY;
        }
    }

    spawnedCountingItems.forEach(item => {
        item.currentScale = THREE.MathUtils.lerp(item.currentScale, item.targetScale, dt * 10);
        item.bouncePhase += dt * 4;
        item.group.scale.setScalar(item.currentScale);
        item.group.position.y = (item.baseY || 0.55) + Math.abs(Math.sin(item.bouncePhase)) * 0.15;
        item.group.rotation.y += dt * 2.2;

        const proj = item.group.position.clone();
        proj.y += 0.72;
        proj.project(camera);
        const sx = (proj.x * 0.5 + 0.5) * window.innerWidth;
        const sy = (-proj.y * 0.5 + 0.5) * window.innerHeight;
        item.labelEl.style.left = `${sx}px`;
        item.labelEl.style.top = `${sy}px`;
    });

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

window.onload = function () {
    initThreeScene();
    renderStarsBar();
    switchMode('gacha');
    openLobby('subject');
    animate();
};
