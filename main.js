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
/********************************************************************
 * Mode 8 Plugin: 💦 魔法水槍染色大作戰 (一篤裝彈 + 三原色混色 + 噴射水柱 + 彩虹滑浪)
 ********************************************************************/
MODE_DISPLAY_META.colorsplash = '💦 魔法水槍染色';

const COLOR_SPLASH_TIERS = [
    { id: 'match',  label: '🌱 1.鮮色配對 (有色牌)' },
    { id: 'object', label: '🕵️ 2.常識聯想 (純白實物)' },
    { id: 'mix',    label: '🧪 3.三原色混色 (紅+黃=橙)' },
    { id: 'memory', label: '⚡ 4.記憶閃視挑戰' }
];

const COLOR_MIX_TABLE = {
    'red+yellow': 'orange', 'yellow+red': 'orange',
    'blue+yellow': 'green', 'yellow+blue': 'green',
    'red+blue': 'purple',   'blue+red': 'purple'
};

function ensureColorSplashLobbyCard() {
    const treasureCard = document.getElementById('lobby-card-treasure');
    if (!treasureCard || document.getElementById('lobby-card-colorsplash')) return;

    const csCard = document.createElement('button');
    csCard.id = 'lobby-card-colorsplash';
    csCard.onclick = () => startGameFromLobby('colorsplash');
    csCard.className = 'btn-toy group sm:col-span-2 bg-gradient-to-r from-pink-100 via-amber-50 to-sky-100 hover:from-pink-200 hover:to-sky-200 p-5 rounded-3xl border-4 border-pink-400 items-center gap-4 text-left shadow-lg hidden';
    csCard.innerHTML = `
        <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-pink-500 via-amber-400 to-sky-500 text-white flex items-center justify-center text-4xl sm:text-5xl shadow-md group-hover:scale-110 transition-transform flex-shrink-0">💦</div>
        <div class="flex-1">
            <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="text-lg sm:text-2xl font-black text-slate-800">魔法水槍染色大作戰（高飽和度噴漆＋三原色混色）</span>
                <span class="text-xs font-black bg-gradient-to-r from-pink-500 to-sky-500 text-white px-3 py-1 rounded-full shadow-sm">🎨 顏色樂園王牌新玩法</span>
            </div>
            <p class="text-xs sm:text-sm font-bold text-slate-600 mt-1">篤蘑菇台顏色小兵注入背囊水槍，射出鮮豔高壓水柱幫純白消防車、小青蛙同提子染返靚色！</p>
        </div>`;
    treasureCard.parentNode.appendChild(csCard);
}

function ensureColorSplashActionBtn() {
    let btn = document.getElementById('color-splash-btn');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'color-splash-btn';
        btn.onclick = () => autoFireColorWaterGun();
        btn.className = 'fixed right-2.5 sm:right-5 bottom-32 sm:bottom-36 z-40 pointer-events-auto btn-toy bg-gradient-to-r from-pink-500 via-amber-400 to-sky-500 text-slate-950 font-black px-4 py-2.5 sm:px-5 sm:py-3 rounded-3xl border-4 border-white shadow-2xl flex items-center gap-2 text-base sm:text-xl animate-bounce hidden';
        btn.innerHTML = `<span>💦</span><span id="color-splash-btn-text">噴射染色！</span><span>✨</span>`;
        document.body.appendChild(btn);
    }
    return btn;
}

function renderColorSplashTierBarUI() {
    const tierBar = document.getElementById('maze-tier-bar');
    if (!tierBar) return;
    const cur = colorSplashState.tier || 'match';
    let html = `<div class="pointer-events-auto flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border-2 border-pink-400 shadow-lg">`;
    COLOR_SPLASH_TIERS.forEach(t => {
        const active = (cur === t.id);
        const cls = active ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white border-pink-600 shadow-sm scale-105' : 'bg-slate-100 hover:bg-pink-50 text-slate-600 border-slate-200';
        html += `<button onclick="selectColorSplashTier('${t.id}')" class="btn-toy-sm px-2.5 py-1 rounded-xl font-black text-xs sm:text-sm border ${cls}">${t.label}</button>`;
    });
    html += `</div>`;
    tierBar.innerHTML = html;
}

function selectColorSplashTier(tierId) {
    playPopSound(580);
    colorSplashState.tier = tierId;
    renderColorSplashTierBarUI();
    startNewRound();
}

function updateColorSplashBanner() {
    const banner = document.getElementById('counting-banner');
    const dotsContainer = document.getElementById('counting-dots');
    const emojiEl = document.getElementById('counting-emoji');
    if (!banner || !dotsContainer) return;

    banner.classList.remove('hidden');
    if (dotsContainer.previousElementSibling) dotsContainer.previousElementSibling.style.display = 'none';
    emojiEl.textContent = '💦';
    emojiEl.className = 'text-xl sm:text-2xl';
    dotsContainer.innerHTML = '';

    // 三原色混色模式：即時顯示水箱混色公式 [ 🔴紅 + 🟡黃 = 🟠橙 ]
    if (colorSplashState.tier === 'mix') {
        const tc = colorSplashState.tankColors;
        const s1 = tc[0] ? getVividSpec(tc[0]).title : '？';
        const s2 = tc[1] ? getVividSpec(tc[1]).title : '？';
        const res = colorSplashState.loadedColor ? getVividSpec(colorSplashState.loadedColor).title : '？';
        const mixPill = document.createElement('span');
        mixPill.className = 'inline-flex items-center gap-1 bg-purple-600 text-white px-2.5 py-0.5 rounded-xl text-xs sm:text-sm font-black shadow';
        mixPill.textContent = `🧪水箱：${s1} + ${s2} = ${res}`;
        dotsContainer.appendChild(mixPill);
    }

    colorSplashState.sculptures.forEach(sc => {
        const pill = document.createElement('span');
        if (sc.painted) {
            pill.className = 'inline-flex items-center bg-emerald-500 text-white px-2 py-0.5 rounded-xl text-xs sm:text-sm font-black star-earned';
            pill.textContent = `✓${sc.spec.title}`;
        } else {
            pill.className = 'inline-flex items-center bg-slate-100 text-slate-700 px-2 py-0.5 rounded-xl text-xs font-bold border border-slate-300';
            pill.textContent = sc.spec.objName;
        }
        dotsContainer.appendChild(pill);
    });
}

function syncMarioWaterTankVisual() {
    const cId = colorSplashState.loadedColor || colorSplashState.tankColors[0] || null;
    if (!colorSplashState.tankLiquidMesh) return;
    if (!cId) {
        colorSplashState.tankLiquidMesh.visible = false;
        ensureColorSplashActionBtn().classList.add('hidden');
        return;
    }
    const spec = getVividSpec(cId);
    colorSplashState.tankLiquidMesh.visible = true;
    colorSplashState.tankLiquidMesh.material.color.setHex(spec.numHex);
    colorSplashState.tankLiquidMesh.material.emissive.setHex(spec.emissive);
    const isHalf = (colorSplashState.tier === 'mix' && !colorSplashState.loadedColor);
    colorSplashState.tankLiquidMesh.scale.y = isHalf ? 0.5 : 1.0;

    if (colorSplashState.nozzleTipMesh) {
        colorSplashState.nozzleTipMesh.material.color.setHex(spec.numHex);
        colorSplashState.nozzleTipMesh.material.emissive.setHex(spec.emissive);
    }

    if (colorSplashState.loadedColor) {
        updateTargetBadgeUI(colorSplashState.loadedColor, false);
        const btn = ensureColorSplashActionBtn();
        const txt = document.getElementById('color-splash-btn-text');
        if (txt) txt.textContent = `噴射「${spec.title}」水柱！`;
        btn.classList.remove('hidden');
    } else {
        ensureColorSplashActionBtn().classList.add('hidden');
    }
}

function setupColorSplashRound() {
    gameState.subject = 'color';
    ensure3DColorSplashBuilt();
    ensureMazeCompactHUD();
    ensureColorSplashActionBtn().classList.add('hidden');
    renderColorSplashTierBarUI();

    colorSplashState.stageContainer.clear();
    if (colorSplashState.rainbowSlideMesh) colorSplashState.rainbowSlideMesh.visible = false;
    colorSplashState.streamBalls.forEach(b => { b.visible = false; });

    colorSplashState.sculptures = [];
    colorSplashState.bridgeGems = [];
    colorSplashState.tankColors = [];
    colorSplashState.loadedColor = null;
    colorSplashState.activeStream = null;
    colorSplashState.autoPickMinion = null;
    colorSplashState.phase = 'paint';
    syncMarioWaterTankVisual();

    const tier = colorSplashState.tier || 'match';
    const availIds = COLOR_CURRICULUM.map(c => c.id);
    let targetColors = [];
    let pedestalColors = [];

    if (tier === 'mix') {
        targetColors = ['orange', 'green', 'purple'].filter(c => availIds.includes(c) || VIVID_COLOR_SPECS[c]);
        pedestalColors = ['red', 'yellow', 'blue'];
    } else {
        const shuffled = [...availIds].sort(() => Math.random() - 0.5);
        targetColors = shuffled.slice(0, 3);
        pedestalColors = [...targetColors, shuffled[3]].sort(() => Math.random() - 0.5);
    }

    colorSplashState.memoryHidden = false;
    colorSplashState.memoryTimer = (tier === 'memory') ? 4.2 : 0;

    [-3.4, 0, 3.4].forEach((sx, idx) => {
        colorSplashState.sculptures.push(createColorToySculpture(idx, sx, targetColors[idx], tier));
    });

    // 南岸蘑菇台定點擺放高飽和度顏色小兵
    const pedCoords = pedestalColors.length === 3
        ? [[-3.6, 3.8], [0, 4.2], [3.6, 3.8]]
        : [[-4.5, 3.4], [-1.5, 4.1], [1.5, 4.1], [4.5, 3.4]];

    pedestalColors.forEach((cId, idx) => {
        const [px, pz] = pedCoords[idx];
        const spec = getVividSpec(cId);
        const ped = new THREE.Mesh(
            new THREE.CylinderGeometry(0.95, 1.05, 0.28, 26),
            new THREE.MeshStandardMaterial({ color: spec.numHex, roughness: 0.25, emissive: spec.emissive, emissiveIntensity: 0.25 })
        );
        ped.position.set(px, 0.5, pz);
        colorSplashState.stageContainer.add(ped);

        const minion = create3DNumberCharacter(cId, px, pz, 0.74);
        minion.isArenaMinion = true;
        minion.isShapeBridgeMinion = true;
        minion.homeX = px;
        minion.homeZ = pz;
        if (minion.bodyMesh && Array.isArray(minion.bodyMesh.material)) {
            minion.bodyMesh.material.forEach((m, mi) => {
                if (mi !== 4) { m.color.setHex(spec.numHex); m.emissive = new THREE.Color(spec.emissive); m.emissiveIntensity = 0.22; }
            });
        }
        interactiveBlocks.push(minion);
    });

    gameState.targetKey = pedestalColors[0];
    updateTargetBadgeUI(targetColors[0], false);
    updateColorSplashBanner();

    colorSplashState.heroX = 0; colorSplashState.heroZ = 2.1;
    colorSplashState.targetX = null; colorSplashState.targetZ = null;
    colorSplashState.moveDirX = 0; colorSplashState.moveDirZ = 0; colorSplashState.facingAngle = Math.PI;
    if (colorSplashState.heroMesh) { colorSplashState.heroMesh.position.set(0, 0.36, 2.1); colorSplashState.heroMesh.rotation.y = Math.PI; }

    if (tier === 'mix') {
        setPromptUI(`🧪 三原色混色：請篤 2 隻原色小兵（如紅+黃）溝出新顏色噴向玩具！`, ``);
    } else if (tier === 'object') {
        setPromptUI(`🕵️ 常識聯想：睇下白色玩具係咩嚟？篤啱顏色小兵幫佢染返靚色！`, ``);
    } else if (tier === 'memory') {
        setPromptUI(`⚡ 快啲記住 3 件玩具嘅目標顏色！（4 秒後收起色牌提示）`, ``);
    } else {
        setPromptUI(`💦 篤蘑菇台顏色小兵裝滿水槍，再篤對岸白色玩具噴射染色！`, ``);
    }
}

function handleColorMinionLoaded(minion) {
    if (gameState.isBusy || colorSplashState.phase !== 'paint') return;
    const cId = minion.itemKey;
    const spec = getVividSpec(cId);
    colorSplashState.autoPickMinion = null;

    if (colorSplashState.tier === 'mix') {
        if (colorSplashState.loadedColor) {
            colorSplashState.tankColors = [];
            colorSplashState.loadedColor = null;
        }
        if (colorSplashState.tankColors.length === 0) {
            playCoinSound();
            colorSplashState.tankColors.push(cId);
            emitColorSplashParticles(new THREE.Vector3(minion.homeX, 1.5, minion.homeZ), spec.numHex);
            syncMarioWaterTankVisual();
            updateColorSplashBanner();
            setPromptUI(`🧪 水箱已裝入「${spec.title}」！再篤另一隻原色小兵溝出新顏色啦！`, ``);
            return;
        } else {
            const first = colorSplashState.tankColors[0];
            if (first === cId) {
                playGentleNudge();
                setPromptUI(`已經有「${spec.title}」喇！試下溝另一隻唔同嘅原色小兵啦！`, ``);
                return;
            }
            const mixed = COLOR_MIX_TABLE[`${first}+${cId}`];
            colorSplashState.tankColors.push(cId);
            colorSplashState.loadedColor = mixed;
            const mixSpec = getVividSpec(mixed);
            playSuccessChime();
            emitColorSplashParticles(new THREE.Vector3(colorSplashState.heroX, 1.8, colorSplashState.heroZ), mixSpec.numHex);
            syncMarioWaterTankVisual();
            updateColorSplashBanner();
            setPromptUI(`✨ 混色成功！${getVividSpec(first).short}+${spec.short} 變成「${mixSpec.title}」！快啲篤對岸玩具噴射！`, ``);
            return;
        }
    }

    const needed = colorSplashState.sculptures.some(s => !s.painted && s.colorId === cId);
    if (!needed) {
        playGentleNudge();
        minion.state = 'wrong'; minion.wrongTimer = 0.6;
        setPromptUI(`對岸無玩具需要「${spec.title}」喎！請揀另一隻顏色小兵！`, ``);
        return;
    }

    playCoinSound();
    colorSplashState.loadedColor = cId;
    emitColorSplashParticles(new THREE.Vector3(minion.homeX, 1.5, minion.homeZ), spec.numHex);
    syncMarioWaterTankVisual();
    updateColorSplashBanner();
    setPromptUI(`💦 水槍已裝滿「${spec.title}」！快啲篤對岸對應玩具（或撳右下角💦大掣）噴射！`, ``);
}

function fireColorWaterGunAt(sculp) {
    if (!colorSplashState.loadedColor || sculp.painted || colorSplashState.phase !== 'paint') return;
    const loaded = colorSplashState.loadedColor;
    const loadedSpec = getVividSpec(loaded);

    if (sculp.colorId !== loaded) {
        playGentleNudge();
        sculp.toyGroup.position.y = 0.6;
        setTimeout(() => { sculp.toyGroup.position.y = 0.34; }, 220);
        setPromptUI(`哎呀！${sculp.spec.objName}唔係「${loadedSpec.title}」㗎！試下射去隔離啱顏色嘅玩具啦！`, ``);
        return;
    }

    ensureColorSplashActionBtn().classList.add('hidden');
    playMarioJumpSound();
    colorSplashState.phase = 'spraying';
    colorSplashState.moveDirX = 0; colorSplashState.moveDirZ = 0;
    colorSplashState.targetX = null; colorSplashState.targetZ = null;
    colorSplashState.facingAngle = Math.atan2(sculp.x - colorSplashState.heroX, sculp.z - colorSplashState.heroZ);

    colorSplashState.activeStream = {
        sculp,
        spec: loadedSpec,
        progress: 0,
        startPos: new THREE.Vector3(colorSplashState.heroX, 1.25, colorSplashState.heroZ),
        endPos: new THREE.Vector3(sculp.x, 1.35, sculp.z)
    };
}

function autoFireColorWaterGun() {
    if (gameState.mode !== 'colorsplash' || colorSplashState.phase !== 'paint' || !colorSplashState.loadedColor) return;
    const match = colorSplashState.sculptures.find(s => !s.painted && s.colorId === colorSplashState.loadedColor);
    if (match) fireColorWaterGunAt(match);
}

function updateColorSplashFrame(dt, elapsed) {
    environmentGroup.visible = false;

    // 記憶閃視倒數自動收埋色牌
    if (colorSplashState.tier === 'memory' && !colorSplashState.memoryHidden && colorSplashState.memoryTimer > 0) {
        colorSplashState.memoryTimer -= dt;
        if (colorSplashState.memoryTimer <= 0) {
            colorSplashState.memoryHidden = true;
            colorSplashState.sculptures.forEach(sc => { if (!sc.painted) updateSculptureSign(sc, 'memory', true); });
            setPromptUI(`⚡ 色牌收埋喇！憑記憶篤啱顏色小兵幫玩具染色啦！（忘記可撳💡提示）`, ``);
        }
    }

    // 雕塑呼吸與染色後開心旋轉彈跳
    colorSplashState.sculptures.forEach((sc, idx) => {
        if (sc.painted) {
            sc.toyGroup.rotation.y += dt * 2.2;
            sc.toyGroup.position.y = 0.38 + Math.abs(Math.sin(elapsed * 5.5 + idx)) * 0.22;
            if (sc.bounceTimer > 0) {
                sc.bounceTimer = Math.max(0, sc.bounceTimer - dt * 2.5);
                sc.toyGroup.scale.setScalar(1.0 + Math.sin(sc.bounceTimer * Math.PI) * 0.28);
            }
        } else {
            sc.toyGroup.rotation.y = Math.sin(elapsed * 1.4 + idx) * 0.22;
        }
    });

    // 蘑菇台顏色小兵原地彈跳
    interactiveBlocks.forEach((b, idx) => {
        if (b.isShapeBridgeMinion && b.isArenaMinion && b.group.visible) {
            if (b.state === 'wrong') {
                b.wrongTimer -= dt; b.group.rotation.z = Math.sin(elapsed * 28) * 0.16;
                if (b.wrongTimer <= 0) { b.state = 'idle'; b.group.rotation.z = 0; }
            } else b.group.rotation.z = Math.sin(elapsed * 3 + idx) * 0.04;
            b.group.position.set(b.homeX, 1.32 + Math.abs(Math.sin(elapsed * 5 + idx)) * 0.18, b.homeZ);
            b.group.rotation.y = Math.sin(elapsed * 2 + idx) * 0.22;
            b.group.scale.setScalar(0.74);
        }
    });

    // 馬利奧移動與彩虹滑浪過河
    let vx = 0, vz = 0;
    const spd = colorSplashState.autoPickMinion ? 9.8 : 7.6;
    if (colorSplashState.phase === 'paint' && !gameState.isBusy) {
        if (colorSplashState.moveDirX !== 0 || colorSplashState.moveDirZ !== 0) {
            vx = colorSplashState.moveDirX * spd; vz = colorSplashState.moveDirZ * spd;
        } else if (colorSplashState.targetX !== null && colorSplashState.targetZ !== null) {
            const dx = colorSplashState.targetX - colorSplashState.heroX, dz = colorSplashState.targetZ - colorSplashState.heroZ;
            const dist = Math.hypot(dx, dz);
            if (dist > 0.15) { vx = (dx / dist) * spd; vz = (dz / dist) * spd; }
            else {
                colorSplashState.targetX = null; colorSplashState.targetZ = null;
                if (colorSplashState.clickMarker) colorSplashState.clickMarker.visible = false;
                if (colorSplashState.autoPickMinion) handleColorMinionLoaded(colorSplashState.autoPickMinion);
            }
        }
    } else if (colorSplashState.phase === 'crossing') {
        vz = -2.6;
        if (colorSplashState.moveDirX !== 0) vx = colorSplashState.moveDirX * 7.5;
        else if (colorSplashState.targetX !== null) {
            const dx = colorSplashState.targetX - colorSplashState.heroX;
            if (Math.abs(dx) > 0.1) vx = Math.sign(dx) * Math.min(Math.abs(dx) * 10, 7.8);
        }
        if (colorSplashState.heroZ <= -4.6) {
            colorSplashState.phase = 'celebrate';
            playStageClearFanfare(); awardStarProgress();
            setPromptUI(`🌈 染色大成功！馬利奧衝入彩虹顏料大城堡喇！`, ``);
            [[-2.5, 3.6, -6.0, 0xFF1744], [0, 4.2, -6.2, 0xFFD600], [2.5, 3.6, -6.0, 0x00B0FF]].forEach(([fx, fy, fz, col], idx) => {
                activeCountingTimeouts.push(setTimeout(() => { playCoinSound(); emitColorSplashParticles(new THREE.Vector3(fx, fy, fz), col); }, idx * 320));
            });
            activeCountingTimeouts.push(setTimeout(() => { if (!isToyModalOpen()) startNewRound(); }, 2500));
        }
    }

    const walking = Math.hypot(vx, vz) > 0.05;
    if (walking) {
        const maxX = (colorSplashState.phase === 'crossing') ? 3.2 : 6.0;
        const minZ = (colorSplashState.phase === 'crossing') ? -4.8 : 0.9;
        colorSplashState.heroX = Math.max(-maxX, Math.min(maxX, colorSplashState.heroX + vx * dt));
        colorSplashState.heroZ = Math.max(minZ, Math.min(5.5, colorSplashState.heroZ + vz * dt));
        colorSplashState.walkCycle += dt * 18;
        colorSplashState.facingAngle = Math.atan2(vx, vz);
    }

    const hop = walking ? Math.abs(Math.sin(colorSplashState.walkCycle)) * 0.18 : Math.sin(elapsed * 3) * 0.03;
    colorSplashState.heroMesh.position.set(colorSplashState.heroX, 0.36 + hop, colorSplashState.heroZ);
    colorSplashState.heroMesh.rotation.y = THREE.MathUtils.lerp(colorSplashState.heroMesh.rotation.y, colorSplashState.facingAngle, dt * 12);
    if (colorSplashState.compassRing) colorSplashState.compassRing.position.set(colorSplashState.heroX, 0.38, colorSplashState.heroZ);

    // 過橋執取七彩寶石
    colorSplashState.bridgeGems.forEach((gem, idx) => {
        if (!gem.userData.collected) {
            gem.rotation.y += dt * 4;
            if (Math.hypot(colorSplashState.heroX - gem.position.x, colorSplashState.heroZ - gem.position.z) < 1.35) {
                gem.userData.collected = true; playCountingNote((idx % 8) + 1);
                emitColorSplashParticles(gem.position, gem.userData.hex);
            }
        } else gem.visible = false;
    });

    // 行近蘑菇台自動裝彈 / 行近岸邊自動對準噴水
    if (colorSplashState.phase === 'paint' && !gameState.isBusy) {
        for (let i = 0; i < interactiveBlocks.length; i++) {
            const m = interactiveBlocks[i];
            if (m.isArenaMinion && m.group.visible && m.state !== 'wrong' && Math.hypot(colorSplashState.heroX - m.homeX, colorSplashState.heroZ - m.homeZ) < 1.15) {
                if (colorSplashState.loadedColor !== m.itemKey && !(colorSplashState.tier === 'mix' && colorSplashState.tankColors.includes(m.itemKey))) {
                    handleColorMinionLoaded(m); break;
                }
            }
        }
        if (colorSplashState.loadedColor && colorSplashState.heroZ < 1.25) {
            const match = colorSplashState.sculptures.find(s => !s.painted && s.colorId === colorSplashState.loadedColor && Math.abs(colorSplashState.heroX - s.x) < 2.2);
            if (match) fireColorWaterGunAt(match);
        }
    }

    // 💦 高壓拋物線彩色水柱噴射動畫
    if (colorSplashState.phase === 'spraying' && colorSplashState.activeStream) {
        const st = colorSplashState.activeStream;
        st.progress = Math.min(1, st.progress + dt * 1.9);
        colorSplashState.streamBalls.forEach((drop, i) => {
            const t = st.progress * 1.25 - (i / 18) * 0.45;
            if (t >= 0 && t <= 1) {
                drop.visible = true;
                drop.material.color.setHex(st.spec.numHex);
                drop.material.emissive.setHex(st.spec.emissive);
                drop.position.lerpVectors(st.startPos, st.endPos, t);
                drop.position.y += Math.sin(t * Math.PI) * 2.1;
            } else drop.visible = false;
        });

        if (st.progress >= 1) {
            colorSplashState.streamBalls.forEach(d => { d.visible = false; });
            const sc = st.sculp;
            sc.painted = true;
            sc.bounceTimer = 1.0;
            // 將灰白雕塑瞬間染成超高飽和度發光鮮色！
            sc.paintMeshes.forEach(m => {
                m.material.color.setHex(st.spec.numHex);
                m.material.roughness = 0.22;
                m.material.emissive.setHex(st.spec.emissive);
                m.material.emissiveIntensity = 0.28;
            });
            sc.accentMeshes.forEach(a => {
                a.mesh.material.color.setHex(a.hex);
                a.mesh.material.roughness = 0.25;
            });
            updateSculptureSign(sc, colorSplashState.tier, false);
            emitColorSplashParticles(st.endPos, st.spec.numHex);
            playChestOpenSound();

            colorSplashState.loadedColor = null;
            colorSplashState.tankColors = [];
            colorSplashState.activeStream = null;
            syncMarioWaterTankVisual();
            updateColorSplashBanner();

            const remaining = colorSplashState.sculptures.find(s => !s.painted);
            if (remaining) {
                colorSplashState.phase = 'paint';
                setPromptUI(`🎉 好靚呀！${sc.spec.objName}染返「${st.spec.title}」喇！繼續幫下一件玩具染色啦！`, ``);
            } else {
                colorSplashState.phase = 'crossing';
                colorSplashState.heroX = 0; colorSplashState.heroZ = 1.3; colorSplashState.targetX = 0;
                if (colorSplashState.rainbowSlideMesh) colorSplashState.rainbowSlideMesh.visible = true;
                interactiveBlocks.forEach(b => { if (b.isArenaMinion) b.group.visible = false; });

                const gemColors = [0xFF1744, 0xFFD600, 0x00B0FF, 0x00E676, 0xFF6D00, 0xD500F9];
                [-2.2, 0, 2.2].forEach((lx, li) => {
                    [0.6, -0.2, -1.0, -1.8, -2.6].forEach((gz, gi) => {
                        const gHex = gemColors[(li * 2 + gi) % gemColors.length];
                        const gem = new THREE.Mesh(
                            new THREE.OctahedronGeometry(0.36, 0),
                            new THREE.MeshStandardMaterial({ color: gHex, roughness: 0.15, emissive: gHex, emissiveIntensity: 0.35 })
                        );
                        gem.position.set(lx, 0.9, gz);
                        gem.userData = { collected: false, hex: gHex };
                        colorSplashState.stageContainer.add(gem);
                        colorSplashState.bridgeGems.push(gem);
                    });
                });
                playSuccessChime();
                setPromptUI(`🌈 全部玩具恢復彩色喇！左右掃動控制馬利奧食晒彩虹橋上嘅寶石！`, ``);
            }
        }
    }

    const isEnd = (colorSplashState.phase === 'crossing' || colorSplashState.phase === 'celebrate');
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, colorSplashState.heroX * 0.22, dt * 4);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, isEnd ? 8.0 : 9.4, dt * 4);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, isEnd ? 4.8 : 11.2, dt * 4);
    camera.lookAt(colorSplashState.heroX * 0.16, 1.0, isEnd ? -4.2 : -1.2);
}

// 接駁原有主系統 Hooks（免修改原有函式內部）
(function bindColorSplashHooks() {
    const _origOpenLobby = openLobby;
    openLobby = function (step = 'subject') {
        ensureColorSplashLobbyCard();
        const csBtn = document.getElementById('color-splash-btn');
        if (csBtn) csBtn.classList.add('hidden');
        _origOpenLobby(step);
        const csCard = document.getElementById('lobby-card-colorsplash');
        if (csCard && step !== 'subject') {
            csCard.classList.toggle('hidden', gameState.subject !== 'color');
            csCard.classList.toggle('flex', gameState.subject === 'color');
        }
    };

    const _origSwitchSubject = switchSubject;
    switchSubject = function (newSubject) {
        if (newSubject !== 'color' && gameState.mode === 'colorsplash') gameState.mode = 'gacha';
        _origSwitchSubject(newSubject);
    };

    const _origUpdateRightBtn = updateRightButtonForMode;
    updateRightButtonForMode = function () {
        _origUpdateRightBtn();
        if (gameState.mode === 'colorsplash') {
            document.getElementById('right-btn-label').textContent = '換新玩具';
            document.getElementById('right-btn-icon').className = 'fa-solid fa-wand-magic-sparkles';
        }
    };

    const _origEnsureHUD = ensureMazeCompactHUD;
    ensureMazeCompactHUD = function () {
        _origEnsureHUD();
        if (gameState.mode === 'colorsplash') renderColorSplashTierBarUI();
    };

    const _origStartNewRound = startNewRound;
    startNewRound = function () {
        const csBtn = document.getElementById('color-splash-btn');
        if (csBtn) csBtn.classList.add('hidden');
        if (gameState.mode === 'colorsplash') {
            clearTimeout(autoPromptTimer);
            clearCountingObjects();
            numberBlocksGroup.clear();
            interactiveBlocks = [];
            gameState.isBusy = false;
            setupColorSplashRound();
            return;
        }
        if (typeof colorSplashGroup !== 'undefined') colorSplashGroup.visible = false;
        _origStartNewRound();
    };

    const _origSwitchMode = switchMode;
    switchMode = function (newMode) {
        if (newMode === 'colorsplash') {
            gameState.subject = 'color';
            ensure3DColorSplashBuilt();
        }
        _origSwitchMode(newMode);
        const isCS = (newMode === 'colorsplash');
        if (typeof colorSplashGroup !== 'undefined') colorSplashGroup.visible = isCS;
        if (isCS) {
            environmentGroup.visible = false;
            const mainFloor = scene ? scene.getObjectByName('mainFloor') : null;
            if (mainFloor) mainFloor.visible = false;
            const dpad = document.getElementById('treasure-dpad-bar');
            if (dpad) { dpad.classList.remove('hidden'); dpad.classList.add('flex'); }
            renderColorSplashTierBarUI();
        }
    };

    const _origSetDir = setTreasureMoveDir;
    setTreasureMoveDir = function (dx, dz) {
        if (gameState.mode === 'colorsplash') {
            if (colorSplashState.phase !== 'paint' && colorSplashState.phase !== 'crossing') {
                colorSplashState.moveDirX = 0; colorSplashState.moveDirZ = 0; return;
            }
            colorSplashState.moveDirX = dx; colorSplashState.moveDirZ = dz;
            if (dx !== 0 || dz !== 0) { colorSplashState.targetX = null; colorSplashState.targetZ = null; colorSplashState.autoPickMinion = null; }
            return;
        }
        _origSetDir(dx, dz);
    };

    const _origNudge = nudgeTreasureHero;
    nudgeTreasureHero = function (dx, dz) {
        if (gameState.mode === 'colorsplash') {
            if (colorSplashState.phase === 'crossing') {
                colorSplashState.targetX = Math.max(-2.6, Math.min(2.6, colorSplashState.heroX + dx * 2.2)); return;
            }
            if (colorSplashState.phase === 'paint' && !gameState.isBusy) {
                playPopSound(440);
                colorSplashState.targetX = Math.max(-5.8, Math.min(5.8, colorSplashState.heroX + dx * 1.6));
                colorSplashState.targetZ = Math.max(0.9, Math.min(5.4, colorSplashState.heroZ + dz * 1.6));
            }
            return;
        }
        _origNudge(dx, dz);
    };

    const _origHint = triggerVisualHint;
    triggerVisualHint = function (manualClick = false) {
        if (gameState.mode === 'colorsplash') {
            if (manualClick) playPopSound(660);
            if (colorSplashState.tier === 'memory') {
                colorSplashState.memoryHidden = false;
                colorSplashState.memoryTimer = 3.5;
                colorSplashState.sculptures.forEach(sc => { if (!sc.painted) updateSculptureSign(sc, 'memory', false); });
            }
            return;
        }
        _origHint(manualClick);
    };

    const _origKeyDown = onWindowKeyDown;
    onWindowKeyDown = function (e) {
        if (gameState.mode === 'colorsplash') {
            if (colorSplashState.loadedColor && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); autoFireColorWaterGun(); return; }
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') setTreasureMoveDir(-1, colorSplashState.moveDirZ);
            else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') setTreasureMoveDir(1, colorSplashState.moveDirZ);
            else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { e.preventDefault(); setTreasureMoveDir(colorSplashState.moveDirX, -1); }
            else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { e.preventDefault(); setTreasureMoveDir(colorSplashState.moveDirX, 1); }
            return;
        }
        _origKeyDown(e);
    };

    const _origKeyUp = onWindowKeyUp;
    onWindowKeyUp = function (e) {
        if (gameState.mode === 'colorsplash') {
            if (['ArrowLeft', 'a', 'A', 'ArrowRight', 'd', 'D'].includes(e.key)) setTreasureMoveDir(0, colorSplashState.moveDirZ);
            if (['ArrowUp', 'w', 'W', 'ArrowDown', 's', 'S'].includes(e.key)) setTreasureMoveDir(colorSplashState.moveDirX, 0);
            return;
        }
        _origKeyUp(e);
    };

    const _origPtrMove = onCanvasPointerMove;
    onCanvasPointerMove = function (event) {
        if (gameState.mode === 'colorsplash' && shapeBridgeState.isPointerDragging && !gameState.inLobby) {
            const rect = renderer.domElement.getBoundingClientRect();
            pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(pointer, camera);
            const hitPt = new THREE.Vector3();
            if (raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.35), hitPt)) {
                if (colorSplashState.phase === 'crossing') colorSplashState.targetX = THREE.MathUtils.clamp(hitPt.x, -2.8, 2.8);
                else if (colorSplashState.phase === 'paint') {
                    colorSplashState.targetX = THREE.MathUtils.clamp(hitPt.x, -5.8, 5.8);
                    colorSplashState.targetZ = THREE.MathUtils.clamp(hitPt.z, 0.9, 5.4);
                }
            }
            return;
        }
        _origPtrMove(event);
    };

    const _origPtrDown = onCanvasPointerDown;
    onCanvasPointerDown = function (event) {
        if (gameState.mode === 'colorsplash' && !gameState.inLobby) {
            if (colorSplashState.phase === 'crossing') { shapeBridgeState.isPointerDragging = true; onCanvasPointerMove(event); return; }
            if (gameState.isBusy || colorSplashState.phase !== 'paint') return;
            ensureAudioCtx();

            const rect = renderer.domElement.getBoundingClientRect();
            pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(pointer, camera);

            // 1. 檢查係咪篤咗對岸待染色雕塑
            const scHits = raycaster.intersectObjects(colorSplashState.sculptures.filter(s => !s.painted).flatMap(s => [s.hitBox, s.signMesh]), false);
            if (scHits.length > 0 && scHits[0].object.userData.sculpObj) {
                const targetSc = scHits[0].object.userData.sculpObj;
                if (colorSplashState.loadedColor) {
                    playPopSound(600);
                    fireColorWaterGunAt(targetSc);
                } else {
                    playGentleNudge();
                    setPromptUI(`請先篤下面蘑菇台嘅「顏色小兵」裝滿水槍先啦！`, ``);
                }
                return;
            }

            // 2. 檢查係咪篤咗蘑菇台顏色小兵
            const mHits = raycaster.intersectObjects(interactiveBlocks.filter(b => b.bodyMesh).map(b => b.bodyMesh), false);
            if (mHits.length > 0 && mHits[0].object.userData.parentWrapper) {
                const m = mHits[0].object.userData.parentWrapper;
                playPopSound(560);
                colorSplashState.moveDirX = 0; colorSplashState.moveDirZ = 0;
                colorSplashState.autoPickMinion = m;
                colorSplashState.targetX = m.homeX; colorSplashState.targetZ = m.homeZ;
                return;
            }

            // 3. 篤草地自由移動或拖曳
            shapeBridgeState.isPointerDragging = true;
            onCanvasPointerMove(event);
            return;
        }
        _origPtrDown(event);
    };

    const _origAnimate = animate;
    let _csLast = performance.now();
    animate = function () {
        const now = performance.now();
        const csDt = Math.min((now - _csLast) / 1000, 0.1);
        _csLast = now;
        if (typeof colorSplashGroup !== 'undefined' && colorSplashGroup.visible && colorSplashState.heroMesh) {
            updateColorSplashFrame(csDt, now / 1000);
        }
        _origAnimate();
        if (!gameState.inLobby && gameState.mode === 'colorsplash') {
            const tb = document.getElementById('maze-tier-bar');
            if (tb) tb.style.display = 'flex';
        }
    };
})();
/********************************************************************
 * Patch Steps 2 + 3 + 4 (合併版：直接貼於 main.js 最底端最後一行之後)
 * 包含：頂部算式防撞位、數數欄寬度自適應、新遊戲提示連動、iPad防誤觸、自動存檔與廣東話讀題
 ********************************************************************/
(function applyWonderlandCombinedPatches() {
    if (window.__wonderlandPatch234Applied) return;
    window.__wonderlandPatch234Applied = true;

    // ==================== 步驟 2：頂部雙層自動排位 + 數數欄自適應寬度 ====================
    function getTopHudStack() {
        let stack = document.getElementById('top-hud-stack');
        if (!stack) {
            stack = document.createElement('div');
            stack.id = 'top-hud-stack';
            stack.className = 'fixed inset-x-0 z-30 flex flex-col items-center gap-1.5 px-2 pointer-events-none';
            document.body.appendChild(stack);
        }
        let maxBottom = 52;
        ['status-mode-badge', 'stars-bar', 'btn-visual-hint'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const rect = el.getBoundingClientRect();
                if (rect.bottom > 0) maxBottom = Math.max(maxBottom, rect.bottom);
            }
        });
        stack.style.top = `${Math.min(135, Math.round(maxBottom + 6))}px`;
        return stack;
    }

    window.dockTopFloatingBars = function () {
        const stack = getTopHudStack();
        const tierBar = document.getElementById('maze-tier-bar');
        if (tierBar && tierBar.parentElement !== stack) {
            stack.appendChild(tierBar);
            tierBar.className = 'w-full flex flex-wrap items-center justify-center gap-1.5 pointer-events-none';
        }
        const eqHud = document.getElementById('addition-equation-hud');
        if (eqHud) {
            if (eqHud.parentElement !== stack) stack.appendChild(eqHud);
            eqHud.className = 'w-full flex items-center justify-center pointer-events-none transition-all duration-300';
        }
    };

    window.syncCountingBannerWidth = function () {
        const banner = document.getElementById('counting-banner');
        const dots = document.getElementById('counting-dots');
        if (!banner || !dots) return;

        const wasHidden = banner.classList.contains('hidden');
        dots.className = 'flex flex-wrap items-center gap-1 sm:gap-1.5';

        const hasCornerDpad = ['treasure', 'addition', 'shapebridge', 'colorsplash'].includes(gameState.mode);
        if (hasCornerDpad) {
            banner.className = 'fixed left-2.5 sm:left-4 bottom-16 sm:bottom-20 z-20 pointer-events-none bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border-2 border-amber-300 shadow-md flex items-center gap-1.5 max-w-[62vw] sm:max-w-[460px]' + (wasHidden ? ' hidden' : '');
        } else {
            if (dots.previousElementSibling) dots.previousElementSibling.style.display = 'block';
            const bottomCls = (gameState.mode === 'mario') ? 'bottom-20 sm:bottom-24' : 'bottom-16 sm:bottom-20';
            banner.className = `fixed left-2.5 sm:left-4 ${bottomCls} z-20 pointer-events-none bg-white/92 backdrop-blur-md px-3 py-1.5 rounded-2xl border-2 border-amber-300 shadow-lg flex items-center gap-2 max-w-[92vw] sm:max-w-[620px]` + (wasHidden ? ' hidden' : '');
        }
    };

    if (typeof updateAdditionEquationHUD === 'function') {
        const _prevUpdateEq = updateAdditionEquationHUD;
        updateAdditionEquationHUD = function (l, r, s) {
            _prevUpdateEq(l, r, s);
            dockTopFloatingBars();
        };
    }

    if (typeof ensureMazeCompactHUD === 'function') {
        const _prevEnsureHUD = ensureMazeCompactHUD;
        ensureMazeCompactHUD = function () {
            _prevEnsureHUD();
            dockTopFloatingBars();
            syncCountingBannerWidth();
        };
    }

    if (typeof runQuantityCountingSequence === 'function') {
        const _prevRunCounting = runQuantityCountingSequence;
        runQuantityCountingSequence = function (itemKey, autoAdvanceAfter, isCoin = false) {
            syncCountingBannerWidth();
            _prevRunCounting(itemKey, autoAdvanceAfter, isCoin);
        };
    }

    window.addEventListener('resize', dockTopFloatingBars);

    // ==================== 步驟 3：補齊新遊戲「提示」視覺指引 + iPad 觸控防卡掣 ====================
    const style = document.createElement('style');
    style.textContent = `
        body, #canvas-container, #canvas-container canvas, #treasure-dpad-bar, #treasure-dpad-bar button, #mario-controls-bar button {
            touch-action: none;
            -webkit-user-select: none;
            user-select: none;
            -webkit-touch-callout: none;
        }
    `;
    document.head.appendChild(style);

    const stopAllHeroDirs = () => {
        if (typeof setTreasureMoveDir === 'function') setTreasureMoveDir(0, 0);
    };
    window.addEventListener('pointerup', stopAllHeroDirs);
    window.addEventListener('pointercancel', stopAllHeroDirs);
    window.addEventListener('blur', stopAllHeroDirs);

    if (typeof triggerVisualHint === 'function') {
        const _prevHint = triggerVisualHint;
        triggerVisualHint = function (manualClick = false) {
            if (gameState.isBusy || gameState.mode === 'explore') return;

            if (gameState.mode === 'shapebridge' && typeof shapeBridgeState !== 'undefined') {
                if (manualClick) playPopSound(660);
                if (shapeBridgeState.carryingMinion) {
                    const matchSlot = shapeBridgeState.slots.find(s => !s.filled && s.requiredShapeId === shapeBridgeState.carryingMinion.itemKey);
                    if (matchSlot) {
                        if (matchSlot.arrowMesh) matchSlot.arrowMesh.visible = true;
                        emitStarParticles(new THREE.Vector3(matchSlot.x, 1.2, matchSlot.z));
                    }
                } else {
                    const nextSlot = shapeBridgeState.slots.find(s => !s.filled);
                    if (nextSlot) {
                        const m = interactiveBlocks.find(b => b.isArenaMinion && b.group.visible && b.itemKey === nextSlot.requiredShapeId);
                        if (m) {
                            m.state = 'hint';
                            if (m.haloMesh) m.haloMesh.material.opacity = 0.92;
                            emitStarParticles(new THREE.Vector3(m.homeX, 1.6, m.homeZ));
                        }
                    }
                }
                return;
            }

            if (gameState.mode === 'colorsplash' && typeof colorSplashState !== 'undefined') {
                _prevHint(manualClick);
                const targetSc = colorSplashState.sculptures.find(s => !s.painted);
                if (!targetSc) return;

                targetSc.bounceTimer = 1.0;
                targetSc.pedRim.material.color.setHex(targetSc.spec.numHex);
                targetSc.pedRim.material.emissive.setHex(targetSc.spec.emissive);
                targetSc.pedRim.material.emissiveIntensity = 0.45;

                if (colorSplashState.loadedColor === targetSc.colorId) {
                    emitColorSplashParticles(new THREE.Vector3(targetSc.x, 1.7, targetSc.z), targetSc.spec.numHex);
                } else {
                    let needColor = targetSc.colorId;
                    if (colorSplashState.tier === 'mix') {
                        const pair = targetSc.colorId === 'orange' ? ['red', 'yellow'] : (targetSc.colorId === 'green' ? ['blue', 'yellow'] : ['red', 'blue']);
                        needColor = pair.find(c => !colorSplashState.tankColors.includes(c)) || pair[0];
                    }
                    const m = interactiveBlocks.find(b => b.isArenaMinion && b.group.visible && b.itemKey === needColor);
                    if (m) {
                        if (m.haloMesh) {
                            m.haloMesh.rotation.x = Math.PI / 2;
                            m.haloMesh.position.set(0, -0.95, 0);
                            m.haloMesh.material.opacity = 0.95;
                        }
                        if (typeof getVividSpec === 'function') {
                            emitColorSplashParticles(new THREE.Vector3(m.homeX, 1.6, m.homeZ), getVividSpec(needColor).numHex);
                        }
                    }
                }
                return;
            }

            _prevHint(manualClick);
        };
    }

    // ==================== 步驟 4：自動存檔 + 廣東話語音讀題開關 ====================
    const SAVE_KEY = 'wonderland3d_save_v1';
    window.voiceReadEnabled = true;

    function saveGameProgress() {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify({
                stars: gameState.stars,
                unlockedToys: gameState.unlockedToys,
                settings: gameState.settings,
                voiceReadEnabled: window.voiceReadEnabled
            }));
        } catch (e) {}
    }

    function loadGameProgress() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return;
            const data = JSON.parse(raw);
            if (typeof data.stars === 'number') gameState.stars = data.stars;
            if (Array.isArray(data.unlockedToys) && data.unlockedToys.length > 0) gameState.unlockedToys = data.unlockedToys;
            if (data.settings) Object.assign(gameState.settings, data.settings);
            if (typeof data.voiceReadEnabled === 'boolean') window.voiceReadEnabled = data.voiceReadEnabled;
            if (typeof renderStarsBar === 'function') renderStarsBar();
        } catch (e) {}
    }

    window.resetSavedProgress = function () {
        playPopSound(420);
        gameState.stars = 0;
        gameState.unlockedToys = [1];
        saveGameProgress();
        if (typeof renderStarsBar === 'function') renderStarsBar();
        if (typeof renderToyCabinetGrid === 'function') renderToyCabinetGrid();
    };

    function speakCantonesePrompt(rawText) {
        if (!window.voiceReadEnabled || gameState.inLobby || !('speechSynthesis' in window) || !rawText) return;
        const clean = rawText
            .replace(/\+/g, ' 加 ')
            .replace(/[−-](?=\s*[\d?？])/g, ' 減 ')
            .replace(/=/g, ' 等於 ')
            .replace(/[?？]/g, ' 幾多 ')
            .replace(/➔/g, ' 跟住 ')
            .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}【】\[\]✓]/gu, '')
            .trim();
        if (!clean) return;

        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(clean);
        utter.lang = 'zh-HK';
        utter.rate = 0.95;
        utter.pitch = 1.1;
        window.speechSynthesis.speak(utter);
    }

    function mountVoiceAndResetButtons() {
        const hintBtn = document.getElementById('btn-visual-hint');
        if (hintBtn && !document.getElementById('btn-voice-toggle')) {
            const vBtn = document.createElement('button');
            vBtn.id = 'btn-voice-toggle';
            const syncLabel = () => {
                vBtn.className = `btn-toy-sm font-black px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl border-2 shadow text-xs sm:text-sm flex items-center gap-1 ${window.voiceReadEnabled ? 'bg-amber-400 text-slate-950 border-amber-500' : 'bg-slate-200 text-slate-600 border-slate-300'}`;
                vBtn.innerHTML = window.voiceReadEnabled ? '<span>🗣️</span><span class="hidden sm:inline">讀題：開</span>' : '<span>🔇</span><span class="hidden sm:inline">讀題：關</span>';
            };
            vBtn.onclick = () => {
                playPopSound(540);
                window.voiceReadEnabled = !window.voiceReadEnabled;
                if (!window.voiceReadEnabled && 'speechSynthesis' in window) window.speechSynthesis.cancel();
                syncLabel();
                saveGameProgress();
                if (window.voiceReadEnabled) speakCantonesePrompt(document.getElementById('prompt-text')?.textContent || '');
            };
            syncLabel();
            hintBtn.parentNode.insertBefore(vBtn, hintBtn);
        }

        const settingsModal = document.getElementById('settings-modal');
        const settingsCard = settingsModal ? settingsModal.firstElementChild : null;
        if (settingsCard && !document.getElementById('btn-reset-save')) {
            const resetWrap = document.createElement('div');
            resetWrap.className = 'mt-3 pt-3 border-t border-slate-200 flex justify-end';
            resetWrap.innerHTML = `<button id="btn-reset-save" onclick="resetSavedProgress()" class="btn-toy-sm bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold">🔄 重置星星與玩具收集進度</button>`;
            settingsCard.appendChild(resetWrap);
        }
    }

    if (typeof awardStarProgress === 'function') {
        const _prevAward = awardStarProgress;
        awardStarProgress = function () {
            _prevAward();
            setTimeout(saveGameProgress, 100);
        };
    }

    if (typeof updateSetting === 'function') {
        const _prevUpdateSetting = updateSetting;
        updateSetting = function (k, v) {
            _prevUpdateSetting(k, v);
            saveGameProgress();
        };
    }

    if (typeof setPromptUI === 'function') {
        const _prevSetPrompt = setPromptUI;
        setPromptUI = function (mainText, subText) {
            _prevSetPrompt(mainText, subText);
            speakCantonesePrompt(mainText);
        };
    }

    const initPatchUI = () => {
        loadGameProgress();
        mountVoiceAndResetButtons();
        setTimeout(dockTopFloatingBars, 180);
    };
    if (document.readyState === 'complete') initPatchUI();
    else window.addEventListener('load', initPatchUI);
})();
/********************************************************************
 * Patch Step 5: iPad 粵語解鎖與讀音字典 + 直向螢幕智能鏡頭 + WebGL 記憶體自動清理
 * (直接貼於 main.js 最底端最後一行之後，無需刪改舊代碼)
 ********************************************************************/
(function applyStabilityVoicePortraitMemoryPatch() {
    if (window.__wonderlandStabilityPatchApplied) return;
    window.__wonderlandStabilityPatchApplied = true;

    // ==================== 1. iPad Safari 語音解鎖 + 廣東話精準讀音引擎 ====================
    let cachedCantoneseVoice = null;
    let iosSpeechUnlocked = false;
    let pendingUtterText = '';
    let speechSeqToken = 0;

    function pickBestCantoneseVoice() {
        if (!('speechSynthesis' in window)) return null;
        const voices = window.speechSynthesis.getVoices() || [];
        if (!voices.length) return null;

        // 優先次序：香港粵語原生聲線 (zh-HK / yue-HK) -> 名稱含粵語/HK -> 其他中文聲線
        return (
            voices.find(v => /^(zh-hk|yue-hk|yue)/i.test(v.lang) && /sin-?ji|premium|enhanced|natural/i.test(v.name)) ||
            voices.find(v => /^(zh-hk|yue-hk|yue)/i.test(v.lang)) ||
            voices.find(v => /hk|hong\s*kong|cantonese|粵|廣東/i.test(`${v.lang} ${v.name}`)) ||
            null
        );
    }

    if ('speechSynthesis' in window) {
        cachedCantoneseVoice = pickBestCantoneseVoice();
        window.speechSynthesis.addEventListener?.('voiceschanged', () => {
            cachedCantoneseVoice = pickBestCantoneseVoice();
        });
    }

    // 將畫面文字轉換為自然準確嘅廣東話口語讀音（只影響語音，唔影響畫面顯示文字）
    function formatCantoneseReadText(rawText) {
        if (!rawText) return '';
        let txt = String(rawText);

        // A. 先處理關卡編號與範圍（防止 1-1、1-5 被誤讀成「一減一」、「一減五」）
        txt = txt.replace(/關卡\s*1\s*-\s*(\d+)/g, '第 $1 關，');
        txt = txt.replace(/(\d+)\s*-\s*(\d+)/g, (match, a, b) => {
            return Number(a) < Number(b) ? `${a} 至 ${b}` : `${a} 減 ${b}`;
        });

        // B. 處理箭咀、分數進度與問號語境
        txt = txt.replace(/[（(](\d+)\s*➔\s*(\d+)[）)]/g, '，由 $1 數到 $2，');
        txt = txt.replace(/[（(]1\/2[）)]/g, '一半');
        txt = txt.replace(/[（(]2\/2[）)]/g, '全部');
        txt = txt.replace(/「[?？]」台/g, '問號台');
        txt = txt.replace(/「[?？]」位/g, '問號位');
        txt = txt.replace(/[?？]\s*木箱/g, '問號木箱');
        txt = txt.replace(/[（(][?？][）)]/g, '');

        // C. 移除幾何徽章符號與 Emoji（防止「▲三角形」被重覆讀成「黑色三角形 三角形」）
        txt = txt.replace(/[●■▲★♥▬◆▼▮◀▶➕➖✖➗✓🎯🔨🔥💦🌈🐢🧩🕵️🔄⚡🚀🌱👑🏰🎉💥🙌👍🐣🌉🛸🔮🚂🍄🎨🔢🔺💡🗣️🔇]/gu, '');
        txt = txt.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}【】\[\]]/gu, ' ');

        // D. 處理算式符號
        txt = txt
            .replace(/\+/g, ' 加 ')
            .replace(/−/g, ' 減 ')
            .replace(/=/g, ' 等於 ')
            .replace(/[?？]/g, ' 幾多 ')
            .replace(/➔/g, '，跟住 ');

        // E. 廣東話多音字與幼兒口語微調
        txt = txt
            .replace(/長方形/g, '場方形')
            .replace(/正中目標/g, '正眾目標')
            .replace(/調皮/g, '條皮')
            .replace(/彈(飛|跳|射|出|開|床|板)/g, '但$1')
            .replace(/行(去|近|過)/g, '跑$1')
            .replace(/數下/g, '數一數')
            .replace(/(睇|試|撳|望)下/g, '$1吓')
            .replace(/\s+/g, ' ')
            .trim();

        return txt;
    }

    window.speakCantoneseSmart = function (rawText, forceReplay = false) {
        if ((!window.voiceReadEnabled && !forceReplay) || !('speechSynthesis' in window)) return;
        if (gameState.inLobby && !forceReplay) return;

        const clean = formatCantoneseReadText(rawText);
        if (!clean) return;

        if (!iosSpeechUnlocked) {
            pendingUtterText = clean;
        }

        const myToken = ++speechSeqToken;
        window.speechSynthesis.cancel();

        // iPad Safari 修正：cancel() 後延遲 40ms 先 speak()，防止 iOS 食字靜音
        setTimeout(() => {
            if (myToken !== speechSeqToken) return;
            if (!window.voiceReadEnabled && !forceReplay) return;

            const utter = new SpeechSynthesisUtterance(clean);
            if (!cachedCantoneseVoice) cachedCantoneseVoice = pickBestCantoneseVoice();
            if (cachedCantoneseVoice) utter.voice = cachedCantoneseVoice;
            utter.lang = cachedCantoneseVoice ? cachedCantoneseVoice.lang : 'zh-HK';
            utter.rate = 0.94;
            utter.pitch = 1.08;
            window.speechSynthesis.speak(utter);
        }, 40);
    };

    // 首次觸控螢幕即時解鎖 iPad WebAudio 與 SpeechSynthesis
    function unlockIOSAudioAndSpeech() {
        if (typeof ensureAudioCtx === 'function') ensureAudioCtx();
        if (!iosSpeechUnlocked && 'speechSynthesis' in window) {
            iosSpeechUnlocked = true;
            const silentUtter = new SpeechSynthesisUtterance('');
            silentUtter.volume = 0;
            window.speechSynthesis.speak(silentUtter);
            if (pendingUtterText && !gameState.inLobby && window.voiceReadEnabled) {
                const toRead = pendingUtterText;
                pendingUtterText = '';
                setTimeout(() => window.speakCantoneseSmart(toRead), 80);
            }
        }
    }
    ['touchstart', 'pointerdown', 'click'].forEach(evt => {
        window.addEventListener(evt, unlockIOSAudioAndSpeech, { capture: true, passive: true });
    });

    // 接管 setPromptUI 與「讀題」按鈕，並支援輕觸左下角目標章重聽題目
    setPromptUI = function (mainText, subText) {
        const mainEl = document.getElementById('prompt-text');
        if (mainEl) mainEl.textContent = mainText;
        const subEl = document.getElementById('sub-prompt-text');
        if (subEl) subEl.textContent = subText || '';
        window.speakCantoneseSmart(mainText);
    };

    function upgradeVoiceButtons() {
        const vBtn = document.getElementById('btn-voice-toggle');
        if (vBtn) {
            vBtn.onclick = () => {
                playPopSound(540);
                window.voiceReadEnabled = !window.voiceReadEnabled;
                if (!window.voiceReadEnabled && 'speechSynthesis' in window) {
                    speechSeqToken++;
                    window.speechSynthesis.cancel();
                }
                vBtn.className = `btn-toy-sm font-black px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl border-2 shadow text-xs sm:text-sm flex items-center gap-1 ${window.voiceReadEnabled ? 'bg-amber-400 text-slate-950 border-amber-500' : 'bg-slate-200 text-slate-600 border-slate-300'}`;
                vBtn.innerHTML = window.voiceReadEnabled ? '<span>🗣️</span><span class="hidden sm:inline">讀題：開</span>' : '<span>🔇</span><span class="hidden sm:inline">讀題：關</span>';
                if (window.voiceReadEnabled) {
                    window.speakCantoneseSmart(document.getElementById('prompt-text')?.textContent || '', true);
                }
            };
        }

        // 輕觸左下角目標數字章可隨時重讀當前題目（唔影響草地觸控穿透）
        const targetCard = document.getElementById('target-number-card');
        if (targetCard && !targetCard.dataset.replayBound) {
            targetCard.dataset.replayBound = 'true';
            targetCard.style.pointerEvents = 'auto';
            targetCard.style.cursor = 'pointer';
            targetCard.title = '撳我重聽廣東話讀題';
            targetCard.addEventListener('click', (e) => {
                e.stopPropagation();
                playPopSound(600);
                window.speakCantoneseSmart(document.getElementById('prompt-text')?.textContent || '', true);
            });
        }
    }

    // ==================== 2. 直向螢幕（Portrait）智能鏡頭縮放與窄屏防撞位 ====================
    let baseLandscapeFov = null;

    function syncPortraitCameraAndNarrowHUD() {
        if (!camera) return;
        if (baseLandscapeFov === null) {
            baseLandscapeFov = (camera.fov >= 35 && camera.fov <= 60) ? camera.fov : 45;
        }

        const w = Math.max(1, window.innerWidth);
        const h = Math.max(1, window.innerHeight);
        const aspect = w / h;

        const isWideCustomStage = ['treasure', 'addition', 'shapebridge', 'colorsplash'].includes(gameState.mode);
        const refAspect = isWideCustomStage ? 1.12 : 0.92;

        let targetFov = baseLandscapeFov;
        if (aspect < refAspect) {
            const baseRad = (baseLandscapeFov * Math.PI) / 180;
            const portraitRad = 2 * Math.atan(Math.tan(baseRad / 2) * (refAspect / Math.max(0.42, aspect)));
            targetFov = Math.min(85, (portraitRad * 180) / Math.PI);
        }

        if (Math.abs(camera.fov - targetFov) > 0.15) {
            camera.fov = targetFov;
            camera.updateProjectionMatrix();
        }

        // 直向窄手機螢幕防撞：自動收窄左下提示框並微縮右下方向盤，避免左右重疊
        const dpad = document.getElementById('treasure-dpad-bar');
        const targetBadge = document.getElementById('target-number-card');
        const promptCard = targetBadge ? targetBadge.parentElement : null;
        if (dpad && promptCard && promptCard.dataset.movedToCorner) {
            if (w < 500 && isWideCustomStage) {
                dpad.style.transformOrigin = 'bottom right';
                dpad.style.transform = 'scale(0.88)';
                promptCard.style.maxWidth = `${Math.max(195, w - 165)}px`;
            } else {
                dpad.style.transform = '';
                promptCard.style.maxWidth = '';
            }
        }
    }

    if (typeof updateCameraForAspect === 'function') {
        const _origUpdateCam = updateCameraForAspect;
        updateCameraForAspect = function () {
            _origUpdateCam();
            syncPortraitCameraAndNarrowHUD();
        };
    }

    const _prevSwitchModeForCam = switchMode;
    switchMode = function (newMode) {
        _prevSwitchModeForCam(newMode);
        syncPortraitCameraAndNarrowHUD();
    };

    window.addEventListener('resize', syncPortraitCameraAndNarrowHUD);
    window.addEventListener('orientationchange', () => setTimeout(syncPortraitCameraAndNarrowHUD, 150));

    // ==================== 3. WebGL 3D 貼圖與幾何體記憶體自動釋放（防平板閃退） ====================
    const pendingRemovedObjects = new Set();
    let disposeTimer = null;

    const TEX_PROPS = ['map', 'alphaMap', 'emissiveMap', 'bumpMap', 'normalMap', 'roughnessMap', 'metalnessMap'];

    function flushWebGLDisposalQueue() {
        disposeTimer = null;
        if (!pendingRemovedObjects.size || !scene) return;

        // 先掃描目前所有仍在場景與各模式舞台內使用緊嘅資源 UUID，確保共用模型/材質絕對唔會被誤刪
        const liveGeoms = new Set();
        const liveMats = new Set();
        const liveTexs = new Set();
        const liveNodes = new Set();

        const rootsToProtect = [
            scene,
            typeof gachaMachineGroup !== 'undefined' ? gachaMachineGroup : null,
            typeof trainGroup !== 'undefined' ? trainGroup : null,
            typeof marioStageGroup !== 'undefined' ? marioStageGroup : null,
            typeof treasureIslandGroup !== 'undefined' ? treasureIslandGroup : null,
            typeof additionArenaGroup !== 'undefined' ? additionArenaGroup : null,
            typeof shapeBridgeGroup !== 'undefined' ? shapeBridgeGroup : null,
            typeof colorSplashGroup !== 'undefined' ? colorSplashGroup : null,
            typeof environmentGroup !== 'undefined' ? environmentGroup : null
        ];

        rootsToProtect.forEach(root => {
            if (!root || typeof root.traverse !== 'function') return;
            root.traverse(node => {
                liveNodes.add(node);
                if (node.geometry) liveGeoms.add(node.geometry.uuid);
                const mats = Array.isArray(node.material) ? node.material : (node.material ? [node.material] : []);
                mats.forEach(m => {
                    liveMats.add(m.uuid);
                    TEX_PROPS.forEach(p => {
                        if (m[p] && m[p].isTexture) liveTexs.add(m[p].uuid);
                    });
                });
            });
        });

        // 安全釋放已經離開場景嘅舊題目 CanvasTexture、材質與幾何體
        pendingRemovedObjects.forEach(removedRoot => {
            if (!removedRoot || typeof removedRoot.traverse !== 'function') return;
            removedRoot.traverse(node => {
                if (liveNodes.has(node)) return;
                if (node.geometry && !liveGeoms.has(node.geometry.uuid)) {
                    node.geometry.dispose();
                }
                const mats = Array.isArray(node.material) ? node.material : (node.material ? [node.material] : []);
                mats.forEach(m => {
                    TEX_PROPS.forEach(p => {
                        if (m[p] && m[p].isTexture && !liveTexs.has(m[p].uuid)) {
                            m[p].dispose();
                        }
                    });
                    if (!liveMats.has(m.uuid)) {
                        m.dispose();
                    }
                });
            });
        });

        pendingRemovedObjects.clear();
    }

    function scheduleDisposal(objs) {
        for (let i = 0; i < objs.length; i++) {
            if (objs[i]) pendingRemovedObjects.add(objs[i]);
        }
        if (!disposeTimer && pendingRemovedObjects.size > 0) {
            disposeTimer = setTimeout(flushWebGLDisposalQueue, 300);
        }
    }

    if (typeof THREE !== 'undefined' && THREE.Object3D) {
        const _origClear = THREE.Object3D.prototype.clear;
        THREE.Object3D.prototype.clear = function () {
            if (this.children && this.children.length > 0) {
                scheduleDisposal([...this.children]);
            }
            return _origClear.apply(this, arguments);
        };

        const _origRemove = THREE.Object3D.prototype.remove;
        THREE.Object3D.prototype.remove = function () {
            if (arguments.length > 0) {
                scheduleDisposal(arguments);
            }
            return _origRemove.apply(this, arguments);
        };
    }

    // 方便喺 Console 輸入 checkWonderlandMemory() 隨時檢查貼圖與幾何體數量
    window.checkWonderlandMemory = function () {
        return renderer ? renderer.info.memory : null;
    };

    const bootStabilityPatch = () => {
        upgradeVoiceButtons();
        syncPortraitCameraAndNarrowHUD();
    };
    if (document.readyState === 'complete') setTimeout(bootStabilityPatch, 220);
    else window.addEventListener('load', () => setTimeout(bootStabilityPatch, 220));
})();
/********************************************************************
 * Patch Step 6: 1-2-3 視覺步驟流程條 + 指定練習目標鎖定 (支援全模式均衡抽題)
 * (直接貼於 main.js 最底端最後一行之後，無需刪改舊代碼)
 ********************************************************************/
(function applyFlowchartAndTargetLockPatch() {
    if (window.__wonderlandPatch6Applied) return;
    window.__wonderlandPatch6Applied = true;

    const SAVE_KEY = 'wonderland3d_save_v1';

    // 初始化設定結構
    if (!gameState.settings.lockedTargets) {
        gameState.settings.lockedTargets = { number: [], color: [], shape: [] };
    }
    if (typeof gameState.settings.showStepFlow !== 'boolean') {
        gameState.settings.showStepFlow = true;
    }

    let activeSettingsLockTab = 'number';
    const roundRobinQueues = { number: [], color: [], shape: [] };

    function persistPatch6Settings() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            const base = raw ? JSON.parse(raw) : {};
            base.stars = gameState.stars;
            base.unlockedToys = gameState.unlockedToys;
            base.settings = gameState.settings;
            base.voiceReadEnabled = window.voiceReadEnabled;
            localStorage.setItem(SAVE_KEY, JSON.stringify(base));
        } catch (e) {}
    }

    function loadPatch6Settings() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return;
            const data = JSON.parse(raw);
            if (data.settings) {
                if (data.settings.lockedTargets) {
                    gameState.settings.lockedTargets = {
                        number: Array.isArray(data.settings.lockedTargets.number) ? data.settings.lockedTargets.number.map(Number) : [],
                        color: Array.isArray(data.settings.lockedTargets.color) ? data.settings.lockedTargets.color : [],
                        shape: Array.isArray(data.settings.lockedTargets.shape) ? data.settings.lockedTargets.shape : []
                    };
                }
                if (typeof data.settings.showStepFlow === 'boolean') {
                    gameState.settings.showStepFlow = data.settings.showStepFlow;
                }
            }
        } catch (e) {}
    }

    function getFullCatalogForSubject(subj) {
        if (subj === 'color') return COLOR_CURRICULUM.map(c => c.id);
        if (subj === 'shape') return SHAPE_CURRICULUM.map(s => s.id);
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    }

    function getLockedList(subj) {
        const lt = gameState.settings.lockedTargets || {};
        const arr = Array.isArray(lt[subj]) ? lt[subj] : [];
        const validSet = new Set(getFullCatalogForSubject(subj));
        return arr.filter(item => validSet.has(subj === 'number' ? Number(item) : item));
    }

    // 均衡輪抽器：若鎖定咗 [6, 7]，確保 6 同 7 平均輪流出現，唔會偏埋一邊
    function pickNextLockedItem(subj) {
        const locked = getLockedList(subj);
        if (!locked.length) return null;
        if (locked.length === 1) return locked[0];

        let q = roundRobinQueues[subj] || [];
        q = q.filter(item => locked.includes(item));
        if (!q.length) {
            q = [...locked].sort(() => Math.random() - 0.5);
        }
        const picked = q.shift();
        roundRobinQueues[subj] = q;
        return picked;
    }

    function speakStepHint(text) {
        playPopSound(620);
        if (typeof window.speakCantoneseSmart === 'function') {
            window.speakCantoneseSmart(text, true);
        } else if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'zh-HK';
            window.speechSynthesis.speak(u);
        }
    }

    // ==================== 1. 1-2-3 視覺步驟流程條 ====================
    let lastFlowSig = '';

    function computeCurrentFlowSteps() {
        const mode = gameState.mode;

        if (mode === 'shapebridge' && typeof shapeBridgeState !== 'undefined') {
            const ph = shapeBridgeState.phase;
            let activeIdx = 0;
            if (ph === 'celebrate') activeIdx = 3;
            else if (ph === 'crossing') activeIdx = 2;
            else if (ph === 'jumping' || ph === 'hammering' || Boolean(shapeBridgeState.carryingMinion)) activeIdx = 1;
            return {
                activeIdx,
                steps: [
                    { icon: '🍄', label: '揀形狀小兵', speak: '第一步，篤蘑菇台上嘅形狀小兵' },
                    { icon: '🔨', label: '大槌打樁修橋', speak: '第二步，篤橋面缺口用黃金大槌打樁修橋' },
                    { icon: '🎢', label: '過橋食金幣', speak: '第三步，左右控制馬利奧過橋食金幣' }
                ]
            };
        }

        if (mode === 'colorsplash' && typeof colorSplashState !== 'undefined') {
            const ph = colorSplashState.phase;
            const isMix = (colorSplashState.tier === 'mix');
            const cnt = colorSplashState.tankColors ? Math.min(2, colorSplashState.tankColors.length) : 0;
            let activeIdx = 0;
            if (ph === 'celebrate') activeIdx = 3;
            else if (ph === 'crossing') activeIdx = 2;
            else if (ph === 'spraying' || Boolean(colorSplashState.loadedColor)) activeIdx = 1;
            return {
                activeIdx,
                steps: [
                    {
                        icon: isMix ? '🧪' : '🍄',
                        label: isMix ? `揀原色(${cnt}/2)` : '篤小兵裝顏料',
                        speak: isMix ? '第一步，篤兩隻原色小兵溝出新顏色' : '第一步，篤蘑菇台顏色小兵裝滿水槍'
                    },
                    { icon: '💦', label: '噴水染靚色', speak: '第二步，篤對岸白色玩具噴射染色' },
                    { icon: '🌈', label: '彩虹橋食寶石', speak: '第三步，左右控制馬利奧食晒彩虹橋上嘅寶石' }
                ]
            };
        }

        if (mode === 'addition' && typeof additionState !== 'undefined') {
            const ph = additionState.phase;
            const needSecond = (additionState.tier === 'free2' && additionState.caughtA !== null && additionState.caughtB === null);
            let activeIdx = 0;
            if (ph === 'celebrate') activeIdx = 3;
            else if (ph === 'fusing' || ph === 'readyToFire' || ph === 'firing') activeIdx = 1;
            return {
                activeIdx,
                steps: [
                    { icon: '🏃', label: needSecond ? '捉第2隻小兵' : '捉答案小兵', speak: '第一步，睇清楚算式，捉正確數字小兵' },
                    { icon: '🔥', label: '點火射飛碟', speak: '第二步，撳右下角點火發射大掣' },
                    { icon: '🎉', label: '擊退飛碟過關', speak: '第三步，成功擊退飛碟贏取星星' }
                ]
            };
        }

        if (mode === 'treasure' && typeof treasureHero !== 'undefined') {
            const total = (treasureHero.sequence || [1, 2, 3, 4, 5]).length;
            const rescued = treasureHero.rescuedSet ? treasureHero.rescuedSet.size : 0;
            let activeIdx = 0;
            if (treasureHero.castleVictoryTriggered) activeIdx = 3;
            else if (treasureHero.allRescued) activeIdx = 2;
            else if (rescued > 0) activeIdx = 1;
            return {
                activeIdx,
                steps: [
                    { icon: '🔍', label: '搵首個數字', speak: '第一步，喺迷宮搵出第一個目標數字' },
                    { icon: '🐣', label: `救齊小隊(${rescued}/${total})`, speak: '第二步，按順序救齊數字小隊排隊跟尾' },
                    { icon: '🏰', label: '衝入皇冠城堡', speak: '第三步，帶住小隊衝入北面皇冠城堡' }
                ]
            };
        }

        if (mode === 'mario' && typeof marioHero !== 'undefined') {
            let activeIdx = 0;
            if (marioHero.runningToFlag) activeIdx = 2;
            else if (marioHero.isJumping || gameState.isBusy) activeIdx = 1;
            return {
                activeIdx,
                steps: [
                    { icon: '🎯', label: '對準目標金磚', speak: '第一步，睇清楚目標牌，移去正確金磚下面' },
                    { icon: '🍄', label: '跳起頂開金磚', speak: '第二步，跳起頂開目標金磚塊' },
                    { icon: '🚩', label: '拉旗衝線過關', speak: '第三步，跑去終點旗杆過關' }
                ]
            };
        }

        if (mode === 'explore') {
            const isCelebrating = (typeof spawnedCountingItems !== 'undefined' && spawnedCountingItems.length > 0) ||
                interactiveBlocks.some(b => b.state === 'celebrate');
            return {
                activeIdx: isCelebrating ? 1 : 0,
                steps: [
                    { icon: '👆', label: '隨意篤公仔', speak: '第一步，隨便篤一個立體公仔探索' },
                    { icon: '🎵', label: '聽聲音睇寶物', speak: '第二步，聽聲音同觀察彈出嚟嘅寶物' }
                ]
            };
        }

        // 🔮 扭蛋尋寶 & 🚂 認知小火車
        let activeIdx = 0;
        if (gameState.isBusy) {
            activeIdx = (typeof spawnedCountingItems !== 'undefined' && spawnedCountingItems.length > 0) ? 1 : 2;
        }
        return {
            activeIdx,
            steps: [
                { icon: mode === 'train' ? '🚂' : '🔮', label: '搵出目標公仔', speak: '第一步，睇清楚目標提示，篤一樣嘅立體公仔' },
                { icon: gameState.settings.countObjects ? '🍎' : '✨', label: gameState.settings.countObjects ? '一齊數寶物' : '配對成功', speak: '第二步，一齊數一數彈出嚟嘅寶物' },
                { icon: '⭐', label: '贏取星星', speak: '第三步，完成任務贏取獎勵星星' }
            ]
        };
    }

    function ensureFlowchartRowElement() {
        let row = document.getElementById('visual-flowchart-row');
        if (!row) {
            row = document.createElement('div');
            row.id = 'visual-flowchart-row';
            row.className = 'w-full flex flex-wrap items-center justify-center gap-1.5 pointer-events-none';
            const stack = document.getElementById('top-hud-stack') || document.body;
            stack.appendChild(row);
        }
        return row;
    }

    window.refreshVisualStepFlowchart = function (forceRender = false) {
        const row = ensureFlowchartRowElement();
        if (gameState.inLobby) {
            row.style.display = 'none';
            return;
        }

        const showFlow = Boolean(gameState.settings.showStepFlow);
        const locked = getLockedList(gameState.subject);
        if (!showFlow && locked.length === 0) {
            row.style.display = 'none';
            return;
        }
        row.style.display = 'flex';

        const flowData = computeCurrentFlowSteps();
        const lockKeyStr = locked.join(',');
        const sig = `${gameState.subject}|${gameState.mode}|${showFlow}|${lockKeyStr}|${flowData.activeIdx}|${flowData.steps.map(s => s.label).join('/')}`;
        if (!forceRender && sig === lastFlowSig) return;
        lastFlowSig = sig;

        let html = '';

        // A. 1-2-3 視覺步驟流程條
        if (showFlow) {
            html += `<div class="pointer-events-auto inline-flex items-center gap-1 sm:gap-1.5 bg-white/92 backdrop-blur-md px-2.5 py-1 rounded-full border-2 border-teal-300 shadow-md">`;
            flowData.steps.forEach((st, idx) => {
                const isDone = idx < flowData.activeIdx;
                const isActive = idx === flowData.activeIdx;
                let pillCls = 'bg-slate-100 text-slate-400 border border-slate-200';
                let numBadge = `<span class="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-200 text-slate-500 text-[10px] sm:text-xs inline-flex items-center justify-center font-black">${idx + 1}</span>`;

                if (isDone) {
                    pillCls = 'bg-emerald-500 text-white border border-emerald-600 shadow-sm';
                    numBadge = `<span class="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white text-emerald-600 text-[10px] sm:text-xs inline-flex items-center justify-center font-black">✓</span>`;
                } else if (isActive) {
                    pillCls = 'bg-amber-400 text-slate-950 border-2 border-orange-500 shadow font-black scale-105';
                    numBadge = `<span class="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-orange-600 text-white text-[10px] sm:text-xs inline-flex items-center justify-center font-black">${idx + 1}</span>`;
                }

                const safeSpeak = st.speak.replace(/'/g, '');
                html += `<button type="button" onclick="window.__speakFlowStep('${safeSpeak}')" class="px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-extrabold inline-flex items-center gap-1 transition-all ${pillCls}" title="撳我聽步驟語音提示">${numBadge}<span>${st.icon}${st.label}</span></button>`;
                if (idx < flowData.steps.length - 1) {
                    html += `<span class="text-[10px] sm:text-xs font-black ${isDone ? 'text-emerald-500' : 'text-slate-300'}">➔</span>`;
                }
            });
            html += `</div>`;
        }

        // B. 目標鎖定提示小章（方便老師一眼睇到目前專練緊邊幾個目標，一撳即開設定修改）
        if (locked.length > 0) {
            const labels = locked.map(k => {
                const m = getCognitiveItemMeta(k, gameState.subject);
                return gameState.subject === 'number' ? String(k) : (m.badgeSymbol ? `${m.badgeSymbol}${m.title}` : m.title);
            }).join('、');
            html += `<button type="button" onclick="openTargetLockSettings()" class="pointer-events-auto btn-toy-sm bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-full border-2 border-indigo-300 shadow text-[11px] sm:text-xs font-black inline-flex items-center gap-1" title="點擊修改或解鎖練習目標"><span>🔒專練：${labels}</span></button>`;
        }

        row.innerHTML = html;
    };

    window.__speakFlowStep = speakStepHint;

    // 確保頂部容器順序整齊：[難度欄] -> [1-2-3 流程條 + 鎖定章] -> [加減算式板]
    if (typeof window.dockTopFloatingBars === 'function') {
        const _prevDock = window.dockTopFloatingBars;
        window.dockTopFloatingBars = function () {
            _prevDock();
            const stack = document.getElementById('top-hud-stack');
            const row = ensureFlowchartRowElement();
            const eqHud = document.getElementById('addition-equation-hud');
            if (stack && row) {
                if (eqHud && eqHud.parentElement === stack) {
                    stack.insertBefore(row, eqHud);
                } else if (row.parentElement !== stack) {
                    stack.appendChild(row);
                }
            }
        };
    }

    // ==================== 2. 設定面板：指定練習目標鎖定 UI ====================
    window.openTargetLockSettings = function () {
        activeSettingsLockTab = gameState.subject || 'number';
        toggleSettingsModal(true);
        renderTargetLockPanelUI();
    };

    window.switchTargetLockTab = function (subj) {
        playPopSound(520);
        activeSettingsLockTab = subj;
        renderTargetLockPanelUI();
    };

    window.toggleTargetLockItem = function (subj, rawKey) {
        playPopSound(560);
        const key = (subj === 'number') ? Number(rawKey) : String(rawKey);
        const list = getLockedList(subj);
        const idx = list.indexOf(key);
        if (idx >= 0) list.splice(idx, 1);
        else list.push(key);

        if (subj === 'number') list.sort((a, b) => a - b);
        gameState.settings.lockedTargets[subj] = list;
        roundRobinQueues[subj] = [];
        persistPatch6Settings();
        renderTargetLockPanelUI();
        refreshVisualStepFlowchart(true);

        if (gameState.subject === subj && !gameState.inLobby) {
            startNewRound();
        }
    };

    window.clearLockedTargetsFor = function (subj) {
        playPopSound(480);
        gameState.settings.lockedTargets[subj] = [];
        roundRobinQueues[subj] = [];
        persistPatch6Settings();
        renderTargetLockPanelUI();
        refreshVisualStepFlowchart(true);
        if (gameState.subject === subj && !gameState.inLobby) {
            startNewRound();
        }
    };

    window.toggleShowStepFlowSetting = function () {
        playPopSound(540);
        gameState.settings.showStepFlow = !gameState.settings.showStepFlow;
        persistPatch6Settings();
        renderTargetLockPanelUI();
        refreshVisualStepFlowchart(true);
    };

    function mountTargetLockPanelIntoSettings() {
        const settingsModal = document.getElementById('settings-modal');
        const settingsCard = settingsModal ? settingsModal.firstElementChild : null;
        if (!settingsCard) return;

        // 確保設定視窗喺 iPad 橫向或手機細螢幕可以順暢上下捲動
        settingsCard.style.maxHeight = '88vh';
        settingsCard.style.overflowY = 'auto';

        if (!document.getElementById('target-lock-settings-box')) {
            const box = document.createElement('div');
            box.id = 'target-lock-settings-box';
            box.className = 'mt-4 pt-4 border-t-2 border-slate-100 space-y-3';

            const resetBtn = document.getElementById('btn-reset-save');
            if (resetBtn && resetBtn.parentElement && resetBtn.parentElement.parentElement === settingsCard) {
                settingsCard.insertBefore(box, resetBtn.parentElement);
            } else {
                settingsCard.appendChild(box);
            }
        }
        renderTargetLockPanelUI();
    }

    function renderTargetLockPanelUI() {
        const box = document.getElementById('target-lock-settings-box');
        if (!box) return;

        const tab = activeSettingsLockTab || gameState.subject || 'number';
        const locked = getLockedList(tab);
        const catalog = getFullCatalogForSubject(tab);
        const flowOn = Boolean(gameState.settings.showStepFlow);

        const tabBtn = (id, label) => {
            const cnt = getLockedList(id).length;
            const active = (tab === id);
            const cls = active
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50';
            return `<button type="button" onclick="switchTargetLockTab('${id}')" class="flex-1 py-1.5 px-2 rounded-xl font-black text-xs sm:text-sm border-2 transition-all ${cls}">${label}${cnt > 0 ? ` (${cnt})` : ''}</button>`;
        };

        let itemsHtml = '';
        catalog.forEach(itemKey => {
            const isLocked = locked.includes(itemKey);
            const meta = getCognitiveItemMeta(itemKey, tab);
            const argStr = (tab === 'number') ? itemKey : `'${itemKey}'`;

            let labelHtml = '';
            if (tab === 'number') {
                labelHtml = `<span class="text-base sm:text-lg font-black">${itemKey}</span>`;
            } else if (tab === 'color') {
                labelHtml = `<span class="w-4 h-4 rounded-full border border-black/20 inline-block flex-shrink-0" style="background:${meta.hex}"></span><span>${meta.title}</span>`;
            } else {
                labelHtml = `<span style="color:${meta.hex}">${meta.badgeSymbol}</span><span>${meta.title}</span>`;
            }

            const pillCls = isLocked
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-amber-300 scale-105'
                : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300';

            itemsHtml += `<button type="button" onclick="toggleTargetLockItem('${tab}', ${argStr})" class="py-2 px-2.5 rounded-xl border-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-1 transition-all ${pillCls}">${isLocked ? '<span>🔒</span>' : ''}${labelHtml}</button>`;
        });

        box.innerHTML = `
            <div class="flex items-center justify-between bg-teal-50/80 px-3 py-2.5 rounded-2xl border border-teal-200">
                <div>
                    <div class="font-black text-slate-800 text-sm sm:text-base">📋 1-2-3 視覺步驟流程條</div>
                    <div class="text-xs font-bold text-slate-500">頂部顯示圖象化任務步驟，撳步驟格可發聲提示</div>
                </div>
                <button type="button" onclick="toggleShowStepFlowSetting()" class="w-14 h-8 rounded-full transition-colors p-1 flex items-center flex-shrink-0 ${flowOn ? 'bg-emerald-500' : 'bg-slate-300'}">
                    <span class="w-6 h-6 rounded-full bg-white shadow transform transition-transform ${flowOn ? 'translate-x-6' : 'translate-x-0'}"></span>
                </button>
            </div>

            <div class="bg-indigo-50/70 p-3 rounded-2xl border-2 border-indigo-200 space-y-2.5">
                <div class="flex flex-wrap items-center justify-between gap-1">
                    <div>
                        <span class="font-black text-slate-800 text-sm sm:text-base">🎯 指定練習目標鎖定（個別重點訓練）</span>
                        <p class="text-[11px] sm:text-xs font-bold text-slate-500">可勾選 1 個或多個重點目標集中抽問；唔勾選則全部隨機</p>
                    </div>
                    ${locked.length > 0
                        ? `<button type="button" onclick="clearLockedTargetsFor('${tab}')" class="btn-toy-sm bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 px-2.5 py-1 rounded-xl text-xs font-black">🔓 恢復全部隨機</button>`
                        : `<span class="text-xs font-black text-slate-400 bg-white px-2.5 py-1 rounded-xl border border-slate-200">🎲 目前：全部隨機</span>`
                    }
                </div>

                <div class="flex items-center gap-1.5">${tabBtn('number', '🔢 數字')}${tabBtn('color', '🎨 顏色')}${tabBtn('shape', '🔺 形狀')}</div>

                <div class="grid ${tab === 'number' ? 'grid-cols-5' : 'grid-cols-3'} gap-1.5 pt-1">${itemsHtml}</div>
            </div>
        `;
    }

    const _prevToggleSettings = toggleSettingsModal;
    toggleSettingsModal = function (show) {
        if (show) {
            activeSettingsLockTab = gameState.subject || 'number';
            mountTargetLockPanelIntoSettings();
        }
        _prevToggleSettings(show);
    };

    // ==================== 3. 全模式「指定練習目標鎖定」抽題攔截器 ====================

    // A. 攔截形狀修橋大作戰 (Mode 7)
    if (typeof setupShapeBridgeRound === 'function') {
        const _origSetupShapeBridge = setupShapeBridgeRound;
        setupShapeBridgeRound = function () {
            _origSetupShapeBridge();
            const lockedShapes = getLockedList('shape');
            if (!lockedShapes.length) return;

            if (shapeBridgeState.slotsContainer) shapeBridgeState.slotsContainer.clear();
            numberBlocksGroup.clear();
            interactiveBlocks = [];
            shapeBridgeState.slots = [];

            const tier = shapeBridgeState.tier || 'turtle';
            const allShapes = getFullCatalogForSubject('shape');
            let pedestalShapes = [];

            if (tier === 'split' && typeof SPLIT_BRIDGE_RECIPES !== 'undefined') {
                const matched = SPLIT_BRIDGE_RECIPES.filter(r => lockedShapes.includes(r.target) || lockedShapes.includes(r.part));
                const pool = matched.length > 0 ? matched : SPLIT_BRIDGE_RECIPES;
                const pickedRecipes = [pool[0], pool[1 % pool.length]];
                [-2.5, 2.5].forEach((xPos, idx) => {
                    shapeBridgeState.slots.push(createBridgeSlotObject(idx, xPos, pickedRecipes[idx].target, tier, pickedRecipes[idx].part));
                    pedestalShapes.push(pickedRecipes[idx].part, pickedRecipes[idx].part);
                });
            } else {
                const chosen3 = [pickNextLockedItem('shape'), pickNextLockedItem('shape'), pickNextLockedItem('shape')];
                [-3.3, 0, 3.3].forEach((xPos, idx) => {
                    shapeBridgeState.slots.push(createBridgeSlotObject(idx, xPos, chosen3[idx], tier, null));
                });
                const nonLocked = allShapes.filter(s => !lockedShapes.includes(s)).sort(() => Math.random() - 0.5);
                const distractor = nonLocked[0] || allShapes.find(s => s !== chosen3[0]) || allShapes[0];
                pedestalShapes = [...chosen3, distractor].sort(() => Math.random() - 0.5);
            }

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

            const firstReq = shapeBridgeState.slots[0].requiredShapeId;
            gameState.targetKey = firstReq;
            updateTargetBadgeUI(firstReq, false);
            updateShapeBridgeBanner();
        };
    }

    // B. 攔截魔法水槍染色 (Mode 8)
    if (typeof setupColorSplashRound === 'function') {
        const _origSetupColorSplash = setupColorSplashRound;
        setupColorSplashRound = function () {
            _origSetupColorSplash();
            const lockedColors = getLockedList('color');
            if (!lockedColors.length) return;

            colorSplashState.stageContainer.clear();
            numberBlocksGroup.clear();
            interactiveBlocks = [];
            colorSplashState.sculptures = [];

            const tier = colorSplashState.tier || 'match';
            const allColors = getFullCatalogForSubject('color');
            let targetColors = [];
            let pedestalColors = [];

            if (tier === 'mix') {
                const mixDefs = [
                    { id: 'orange', parts: ['red', 'yellow'] },
                    { id: 'green',  parts: ['blue', 'yellow'] },
                    { id: 'purple', parts: ['red', 'blue'] }
                ];
                const matched = mixDefs.filter(m => lockedColors.includes(m.id) || m.parts.some(p => lockedColors.includes(p)));
                const pool = matched.length ? matched.map(m => m.id) : ['orange', 'green', 'purple'];
                targetColors = [pool[0], pool[1 % pool.length], pool[2 % pool.length]];
                pedestalColors = ['red', 'yellow', 'blue'];
            } else {
                targetColors = [pickNextLockedItem('color'), pickNextLockedItem('color'), pickNextLockedItem('color')];
                const uniqueTargets = [...new Set(targetColors)];
                const extraPool = allColors.filter(c => !uniqueTargets.includes(c)).sort(() => Math.random() - 0.5);
                pedestalColors = [...uniqueTargets, ...extraPool].slice(0, 4).sort(() => Math.random() - 0.5);
            }

            [-3.4, 0, 3.4].forEach((sx, idx) => {
                colorSplashState.sculptures.push(createColorToySculpture(idx, sx, targetColors[idx], tier));
            });

            const pedCoords = pedestalColors.length === 3
                ? [[-3.6, 3.8], [0, 4.2], [3.6, 3.8]]
                : [[-4.5, 3.4], [-1.5, 4.1], [1.5, 4.1], [4.5, 3.4]];

            pedestalColors.forEach((cId, idx) => {
                const [px, pz] = pedCoords[idx];
                const spec = getVividSpec(cId);
                const ped = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.95, 1.05, 0.28, 26),
                    new THREE.MeshStandardMaterial({ color: spec.numHex, roughness: 0.25, emissive: spec.emissive, emissiveIntensity: 0.25 })
                );
                ped.position.set(px, 0.5, pz);
                colorSplashState.stageContainer.add(ped);

                const minion = create3DNumberCharacter(cId, px, pz, 0.74);
                minion.isArenaMinion = true;
                minion.isShapeBridgeMinion = true;
                minion.homeX = px;
                minion.homeZ = pz;
                if (minion.bodyMesh && Array.isArray(minion.bodyMesh.material)) {
                    minion.bodyMesh.material.forEach((m, mi) => {
                        if (mi !== 4) { m.color.setHex(spec.numHex); m.emissive = new THREE.Color(spec.emissive); m.emissiveIntensity = 0.22; }
                    });
                }
                interactiveBlocks.push(minion);
            });

            gameState.targetKey = targetColors[0];
            updateTargetBadgeUI(targetColors[0], false);
            updateColorSplashBanner();
        };
    }

    // C. 攔截加減法競技場 (Mode 6：集中練習鎖定數字嘅合成與分解)
    if (typeof setupAdditionRound === 'function') {
        const _origSetupAddition = setupAdditionRound;
        setupAdditionRound = function () {
            _origSetupAddition();
            const lockedNums = getLockedList('number');
            if (!lockedNums.length) return;

            const focusN = pickNextLockedItem('number');
            const isSub = (additionState.currentOp === 'sub');
            let tier = additionState.tier || 'sum5';
            let a = 1, b = 1, sum = 2;

            numberBlocksGroup.clear();
            interactiveBlocks = [];

            if (!isSub) {
                if (tier === 'missing' || focusN === 1) {
                    b = focusN;
                    a = 1 + Math.floor(Math.random() * Math.max(1, Math.min(5, 12 - b)));
                    sum = a + b;
                    additionState.numA = a; additionState.numB = b; additionState.targetSum = sum;
                    additionState.caughtA = a; additionState.caughtB = null; additionState.caughtSum = sum;
                    gameState.targetKey = b;
                    setPromptUI(`🕵️ 專練數字 ${b}【 ${a} + ? = ${sum} 】：請捉「${b}」號小兵填中間台！`, ``);
                } else if (tier === 'free2') {
                    sum = Math.max(2, focusN);
                    additionState.numA = null; additionState.numB = null; additionState.targetSum = sum;
                    additionState.caughtA = null; additionState.caughtB = null; additionState.caughtSum = sum;
                    gameState.targetKey = sum;
                    setPromptUI(`🔥 專練 ${sum} 嘅合成【 ? + ? = ${sum} 】：請捉 2 隻加埋等於 ${sum} 嘅小兵！`, ``);
                } else {
                    sum = Math.max(2, focusN);
                    a = 1 + Math.floor(Math.random() * (sum - 1));
                    b = sum - a;
                    additionState.numA = a; additionState.numB = b; additionState.targetSum = sum;
                    additionState.caughtA = a; additionState.caughtB = b; additionState.caughtSum = null;
                    gameState.targetKey = sum;
                    setPromptUI(`➕ 專練數字 ${sum}【 ${a} + ${b} = ? 】：請捉答案小兵！`, ``);
                }
            } else {
                if (tier === 'missing') {
                    b = Math.min(9, focusN);
                    sum = 1 + Math.floor(Math.random() * Math.max(1, 11 - b));
                    a = b + sum;
                    additionState.numA = a; additionState.numB = b; additionState.targetSum = sum;
                    additionState.caughtA = a; additionState.caughtB = null; additionState.caughtSum = sum;
                    gameState.targetKey = b;
                    setPromptUI(`🕵️ 專練數字 ${b}【 ${a} - ? = ${sum} 】：請捉「${b}」號小兵！`, ``);
                } else if (tier === 'free2') {
                    sum = Math.min(8, focusN);
                    additionState.numA = null; additionState.numB = null; additionState.targetSum = sum;
                    additionState.caughtA = null; additionState.caughtB = null; additionState.caughtSum = sum;
                    gameState.targetKey = sum;
                    setPromptUI(`🔥 專練減數 ${sum}【 ? - ? = ${sum} 】：請捉 2 隻相減等於 ${sum} 嘅小兵！`, ``);
                } else {
                    sum = focusN;
                    b = 1 + Math.floor(Math.random() * Math.max(1, Math.min(5, 14 - sum)));
                    a = sum + b;
                    additionState.numA = a; additionState.numB = b; additionState.targetSum = sum;
                    additionState.caughtA = a; additionState.caughtB = b; additionState.caughtSum = null;
                    gameState.targetKey = sum;
                    setPromptUI(`➖ 專練數字 ${sum}【 ${a} - ${b} = ? 】：請捉答案小兵！`, ``);
                }
            }

            refreshAdditionStagePods();
            syncAdditionBottomCard();

            let roamList = [];
            if (tier === 'free2' && focusN !== 1) {
                if (!isSub) {
                    const p1 = Math.max(1, Math.floor(sum / 2)), p2 = sum - p1;
                    roamList = [p1, p2, 1, sum - 1, Math.max(1, (sum + 2) % 9)].sort(() => Math.random() - 0.5);
                } else {
                    const p1 = sum + 2, p3 = Math.min(12, sum + 4);
                    roamList = [p1, 2, p3, p3 - sum, sum + 1].sort(() => Math.random() - 0.5);
                }
            } else {
                const ans = gameState.targetKey;
                const cands = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter(n => n !== ans).sort(() => Math.random() - 0.5);
                roamList = [ans, cands[0], cands[1], cands[2]].sort(() => Math.random() - 0.5);
            }

            const startCoords = [{ x: -4.2, z: 1.6 }, { x: 4.2, z: 1.6 }, { x: -2.4, z: 3.6 }, { x: 2.4, z: 3.6 }, { x: 0, z: 2.2 }];
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
        };
    }

    // D. 攔截迷宮救兵 (Mode 5：確保迷宮數列包含鎖定嘅目標數字)
    if (typeof setupTreasureRound === 'function') {
        const _origSetupTreasure = setupTreasureRound;
        setupTreasureRound = function () {
            const lockedNums = getLockedList('number');
            if (!lockedNums.length) {
                _origSetupTreasure();
                return;
            }
            const focusN = pickNextLockedItem('number');
            const prevRange = gameState.settings.range;
            gameState.settings.range = (focusN >= 6) ? '6-10' : '1-5';
            _origSetupTreasure();
            gameState.settings.range = prevRange;
        };
    }

    // E. 攔截自由探索 (Mode 4：若鎖定目標則只展示鎖定公仔，減少視覺干擾)
    if (typeof setupExploreMode === 'function') {
        const _origSetupExplore = setupExploreMode;
        setupExploreMode = function () {
            const locked = getLockedList(gameState.subject);
            if (!locked.length) {
                _origSetupExplore();
                return;
            }
            updateTargetBadgeUI(null, true);
            const spacing = locked.length > 5 ? 1.92 : 2.35;
            const startX = -((locked.length - 1) * spacing) / 2;
            locked.forEach((itemKey, idx) => {
                const xPos = startX + idx * spacing;
                const zPos = 0.55 + Math.abs(idx - (locked.length - 1) / 2) * 0.25;
                interactiveBlocks.push(create3DNumberCharacter(itemKey, xPos, zPos, locked.length > 5 ? 0.84 : 0.96));
            });
            setPromptUI(`自由探索（已鎖定 ${locked.length} 個重點目標）：隨便篤立體公仔探索啦！`, ``);
        };
    }

    // F. 攔截基礎三選一模式 (扭蛋 gacha / 火車 train / 頂磚 mario)
    const _prevStartRound = startNewRound;
    startNewRound = function () {
        const isBasicMode = ['gacha', 'train', 'mario'].includes(gameState.mode);
        const locked = getLockedList(gameState.subject);

        if (!isBasicMode || locked.length === 0) {
            _prevStartRound();
            refreshVisualStepFlowchart(true);
            return;
        }

        clearTimeout(autoPromptTimer);
        clearCountingObjects();
        numberBlocksGroup.clear();
        interactiveBlocks = [];
        gameState.isBusy = false;

        ['addition-fire-btn', 'shape-slam-btn', 'color-splash-btn'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
        if (typeof colorSplashGroup !== 'undefined') colorSplashGroup.visible = false;

        const target = pickNextLockedItem(gameState.subject);
        const fullPool = getFullCatalogForSubject(gameState.subject);
        gameState.targetKey = target;
        gameState.targetNumber = target;
        updateTargetBadgeUI(target, false);

        const numChoices = gameState.settings.choices;
        const distractors = fullPool.filter(k => k !== target).sort(() => Math.random() - 0.5);
        const choices = [target, ...distractors.slice(0, numChoices - 1)].sort(() => Math.random() - 0.5);
        gameState.currentOptions = choices;

        const meta = getCognitiveItemMeta(target);

        if (gameState.mode === 'mario') {
            setupMarioRound(choices, target, meta);
            if (!gameState.inLobby) scheduleAutoVisualPrompt();
            refreshVisualStepFlowchart(true);
            return;
        }

        const spacing = numChoices === 1 ? 0 : (numChoices === 2 ? 3.4 : 3.1);
        const startX = -((numChoices - 1) * spacing) / 2;
        choices.forEach((itemKey, idx) => {
            interactiveBlocks.push(create3DNumberCharacter(itemKey, startX + idx * spacing, 1.35, 1.08));
        });

        if (gameState.mode === 'gacha') {
            setPromptUI(`請搵出「${meta.title}」扭蛋尋寶！`, ``);
        } else if (gameState.mode === 'train') {
            updateTrainSignTexture(target);
            trainAnimState.currentX = -12;
            trainAnimState.targetX = 0;
            playTrainWhistle();
            setPromptUI(`小火車載住「${meta.title}」，請搵出一樣嘅積木公仔！`, ``);
        }

        if (!gameState.inLobby) scheduleAutoVisualPrompt();
        refreshVisualStepFlowchart(true);
    };

    const _prevOpenLobby = openLobby;
    openLobby = function (step = 'subject') {
        _prevOpenLobby(step);
        refreshVisualStepFlowchart(true);
    };

    // 每幀輕量同步步驟高亮（只有步驟真正改變時先更新 DOM，零效能負擔）
    const _prevAnim = animate;
    animate = function () {
        _prevAnim();
        refreshVisualStepFlowchart(false);
    };

    const bootPatch6 = () => {
        loadPatch6Settings();
        mountTargetLockPanelIntoSettings();
        if (typeof window.dockTopFloatingBars === 'function') window.dockTopFloatingBars();
        refreshVisualStepFlowchart(true);
    };
    if (document.readyState === 'complete') setTimeout(bootPatch6, 260);
    else window.addEventListener('load', () => setTimeout(bootPatch6, 260));
})();
