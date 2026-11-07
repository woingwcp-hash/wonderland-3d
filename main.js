/********************************************************************
 * [FILE: main.js - PART 1 OF 2 (上半部)]
 * 包含：大廳導航、清爽左下角HUD、迷宮救兵(Mode 5)、形狀修橋大作戰(Mode 7 新版)
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

if (typeof window.shapeBridgeGroup === 'undefined') {
    window.shapeBridgeGroup = new THREE.Group();
}
if (typeof window.shapeBridgeState === 'undefined') {
    window.shapeBridgeState = {
        built: false, tier: 'turtle', slots: [], pedestals: [], bridgeCoins: [],
        carryingMinion: null, jumpingAnim: null, flyingMonsters: [],
        phase: 'repair', heroX: 0, heroZ: 3.8, targetX: null, targetZ: null,
        autoPickMinion: null, autoPlugSlot: null, moveDirX: 0, moveDirZ: 0,
        walkCycle: 0, facingAngle: Math.PI, isPointerDragging: false,
        heroMesh: null, hammerMesh: null, rainbowTrackMesh: null,
        compassRing: null, clickMarker: null, slotsContainer: null
    };
}

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
            <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 text-white flex items-center justify-center text-4xl sm:text-5xl shadow-md group-hover:scale-110 transition-transform flex-shrink-0">🛸</div>
            <div class="flex-1">
                <div class="flex flex-wrap items-center justify-between gap-1">
                    <span class="text-lg sm:text-2xl font-black text-slate-800">小兵合體大作戰</span>
                    <span class="text-xs font-black bg-gradient-to-r from-purple-600 to-pink-500 text-white px-2.5 py-1 rounded-full shadow-sm">➕➖ 加減算式大砲</span>
                </div>
                <p class="text-xs sm:text-sm font-bold text-slate-600 mt-1">三台並列清晰算式（A ± B = C）！控制馬利奧捉柱方形數字小兵開炮射飛碟！</p>
            </div>`;
        treasureCard.parentNode.appendChild(addCard);
    }

    if (!document.getElementById('lobby-card-shapebridge')) {
        const bridgeCard = document.createElement('button');
        bridgeCard.id = 'lobby-card-shapebridge';
        bridgeCard.onclick = () => startGameFromLobby('shapebridge');
        bridgeCard.className = 'btn-toy group sm:col-span-2 bg-gradient-to-r from-cyan-100 via-sky-50 to-teal-100 hover:from-cyan-200 hover:to-teal-200 p-5 rounded-3xl border-4 border-teal-400 items-center gap-4 text-left shadow-lg hidden';
        bridgeCard.innerHTML = `
            <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-sky-600 text-white flex items-center justify-center text-4xl sm:text-5xl shadow-md group-hover:scale-110 transition-transform flex-shrink-0">🌉</div>
            <div class="flex-1">
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="text-lg sm:text-2xl font-black text-slate-800">馬利奧形狀修橋大作戰（黃金大槌＋狂食金幣）</span>
                    <span class="text-xs font-black bg-gradient-to-r from-teal-500 to-sky-600 text-white px-3 py-1 rounded-full shadow-sm">🔺 形狀樂園王牌新玩法</span>
                </div>
                <p class="text-xs sm:text-sm font-bold text-slate-600 mt-1">一篤即捉蘑菇台形狀小兵，揮動黃金大槌「咚咚」打樁彈飛水怪，再喺彩虹大橋左右狂食金幣！</p>
            </div>`;
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
    const sbBtn = document.getElementById('shape-slam-btn');
    if (sbBtn) sbBtn.classList.add('hidden');

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
                card.classList.toggle('hidden', gameState.subject !== 'number');
                card.classList.toggle('flex', gameState.subject === 'number');
            }
        });

        const shapeBridgeCard = document.getElementById('lobby-card-shapebridge');
        if (shapeBridgeCard) {
            shapeBridgeCard.classList.toggle('hidden', gameState.subject !== 'shape');
            shapeBridgeCard.classList.toggle('flex', gameState.subject === 'shape');
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
    if (gameState.subject === 'color') return COLOR_CURRICULUM.map(c => c.id);
    if (gameState.subject === 'shape') return SHAPE_CURRICULUM.map(s => s.id);
    const rangeStr = gameState.settings.range;
    if (rangeStr === '1-5') return [1, 2, 3, 4, 5];
    if (rangeStr === '6-10') return [6, 7, 8, 9, 10];
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
}

function switchSubject(newSubject) {
    playPopSound(560);
    gameState.subject = newSubject;
    gameState.isBusy = false;
    if (newSubject !== 'number' && (gameState.mode === 'treasure' || gameState.mode === 'addition')) gameState.mode = 'gacha';
    if (newSubject !== 'shape' && gameState.mode === 'shapebridge') gameState.mode = 'gacha';
    updateTopStatusBadge();
    updateRightButtonForMode();
    startNewRound();
}

function updateRightButtonForMode() {
    const rightLabel = document.getElementById('right-btn-label');
    const rightIcon = document.getElementById('right-btn-icon');
    if (gameState.mode === 'explore') {
        rightLabel.textContent = (gameState.subject === 'number') ? (gameState.explorePage === '1-5' ? '切換 6-10' : '切換 1-5') : '重新排列';
        rightIcon.className = (gameState.subject === 'number') ? 'fa-solid fa-repeat' : 'fa-solid fa-rotate';
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

    if (marioControls && marioBadge) {
        marioControls.classList.toggle('hidden', newMode !== 'mario');
        marioControls.classList.toggle('flex', newMode === 'mario');
        marioBadge.classList.toggle('hidden', newMode !== 'mario');
        marioBadge.classList.toggle('flex', newMode === 'mario');
    }

    ensureMazeCompactHUD();
    if (treasureDpad) {
        treasureDpad.classList.toggle('hidden', !isCustomStage);
        treasureDpad.classList.toggle('flex', isCustomStage);
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
    const sbBtn = document.getElementById('shape-slam-btn');
    if (sbBtn) sbBtn.classList.add('hidden');

    if (gameState.mode === 'explore') { setupExploreMode(); return; }
    if (gameState.mode === 'addition') { setupAdditionRound(); scheduleAutoVisualPrompt(); return; }
    if (gameState.mode === 'shapebridge') { setupShapeBridgeRound(); scheduleAutoVisualPrompt(); return; }

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
        setPromptUI(`請搵出「${meta.title}」扭蛋尋寶！`, `輕觸畫面中的立體「${meta.title}」公仔`);
    } else if (gameState.mode === 'train') {
        updateTrainSignTexture(target);
        trainAnimState.currentX = -12;
        trainAnimState.targetX = 0;
        playTrainWhistle();
        setPromptUI(`小火車載住「${meta.title}」，請搵出一樣嘅積木公仔！`, `請輕觸與火車牌相同的立體「${meta.title}」`);
    }

    if (!gameState.inLobby) scheduleAutoVisualPrompt();
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

    setPromptUI(`🍄 關卡 1-${gameState.marioStage}：請頂開「${meta.title}」嘅金磚塊！`, `直接點擊空中磚塊，或用下方按鈕移動並跳起頂磚塊`);
}

// ==================== Mode 5: 【1-2-3-4-5 迷宮救兵大巡遊 & 清爽零遮擋 HUD】 ====================
const MAZE_COUNTING_TIERS = [
    { id: 'forward',  label: '🌱 1.基礎順數' },
    { id: 'count_on', label: '🧩 2.中途接數' },
    { id: 'missing',  label: '🕵️ 3.失蹤填空' },
    { id: 'backward', label: '🚀 4.火箭倒數' },
    { id: 'skip',     label: '⚡ 5.單雙跳數' }
];

function ensureMazeCompactHUD() {
    // 1. 綁定手指按住拖曳跟隨 (Touch-Drag Follow)，令小朋友喺 iPad 拖住手指就識順滑行路！
    if (renderer && renderer.domElement && !renderer.domElement.dataset.dragBound) {
        renderer.domElement.dataset.dragBound = 'true';
        renderer.domElement.addEventListener('pointermove', onCanvasPointerMove, false);
        window.addEventListener('pointerup', onCanvasPointerUp, false);
    }

    // 2. 將十字方向盤固定喺「右下角」最底
    const dpad = document.getElementById('treasure-dpad-bar');
    if (dpad && !dpad.dataset.compactMoved) {
        dpad.dataset.compactMoved = 'true';
        document.body.appendChild(dpad);
        dpad.className = 'fixed right-2.5 sm:right-5 bottom-2.5 sm:bottom-4 z-30 pointer-events-auto items-center justify-center gap-1 sm:gap-1.5 bg-slate-900/75 backdrop-blur-md p-1.5 sm:p-2.5 rounded-3xl border-2 border-amber-400 shadow-xl hidden';
        const infoBox = dpad.querySelector('div.border-r');
        if (infoBox) infoBox.className = 'hidden';
    }

    // 3. 將中間下面嘅白色大任務框縮細移去「左下角」，設為 pointer-events-none 觸控穿透！
    const targetBadge = document.getElementById('target-number-card');
    const promptCard = targetBadge ? targetBadge.parentElement : null;
    if (promptCard && !promptCard.dataset.movedToCorner) {
        promptCard.dataset.movedToCorner = 'true';
        document.body.appendChild(promptCard);
        promptCard.className = 'fixed left-2.5 sm:left-4 bottom-2.5 sm:bottom-4 z-20 pointer-events-none bg-white/85 backdrop-blur-md px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-2xl border-2 border-sky-300 shadow-lg flex items-center gap-2 max-w-[270px] sm:max-w-[360px] transition-all';
        targetBadge.className = 'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center font-black shadow-sm flex-shrink-0 border-2 border-amber-400';
        const badgeNum = document.getElementById('target-badge-num');
        if (badgeNum) badgeNum.className = 'text-lg sm:text-xl font-black leading-none';
        const mainPrompt = document.getElementById('prompt-text');
        if (mainPrompt) mainPrompt.className = 'text-xs sm:text-sm font-black text-slate-800 leading-snug text-left line-clamp-2';
        const subPrompt = document.getElementById('sub-prompt-text');
        if (subPrompt) subPrompt.className = 'hidden';
        const rightBtnLabel = document.getElementById('right-btn-label');
        const rightBtn = rightBtnLabel ? rightBtnLabel.closest('button') : null;
        if (rightBtn) {
            rightBtn.className = 'pointer-events-auto btn-toy-sm bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-2.5 py-1.5 rounded-xl border-2 border-amber-500 shadow text-xs whitespace-nowrap flex items-center gap-1 flex-shrink-0';
        }
    }

    // 4. 進度條移去左下角任務框正上方
    const banner = document.getElementById('counting-banner');
    if (banner && !banner.dataset.movedToCorner) {
        banner.dataset.movedToCorner = 'true';
        document.body.appendChild(banner);
        banner.className = 'fixed left-2.5 sm:left-4 bottom-16 sm:bottom-20 z-20 pointer-events-none bg-white/85 backdrop-blur-md px-2.5 py-1 rounded-2xl border-2 border-amber-300 shadow-md flex items-center gap-1.5 max-w-[270px] sm:max-w-[360px] overflow-x-auto hidden';
    }

    let tierBar = document.getElementById('maze-tier-bar');
    if (!tierBar) {
        tierBar = document.createElement('div');
        tierBar.id = 'maze-tier-bar';
        tierBar.className = 'fixed top-14 sm:top-16 inset-x-0 z-30 flex flex-wrap items-center justify-center gap-1.5 px-2 pointer-events-none';
        document.body.appendChild(tierBar);
    }
    if (gameState.mode === 'addition') renderAdditionTierBarUI();
    else if (gameState.mode === 'shapebridge') renderShapeBridgeTierBarUI();
    else renderMazeTierBarUI();
}

function renderMazeTierBarUI() {
    const tierBar = document.getElementById('maze-tier-bar');
    if (!tierBar) return;
    const curTier = treasureHero.countingTier || 'forward';
    const isBlind = Boolean(treasureHero.blindMode);

    let html = `<div class="pointer-events-auto flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border-2 border-sky-300 shadow-lg">`;
    MAZE_COUNTING_TIERS.forEach(t => {
        const active = (curTier === t.id);
        const btnCls = active ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-sm scale-105' : 'bg-slate-100 hover:bg-sky-50 text-slate-600 border-slate-200';
        html += `<button onclick="selectMazeCountingTier('${t.id}')" class="btn-toy-sm px-2.5 py-1 rounded-xl font-black text-xs sm:text-sm border ${btnCls}">${t.label}</button>`;
    });

    const blindCls = isBlind ? 'bg-purple-600 text-white border-purple-400' : 'bg-emerald-500 text-white border-emerald-300';
    html += `<button onclick="toggleMazeBlindMode()" class="btn-toy-sm px-2.5 py-1 rounded-xl font-black text-xs sm:text-sm border ml-1 ${blindCls}">${isBlind ? '❓ 挑戰：自己諗' : '👁️ 提示：開'}</button></div>`;
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
    let goalCol = 4, goalRow = 0;

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

    let seq = [1, 2, 3, 4, 5], preRescuedNums = [], distractors = [];
    if (tier === 'forward') {
        seq = useHighRange ? [6, 7, 8, 9, 10] : [1, 2, 3, 4, 5];
    } else if (tier === 'count_on') {
        const startN = [2, 3, 4, 5, 6][Math.floor(Math.random() * 5)];
        seq = [startN, startN + 1, startN + 2, startN + 3, startN + 4];
    } else if (tier === 'missing') {
        seq = useHighRange ? [6, 7, 8, 9, 10] : [1, 2, 3, 4, 5];
        preRescuedNums = [seq[0], seq[2], seq[4]];
        distractors = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(n => !seq.includes(n)).sort(() => Math.random() - 0.5).slice(0, 3);
    } else if (tier === 'backward') {
        seq = useHighRange ? [10, 9, 8, 7, 6] : [5, 4, 3, 2, 1];
    } else if (tier === 'skip') {
        seq = (lvlIdx % 2 === 0) ? [2, 4, 6, 8, 10] : [1, 3, 5, 7, 9];
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
        interactiveBlocks.push(create3DMazeNumberFriend(num, spot.col, spot.row));
    });

    const firstTarget = seq.find(n => !treasureHero.rescuedSet.has(n));
    gameState.targetKey = firstTarget;
    gameState.targetNumber = firstTarget;

    if (treasureHero.group) {
        treasureHero.group.position.set(startPos.x, 0.3, startPos.z);
        treasureHero.group.rotation.y = Math.PI;
    }
    if (treasureHero.compassRing) treasureHero.compassRing.position.set(startPos.x, 0.34, startPos.z);
    if (treasureHero.clickMarker) treasureHero.clickMarker.visible = false;

    renderMazeTierBarUI();
    updateParadeProgressBanner();
    refreshMazeGuideDots();
    syncMazeTargetCardDisplay();

    const firstMeta = getCognitiveItemMeta(firstTarget);
    const shownTitle = (treasureHero.blindMode && !treasureHero.hintRevealedThisStep) ? '神秘數字（？）' : firstMeta.title;

    if (tier === 'missing') {
        setPromptUI(`🕵️ 失蹤填空：隊伍有 ${preRescuedNums.join('、')}，請搵出失蹤數字插隊！`, ``);
    } else if (tier === 'backward') {
        setPromptUI(`🚀 火箭倒數挑戰（${seq[0]}➔${seq[4]}）：請先救「${shownTitle}」！`, ``);
    } else if (tier === 'skip') {
        const oddEvenLabel = (seq[0] % 2 === 0) ? '雙數小隊' : '單數小隊';
        setPromptUI(`⚡ ${oddEvenLabel}：請先去救「${shownTitle}」！`, ``);
    } else if (tier === 'count_on') {
        setPromptUI(`🧩 中途接數（由 ${seq[0]} 起數）：請先救「${shownTitle}」！`, ``);
    } else {
        setPromptUI(`${lvl.name}：請先去救「${shownTitle}」組隊巡遊！`, ``);
    }
}

function setTreasureMoveDir(dx, dz) {
    if (gameState.mode === 'shapebridge') {
        if (shapeBridgeState.phase !== 'repair' && shapeBridgeState.phase !== 'crossing') {
            shapeBridgeState.moveDirX = 0; shapeBridgeState.moveDirZ = 0; return;
        }
        shapeBridgeState.moveDirX = dx; shapeBridgeState.moveDirZ = dz;
        if (dx !== 0 || dz !== 0) {
            shapeBridgeState.targetX = null; shapeBridgeState.targetZ = null;
            shapeBridgeState.autoPickMinion = null; shapeBridgeState.autoPlugSlot = null;
            if (shapeBridgeState.clickMarker) shapeBridgeState.clickMarker.visible = false;
        }
        return;
    }
    if (gameState.mode === 'addition') {
        if (gameState.isBusy || additionState.phase !== 'catch') { additionState.moveDirX = 0; additionState.moveDirZ = 0; return; }
        additionState.moveDirX = dx; additionState.moveDirZ = dz;
        if (dx !== 0 || dz !== 0) { additionState.targetX = null; additionState.targetZ = null; if (additionState.clickMarker) additionState.clickMarker.visible = false; }
        return;
    }
    if (gameState.mode !== 'treasure' || gameState.isBusy) { treasureHero.moveDirX = 0; treasureHero.moveDirZ = 0; return; }
    treasureHero.moveDirX = dx; treasureHero.moveDirZ = dz;
    if (dx !== 0 || dz !== 0) { treasureHero.pathQueue = []; if (treasureHero.clickMarker) treasureHero.clickMarker.visible = false; }
}

function nudgeTreasureHero(dx, dz) {
    if (gameState.mode === 'shapebridge') {
        if (shapeBridgeState.phase === 'crossing') {
            shapeBridgeState.targetX = Math.max(-2.6, Math.min(2.6, shapeBridgeState.heroX + dx * 2.2));
            return;
        }
        if (gameState.isBusy || shapeBridgeState.phase !== 'repair') return;
        playPopSound(440);
        shapeBridgeState.targetX = Math.max(-6.2, Math.min(6.2, shapeBridgeState.heroX + dx * 1.6));
        shapeBridgeState.targetZ = Math.max(0.4, Math.min(5.6, shapeBridgeState.heroZ + dz * 1.6));
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
    if (isMazeCellWalkable(cur.col + dx, cur.row + dz)) {
        treasureHero.pathQueue = [mazeGridToWorld(cur.col + dx, cur.row + dz)];
    }
}

// ==================== Mode 7: 【🌉 馬利奧形狀修橋大作戰 (蘑菇台 + 黃金大魔槌 + 過橋狂食金幣)】 ====================
const SHAPE_BRIDGE_TIERS = [
    { id: 'turtle',   label: '🐢 1.烏龜浮橋 (基礎配對)' },
    { id: 'shadow',   label: '🕵️ 2.神秘黑影橋 (純輪廓)' },
    { id: 'windmill', label: '🔄 3.大風車旋轉橋 (轉向)' },
    { id: 'split',    label: '🧩 4.雙拼合體橋 (2合1拼圖)' }
];

const SPLIT_BRIDGE_RECIPES = [
    { target: 'square',    part: 'triangle', title: '2隻「▲三角形」拼成「■正方形」' },
    { target: 'rectangle', part: 'square',   title: '2隻「■正方形」拼成「▬長方形」' },
    { target: 'star',      part: 'triangle', title: '2隻「▲三角形」拼成「★五角星」' },
    { target: 'heart',     part: 'circle',   title: '2隻「●圓形」拼成「♥心形」' }
];

function ensureShapeSlamButton() {
    let btn = document.getElementById('shape-slam-btn');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'shape-slam-btn';
        btn.onclick = () => autoSlamCarriedShapeMinion();
        btn.className = 'fixed right-2.5 sm:right-5 bottom-32 sm:bottom-36 z-40 pointer-events-auto btn-toy bg-gradient-to-r from-teal-500 via-emerald-500 to-amber-400 hover:from-teal-400 hover:to-amber-300 text-white font-black px-4 py-2.5 sm:px-5 sm:py-3 rounded-3xl border-4 border-white shadow-2xl flex items-center gap-2 text-base sm:text-xl animate-bounce hidden';
        btn.innerHTML = `<span>🔨</span><span id="shape-slam-btn-text">大槌打樁修橋！</span><span>✨</span>`;
        document.body.appendChild(btn);
    }
    return btn;
}

function autoSlamCarriedShapeMinion() {
    if (gameState.mode !== 'shapebridge' || shapeBridgeState.phase !== 'repair' || !shapeBridgeState.carryingMinion) return;
    const carriedKey = shapeBridgeState.carryingMinion.itemKey;
    const matchSlot = shapeBridgeState.slots.find(s => !s.filled && s.requiredShapeId === carriedKey);
    if (matchSlot) triggerPlugMinionIntoBridgeSlot(matchSlot);
}

function renderShapeBridgeTierBarUI() {
    const tierBar = document.getElementById('maze-tier-bar');
    if (!tierBar) return;
    const cur = shapeBridgeState.tier || 'turtle';
    let html = `<div class="pointer-events-auto flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border-2 border-teal-400 shadow-lg">`;
    SHAPE_BRIDGE_TIERS.forEach(t => {
        const active = (cur === t.id);
        const cls = active ? 'bg-gradient-to-r from-teal-500 to-sky-600 text-white border-teal-600 shadow-sm scale-105' : 'bg-slate-100 hover:bg-teal-50 text-slate-600 border-slate-200';
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
    if (dotsContainer.previousElementSibling) dotsContainer.previousElementSibling.style.display = 'none';
    emojiEl.textContent = '🌉';
    emojiEl.className = 'text-xl sm:text-2xl';
    dotsContainer.innerHTML = '';

    shapeBridgeState.slots.forEach(slot => {
        const meta = getCognitiveItemMeta(slot.shapeId, 'shape');
        const pill = document.createElement('span');
        const isCarriedMatch = shapeBridgeState.carryingMinion && shapeBridgeState.carryingMinion.itemKey === slot.requiredShapeId && !slot.filled;
        if (slot.filled) {
            pill.className = 'inline-flex items-center gap-1 bg-emerald-500 text-white px-2 py-0.5 rounded-xl text-xs sm:text-sm font-black shadow-sm star-earned';
            pill.textContent = `✓${meta.badgeSymbol}${meta.title}`;
        } else if (isCarriedMatch) {
            pill.className = 'inline-flex items-center gap-1 bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-xl text-xs sm:text-base font-black border-2 border-orange-500 animate-bounce shadow';
            pill.textContent = `🔨篤橋窿打樁！`;
        } else {
            pill.className = 'inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-xl text-xs font-bold border border-slate-300';
            const progressTxt = slot.neededCount > 1 ? `(${slot.currentCount}/2)` : '';
            pill.textContent = (shapeBridgeState.tier === 'shadow') ? `❓黑影窿` : `${meta.badgeSymbol}${meta.title}${progressTxt}`;
        }
        dotsContainer.appendChild(pill);
    });
}

function setupShapeBridgeRound() {
    gameState.subject = 'shape';
    if (typeof ensure3DShapeBridgeBuilt === 'function') ensure3DShapeBridgeBuilt();
    ensureMazeCompactHUD();
    ensureShapeSlamButton().classList.add('hidden');
    renderShapeBridgeTierBarUI();

    if (shapeBridgeState.slotsContainer) shapeBridgeState.slotsContainer.clear();
    if (shapeBridgeState.rainbowTrackMesh) shapeBridgeState.rainbowTrackMesh.visible = false;
    if (shapeBridgeState.hammerMesh) shapeBridgeState.hammerMesh.visible = false;

    shapeBridgeState.slots = [];
    shapeBridgeState.pedestals = [];
    shapeBridgeState.bridgeCoins = [];
    shapeBridgeState.flyingMonsters = [];
    shapeBridgeState.carryingMinion = null;
    shapeBridgeState.jumpingAnim = null;
    shapeBridgeState.autoPickMinion = null;
    shapeBridgeState.autoPlugSlot = null;
    shapeBridgeState.phase = 'repair';

    const tier = shapeBridgeState.tier || 'turtle';
    const allShapes = SHAPE_CURRICULUM.map(s => s.id).sort(() => Math.random() - 0.5);

    let pedestalShapes = [];
    if (tier === 'split') {
        // 🧩 雙拼合體橋：2 個大橋窿，每個橋窿需要 2 隻細形狀小兵拼合！
        const pickedRecipes = [...SPLIT_BRIDGE_RECIPES].sort(() => Math.random() - 0.5).slice(0, 2);
        const xPos = [-2.5, 2.5];
        pickedRecipes.forEach((rec, idx) => {
            shapeBridgeState.slots.push(createBridgeSlotObject(idx, xPos[idx], rec.target, tier, rec.part));
            pedestalShapes.push(rec.part, rec.part);
        });
    } else {
        // 3 個烏龜浮橋缺口 (-3.3, 0, +3.3)
        const chosenShapes = allShapes.slice(0, 3);
        const xPos = [-3.3, 0, 3.3];
        chosenShapes.forEach((shId, idx) => {
            shapeBridgeState.slots.push(createBridgeSlotObject(idx, xPos[idx], shId, tier, null));
        });
        const distractor = allShapes[3];
        pedestalShapes = [...chosenShapes, distractor].sort(() => Math.random() - 0.5);
    }

    // 在南岸草地建立 4 座【🍄 彩色彈彈蘑菇台】，小兵企定定喺蘑菇台上面彈跳揮手，100% 唔會亂撞！
    const pedCoords = [
        { x: -4.5, z: 3.4, color: 0xFB7185 },
        { x: -1.5, z: 4.1, color: 0x38BDF8 },
        { x: 1.5,  z: 4.1, color: 0xA855F7 },
        { x: 4.5,  z: 3.4, color: 0xF59E0B }
    ];
    pedestalShapes.forEach((shId, idx) => {
        const pt = pedCoords[idx % pedCoords.length];
        createMushroomPedestal(pt.x, pt.z, pt.color);
        const minion = create3DNumberCharacter(shId, pt.x, pt.z, 0.74);
        minion.isArenaMinion = true;
        minion.isShapeBridgeMinion = true;
        minion.homeX = pt.x;
        minion.homeZ = pt.z;
        if (minion.haloMesh) {
            minion.haloMesh.rotation.x = Math.PI / 2;
            minion.haloMesh.position.set(0, -0.95, 0);
        }
        interactiveBlocks.push(minion);
    });

    const firstSlot = shapeBridgeState.slots[0];
    gameState.targetKey = firstSlot.requiredShapeId;
    updateTargetBadgeUI(firstSlot.requiredShapeId, false);
    updateShapeBridgeBanner();

    shapeBridgeState.heroX = 0;
    shapeBridgeState.heroZ = 2.1;
    shapeBridgeState.targetX = null;
    shapeBridgeState.targetZ = null;
    shapeBridgeState.moveDirX = 0;
    shapeBridgeState.moveDirZ = 0;
    shapeBridgeState.facingAngle = 0;
    if (shapeBridgeState.heroMesh) {
        shapeBridgeState.heroMesh.position.set(0, 0.36, 2.1);
        shapeBridgeState.heroMesh.rotation.y = 0;
    }
    if (shapeBridgeState.compassRing) shapeBridgeState.compassRing.position.set(0, 0.38, 2.1);

    if (tier === 'split') {
        setPromptUI(`🧩 雙拼合體橋：篤蘑菇台上嘅細形狀小兵，2隻拼埋修好大缺口！`, ``);
    } else if (tier === 'shadow') {
        setPromptUI(`🕵️ 神秘黑影橋：觀察橋窿有幾多隻角？直接篤蘑菇台上嘅小兵去修橋！`, ``);
    } else if (tier === 'windmill') {
        setPromptUI(`🔄 大風車旋轉橋：橋窿識得轉彎㗎！快啲揀啱形狀小兵用黃金大槌打樁！`, ``);
    } else {
        setPromptUI(`🐢 烏龜浮橋：直接篤蘑菇台上嘅形狀小兵，再用黃金大槌打樁彈飛水怪！`, ``);
    }
}

// 當馬利奧去到蘑菇台揀中形狀小兵時（支援隨時換兵，零挫敗感！）
function handleShapeBridgeMinionCaught(minion) {
    if (gameState.isBusy || shapeBridgeState.phase !== 'repair' || !minion.isArenaMinion) return;

    // 如果頭頂已經舉住另一隻小兵，自動放返落原本嘅蘑菇台，換呢隻新小兵上頭頂！
    if (shapeBridgeState.carryingMinion && shapeBridgeState.carryingMinion !== minion) {
        const prev = shapeBridgeState.carryingMinion;
        prev.isArenaMinion = true;
        prev.group.position.set(prev.homeX, 1.15, prev.homeZ);
        prev.group.scale.setScalar(0.74);
    }

    const shId = minion.itemKey;
    const meta = getCognitiveItemMeta(shId, 'shape');
    const matchingSlot = shapeBridgeState.slots.find(s => !s.filled && s.requiredShapeId === shId);

    if (!matchingSlot) {
        playGentleNudge();
        minion.state = 'wrong';
        minion.wrongTimer = 0.6;
        shapeBridgeState.autoPickMinion = null;
        setPromptUI(`「${meta.title}」已經修好或者橋上無呢個窿喎！請篤另一隻形狀小兵啦！`, ``);
        return;
    }

    playCoinSound();
    minion.isArenaMinion = false;
    minion.state = 'idle';
    if (minion.haloMesh) minion.haloMesh.material.opacity = 0;
    minion.group.scale.setScalar(0.62);
    shapeBridgeState.carryingMinion = minion;
    shapeBridgeState.autoPickMinion = null;
    gameState.targetKey = shId;
    updateTargetBadgeUI(shId, false);
    updateShapeBridgeBanner();

    shapeBridgeState.slots.forEach(s => {
        if (s.arrowMesh) s.arrowMesh.visible = (!s.filled && s.requiredShapeId === shId);
    });

    const slamBtn = ensureShapeSlamButton();
    const slamTxt = document.getElementById('shape-slam-btn-text');
    if (slamTxt) slamTxt.textContent = `大槌打樁「${meta.title}」！`;
    slamBtn.classList.remove('hidden');

    setPromptUI(`🙌 舉起「${meta.badgeSymbol}${meta.title}」喇！請直接篤發光橋窿（或撳右下角🔨大槌掣）打樁！`, ``);
}

// 觸發小兵飛入橋窿 + 馬利奧揮動「🔨 黃金大魔槌」打樁彈飛水怪動畫！
function triggerPlugMinionIntoBridgeSlot(slot) {
    const carried = shapeBridgeState.carryingMinion;
    if (!carried || slot.filled || shapeBridgeState.phase !== 'repair') return;

    const carriedMeta = getCognitiveItemMeta(carried.itemKey, 'shape');
    if (carried.itemKey !== slot.requiredShapeId) {
        playGentleNudge();
        slot.group.position.y = 0.55;
        setTimeout(() => { slot.group.position.y = 0.36; }, 220);
        shapeBridgeState.autoPlugSlot = null;
        setPromptUI(`哎呀！「${carriedMeta.title}」唔啱呢個橋窿喎！請篤隔離發緊光嘅橋窿！`, ``);
        return;
    }

    ensureShapeSlamButton().classList.add('hidden');
    playMarioJumpSound();
    shapeBridgeState.phase = 'jumping';
    shapeBridgeState.carryingMinion = null;
    shapeBridgeState.autoPlugSlot = null;
    shapeBridgeState.moveDirX = 0;
    shapeBridgeState.moveDirZ = 0;
    shapeBridgeState.targetX = null;
    shapeBridgeState.targetZ = null;
    shapeBridgeState.slots.forEach(s => { if (s.arrowMesh) s.arrowMesh.visible = false; });

    shapeBridgeState.jumpingAnim = {
        minion: carried,
        slot: slot,
        progress: 0,
        hammerPhase: 0,
        slamCount: 0,
        startPos: carried.group.position.clone(),
        endPos: new THREE.Vector3(slot.x, 0.85, slot.z)
    };
}
// ==================== 上半部完，請回覆「下半部」繼續貼埋下半部 ====================
/********************************************************************
 * [FILE: main.js - PART 2 OF 2 (下半部)]
 * 包含：加減法競技場(Mode 6)、一篤即飛與拖曳操控、黃金大魔槌打樁動畫、三線過橋狂食金幣與 60FPS 主迴圈
 ********************************************************************/
if (typeof window.additionArenaGroup === 'undefined') {
    window.additionArenaGroup = new THREE.Group();
}
if (typeof window.additionState === 'undefined') {
    window.additionState = {
        built: false, opMode: 'add', currentOp: 'add', opChar: '+', tier: 'sum5',
        numA: 2, numB: 3, targetSum: 5, caughtA: null, caughtB: null, caughtSum: null,
        phase: 'catch', fuseTimer: 0, fireProgress: 0, ufoHitTimer: 0,
        heroX: 0, heroZ: 3.8, targetX: null, targetZ: null, moveDirX: 0, moveDirZ: 0,
        walkCycle: 0, facingAngle: Math.PI, heroMesh: null, compassRing: null, clickMarker: null
    };
}

const ADDITION_OPS = [
    { id: 'add', label: '➕ 加法' },
    { id: 'sub', label: '➖ 減法' },
    { id: 'mix', label: '🔄 加減混合' }
];

const ADDITION_TIERS = [
    { id: 'sum5',    label: '🌱 1.五以內' },
    { id: 'sum10',   label: '🧩 2.十以內' },
    { id: 'sum12',   label: '🚀 3.十二以內' },
    { id: 'missing', label: '🕵️ 4.補數 (A±?=C)' },
    { id: 'free2',   label: '🔥 5.自由湊數 (?±?=C)' }
];

if (typeof createQuestionSlotMinion !== 'function') {
    window.createQuestionSlotMinion = function (x, z, borderColorHex = '#F59E0B') {
        const group = new THREE.Group();
        group.position.set(x, 1.35, z);
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFBEB';
        roundRectCanvas(ctx, 10, 10, 236, 236, 40); ctx.fill();
        ctx.lineWidth = 14; ctx.setLineDash([22, 14]); ctx.strokeStyle = borderColorHex;
        roundRectCanvas(ctx, 18, 18, 220, 220, 32); ctx.stroke();
        ctx.fillStyle = borderColorHex;
        ctx.font = '900 150px "Fredoka", "Noto Sans TC", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
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

window.spawnAdditionEnergyDots = function (countA, countB, isSub = false) {
    if (!additionState.energyDotsGroup) return;
    additionState.energyDotsGroup.clear();

    const makeDots = (count, centerX, colorHex, fadedCount = 0) => {
        if (!count || count <= 0) return;
        const perRow = Math.min(count, 6);
        const spacing = 0.36;
        for (let i = 0; i < count; i++) {
            const row = Math.floor(i / 6), col = i % 6;
            const rowCount = (row > 0) ? Math.min(6, count - row * 6) : perRow;
            const startX = centerX - ((rowCount - 1) * spacing) / 2;
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
        </div>`;
}

function renderAdditionTierBarUI() {
    const tierBar = document.getElementById('maze-tier-bar');
    if (!tierBar) return;
    const curOp = additionState.opMode || 'add';
    const curTier = additionState.tier || 'sum5';

    let html = `<div class="pointer-events-auto flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border-2 border-purple-400 shadow-lg">`;
    ADDITION_OPS.forEach(op => {
        const active = (curOp === op.id);
        const cls = active ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm scale-105' : 'bg-slate-100 hover:bg-amber-50 text-slate-600 border-slate-200';
        html += `<button onclick="selectAdditionOpMode('${op.id}')" class="btn-toy-sm px-2.5 py-1 rounded-xl font-black text-xs sm:text-sm border ${cls}">${op.label}</button>`;
    });
    html += `<span class="text-slate-300 font-black px-0.5">|</span>`;
    ADDITION_TIERS.forEach(t => {
        const active = (curTier === t.id);
        const cls = active ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white border-purple-600 shadow-sm scale-105' : 'bg-slate-100 hover:bg-purple-50 text-slate-600 border-slate-200';
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
        btn.className = 'fixed right-2.5 sm:right-5 bottom-32 sm:bottom-36 z-40 pointer-events-auto btn-toy bg-gradient-to-r from-red-500 via-orange-500 to-amber-400 hover:from-red-400 hover:to-amber-300 text-white font-black px-4 py-2.5 sm:px-5 sm:py-3 rounded-3xl border-4 border-white shadow-2xl flex items-center gap-2 text-base sm:text-xl animate-bounce hidden';
        btn.innerHTML = `<span>🔥</span><span>點火發射！</span><span>🚀</span>`;
        document.body.appendChild(btn);
    }
    return btn;
}

function refreshAdditionStagePods() {
    ['leftPodMinion', 'midPodMinion', 'rightPodMinion', 'slotA', 'slotB', 'slotC'].forEach(k => {
        if (additionState[k]) {
            if (additionState[k].group) numberBlocksGroup.remove(additionState[k].group);
            else numberBlocksGroup.remove(additionState[k]);
            additionState[k] = null;
        }
    });

    const isSub = (additionState.currentOp === 'sub');
    if (additionState.plusSignMesh && additionState.plusSignMesh.children.length > 1) {
        additionState.plusSignMesh.children[1].visible = !isSub;
    }

    if (additionState.caughtA !== null) {
        const mA = create3DNumberCharacter(additionState.caughtA, -3.7, -1.8, 0.72);
        mA.isPodMinion = true;
        if (additionState.caughtA >= 10) mA.group.scale.set(0.82, 0.72, 0.72);
        additionState.leftPodMinion = mA;
    } else {
        additionState.slotA = createQuestionSlotMinion(-3.7, -1.8, '#F43F5E');
    }

    if (additionState.caughtB !== null) {
        const mB = create3DNumberCharacter(additionState.caughtB, 0.0, -1.8, 0.72);
        mB.isPodMinion = true;
        additionState.midPodMinion = mB;
    } else {
        additionState.slotB = createQuestionSlotMinion(0.0, -1.8, '#0EA5E9');
    }

    if (additionState.caughtSum !== null) {
        const mC = create3DNumberCharacter(additionState.caughtSum, 3.7, -1.8, 0.86);
        mC.isPodMinion = true;
        if (additionState.caughtSum >= 10) mC.group.scale.set(0.95, 0.86, 0.86);
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

    cardEl.style.background = isSub ? 'linear-gradient(to bottom, #0284C7, #0369A1)' : 'linear-gradient(to bottom, #A855F7, #7E22CE)';
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
    let a = 2, b = 3, sum = 5;

    if (!isSub) {
        if (tier === 'sum5') { sum = 2 + Math.floor(Math.random() * 4); a = 1 + Math.floor(Math.random() * (sum - 1)); b = sum - a; }
        else if (tier === 'sum10') { sum = 6 + Math.floor(Math.random() * 5); a = 1 + Math.floor(Math.random() * (sum - 1)); b = sum - a; }
        else if (tier === 'sum12') {
            const pairs = [[6, 6], [5, 6], [6, 5], [7, 5], [5, 7], [6, 7], [7, 7], [8, 4], [8, 6], [9, 3]];
            const pick = pairs[Math.floor(Math.random() * pairs.length)];
            a = pick[0]; b = pick[1]; sum = a + b;
        } else if (tier === 'missing') { sum = 4 + Math.floor(Math.random() * 7); a = 1 + Math.floor(Math.random() * (sum - 1)); b = sum - a; }
        else if (tier === 'free2') { sum = 4 + Math.floor(Math.random() * 7); a = null; b = null; }
    } else {
        if (tier === 'sum5') { a = 2 + Math.floor(Math.random() * 4); b = 1 + Math.floor(Math.random() * (a - 1)); sum = a - b; }
        else if (tier === 'sum10') { a = 6 + Math.floor(Math.random() * 5); b = 1 + Math.floor(Math.random() * (a - 1)); sum = a - b; }
        else if (tier === 'sum12') {
            const subPairs = [[12, 6], [12, 5], [12, 4], [11, 5], [11, 6], [13, 6], [14, 7], [15, 7], [16, 8]];
            const pick = subPairs[Math.floor(Math.random() * subPairs.length)];
            a = pick[0]; b = pick[1]; sum = a - b;
        } else if (tier === 'missing') { a = 4 + Math.floor(Math.random() * 7); b = 1 + Math.floor(Math.random() * (a - 1)); sum = a - b; }
        else if (tier === 'free2') { sum = 1 + Math.floor(Math.random() * 6); a = null; b = null; }
    }

    additionState.numA = a; additionState.numB = b; additionState.targetSum = sum;

    if (tier === 'sum5' || tier === 'sum10' || tier === 'sum12') {
        additionState.caughtA = a; additionState.caughtB = b; additionState.caughtSum = null; gameState.targetKey = sum;
    } else if (tier === 'missing') {
        additionState.caughtA = a; additionState.caughtB = null; additionState.caughtSum = sum; gameState.targetKey = b;
    } else if (tier === 'free2') {
        additionState.caughtA = null; additionState.caughtB = null; additionState.caughtSum = sum; gameState.targetKey = sum;
    }

    additionState.phase = 'catch'; additionState.fuseTimer = 0; additionState.fireProgress = 0; additionState.ufoHitTimer = 0;
    additionState.heroX = 0; additionState.heroZ = 4.2; additionState.targetX = null; additionState.targetZ = null;
    additionState.moveDirX = 0; additionState.moveDirZ = 0; additionState.facingAngle = Math.PI;
    if (additionState.heroMesh) { additionState.heroMesh.position.set(0, 0.36, 4.2); additionState.heroMesh.rotation.y = Math.PI; }
    if (additionState.compassRing) additionState.compassRing.position.set(0, 0.38, 4.2);

    refreshAdditionStagePods();
    syncAdditionBottomCard();

    let roamList = [];
    const opChar = additionState.opChar;

    if (tier === 'sum5' || tier === 'sum10' || tier === 'sum12') {
        const candidates = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].filter(n => n !== sum && Math.abs(n - sum) <= 4).sort(() => Math.random() - 0.5);
        roamList = [sum, candidates[0], candidates[1], candidates[2]].sort(() => Math.random() - 0.5);
        setPromptUI(isSub ? `➖ 減法【 ${a} - ${b} = ? 】：請捉答案小兵！` : `➕ 加法【 ${a} + ${b} = ? 】：請捉答案小兵！`, ``);
    } else if (tier === 'missing') {
        const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => n !== b).sort(() => Math.random() - 0.5);
        roamList = [b, pool[0], pool[1], pool[2]].sort(() => Math.random() - 0.5);
        setPromptUI(`🕵️ 補數【 ${a} ${opChar} ? = ${sum} 】：中間缺咗邊個？`, ``);
    } else if (tier === 'free2') {
        if (!isSub) {
            const p1 = Math.max(1, Math.floor(sum / 2)), p2 = sum - p1;
            roamList = [p1, p2, 1, sum - 1, Math.max(1, (sum + 2) % 9)].sort(() => Math.random() - 0.5);
            setPromptUI(`🔥 自由加法【 ? + ? = ${sum} 】：請捉 2 隻加埋等於 ${sum} 嘅小兵！`, ``);
        } else {
            const p1 = sum + 2, p3 = Math.min(10, sum + 4);
            roamList = [p1, 2, p3, p3 - sum, sum + 1].sort(() => Math.random() - 0.5);
            setPromptUI(`🔥 自由減法【 ? - ? = ${sum} 】：請捉 2 隻相減等於 ${sum} 嘅小兵！`, ``);
        }
    }

    const startCoords = [{ x: -4.2, z: 1.6 }, { x: 4.2, z: 1.6 }, { x: -2.4, z: 3.6 }, { x: 2.4, z: 3.6 }, { x: 0, z: 2.2 }];
    roamList.forEach((num, idx) => {
        const pt = startCoords[idx % startCoords.length];
        const minion = create3DNumberCharacter(num, pt.x, pt.z, 0.72);
        minion.isArenaMinion = true;
        if (num >= 10) minion.group.scale.set(0.82, 0.72, 0.72);
        const ang = (idx / roamList.length) * Math.PI * 2 + 0.5;
        minion.vx = Math.cos(ang) * 1.5; minion.vz = Math.sin(ang) * 1.2;
        interactiveBlocks.push(minion);
    });
}

function handleAdditionMinionCaught(minion) {
    if (gameState.isBusy || additionState.phase !== 'catch' || !minion.isArenaMinion) return;
    const num = minion.itemKey, tier = additionState.tier, sum = additionState.targetSum;
    const isSub = (additionState.currentOp === 'sub'), opChar = additionState.opChar || '+';

    if (tier === 'free2') {
        if (additionState.caughtA === null) {
            if ((!isSub && num >= sum) || (isSub && num <= sum)) {
                playGentleNudge(); minion.state = 'wrong'; minion.wrongTimer = 0.6;
                setPromptUI(isSub ? `減法左台第一個數要大過 ${sum} 先夠減㗎！` : `呢隻係 ${num} 號，已經大過或等於 ${sum} 喇！`, ``);
                return;
            }
            playCoinSound();
            additionState.caughtA = num; minion.isArenaMinion = false; minion.group.visible = false;
            refreshAdditionStagePods(); syncAdditionBottomCard();
            const needed = isSub ? (num - sum) : (sum - num);
            gameState.targetKey = needed;
            setPromptUI(`👍 左台企好「${num}」號喇！【 ${num} ${opChar} ? = ${sum} 】請捉「${needed}」號！`, ``);
            if (!interactiveBlocks.some(b => b.isArenaMinion && b.group.visible && b.itemKey === needed)) {
                const newM = create3DNumberCharacter(needed, 0, 2.2, 0.72);
                newM.isArenaMinion = true; newM.vx = 1.4; newM.vz = 1.1;
                interactiveBlocks.push(newM);
            }
            return;
        } else {
            const ok = isSub ? (additionState.caughtA - num === sum) : (additionState.caughtA + num === sum);
            if (ok) {
                playCoinSound(); additionState.caughtB = num; minion.isArenaMinion = false; minion.group.visible = false;
                refreshAdditionStagePods(); syncAdditionBottomCard(); startMinionFusionSequence();
            } else {
                const needed = isSub ? (additionState.caughtA - sum) : (sum - additionState.caughtA);
                playGentleNudge(); minion.state = 'wrong'; minion.wrongTimer = 0.6;
                additionState.targetX = null; additionState.targetZ = null;
                setPromptUI(`${additionState.caughtA} ${opChar} ${num} 唔等於 ${sum} 喎！請捉「${needed}」號！`, ``);
            }
            return;
        }
    }

    const expectedNum = (tier === 'missing') ? additionState.numB : sum;
    if (num === expectedNum) {
        playCoinSound(); minion.isArenaMinion = false; minion.group.visible = false;
        if (tier === 'missing') additionState.caughtB = num;
        else additionState.caughtSum = num;
        refreshAdditionStagePods(); syncAdditionBottomCard(); startMinionFusionSequence();
    } else {
        playGentleNudge(); minion.state = 'wrong'; minion.wrongTimer = 0.6;
        additionState.targetX = null; additionState.targetZ = null;
        setPromptUI(`呢隻係「數字 ${num}」小兵，未啱喎！再數一次！`, ``);
    }
}

function startMinionFusionSequence() {
    additionState.phase = 'fusing'; additionState.fuseTimer = 0;
    additionState.moveDirX = 0; additionState.moveDirZ = 0; additionState.targetX = null; additionState.targetZ = null;
    interactiveBlocks.forEach(b => { if (b.isArenaMinion) b.group.visible = false; });
    const a = additionState.caughtA, b = additionState.caughtB, sum = additionState.targetSum, opChar = additionState.opChar || '+';
    playChestOpenSound();
    emitStarParticles(new THREE.Vector3(3.7, 1.8, -1.8));
    setPromptUI(`🎉 算式完成！【 ${a} ${opChar} ${b} = ${sum} 】快啲撳右下角「🔥 點火發射」！`, ``);
}

function fireAdditionCannon() {
    if (gameState.mode !== 'addition' || additionState.phase !== 'readyToFire') return;
    additionState.phase = 'firing'; additionState.fireProgress = 0;
    ensureAdditionFireButton().classList.add('hidden');
    playMarioJumpSound();
    emitStarParticles(new THREE.Vector3(3.7, 1.8, -2.5));
}

function setupExploreMode() {
    updateTargetBadgeUI(null, true);
    const items = (gameState.subject === 'number') ? (gameState.explorePage === '1-5' ? [1, 2, 3, 4, 5] : [6, 7, 8, 9, 10]) : getPoolForCurrentSubject();
    const spacing = items.length > 5 ? 1.92 : 2.25;
    const startX = -((items.length - 1) * spacing) / 2;

    items.forEach((itemKey, idx) => {
        const xPos = startX + idx * spacing;
        const zPos = 0.55 + Math.abs(idx - (items.length - 1) / 2) * 0.28;
        interactiveBlocks.push(create3DNumberCharacter(itemKey, xPos, zPos, items.length > 5 ? 0.84 : 0.92));
    });

    const subjLabel = gameState.subject === 'number' ? `數字 ${gameState.explorePage}` : (gameState.subject === 'color' ? '6 種基礎顏色' : '6 種立體形狀');
    setPromptUI(`自由探索（${subjLabel}）：隨便撳下任何一個立體公仔啦！`, ``);
}

function marioMoveStep(dir) {
    if (gameState.mode !== 'mario' || gameState.isBusy || marioHero.isJumping || interactiveBlocks.length === 0) return;
    playPopSound(440);
    gameState.marioSelectedIdx = Math.max(0, Math.min(interactiveBlocks.length - 1, gameState.marioSelectedIdx + dir));
    marioHero.targetX = interactiveBlocks[gameState.marioSelectedIdx].baseX;
    marioHero.autoJumpOnArrive = false;
}

function marioJumpAction() {
    if (gameState.mode !== 'mario' || gameState.isBusy || marioHero.isJumping || interactiveBlocks.length === 0) return;
    const targetBrick = interactiveBlocks[gameState.marioSelectedIdx];
    if (!targetBrick) return;
    marioHero.targetX = targetBrick.baseX; marioHero.pendingBrick = targetBrick;
    if (Math.abs(marioHero.currentX - targetBrick.baseX) < 0.25) startHeroJump(targetBrick);
    else marioHero.autoJumpOnArrive = true;
}

function startHeroJump(brickWrapper) {
    if (marioHero.isJumping) return;
    playMarioJumpSound();
    marioHero.isJumping = true; marioHero.hitTriggered = false;
    marioHero.jumpVel = 9.2; marioHero.pendingBrick = brickWrapper; marioHero.autoJumpOnArrive = false;
}

function onWindowKeyDown(e) {
    if (gameState.mode === 'mario') {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') marioMoveStep(-1);
        else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') marioMoveStep(1);
        else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'Enter') { e.preventDefault(); marioJumpAction(); }
    } else if (gameState.mode === 'treasure' || gameState.mode === 'addition' || gameState.mode === 'shapebridge') {
        if (gameState.mode === 'addition' && additionState.phase === 'readyToFire' && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); fireAdditionCannon(); return; }
        if (gameState.mode === 'shapebridge' && shapeBridgeState.carryingMinion && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); autoSlamCarriedShapeMinion(); return; }
        const st = gameState.mode === 'addition' ? additionState : (gameState.mode === 'shapebridge' ? shapeBridgeState : treasureHero);
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') setTreasureMoveDir(-1, st.moveDirZ);
        else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') setTreasureMoveDir(1, st.moveDirZ);
        else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { e.preventDefault(); setTreasureMoveDir(st.moveDirX, -1); }
        else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { e.preventDefault(); setTreasureMoveDir(st.moveDirX, 1); }
    }
}

function onWindowKeyUp(e) {
    if (!['treasure', 'addition', 'shapebridge'].includes(gameState.mode)) return;
    const st = gameState.mode === 'addition' ? additionState : (gameState.mode === 'shapebridge' ? shapeBridgeState : treasureHero);
    if (['ArrowLeft', 'a', 'A', 'ArrowRight', 'd', 'D'].includes(e.key)) setTreasureMoveDir(0, st.moveDirZ);
    if (['ArrowUp', 'w', 'W', 'ArrowDown', 's', 'S'].includes(e.key)) setTreasureMoveDir(st.moveDirX, 0);
}

function scheduleAutoVisualPrompt() {
    clearTimeout(autoPromptTimer);
    if (!gameState.settings.autoPrompt || gameState.mode === 'explore') return;
    autoPromptTimer = setTimeout(() => triggerVisualHint(false), 6000);
}

function triggerVisualHint(manualClick = false) {
    if (gameState.mode === 'explore' || gameState.isBusy) return;
    if (gameState.mode === 'treasure') {
        treasureHero.hintRevealedThisStep = true;
        updateParadeProgressBanner(); refreshMazeGuideDots(); syncMazeTargetCardDisplay();
    }
    const rightBlock = interactiveBlocks.find(b => !b.rescued && !b.isPodMinion && b.group.visible && b.itemKey === gameState.targetKey);
    if (rightBlock) {
        rightBlock.state = 'hint';
        if (rightBlock.haloMesh) rightBlock.haloMesh.material.opacity = 0.88;
        if (manualClick) playPopSound(660);
    }
}

function setPromptUI(mainText, subText) {
    document.getElementById('prompt-text').textContent = mainText;
    const subEl = document.getElementById('sub-prompt-text');
    if (subEl) subEl.textContent = subText || '';
}

/********************************************************************
 * 8. ONE-TAP SMART ACTION & TOUCH-DRAG INTERACTION (RAYCASTER)
 ********************************************************************/
function onCanvasPointerMove(event) {
    if (!shapeBridgeState.isPointerDragging || gameState.inLobby) return;
    if (gameState.mode !== 'shapebridge' && gameState.mode !== 'addition') return;

    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.35);
    const hitPt = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(groundPlane, hitPt)) {
        if (gameState.mode === 'shapebridge') {
            if (shapeBridgeState.phase === 'crossing') {
                shapeBridgeState.targetX = THREE.MathUtils.clamp(hitPt.x, -2.8, 2.8);
            } else if (shapeBridgeState.phase === 'repair' && !gameState.isBusy) {
                shapeBridgeState.targetX = THREE.MathUtils.clamp(hitPt.x, -6.2, 6.2);
                shapeBridgeState.targetZ = THREE.MathUtils.clamp(hitPt.z, 0.4, 5.5);
            }
        } else if (gameState.mode === 'addition' && additionState.phase === 'catch' && !gameState.isBusy) {
            additionState.targetX = THREE.MathUtils.clamp(hitPt.x, -5.8, 5.8);
            additionState.targetZ = THREE.MathUtils.clamp(hitPt.z, 0.8, 5.6);
        }
    }
}

function onCanvasPointerUp() {
    shapeBridgeState.isPointerDragging = false;
}

function onCanvasPointerDown(event) {
    if (gameState.inLobby) return;
    // 過橋狂食金幣階段：允許玩家直接篤或拖曳畫面左右控制馬利奧食金幣！
    if (gameState.mode === 'shapebridge' && shapeBridgeState.phase === 'crossing') {
        shapeBridgeState.isPointerDragging = true;
        onCanvasPointerMove(event);
        return;
    }
    if (gameState.isBusy) return;
    ensureAudioCtx();

    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    // 🌉 形狀修橋「一篤即飛」：直接篤橋窿，即刻飛過去用黃金大槌打樁！
    if (gameState.mode === 'shapebridge' && shapeBridgeState.phase === 'repair') {
        const slotMeshes = shapeBridgeState.slots.filter(s => !s.filled && s.hitMesh).map(s => s.hitMesh);
        const slotHits = raycaster.intersectObjects(slotMeshes, false);
        if (slotHits.length > 0 && slotHits[0].object.userData.slotObj) {
            const targetSlot = slotHits[0].object.userData.slotObj;
            if (shapeBridgeState.carryingMinion) {
                playPopSound(600);
                triggerPlugMinionIntoBridgeSlot(targetSlot);
            } else {
                // 如果未舉起小兵就篤橋窿：自動幫小朋友搵蘑菇台上對應嘅小兵衝過去舉起！
                const matchM = interactiveBlocks.find(b => b.isArenaMinion && b.group.visible && b.itemKey === targetSlot.requiredShapeId);
                if (matchM) {
                    playPopSound(540);
                    shapeBridgeState.autoPickMinion = matchM;
                    shapeBridgeState.targetX = matchM.homeX;
                    shapeBridgeState.targetZ = matchM.homeZ;
                }
            }
            return;
        }
    }

    const meshes = [];
    interactiveBlocks.forEach(b => {
        if (b.extraHitMeshes) meshes.push(...b.extraHitMeshes);
        else if (b.bodyMesh) meshes.push(b.bodyMesh);
    });
    const intersects = raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
        const tappedWrapper = intersects[0].object.userData.parentWrapper;
        if (tappedWrapper) {
            if (gameState.mode === 'mario') {
                if (gameState.isBusy || marioHero.isJumping) return;
                const idx = interactiveBlocks.indexOf(tappedWrapper);
                if (idx !== -1) gameState.marioSelectedIdx = idx;
                marioHero.targetX = tappedWrapper.baseX; marioHero.pendingBrick = tappedWrapper;
                if (Math.abs(marioHero.currentX - tappedWrapper.baseX) < 0.25) startHeroJump(tappedWrapper);
                else { playPopSound(500); marioHero.autoJumpOnArrive = true; }
            } else if (gameState.mode === 'shapebridge') {
                // 🍄 篤蘑菇台上嘅形狀小兵：馬利奧即刻極速衝過去舉起佢！
                if (gameState.isBusy || shapeBridgeState.phase !== 'repair' || !tappedWrapper.isArenaMinion) return;
                playPopSound(560);
                shapeBridgeState.moveDirX = 0; shapeBridgeState.moveDirZ = 0;
                shapeBridgeState.autoPickMinion = tappedWrapper;
                shapeBridgeState.targetX = tappedWrapper.homeX;
                shapeBridgeState.targetZ = tappedWrapper.homeZ;
            } else if (gameState.mode === 'addition') {
                if (additionState.phase === 'readyToFire') { fireAdditionCannon(); return; }
                if (gameState.isBusy || additionState.phase !== 'catch' || !tappedWrapper.isArenaMinion) return;
                playPopSound(540);
                additionState.moveDirX = 0; additionState.moveDirZ = 0;
                additionState.targetX = tappedWrapper.group.position.x;
                additionState.targetZ = tappedWrapper.group.position.z;
            } else if (gameState.mode === 'treasure') {
                if (gameState.isBusy || tappedWrapper.rescued) return;
                playPopSound(540);
                treasureHero.moveDirX = 0; treasureHero.moveDirZ = 0;
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

    if ((gameState.mode === 'addition' || gameState.mode === 'shapebridge') && !gameState.isBusy) {
        if (gameState.mode === 'addition' && additionState.phase === 'readyToFire') { fireAdditionCannon(); return; }
        shapeBridgeState.isPointerDragging = true;
        const st = (gameState.mode === 'addition') ? additionState : shapeBridgeState;
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.35);
        const hitPt = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(groundPlane, hitPt)) {
            playPopSound(460);
            st.moveDirX = 0; st.moveDirZ = 0;
            st.targetX = THREE.MathUtils.clamp(hitPt.x, -5.8, 5.8);
            st.targetZ = THREE.MathUtils.clamp(hitPt.z, 0.4, 5.6);
            if (st.clickMarker) {
                st.clickMarker.position.set(st.targetX, 0.38, st.targetZ);
                st.clickMarker.visible = true;
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
            if (treasureHero.allRescued && hitPt.z < -5.2) targetCell = { col: 4, row: 0 };
            if (isMazeCellWalkable(targetCell.col, targetCell.row)) {
                playPopSound(460);
                treasureHero.moveDirX = 0; treasureHero.moveDirZ = 0;
                treasureHero.pathQueue = findMazePathBFS(heroCell.col, heroCell.row, targetCell.col, targetCell.row);
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
        block.state = 'celebrate'; block.celebrateTimer = 1.2;
        emitStarParticles(block.group.position);
        setPromptUI(`呢個係「${tappedMeta.title}」！一齊睇下 ${tappedMeta.itemEmoji} ${tappedMeta.itemName}！`, ``);
        runQuantityCountingSequence(tappedKey, false, false);
        return;
    }

    if (gameState.mode === 'treasure') {
        if (block.rescued) return;
        if (tappedKey === gameState.targetKey) {
            block.rescued = true; block.state = 'idle';
            if (block.haloMesh) block.haloMesh.material.opacity = 0;
            block.group.scale.setScalar(0.56); block.bodyMesh.rotation.x = 0;

            const seq = treasureHero.sequence || [1, 2, 3, 4, 5];
            if (!treasureHero.rescuedSet) treasureHero.rescuedSet = new Set();
            treasureHero.rescuedSet.add(tappedKey);

            treasureHero.paradeFollowers.push(block);
            treasureHero.paradeFollowers.sort((a, b) => seq.indexOf(a.itemKey) - seq.indexOf(b.itemKey));
            treasureHero.hintRevealedThisStep = false;

            const noteIdx = (treasureHero.countingTier === 'backward') ? (seq.length - seq.indexOf(tappedKey)) : (seq.indexOf(tappedKey) + 1);
            playCountingNote(Math.max(1, noteIdx)); playCoinSound();
            emitStarParticles(block.group.position);

            const nextTarget = seq.find(n => !treasureHero.rescuedSet.has(n));
            if (nextTarget !== undefined) {
                gameState.targetKey = nextTarget; gameState.targetNumber = nextTarget;
                updateParadeProgressBanner(); refreshMazeGuideDots(); syncMazeTargetCardDisplay();
                const nextMeta = getCognitiveItemMeta(nextTarget);
                const nextTitle = treasureHero.blindMode ? '下一個失蹤數字（？）' : nextMeta.title;
                setPromptUI(`🎉「${tappedMeta.title}」成功歸隊！接住請搵「${nextTitle}」！`, ``);
            } else {
                treasureHero.allRescued = true;
                interactiveBlocks.forEach(b => { if (!b.rescued) b.group.visible = false; });
                playChestOpenSound();
                updateParadeProgressBanner(); refreshMazeGuideDots(); updateTargetBadgeUI(tappedKey, false);
                setPromptUI(`🏰 全隊集結（${seq.join('➔')}）！快啲帶隊衝入北面城堡大門啦！`, ``);
                const heroCell = mazeWorldToGrid(treasureHero.currentX, treasureHero.currentZ);
                treasureHero.pathQueue = findMazePathBFS(heroCell.col, heroCell.row, 4, 0);
            }
        } else {
            playGentleNudge(); block.state = 'wrong'; block.wrongTimer = 0.6;
            treasureHero.pathQueue = []; treasureHero.moveDirX = 0; treasureHero.moveDirZ = 0;
            const targetMeta = getCognitiveItemMeta(gameState.targetKey);
            const hintName = (treasureHero.blindMode && !treasureHero.hintRevealedThisStep) ? '正確嘅下一個數字（可撳💡提示）' : `「${targetMeta.title}」`;
            setPromptUI(`呢個係「${tappedMeta.title}」，未輪到佢住喎！請先救${hintName}！`, ``);
        }
        return;
    }

    if (tappedKey === gameState.targetKey) {
        gameState.isBusy = true; block.state = 'celebrate';
        if (block.haloMesh) block.haloMesh.material.opacity = 0;
        emitStarParticles(block.group.position);

        const isMario = (gameState.mode === 'mario');
        if (isMario) { playCoinSound(); block.bumpOffset = 0.55; gameState.marioStage += 1; }
        else if (gameState.mode === 'gacha') { playSuccessChime(); gachaSpinTimer = 1.2; }
        else if (gameState.mode === 'train') { playSuccessChime(); playTrainWhistle(); }

        awardStarProgress();

        if (gameState.settings.countObjects) {
            setPromptUI(`答啱喇！係「${tappedMeta.title}」！一齊數下 3D 寶物！`, ``);
            runQuantityCountingSequence(tappedKey, true, isMario);
        } else {
            setPromptUI(`好叻呀！答啱喇，呢個係「${tappedMeta.title}」！`, ``);
            if (isMario) triggerMarioGoalRun();
            else setTimeout(() => { if (!isToyModalOpen()) startNewRound(); }, 2200);
        }
    } else {
        playGentleNudge(); block.state = 'wrong'; block.wrongTimer = 0.7;
        if (block.isMarioBrick) block.bumpOffset = 0.25;
        if (block.bodyMesh && Array.isArray(block.bodyMesh.material)) {
            block.bodyMesh.material.forEach(m => { m.transparent = true; m.opacity = 0.6; });
        }
        const targetMeta = getCognitiveItemMeta(gameState.targetKey);
        setPromptUI(`呢個係「${tappedMeta.title}」，我哋再搵下「${targetMeta.title}」啦！`, ``);
        setTimeout(() => triggerVisualHint(false), 900);
    }
}

function triggerMazeCastleVictory() {
    if (treasureHero.castleVictoryTriggered) return;
    treasureHero.castleVictoryTriggered = true; gameState.isBusy = true;
    treasureHero.moveDirX = 0; treasureHero.moveDirZ = 0; treasureHero.pathQueue = [];
    playStageClearFanfare(); awardStarProgress();

    const seqStr = (treasureHero.sequence || [1, 2, 3, 4, 5]).join(' ➔ ');
    setPromptUI(`👑 巡遊大成功！已帶齊 ${seqStr} 進入皇冠城堡！`, ``);

    [[-2.4, 3.5, -7.8], [2.4, 3.5, -7.8], [0, 4.2, -8.2], [-3.2, 3.0, -6.8], [3.2, 3.0, -6.8]].forEach(([fx, fy, fz], idx) => {
        activeCountingTimeouts.push(setTimeout(() => { playCoinSound(); emitStarParticles(new THREE.Vector3(fx, fy, fz)); }, idx * 320));
    });
    activeCountingTimeouts.push(setTimeout(() => {
        treasureHero.mazeLevelIdx = (treasureHero.mazeLevelIdx || 0) + 1;
        if (!isToyModalOpen()) startNewRound();
    }, 2700));
}

function triggerMarioGoalRun() {
    marioHero.runningToFlag = true; marioHero.targetX = 4.55;
    playStageClearFanfare(); emitStarParticles(new THREE.Vector3(5.1, 3.5, 0.8));
    setTimeout(() => { if (!isToyModalOpen()) startNewRound(); }, 2200);
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
        activeCountingTimeouts.push(setTimeout(() => {
            createSingleCounting3DItem(i, count, startX + (i - 1) * spacing, zPos, isCoin, itemKey);
            if (isCoin) playCoinSound(); else playCountingNote(i);
            const badge = document.createElement('span');
            badge.className = 'inline-flex items-center justify-center bg-orange-100 text-orange-600 px-2 py-0.5 rounded-xl text-xs sm:text-base font-black star-earned';
            badge.textContent = meta.subject === 'number' ? String(i) : `${meta.title}×${i}`;
            dotsContainer.appendChild(badge);
        }, 400 + (i - 1) * 460));
    }

    activeCountingTimeouts.push(setTimeout(() => {
        if (meta.subject === 'number') {
            setPromptUI(`好叻呀！總共有 ${count}（${NUMBER_WORDS_HK[count]}）${isCoin ? '粒金幣' : '個紅蘋果'}！`, ``);
        } else {
            setPromptUI(`好叻呀！呢個就係「${meta.title}」！（${meta.itemEmoji} ${meta.itemName}）`, ``);
        }
        if (autoAdvanceAfter) {
            if (gameState.mode === 'mario') triggerMarioGoalRun();
            else activeCountingTimeouts.push(setTimeout(() => {
                if (gameState.mode === 'train') trainAnimState.targetX = 14;
                setTimeout(() => { if (!isToyModalOpen()) startNewRound(); }, 650);
            }, 1100));
        } else {
            gameState.isBusy = false;
        }
    }, 400 + count * 460 + 600));
}

/********************************************************************
 * 9. REWARD STARS, TOY CABINET & SETTINGS
 ********************************************************************/
function awardStarProgress() {
    gameState.stars = Math.min(5, gameState.stars + 1);
    renderStarsBar();
    if (gameState.stars >= 5) {
        const nextToy = TOY_CATALOG.find(t => !gameState.unlockedToys.includes(t.num));
        const unlocked = nextToy || TOY_CATALOG[Math.floor(Math.random() * TOY_CATALOG.length)];
        if (!gameState.unlockedToys.includes(unlocked.num)) gameState.unlockedToys.push(unlocked.num);
        setTimeout(() => { gameState.stars = 0; renderStarsBar(); showNewToyRewardModal(unlocked); }, 1600);
    }
}

function renderStarsBar() {
    const container = document.getElementById('stars-bar');
    container.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('i');
        star.className = (i <= gameState.stars) ? 'fa-solid fa-star text-amber-400 drop-shadow star-earned' : 'fa-solid fa-star text-slate-200';
        container.appendChild(star);
    }
    document.getElementById('toy-count-badge').textContent = String(gameState.unlockedToys.length);
}

function showNewToyRewardModal(toyObj) {
    playStageClearFanfare();
    document.getElementById('new-reward-banner').classList.remove('hidden');
    document.getElementById('new-reward-name').textContent = `${toyObj.icon} ${toyObj.name}`;
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
            card.onclick = () => playCoinSound();
            card.innerHTML = `<span class="text-4xl sm:text-5xl mb-1">${toy.icon}</span><span class="text-xs sm:text-sm font-black text-slate-800">${toy.name}</span><span class="text-[11px] font-bold text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full">✨ 已收集</span>`;
        } else {
            card.className = 'bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl p-3 flex flex-col items-center justify-center gap-1 text-center opacity-70 cursor-default';
            card.innerHTML = `<span class="text-3xl sm:text-4xl text-slate-400 mb-1">🔒</span><span class="text-xs sm:text-sm font-bold text-slate-400">第 ${toy.num} 號玩具</span><span class="text-[11px] text-slate-400">集齊5星解鎖</span>`;
        }
        grid.appendChild(card);
    });
}

function isToyModalOpen() { return !document.getElementById('toy-modal').classList.contains('hidden'); }

function toggleToyModal(show) {
    playPopSound(500);
    if (show) {
        document.getElementById('new-reward-banner').classList.add('hidden');
        renderToyCabinetGrid();
        document.getElementById('toy-modal').classList.remove('hidden');
    } else {
        document.getElementById('toy-modal').classList.add('hidden');
        if (gameState.isBusy) startNewRound();
    }
}

function toggleSettingsModal(show) {
    playPopSound(480);
    const modal = document.getElementById('settings-modal');
    if (show) { syncSettingsUI(); modal.classList.remove('hidden'); }
    else modal.classList.add('hidden');
}

function updateSetting(key, value) {
    playPopSound(540);
    gameState.settings[key] = value;
    if (key === 'lowDistraction') {
        const isCustom = ['treasure', 'addition', 'shapebridge'].includes(gameState.mode);
        environmentGroup.visible = !value && !isCustom;
        scene.background = new THREE.Color(value ? '#F8FAFC' : '#CBEBFB');
        const floor = scene.getObjectByName('mainFloor');
        if (floor) floor.material.color.set(value ? '#E2E8F0' : '#9AE66E');
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

    cloudsList.forEach(c => { c.position.x = c.userData.baseX + Math.sin(elapsed * c.userData.speed) * 1.4; });
    if (gachaSpinTimer > 0 && gachaDialMesh) { gachaSpinTimer -= dt; gachaDialMesh.rotation.z += dt * 10; }

    if (trainGroup.visible) {
        const mover = trainGroup.getObjectByName('trainMover');
        if (mover) {
            const diff = trainAnimState.targetX - trainAnimState.currentX;
            trainAnimState.currentX += diff * Math.min(1, dt * 4.2);
            mover.position.x = trainAnimState.currentX;
            mover.position.y = 0.45 + Math.abs(Math.sin(elapsed * 8)) * (Math.abs(diff) > 0.1 ? 0.06 : 0.015);
            trainAnimState.wheels.forEach(w => { w.rotation.z -= diff * dt * 2.5; });
        }
    }

    interactiveBlocks.forEach(block => {
        block.animTime += dt;
        if ((block.isMazeFriend && block.rescued) || block.isShapeBridgeMinion) return;

        if (block.bumpOffset && block.bumpOffset > 0) block.bumpOffset = Math.max(0, block.bumpOffset - dt * 2.2);
        const bumpY = block.bumpOffset ? Math.sin(block.bumpOffset * Math.PI) * 0.55 : 0;

        if (block.state === 'idle') {
            block.group.position.y = block.baseY + Math.sin(block.animTime * 2.4) * 0.07 + bumpY;
            block.group.rotation.z = Math.sin(block.animTime * 1.5) * 0.025;
            block.group.rotation.y = THREE.MathUtils.lerp(block.group.rotation.y, 0, dt * 5);
            block.group.scale.setScalar(THREE.MathUtils.lerp(block.group.scale.x, block.baseScale, dt * 6));
        } else if (block.state === 'hint') {
            block.group.position.y = block.baseY + Math.abs(Math.sin(block.animTime * 6.5)) * 0.28 + bumpY;
            if (block.haloMesh) block.haloMesh.rotation.z += dt * 2.5;
            block.group.scale.setScalar(block.baseScale * (1.1 + Math.sin(block.animTime * 6.5) * 0.06));
        } else if (block.state === 'wrong') {
            block.wrongTimer -= dt;
            block.group.position.y = block.baseY + bumpY;
            block.group.rotation.z = Math.sin(block.animTime * 28) * 0.14;
            if (block.wrongTimer <= 0) { block.state = 'idle'; block.group.rotation.z = 0; }
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
                if (block.celebrateTimer <= 0) block.state = 'idle';
            }
        }
    });

    const tierBarEl = document.getElementById('maze-tier-bar');
    if (tierBarEl) {
        const showTier = !gameState.inLobby && ['treasure', 'addition', 'shapebridge'].includes(gameState.mode);
        tierBarEl.style.display = showTier ? 'flex' : 'none';
    }
    const eqHudEl = document.getElementById('addition-equation-hud');
    if (eqHudEl && (gameState.mode !== 'addition' || gameState.inLobby)) {
        eqHudEl.style.display = 'none';
    }

    // 4C. Animate 【1-2-3-4-5 迷宮救兵大巡遊】
    if (treasureIslandGroup.visible && treasureHero.group) {
        if (treasureHero.castleGate) {
            const gate = treasureHero.castleGate;
            const targetAngle = treasureHero.allRescued ? 1.75 : 0;
            gate.leftPivot.rotation.y = THREE.MathUtils.lerp(gate.leftPivot.rotation.y, -targetAngle, dt * 5);
            gate.rightPivot.rotation.y = THREE.MathUtils.lerp(gate.rightPivot.rotation.y, targetAngle, dt * 5);
            if (gate.lockMesh) gate.lockMesh.visible = !treasureHero.allRescued;
        }

        let vx = 0, vz = 0;
        const walkSpeed = 6.2;
        if (treasureHero.moveDirX !== 0 || treasureHero.moveDirZ !== 0) {
            vx = treasureHero.moveDirX * walkSpeed; vz = treasureHero.moveDirZ * walkSpeed;
        } else if (treasureHero.pathQueue && treasureHero.pathQueue.length > 0) {
            const nextPt = treasureHero.pathQueue[0];
            const dx = nextPt.x - treasureHero.currentX, dz = nextPt.z - treasureHero.currentZ;
            const dist = Math.hypot(dx, dz);
            if (dist > 0.12) { vx = (dx / dist) * walkSpeed; vz = (dz / dist) * walkSpeed; }
            else {
                treasureHero.currentX = nextPt.x; treasureHero.currentZ = nextPt.z;
                treasureHero.pathQueue.shift();
                if (treasureHero.pathQueue.length === 0 && treasureHero.clickMarker) treasureHero.clickMarker.visible = false;
            }
        }

        const isWalking = Math.hypot(vx, vz) > 0.05;
        if (isWalking && !gameState.isBusy) {
            const heroRadius = 0.42;
            const canStandAt = (wx, wz) => [
                [wx - heroRadius, wz - heroRadius], [wx + heroRadius, wz - heroRadius],
                [wx - heroRadius, wz + heroRadius], [wx + heroRadius, wz + heroRadius]
            ].every(([cx, cz]) => { const cell = mazeWorldToGrid(cx, cz); return isMazeCellWalkable(cell.col, cell.row); });

            const nextX = treasureHero.currentX + vx * dt, nextZ = treasureHero.currentZ + vz * dt;
            const curCell = mazeWorldToGrid(treasureHero.currentX, treasureHero.currentZ);
            const cellCenter = mazeGridToWorld(curCell.col, curCell.row);

            if (canStandAt(nextX, treasureHero.currentZ)) {
                treasureHero.currentX = nextX;
                if (Math.abs(vz) < 0.1) treasureHero.currentZ = THREE.MathUtils.lerp(treasureHero.currentZ, cellCenter.z, dt * 8);
            } else if (Math.abs(vx) > 0.1) treasureHero.currentZ = THREE.MathUtils.lerp(treasureHero.currentZ, cellCenter.z, dt * 12);

            if (canStandAt(treasureHero.currentX, nextZ)) {
                treasureHero.currentZ = nextZ;
                if (Math.abs(vx) < 0.1) treasureHero.currentX = THREE.MathUtils.lerp(treasureHero.currentX, cellCenter.x, dt * 8);
            } else if (Math.abs(vz) > 0.1) treasureHero.currentX = THREE.MathUtils.lerp(treasureHero.currentX, cellCenter.x, dt * 12);

            treasureHero.walkCycle += dt * 16;
            treasureHero.facingAngle = Math.atan2(vx, vz);

            const lastTrail = treasureHero.trail[0];
            if (!lastTrail || Math.hypot(treasureHero.currentX - lastTrail.x, treasureHero.currentZ - lastTrail.z) > 0.11) {
                treasureHero.trail.unshift({ x: treasureHero.currentX, z: treasureHero.currentZ, angle: treasureHero.facingAngle });
                if (treasureHero.trail.length > 90) treasureHero.trail.pop();
                refreshMazeGuideDots();
            }
        }

        const walkBounce = isWalking ? Math.abs(Math.sin(treasureHero.walkCycle)) * 0.16 : Math.sin(elapsed * 3) * 0.03;
        treasureHero.group.position.set(treasureHero.currentX, 0.3 + walkBounce, treasureHero.currentZ);
        treasureHero.group.rotation.y = THREE.MathUtils.lerp(treasureHero.group.rotation.y, treasureHero.facingAngle, dt * 12);

        if (treasureHero.paradeFollowers && treasureHero.paradeFollowers.length > 0) {
            treasureHero.paradeFollowers.forEach((follower, idx) => {
                const trailIdx = Math.min(treasureHero.trail.length - 1, (idx + 1) * 10);
                const targetPt = treasureHero.trail[trailIdx] || { x: treasureHero.currentX, z: treasureHero.currentZ + (idx + 1) * 1.1, angle: 0 };
                follower.group.position.x = THREE.MathUtils.lerp(follower.group.position.x, targetPt.x, dt * 10);
                follower.group.position.z = THREE.MathUtils.lerp(follower.group.position.z, targetPt.z, dt * 10);
                follower.group.position.y = 0.72 + (isWalking ? Math.abs(Math.sin(treasureHero.walkCycle - idx * 1.1)) * 0.22 : Math.sin(elapsed * 4 + idx) * 0.05);
                follower.group.rotation.y = THREE.MathUtils.lerp(follower.group.rotation.y, targetPt.angle, dt * 8);
            });
        }

        const camTargetX = treasureHero.currentX * 0.32;
        const camTargetY = treasureHero.castleVictoryTriggered ? 9.2 : 14.8;
        const camTargetZ = treasureHero.castleVictoryTriggered ? -1.2 : (treasureHero.currentZ * 0.35 + 9.4);
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, camTargetX, dt * 4.5);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, camTargetY, dt * 4.5);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, camTargetZ, dt * 4.5);
        camera.lookAt(treasureHero.currentX * 0.28, treasureHero.castleVictoryTriggered ? 1.8 : 0.2, treasureHero.castleVictoryTriggered ? -7.2 : (treasureHero.currentZ * 0.3 + 1.15));

        if (treasureHero.compassRing) {
            treasureHero.compassRing.position.set(treasureHero.currentX, 0.34, treasureHero.currentZ);
            let aimX = 0, aimZ = -6.6;
            if (!treasureHero.allRescued) {
                const nextFriend = interactiveBlocks.find(b => !b.rescued && b.itemKey === gameState.targetKey);
                if (nextFriend) { aimX = nextFriend.baseX; aimZ = nextFriend.baseZ; }
            }
            treasureHero.compassRing.rotation.y = Math.atan2(aimX - treasureHero.currentX, aimZ - treasureHero.currentZ);
        }

        if (!gameState.isBusy) {
            if (treasureHero.allRescued) {
                if (Math.hypot(treasureHero.currentX - 0, treasureHero.currentZ - (-6.6)) < 1.35) triggerMazeCastleVictory();
            } else {
                for (let i = 0; i < interactiveBlocks.length; i++) {
                    const friend = interactiveBlocks[i];
                    if (!friend.rescued && friend.state !== 'wrong' && Math.hypot(treasureHero.currentX - friend.baseX, treasureHero.currentZ - friend.baseZ) < 1.15) {
                        handleBlockTapped(friend); break;
                    }
                }
            }
        }
    }

    // 4D. Animate 【🛸 加減法小兵大作戰】
    if (typeof additionArenaGroup !== 'undefined' && additionArenaGroup.visible && additionState.heroMesh) {
        if (additionState.plusSignMesh) additionState.plusSignMesh.rotation.z = Math.sin(elapsed * 3) * 0.08;
        if (additionState.equalSignMesh) additionState.equalSignMesh.position.y = 1.35 + Math.sin(elapsed * 3) * 0.05;
        ['slotA', 'slotB', 'slotC'].forEach(k => { if (additionState[k]) additionState[k].scale.setScalar(1.0 + Math.sin(elapsed * 5) * 0.05); });

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

        interactiveBlocks.forEach(b => {
            if (b.isArenaMinion && b.group.visible && additionState.phase === 'catch') {
                b.baseX += (b.vx || 1.2) * dt; b.baseZ += (b.vz || 1.1) * dt;
                if (b.baseX < -5.4 || b.baseX > 5.4) b.vx = -(b.vx || 1.2);
                if (b.baseZ < 1.4 || b.baseZ > 4.8) b.vz = -(b.vz || 1.1);
                b.baseX = Math.max(-5.5, Math.min(5.5, b.baseX)); b.baseZ = Math.max(1.4, Math.min(4.8, b.baseZ));
                b.group.position.set(b.baseX, 0.95 + Math.abs(Math.sin(elapsed * 7 + b.animTime)) * 0.22, b.baseZ);
                b.group.rotation.y = Math.atan2(b.vx, b.vz) * 0.25;
            }
        });

        let vx = 0, vz = 0;
        const speed = 6.8;
        if (additionState.phase === 'catch' && !gameState.isBusy) {
            if (additionState.moveDirX !== 0 || additionState.moveDirZ !== 0) { vx = additionState.moveDirX * speed; vz = additionState.moveDirZ * speed; }
            else if (additionState.targetX !== null && additionState.targetZ !== null) {
                const dx = additionState.targetX - additionState.heroX, dz = additionState.targetZ - additionState.heroZ;
                const dist = Math.hypot(dx, dz);
                if (dist > 0.15) { vx = (dx / dist) * speed; vz = (dz / dist) * speed; }
                else { additionState.targetX = null; additionState.targetZ = null; if (additionState.clickMarker) additionState.clickMarker.visible = false; }
            }
        }

        const isWalking = Math.hypot(vx, vz) > 0.05;
        if (isWalking) {
            additionState.heroX = Math.max(-6.2, Math.min(6.2, additionState.heroX + vx * dt));
            additionState.heroZ = Math.max(0.6, Math.min(5.8, additionState.heroZ + vz * dt));
            additionState.walkCycle += dt * 16; additionState.facingAngle = Math.atan2(vx, vz);
        }

        const hop = isWalking ? Math.abs(Math.sin(additionState.walkCycle)) * 0.18 : Math.sin(elapsed * 3) * 0.03;
        additionState.heroMesh.position.set(additionState.heroX, 0.36 + hop, additionState.heroZ);
        additionState.heroMesh.rotation.y = THREE.MathUtils.lerp(additionState.heroMesh.rotation.y, additionState.facingAngle, dt * 12);
        if (additionState.compassRing) additionState.compassRing.position.set(additionState.heroX, 0.38, additionState.heroZ);

        if (additionState.phase === 'catch' && !gameState.isBusy) {
            for (let i = 0; i < interactiveBlocks.length; i++) {
                const m = interactiveBlocks[i];
                if (m.isArenaMinion && m.group.visible && m.state !== 'wrong' && Math.hypot(additionState.heroX - m.group.position.x, additionState.heroZ - m.group.position.z) < 1.25) {
                    handleAdditionMinionCaught(m); break;
                }
            }
        }

        if (additionState.phase === 'fusing') {
            additionState.fuseTimer += dt * 2.0;
            const p = Math.min(1, additionState.fuseTimer);
            if (additionState.leftPodMinion) additionState.leftPodMinion.group.position.y = 1.15 + Math.abs(Math.sin(p * Math.PI * 2)) * 0.45;
            if (additionState.midPodMinion) additionState.midPodMinion.group.position.y = 1.15 + Math.abs(Math.sin(p * Math.PI * 2)) * 0.45;
            if (additionState.rightPodMinion) {
                additionState.rightPodMinion.group.scale.setScalar(THREE.MathUtils.lerp(0.86, 1.12, p));
                additionState.rightPodMinion.group.position.y = 1.25 + Math.sin(p * Math.PI) * 0.6;
            }
            if (p >= 1) { playSuccessChime(); additionState.phase = 'readyToFire'; ensureAdditionFireButton().classList.remove('hidden'); }
        }

        if (additionState.phase === 'firing' && additionState.rightPodMinion && additionState.ufoGroup) {
            additionState.fireProgress = Math.min(1, additionState.fireProgress + dt * 2.2);
            const fp = additionState.fireProgress;
            const ufoPos = additionState.ufoGroup.position;
            const ansMinion = additionState.rightPodMinion.group;
            ansMinion.position.set(THREE.MathUtils.lerp(3.7, ufoPos.x, fp), THREE.MathUtils.lerp(1.35, ufoPos.y, fp) + Math.sin(fp * Math.PI) * 1.8, THREE.MathUtils.lerp(-1.8, ufoPos.z, fp));
            ansMinion.rotation.x += dt * 14;

            if (fp >= 1) {
                ansMinion.visible = false; additionState.phase = 'celebrate'; additionState.ufoHitTimer = 1.8; gameState.isBusy = true;
                playStageClearFanfare(); emitStarParticles(ufoPos.clone()); awardStarProgress();
                setPromptUI(`💥 轟隆！正中目標！【 ${additionState.caughtA} ${additionState.opChar || '+'} ${additionState.caughtB} = ${additionState.targetSum} 】成功擊退飛碟！`, ``);
                activeCountingTimeouts.push(setTimeout(() => { if (!isToyModalOpen()) startNewRound(); }, 2200));
            }
        }

        camera.position.x = THREE.MathUtils.lerp(camera.position.x, additionState.heroX * 0.22, dt * 4);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 9.2, dt * 4);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, 12.4, dt * 4);
        camera.lookAt(additionState.heroX * 0.15, 1.3, -1.2);
    }

    // 4E. Animate 【🌉 馬利奧形狀修橋大作戰 (蘑菇台定點 + 黃金大魔槌打樁 + 過橋三線狂食金幣)】
    if (typeof shapeBridgeGroup !== 'undefined' && shapeBridgeGroup.visible && shapeBridgeState.heroMesh) {
        // 1. 海龜浮島呼吸浮沉、大風車旋轉橋窿與調皮水怪動畫
        shapeBridgeState.slots.forEach((s, idx) => {
            if (s.turtleGroup) {
                s.turtleGroup.position.y = -0.18 + Math.sin(elapsed * 2.5 + idx) * 0.05;
            }
            if (!s.filled) {
                if (s.arrowMesh && s.arrowMesh.visible) {
                    s.arrowMesh.position.y = 1.6 + Math.sin(elapsed * 7) * 0.24;
                }
                if (s.monsterGroup) {
                    s.monsterGroup.position.y = 0.22 + Math.sin(elapsed * 4.5 + idx * 1.5) * 0.14;
                    s.monsterGroup.rotation.y = Math.sin(elapsed * 2.5 + idx) * 0.4;
                }
                if (shapeBridgeState.tier === 'windmill' && s.holeBoard) {
                    s.holeBoard.rotation.z = Math.sin(elapsed * 1.5 + idx) * 0.65;
                }
            }
        });

        // 2. 被黃金大槌彈飛上天嘅水怪動畫
        for (let i = shapeBridgeState.flyingMonsters.length - 1; i >= 0; i--) {
            const fm = shapeBridgeState.flyingMonsters[i];
            fm.life -= dt;
            fm.mesh.position.x += fm.vx * dt;
            fm.mesh.position.y += fm.vy * dt;
            fm.mesh.position.z += fm.vz * dt;
            fm.mesh.rotation.x += dt * 15;
            fm.mesh.rotation.y += dt * 12;
            if (fm.life <= 0) {
                fm.mesh.visible = false;
                shapeBridgeState.flyingMonsters.splice(i, 1);
            }
        }

        // 3. 🍄 蘑菇台上嘅形狀小兵（原地開心彈跳揮手，100% 唔會亂行撞人！）
        interactiveBlocks.forEach((b, idx) => {
            if (b.isShapeBridgeMinion && b.isArenaMinion && b.group.visible) {
                if (b.state === 'wrong') {
                    b.wrongTimer -= dt;
                    b.group.rotation.z = Math.sin(elapsed * 28) * 0.16;
                    if (b.wrongTimer <= 0) { b.state = 'idle'; b.group.rotation.z = 0; }
                } else {
                    b.group.rotation.z = Math.sin(elapsed * 3 + idx) * 0.04;
                }
                const bounce = Math.abs(Math.sin(elapsed * 5 + idx)) * 0.18;
                b.group.position.set(b.homeX, 1.32 + bounce, b.homeZ);
                b.group.rotation.y = Math.sin(elapsed * 2 + idx) * 0.22;
                b.group.scale.setScalar(b.state === 'hint' ? 0.82 + Math.sin(elapsed * 7) * 0.06 : 0.74);
            }
        });

        // 4. 控制馬利奧移動（修橋階段 & 過橋三線狂食金幣階段）
        let vx = 0, vz = 0;
        const moveSpeed = shapeBridgeState.autoPickMinion ? 9.5 : 7.5;

        if (shapeBridgeState.phase === 'repair' && !gameState.isBusy) {
            if (shapeBridgeState.moveDirX !== 0 || shapeBridgeState.moveDirZ !== 0) {
                vx = shapeBridgeState.moveDirX * moveSpeed;
                vz = shapeBridgeState.moveDirZ * moveSpeed;
            } else if (shapeBridgeState.targetX !== null && shapeBridgeState.targetZ !== null) {
                const dx = shapeBridgeState.targetX - shapeBridgeState.heroX;
                const dz = shapeBridgeState.targetZ - shapeBridgeState.heroZ;
                const dist = Math.hypot(dx, dz);
                if (dist > 0.15) {
                    vx = (dx / dist) * moveSpeed;
                    vz = (dz / dist) * moveSpeed;
                } else {
                    shapeBridgeState.targetX = null;
                    shapeBridgeState.targetZ = null;
                    if (shapeBridgeState.clickMarker) shapeBridgeState.clickMarker.visible = false;
                    if (shapeBridgeState.autoPickMinion) {
                        handleShapeBridgeMinionCaught(shapeBridgeState.autoPickMinion);
                    }
                }
            }
        } else if (shapeBridgeState.phase === 'crossing') {
            // 🎢 過橋大獎賞：馬利奧自動向前衝過彩虹大橋，小朋友可以左右操控狂食 3 排金幣！
            vz = -2.65;
            if (shapeBridgeState.moveDirX !== 0) {
                vx = shapeBridgeState.moveDirX * 7.5;
            } else if (shapeBridgeState.targetX !== null) {
                const dx = shapeBridgeState.targetX - shapeBridgeState.heroX;
                if (Math.abs(dx) > 0.1) vx = Math.sign(dx) * Math.min(Math.abs(dx) * 10, 7.8);
            }

            if (shapeBridgeState.heroZ <= -5.1) {
                shapeBridgeState.phase = 'celebrate';
                playStageClearFanfare();
                awardStarProgress();
                setPromptUI(`👑 彩虹大橋衝線成功！馬利奧食晒金幣抵達奇幻形狀大城堡喇！`, ``);
                [[-2.5, 3.8, -6.8], [2.5, 3.8, -6.8], [0, 4.4, -7.2], [-3.2, 3.2, -5.8], [3.2, 3.2, -5.8]].forEach(([fx, fy, fz], idx) => {
                    activeCountingTimeouts.push(setTimeout(() => { playCoinSound(); emitStarParticles(new THREE.Vector3(fx, fy, fz)); }, idx * 280));
                });
                activeCountingTimeouts.push(setTimeout(() => { if (!isToyModalOpen()) startNewRound(); }, 2500));
            }
        }

        const isWalking = Math.hypot(vx, vz) > 0.05;
        if (isWalking) {
            const maxX = (shapeBridgeState.phase === 'crossing') ? 3.2 : 6.2;
            const minZ = (shapeBridgeState.phase === 'crossing') ? -5.3 : 0.45;
            shapeBridgeState.heroX = Math.max(-maxX, Math.min(maxX, shapeBridgeState.heroX + vx * dt));
            shapeBridgeState.heroZ = Math.max(minZ, Math.min(5.6, shapeBridgeState.heroZ + vz * dt));
            shapeBridgeState.walkCycle += dt * 18;
            shapeBridgeState.facingAngle = Math.atan2(vx, vz);
        }

        const hop = isWalking ? Math.abs(Math.sin(shapeBridgeState.walkCycle)) * 0.18 : Math.sin(elapsed * 3) * 0.03;
        shapeBridgeState.heroMesh.position.set(shapeBridgeState.heroX, 0.36 + hop, shapeBridgeState.heroZ);
        shapeBridgeState.heroMesh.rotation.y = THREE.MathUtils.lerp(shapeBridgeState.heroMesh.rotation.y, shapeBridgeState.facingAngle, dt * 12);

        if (shapeBridgeState.carryingMinion) {
            const cm = shapeBridgeState.carryingMinion;
            cm.group.position.set(shapeBridgeState.heroX, 2.45 + hop * 1.1, shapeBridgeState.heroZ);
            cm.group.rotation.y = shapeBridgeState.heroMesh.rotation.y;
            cm.group.scale.setScalar(0.6);
        }

        // 過橋磁吸食金幣判定
        if (shapeBridgeState.bridgeCoins && shapeBridgeState.bridgeCoins.length > 0) {
            shapeBridgeState.bridgeCoins.forEach((coin, idx) => {
                if (!coin.userData.collected) {
                    coin.rotation.z += dt * 4.5;
                    if (Math.hypot(shapeBridgeState.heroX - coin.position.x, shapeBridgeState.heroZ - coin.position.z) < 1.35) {
                        coin.userData.collected = true;
                        playCountingNote((idx % 8) + 1);
                        emitStarParticles(coin.position);
                    }
                } else {
                    coin.visible = false;
                }
            });
        }

        if (shapeBridgeState.compassRing) {
            shapeBridgeState.compassRing.position.set(shapeBridgeState.heroX, 0.38, shapeBridgeState.heroZ);
            let aimX = 0, aimZ = -1.3;
            if (shapeBridgeState.carryingMinion) {
                const matchSlot = shapeBridgeState.slots.find(s => !s.filled && s.requiredShapeId === shapeBridgeState.carryingMinion.itemKey);
                if (matchSlot) { aimX = matchSlot.x; aimZ = matchSlot.z; }
            } else {
                const nextSlot = shapeBridgeState.slots.find(s => !s.filled);
                if (nextSlot) {
                    const matchMinion = interactiveBlocks.find(b => b.isArenaMinion && b.group.visible && b.itemKey === nextSlot.requiredShapeId);
                    if (matchMinion) { aimX = matchMinion.homeX; aimZ = matchMinion.homeZ; }
                }
            }
            shapeBridgeState.compassRing.rotation.y = Math.atan2(aimX - shapeBridgeState.heroX, aimZ - shapeBridgeState.heroZ);
        }

        // 5. 磁吸判定：行近蘑菇台即舉起小兵 / 舉住小兵行近河邊即刻磁吸飛入橋窿！
        if (shapeBridgeState.phase === 'repair' && !gameState.isBusy) {
            if (!shapeBridgeState.carryingMinion) {
                for (let i = 0; i < interactiveBlocks.length; i++) {
                    const m = interactiveBlocks[i];
                    if (m.isArenaMinion && m.group.visible && m.state !== 'wrong' && Math.hypot(shapeBridgeState.heroX - m.homeX, shapeBridgeState.heroZ - m.homeZ) < 1.25) {
                        handleShapeBridgeMinionCaught(m);
                        break;
                    }
                }
            } else if (shapeBridgeState.heroZ < 1.3) {
                // 🧲 超強河邊磁吸：只要舉住小兵行近河邊，自動吸去對應形狀嘅橋窿！
                const matchSlot = shapeBridgeState.slots.find(s => !s.filled && s.requiredShapeId === shapeBridgeState.carryingMinion.itemKey && Math.abs(shapeBridgeState.heroX - s.x) < 2.2);
                if (matchSlot) {
                    triggerPlugMinionIntoBridgeSlot(matchSlot);
                }
            }
        }

        // 6. 階段 A：小兵凌空飛入橋窿，馬利奧同步跳去橋邊準備揮動「🔨 黃金大魔槌」！
        if (shapeBridgeState.phase === 'jumping' && shapeBridgeState.jumpingAnim) {
            const ja = shapeBridgeState.jumpingAnim;
            ja.progress = Math.min(1, ja.progress + dt * 2.5);
            const p = ja.progress;
            ja.minion.group.position.lerpVectors(ja.startPos, ja.endPos, p);
            ja.minion.group.position.y += Math.sin(p * Math.PI) * 2.5;
            ja.minion.group.rotation.x = p * Math.PI * 2;

            // 馬利奧同步跑去橋口正前方準備扑槌
            shapeBridgeState.heroX = THREE.MathUtils.lerp(shapeBridgeState.heroX, ja.slot.x, dt * 10);
            shapeBridgeState.heroZ = THREE.MathUtils.lerp(shapeBridgeState.heroZ, 0.45, dt * 10);
            shapeBridgeState.facingAngle = Math.PI;

            if (p >= 1) {
                shapeBridgeState.phase = 'hammering';
                ja.hammerPhase = 0;
                ja.slamCount = 0;
                if (shapeBridgeState.hammerMesh) {
                    shapeBridgeState.hammerMesh.visible = true;
                    shapeBridgeState.hammerMesh.rotation.x = 0;
                }
            }
        }

        // 7. 階段 B：🔨 馬利奧揮動「巨型黃金大魔槌」咚！咚！兩下打樁，將水怪彈飛上天！
        if (shapeBridgeState.phase === 'hammering' && shapeBridgeState.jumpingAnim) {
            const ja = shapeBridgeState.jumpingAnim;
            ja.hammerPhase += dt * 2.6;

            // 大魔槌揮動角度 (連扑兩下)
            const swing = Math.sin(ja.hammerPhase * Math.PI * 4);
            if (shapeBridgeState.hammerMesh) {
                shapeBridgeState.hammerMesh.rotation.x = Math.max(-0.4, swing * 1.45);
            }

            // 第 1 下扑落去 & 第 2 下扑落去嘅震撼回饋
            if ((ja.hammerPhase >= 0.25 && ja.slamCount === 0) || (ja.hammerPhase >= 0.75 && ja.slamCount === 1)) {
                ja.slamCount += 1;
                playChestOpenSound();
                emitStarParticles(ja.endPos);
                ja.minion.group.position.y = 0.85 - ja.slamCount * 0.28;
                ja.slot.group.position.y = 0.22;
                setTimeout(() => { if (ja.slot && ja.slot.group) ja.slot.group.position.y = 0.36; }, 120);
            }

            if (ja.hammerPhase >= 1.0) {
                if (shapeBridgeState.hammerMesh) shapeBridgeState.hammerMesh.visible = false;
                ja.minion.group.visible = false;
                ja.slot.currentCount += 1;

                if (ja.slot.currentCount < ja.slot.neededCount) {
                    // 雙拼合體橋：已完成左半邊 (1/2)，提示再篤多一隻細形狀小兵完成右半邊！
                    if (ja.slot.halfFilledMesh) ja.slot.halfFilledMesh.visible = true;
                    shapeBridgeState.phase = 'repair';
                    shapeBridgeState.jumpingAnim = null;
                    updateShapeBridgeBanner();
                    const reqMeta = getCognitiveItemMeta(ja.slot.requiredShapeId, 'shape');
                    setPromptUI(`🔨 已拼好左半邊（1/2）！請再篤多 1 隻「${reqMeta.badgeSymbol}${reqMeta.title}」拼成完整大形狀！`, ``);
                } else {
                    // 橋窿完全修好！將河底小水怪「Biang！」一聲彈飛上天！
                    ja.slot.filled = true;
                    if (ja.slot.monsterGroup) {
                        const mon = ja.slot.monsterGroup;
                        shapeBridgeGroup.attach(mon);
                        shapeBridgeState.flyingMonsters.push({
                            mesh: mon,
                            vx: (Math.random() - 0.5) * 6,
                            vy: 11.5,
                            vz: -7.5,
                            life: 1.2
                        });
                    }
                    ja.slot.cavityGroup.visible = false;
                    ja.slot.repairedGroup.visible = true;
                    updateShapeBridgeBanner();

                    const nextUnfilled = shapeBridgeState.slots.find(s => !s.filled);
                    if (nextUnfilled) {
                        shapeBridgeState.phase = 'repair';
                        shapeBridgeState.jumpingAnim = null;
                        gameState.targetKey = nextUnfilled.requiredShapeId;
                        updateTargetBadgeUI(nextUnfilled.requiredShapeId, false);
                        const nextMeta = getCognitiveItemMeta(nextUnfilled.requiredShapeId, 'shape');
                        setPromptUI(`💥 咚咚！成功彈飛水怪修好橋板！接住請篤蘑菇台上嘅「${nextMeta.badgeSymbol}${nextMeta.title}」！`, ``);
                    } else {
                        // 🎢 所有橋窿修好晒！展開「三線彩虹加速跑道」+ 15 粒閃亮金幣俾玩家左右狂食！
                        shapeBridgeState.phase = 'crossing';
                        shapeBridgeState.jumpingAnim = null;
                        shapeBridgeState.heroX = 0;
                        shapeBridgeState.heroZ = 1.3;
                        shapeBridgeState.targetX = 0;
                        if (shapeBridgeState.rainbowTrackMesh) shapeBridgeState.rainbowTrackMesh.visible = true;
                        interactiveBlocks.forEach(b => { if (b.isArenaMinion) b.group.visible = false; });

                        [-2.2, 0, 2.2].forEach(laneX => {
                            [0.4, -0.5, -1.4, -2.3, -3.2].forEach(cz => {
                                const coin = new THREE.Mesh(
                                    new THREE.CylinderGeometry(0.38, 0.38, 0.12, 20),
                                    new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.2, metalness: 0.65 })
                                );
                                coin.rotation.x = Math.PI / 2;
                                coin.position.set(laneX, 0.88, cz);
                                coin.userData = { collected: false };
                                shapeBridgeState.slotsContainer.add(coin);
                                shapeBridgeState.bridgeCoins.push(coin);
                            });
                        });

                        playSuccessChime();
                        setPromptUI(`🎢 大橋打通喇！快啲用手指左右掃（或撳◀▶掣）控制馬利奧食晒橋上嘅金幣！`, ``);
                    }
                }
            }
        }

        const isEnd = (shapeBridgeState.phase === 'crossing' || shapeBridgeState.phase === 'celebrate');
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, shapeBridgeState.heroX * 0.22, dt * 4);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, isEnd ? 8.2 : 9.6, dt * 4);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, isEnd ? 5.6 : 11.4, dt * 4);
        camera.lookAt(shapeBridgeState.heroX * 0.16, 0.8, isEnd ? -4.2 : -0.8);
    }

    // 4B. Animate Mario 3D Hero Character Movement, Jump & Flagpole Victory
    if (marioStageGroup.visible && marioHero.group) {
        const dx = marioHero.targetX - marioHero.currentX;
        if (Math.abs(dx) > 0.03) {
            const moveSpeed = marioHero.runningToFlag ? 6.5 : 8.5;
            marioHero.currentX += Math.sign(dx) * Math.min(Math.abs(dx), dt * moveSpeed);
            marioHero.walkCycle += dt * 16;
            marioHero.group.rotation.y = THREE.MathUtils.lerp(marioHero.group.rotation.y, dx > 0 ? 0.35 : -0.35, dt * 10);
        } else {
            marioHero.currentX = marioHero.targetX;
            marioHero.group.rotation.y = THREE.MathUtils.lerp(marioHero.group.rotation.y, 0, dt * 10);
            if (marioHero.autoJumpOnArrive && marioHero.pendingBrick) startHeroJump(marioHero.pendingBrick);
        }

        if (marioHero.isJumping) {
            marioHero.currentY += marioHero.jumpVel * dt; marioHero.jumpVel -= 22.0 * dt;
            if (!marioHero.hitTriggered && marioHero.currentY >= 1.52) {
                marioHero.hitTriggered = true; marioHero.jumpVel = -2.5;
                if (marioHero.pendingBrick) handleBlockTapped(marioHero.pendingBrick);
            }
            if (marioHero.currentY <= marioHero.baseY) { marioHero.currentY = marioHero.baseY; marioHero.isJumping = false; marioHero.jumpVel = 0; }
        } else {
            marioHero.currentY = marioHero.baseY + (Math.abs(dx) > 0.04 ? Math.abs(Math.sin(marioHero.walkCycle)) * 0.14 : Math.sin(elapsed * 3) * 0.03);
        }

        marioHero.group.position.set(marioHero.currentX, marioHero.currentY, 0.8);
        if (marioHero.selectionRing && interactiveBlocks[gameState.marioSelectedIdx]) {
            marioHero.selectionRing.position.x = THREE.MathUtils.lerp(marioHero.selectionRing.position.x, interactiveBlocks[gameState.marioSelectedIdx].baseX, dt * 12);
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
        proj.y += 0.72; proj.project(camera);
        item.labelEl.style.left = `${(proj.x * 0.5 + 0.5) * window.innerWidth}px`;
        item.labelEl.style.top = `${(-proj.y * 0.5 + 0.5) * window.innerHeight}px`;
    });

    for (let i = activeParticles.length - 1; i >= 0; i--) {
        const p = activeParticles[i];
        p.life -= dt; p.vy -= 9.8 * dt;
        p.mesh.position.x += p.vx * dt; p.mesh.position.y += p.vy * dt; p.mesh.position.z += p.vz * dt;
        p.mesh.rotation.x += dt * 5; p.mesh.rotation.y += dt * 5;
        p.mesh.scale.setScalar(Math.max(0.01, p.life));
        if (p.life <= 0) { particlesGroup.remove(p.mesh); activeParticles.splice(i, 1); }
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
