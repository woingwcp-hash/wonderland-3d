/********************************************************************
 * [FILE: category-game.js]
 * Mode 9: 🧺 水果與交通工具 3D 語義分類大挑戰 (K2 臨床訓練模組)
 * 直接掛載於《數字奇幻樂園》Three.js 引擎，免修改 scene3d.js / main.js
 ********************************************************************/
(function initWonderlandCategoryGame() {
    if (window.__wonderlandCategoryGameLoaded) return;
    window.__wonderlandCategoryGameLoaded = true;

    // ==================== 1. 香港日常詞彙庫與手繪風 Canvas 圖卡資料 ====================
    const CATEGORY_ITEMS = {
        // 水果類 (Fruits)
        apple:      { id: 'apple',      name: '蘋果',     category: 'fruit',   praise: '「蘋果」紅卜卜又爽甜，係水果嚟㗎！' },
        banana:     { id: 'banana',     name: '香蕉',     category: 'fruit',   praise: '「香蕉」剝開皮就食得，係水果嚟㗎！' },
        orange:     { id: 'orange',     name: '橙',       category: 'fruit',   praise: '「橙」酸酸甜甜多維他命，係水果嚟㗎！' },
        strawberry: { id: 'strawberry', name: '士多啤梨', category: 'fruit',   praise: '「士多啤梨」香甜好味，係水果嚟㗎！' },
        grapes:     { id: 'grapes',     name: '提子',     category: 'fruit',   praise: '「提子」一串串甜甜哋，係水果嚟㗎！' },
        watermelon: { id: 'watermelon', name: '西瓜',     category: 'fruit',   praise: '「西瓜」多汁又消暑，係水果嚟㗎！' },
        mango:      { id: 'mango',      name: '芒果',     category: 'fruit',   praise: '「芒果」黃澄澄好香甜，係水果嚟㗎！' },
        pineapple:  { id: 'pineapple',  name: '菠蘿',     category: 'fruit',   praise: '「菠蘿」酸甜開胃，係水果嚟㗎！' },
        pear:       { id: 'pear',       name: '梨',       category: 'fruit',   praise: '「梨」清甜多汁，係水果嚟㗎！' },
        kiwi:       { id: 'kiwi',       name: '奇異果',   category: 'fruit',   praise: '「奇異果」切開綠油油，係水果嚟㗎！' },

        // 交通工具類 (Hong Kong Vehicles)
        bus:        { id: 'bus',        name: '雙層巴士', category: 'vehicle', praise: '「雙層巴士」載好多人出街，係交通工具！' },
        taxi:       { id: 'taxi',       name: '的士',     category: 'vehicle', praise: '紅色「的士」喺馬路載客，係交通工具！' },
        minibus:    { id: 'minibus',    name: '小巴',     category: 'vehicle', praise: '「小巴」載我哋去唔同地方，係交通工具！' },
        mtr:        { id: 'mtr',        name: '港鐵',     category: 'vehicle', praise: '「港鐵」喺路軌飛快行駛，係交通工具！' },
        ferry:      { id: 'ferry',      name: '渡輪',     category: 'vehicle', praise: '「渡輪」喺海面載人過海，係交通工具！' },
        tram:       { id: 'tram',       name: '電車',     category: 'vehicle', praise: '叮叮「電車」喺港島行駛，係交通工具！' },
        firetruck:  { id: 'firetruck',  name: '消防車',   category: 'vehicle', praise: '「消防車」載消防員去救火，係交通工具！' },
        ambulance:  { id: 'ambulance',  name: '救護車',   category: 'vehicle', praise: '「救護車」載病人去醫院，係交通工具！' },
        bicycle:    { id: 'bicycle',    name: '單車',     category: 'vehicle', praise: '「單車」有兩個轆踩去公園，係交通工具！' },
        airplane:   { id: 'airplane',   name: '飛機',     category: 'vehicle', praise: '「飛機」喺天空載人去旅行，係交通工具！' }
    };

    // 10 題臨床訓練題庫（每題 4 個選項）
    const CATEGORY_QUESTION_BANK = [
        { qNo: 1,  targetCat: 'fruit',   answer: 'apple',      distractors: ['bus', 'taxi', 'airplane'],          dualPair: ['apple', 'orange', 'bus', 'taxi'] },
        { qNo: 2,  targetCat: 'vehicle', answer: 'bus',        distractors: ['banana', 'orange', 'watermelon'],   dualPair: ['bus', 'airplane', 'banana', 'watermelon'] },
        { qNo: 3,  targetCat: 'fruit',   answer: 'banana',     distractors: ['taxi', 'firetruck', 'bicycle'],     dualPair: ['banana', 'pear', 'taxi', 'bicycle'] },
        { qNo: 4,  targetCat: 'vehicle', answer: 'taxi',       distractors: ['apple', 'grapes', 'strawberry'],    dualPair: ['taxi', 'firetruck', 'apple', 'strawberry'] },
        { qNo: 5,  targetCat: 'fruit',   answer: 'strawberry', distractors: ['mtr', 'minibus', 'airplane'],       dualPair: ['strawberry', 'grapes', 'mtr', 'minibus'] },
        { qNo: 6,  targetCat: 'vehicle', answer: 'mtr',        distractors: ['orange', 'mango', 'pineapple'],     dualPair: ['mtr', 'tram', 'orange', 'mango'] },
        { qNo: 7,  targetCat: 'fruit',   answer: 'grapes',     distractors: ['minibus', 'tram', 'ambulance'],     dualPair: ['grapes', 'pineapple', 'tram', 'ambulance'] },
        { qNo: 8,  targetCat: 'vehicle', answer: 'minibus',    distractors: ['watermelon', 'pear', 'kiwi'],       dualPair: ['minibus', 'bicycle', 'pear', 'kiwi'] },
        { qNo: 9,  targetCat: 'fruit',   answer: 'watermelon', distractors: ['ferry', 'bicycle', 'firetruck'],    dualPair: ['watermelon', 'mango', 'ferry', 'firetruck'] },
        { qNo: 10, targetCat: 'vehicle', answer: 'ferry',      distractors: ['mango', 'pineapple', 'kiwi'],       dualPair: ['ferry', 'ambulance', 'pineapple', 'kiwi'] }
    ];

    // ==================== 2. 狀態管理 ====================
    const categorySortGroup = new THREE.Group();
    window.categorySortGroup = categorySortGroup;

    const catSortState = {
        built: false,
        subMode: 'single', // 'single' = 標準四選一拖放 | 'dual' = 雙籃四卡全分類
        qIndex: 0,         // 0 ~ 9 (共10題)
        hadRetryThisQ: false,
        firstTryCount: 0,
        retrySolvedCount: 0,
        questionSolved: false,
        sessionFinished: false,
        zones: [],
        optionCards: [],
        draggingCard: null,
        selectedCard: null,
        dragStartPos: { x: 0, y: 0 },
        pointerMovedDist: 0,
        hoveredZone: null,
        heroMesh: null,
        heroCheerTimer: 0,
        stageItemsGroup: null
    };
    window.catSortState = catSortState;

    function speakCatText(text, force = false) {
        if (typeof window.speakCantoneseSmart === 'function') {
            window.speakCantoneseSmart(text, force);
        } else if (window.voiceReadEnabled !== false && 'speechSynthesis' in window && text) {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'zh-HK';
            u.rate = 0.94;
            window.speechSynthesis.speak(u);
        }
    }

    function catRoundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    // ==================== 3. 繪製香港特色清晰插畫圖卡 (512x512 Canvas) ====================
    function drawCategoryIllustration(ctx, id) {
        ctx.save();
        ctx.translate(256, 200);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        const drawWheel = (wx, wy, r = 28) => {
            ctx.fillStyle = '#1E293B';
            ctx.beginPath(); ctx.arc(wx, wy, r, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#CBD5E1';
            ctx.beginPath(); ctx.arc(wx, wy, r * 0.48, 0, Math.PI * 2); ctx.fill();
        };

        switch (id) {
            case 'apple':
                ctx.fillStyle = '#EF4444';
                ctx.beginPath();
                ctx.arc(-32, 12, 78, 0, Math.PI * 2);
                ctx.arc(32, 12, 78, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#78350F'; ctx.lineWidth = 12;
                ctx.beginPath(); ctx.moveTo(0, -52); ctx.quadraticCurveTo(8, -95, 22, -102); ctx.stroke();
                ctx.fillStyle = '#22C55E';
                ctx.beginPath(); ctx.ellipse(42, -82, 34, 16, -0.35, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.55)';
                ctx.beginPath(); ctx.ellipse(-52, -18, 16, 30, -0.4, 0, Math.PI * 2); ctx.fill();
                break;

            case 'banana':
                ctx.strokeStyle = '#FACC15'; ctx.lineWidth = 46;
                ctx.beginPath(); ctx.arc(-15, -35, 118, 0.25, 1.95); ctx.stroke();
                ctx.strokeStyle = '#FDE047'; ctx.lineWidth = 20;
                ctx.beginPath(); ctx.arc(-15, -42, 112, 0.32, 1.88); ctx.stroke();
                ctx.fillStyle = '#78350F';
                ctx.beginPath(); ctx.arc(98, -6, 14, 0, Math.PI * 2); ctx.fill();
                break;

            case 'orange':
                ctx.fillStyle = '#FB923C';
                ctx.beginPath(); ctx.arc(0, 12, 92, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#EA580C'; ctx.lineWidth = 6; ctx.stroke();
                ctx.fillStyle = '#16A34A';
                ctx.beginPath(); ctx.ellipse(26, -84, 34, 15, -0.3, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#FED7AA';
                [[-32, -18], [28, 35], [40, -10], [-20, 42]].forEach(([dx, dy]) => {
                    ctx.beginPath(); ctx.arc(dx, dy, 5, 0, Math.PI * 2); ctx.fill();
                });
                break;

            case 'strawberry':
                ctx.fillStyle = '#F43F5E';
                ctx.beginPath();
                ctx.moveTo(0, 108);
                ctx.bezierCurveTo(-110, 45, -105, -70, 0, -68);
                ctx.bezierCurveTo(105, -70, 110, 45, 0, 108);
                ctx.fill();
                ctx.fillStyle = '#16A34A';
                [-42, 0, 42].forEach(lx => {
                    ctx.beginPath(); ctx.ellipse(lx, -72, 32, 16, lx * 0.008, 0, Math.PI * 2); ctx.fill();
                });
                ctx.fillStyle = '#FEF08A';
                [[-38, -18], [0, -22], [38, -18], [-25, 22], [25, 22], [0, 58]].forEach(([sx, sy]) => {
                    ctx.beginPath(); ctx.ellipse(sx, sy, 5, 8, 0, 0, Math.PI * 2); ctx.fill();
                });
                break;

            case 'grapes':
                ctx.strokeStyle = '#78350F'; ctx.lineWidth = 10;
                ctx.beginPath(); ctx.moveTo(0, -65); ctx.lineTo(0, -105); ctx.stroke();
                ctx.fillStyle = '#22C55E';
                ctx.beginPath(); ctx.ellipse(32, -88, 30, 15, -0.3, 0, Math.PI * 2); ctx.fill();
                [[-56, -38], [0, -38], [56, -38], [-28, 8], [28, 8], [-54, 10], [54, 10], [-26, 54], [26, 54], [0, 94]].forEach(([gx, gy]) => {
                    ctx.fillStyle = '#9333EA';
                    ctx.beginPath(); ctx.arc(gx, gy, 30, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = 'rgba(255,255,255,0.35)';
                    ctx.beginPath(); ctx.arc(gx - 8, gy - 8, 8, 0, Math.PI * 2); ctx.fill();
                });
                break;

            case 'watermelon':
                ctx.fillStyle = '#15803D';
                ctx.beginPath(); ctx.arc(0, -25, 122, 0, Math.PI, false); ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#BBF7D0';
                ctx.beginPath(); ctx.arc(0, -25, 106, 0, Math.PI, false); ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#EF4444';
                ctx.beginPath(); ctx.arc(0, -25, 94, 0, Math.PI, false); ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#0F172A';
                [[-45, 5], [0, 12], [45, 5], [-22, 38], [22, 38]].forEach(([sx, sy]) => {
                    ctx.beginPath(); ctx.ellipse(sx, sy, 5, 9, 0, 0, Math.PI * 2); ctx.fill();
                });
                break;

            case 'mango':
                ctx.save(); ctx.rotate(-0.35);
                ctx.fillStyle = '#FBBF24';
                ctx.beginPath(); ctx.ellipse(0, 8, 96, 68, 0, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#D97706'; ctx.lineWidth = 6; ctx.stroke();
                ctx.restore();
                ctx.fillStyle = '#16A34A';
                ctx.beginPath(); ctx.ellipse(42, -74, 34, 15, 0.3, 0, Math.PI * 2); ctx.fill();
                break;

            case 'pineapple':
                ctx.fillStyle = '#16A34A';
                [-32, 0, 32].forEach(px => {
                    ctx.beginPath(); ctx.moveTo(px - 22, -45); ctx.lineTo(px, -112); ctx.lineTo(px + 22, -45); ctx.fill();
                });
                ctx.fillStyle = '#F59E0B';
                ctx.beginPath(); ctx.ellipse(0, 24, 72, 84, 0, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#B45309'; ctx.lineWidth = 5;
                [-30, 0, 30].forEach(lx => {
                    ctx.beginPath(); ctx.moveTo(lx - 35, -35); ctx.lineTo(lx + 35, 80); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(lx + 35, -35); ctx.lineTo(lx - 35, 80); ctx.stroke();
                });
                break;

            case 'pear':
                ctx.fillStyle = '#A3E635';
                ctx.beginPath(); ctx.arc(0, 38, 72, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(0, -32, 46, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#78350F'; ctx.lineWidth = 10;
                ctx.beginPath(); ctx.moveTo(0, -76); ctx.lineTo(8, -106); ctx.stroke();
                ctx.fillStyle = '#16A34A';
                ctx.beginPath(); ctx.ellipse(30, -90, 26, 13, -0.3, 0, Math.PI * 2); ctx.fill();
                break;

            case 'kiwi':
                ctx.fillStyle = '#92400E';
                ctx.beginPath(); ctx.arc(0, 8, 94, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#84CC16';
                ctx.beginPath(); ctx.arc(0, 8, 78, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ECFCCB';
                ctx.beginPath(); ctx.arc(0, 8, 32, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#0F172A';
                for (let a = 0; a < 10; a++) {
                    const ang = (a / 10) * Math.PI * 2;
                    ctx.beginPath(); ctx.arc(Math.cos(ang) * 46, 8 + Math.sin(ang) * 46, 4.5, 0, Math.PI * 2); ctx.fill();
                }
                break;

            case 'bus': // 香港雙層巴士
                ctx.fillStyle = '#D97706';
                catRoundRect(ctx, -130, -82, 260, 150, 22); ctx.fill();
                ctx.fillStyle = '#EF4444';
                ctx.fillRect(-130, -8, 260, 14);
                ctx.fillStyle = '#E0F2FE';
                [-95, -35, 25, 80].forEach(wx => {
                    catRoundRect(ctx, wx, -68, 42, 46, 8); ctx.fill();
                    catRoundRect(ctx, wx, 14, 42, 40, 8); ctx.fill();
                });
                drawWheel(-75, 72, 30); drawWheel(75, 72, 30);
                break;

            case 'taxi': // 香港紅色的士
                ctx.fillStyle = '#F8FAFC';
                catRoundRect(ctx, -34, -84, 68, 24, 8); ctx.fill();
                ctx.strokeStyle = '#EF4444'; ctx.lineWidth = 4; ctx.stroke();
                ctx.fillStyle = '#E2E8F0';
                ctx.beginPath(); ctx.moveTo(-82, -12); ctx.lineTo(-52, -62); ctx.lineTo(52, -62); ctx.lineTo(86, -12); ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#EF4444';
                catRoundRect(ctx, -132, -14, 264, 78, 22); ctx.fill();
                ctx.fillStyle = '#38BDF8';
                ctx.fillRect(-46, -52, 40, 34); ctx.fillRect(6, -52, 42, 34);
                drawWheel(-76, 68, 30); drawWheel(76, 68, 30);
                break;

            case 'minibus': // 香港小巴
                ctx.fillStyle = '#FEF3C7';
                catRoundRect(ctx, -126, -62, 252, 130, 26); ctx.fill();
                ctx.strokeStyle = '#D97706'; ctx.lineWidth = 5; ctx.stroke();
                ctx.fillStyle = '#EF4444';
                catRoundRect(ctx, -124, -62, 248, 28, 18); ctx.fill();
                ctx.fillStyle = '#BAE6FD';
                [-95, -35, 25, 78].forEach(wx => { catRoundRect(ctx, wx, -24, 42, 42, 8); ctx.fill(); });
                drawWheel(-74, 72, 28); drawWheel(74, 72, 28);
                break;

            case 'mtr': // 港鐵列車
                ctx.strokeStyle = '#64748B'; ctx.lineWidth = 10;
                ctx.beginPath(); ctx.moveTo(-145, 78); ctx.lineTo(145, 78); ctx.stroke();
                ctx.fillStyle = '#F1F5F9';
                catRoundRect(ctx, -135, -62, 270, 128, 30); ctx.fill();
                ctx.strokeStyle = '#334155'; ctx.lineWidth = 6; ctx.stroke();
                ctx.fillStyle = '#E11D48';
                ctx.fillRect(-133, 14, 266, 18);
                ctx.fillStyle = '#38BDF8';
                [-95, -25, 45].forEach(wx => { catRoundRect(ctx, wx, -42, 50, 44, 10); ctx.fill(); });
                break;

            case 'ferry': // 天星小輪渡輪
                ctx.fillStyle = '#FFFBEB';
                catRoundRect(ctx, -88, -68, 176, 62, 12); ctx.fill();
                ctx.fillStyle = '#D97706';
                ctx.fillRect(-16, -98, 32, 30);
                ctx.fillStyle = '#15803D';
                ctx.beginPath(); ctx.moveTo(-132, -8); ctx.lineTo(132, -8); ctx.lineTo(102, 58); ctx.lineTo(-102, 58); ctx.closePath(); ctx.fill();
                ctx.strokeStyle = '#0284C7'; ctx.lineWidth = 12;
                ctx.beginPath(); ctx.moveTo(-140, 72); ctx.quadraticCurveTo(-70, 52, 0, 72); ctx.quadraticCurveTo(70, 92, 140, 72); ctx.stroke();
                break;

            case 'tram': // 香港雙層電車
                ctx.strokeStyle = '#475569'; ctx.lineWidth = 7;
                ctx.beginPath(); ctx.moveTo(0, -88); ctx.lineTo(24, -114); ctx.lineTo(-24, -114); ctx.closePath(); ctx.stroke();
                ctx.fillStyle = '#15803D';
                catRoundRect(ctx, -78, -88, 156, 160, 16); ctx.fill();
                ctx.fillStyle = '#FEF08A';
                [-56, -12, 32].forEach(wx => {
                    ctx.fillRect(wx, -72, 30, 42);
                    ctx.fillRect(wx, 6, 30, 38);
                });
                drawWheel(-42, 76, 22); drawWheel(42, 76, 22);
                break;

            case 'firetruck': // 消防車
                ctx.fillStyle = '#E2E8F0';
                ctx.fillRect(-115, -82, 180, 18);
                ctx.fillStyle = '#38BDF8';
                catRoundRect(ctx, 72, -82, 28, 22, 8); ctx.fill();
                ctx.fillStyle = '#DC2626';
                catRoundRect(ctx, -130, -60, 260, 126, 20); ctx.fill();
                ctx.fillStyle = '#BAE6FD';
                catRoundRect(ctx, 52, -44, 64, 48, 10); ctx.fill();
                ctx.fillStyle = '#FACC15';
                ctx.fillRect(-130, 16, 260, 14);
                drawWheel(-76, 70, 30); drawWheel(76, 70, 30);
                break;

            case 'ambulance': // 救護車
                ctx.fillStyle = '#38BDF8';
                catRoundRect(ctx, 56, -80, 30, 20, 8); ctx.fill();
                ctx.fillStyle = '#FFFFFF';
                catRoundRect(ctx, -128, -60, 256, 126, 22); ctx.fill();
                ctx.strokeStyle = '#94A3B8'; ctx.lineWidth = 6; ctx.stroke();
                ctx.fillStyle = '#EF4444';
                ctx.fillRect(-62, -26, 52, 16); ctx.fillRect(-44, -44, 16, 52);
                ctx.fillRect(-126, 26, 252, 14);
                ctx.fillStyle = '#BAE6FD';
                catRoundRect(ctx, 48, -42, 66, 46, 10); ctx.fill();
                drawWheel(-74, 70, 29); drawWheel(74, 70, 29);
                break;

            case 'bicycle': // 單車
                ctx.strokeStyle = '#0F172A'; ctx.lineWidth = 12;
                ctx.beginPath(); ctx.arc(-78, 42, 46, 0, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.arc(78, 42, 46, 0, Math.PI * 2); ctx.stroke();
                ctx.strokeStyle = '#0284C7'; ctx.lineWidth = 12;
                ctx.beginPath();
                ctx.moveTo(-78, 42); ctx.lineTo(-10, -24); ctx.lineTo(64, -24); ctx.lineTo(78, 42);
                ctx.moveTo(-78, 42); ctx.lineTo(12, 42); ctx.lineTo(-10, -24);
                ctx.stroke();
                ctx.strokeStyle = '#334155'; ctx.lineWidth = 10;
                ctx.beginPath(); ctx.moveTo(64, -24); ctx.lineTo(50, -64); ctx.lineTo(78, -68); ctx.stroke();
                ctx.fillStyle = '#EA580C';
                catRoundRect(ctx, -34, -42, 44, 16, 8); ctx.fill();
                break;

            case 'airplane': // 飛機
                ctx.fillStyle = '#0284C7';
                ctx.beginPath(); ctx.moveTo(-120, -10); ctx.lineTo(-142, -74); ctx.lineTo(-88, -10); ctx.closePath(); ctx.fill();
                ctx.beginPath(); ctx.moveTo(-25, 10); ctx.lineTo(-55, 86); ctx.lineTo(35, 10); ctx.closePath(); ctx.fill();
                ctx.beginPath(); ctx.moveTo(-20, -18); ctx.lineTo(-48, -82); ctx.lineTo(28, -18); ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#F8FAFC';
                ctx.beginPath(); ctx.ellipse(8, 0, 135, 38, 0, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#0284C7'; ctx.lineWidth = 6; ctx.stroke();
                ctx.fillStyle = '#38BDF8';
                [-60, -25, 10, 45, 80].forEach(wx => {
                    ctx.beginPath(); ctx.arc(wx, -4, 9, 0, Math.PI * 2); ctx.fill();
                });
                break;
        }
        ctx.restore();
    }

    function createOptionCardTexture(itemObj, isSolved = false) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 560;
        const ctx = canvas.getContext('2d');

        // 統一柔和暖白底色，避免幼兒靠邊框顏色估答案
        ctx.fillStyle = isSolved ? '#DCFCE7' : '#FFFDF7';
        catRoundRect(ctx, 12, 12, 488, 536, 56);
        ctx.fill();

        ctx.lineWidth = 16;
        ctx.strokeStyle = isSolved ? '#22C55E' : '#F59E0B';
        catRoundRect(ctx, 18, 18, 476, 524, 50);
        ctx.stroke();

        // 上方柔和淺景圓底
        ctx.fillStyle = isSolved ? '#BBF7D0' : '#FEF3C7';
        ctx.beginPath();
        ctx.arc(256, 200, 148, 0, Math.PI * 2);
        ctx.fill();

        drawCategoryIllustration(ctx, itemObj.id);

        // 下方香港繁體中文名稱
        ctx.fillStyle = '#0F172A';
        ctx.font = '900 76px "Noto Sans TC", "PingFang HK", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(itemObj.name, 256, 448);

        if (isSolved) {
            ctx.fillStyle = '#16A34A';
            ctx.beginPath(); ctx.arc(432, 82, 46, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '900 58px sans-serif';
            ctx.fillText('✓', 432, 86);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    // ==================== 4. 建立 3D 分類舞台、3D 水果果籃與交通工具車站 ====================
    function ensure3DCategoryStageBuilt() {
        if (catSortState.built) return;
        catSortState.built = true;
        categorySortGroup.clear();
        categorySortGroup.visible = false;
        if (scene) scene.add(categorySortGroup);

        // 1. 清爽無干擾陽光草地舞台
        const sandBase = new THREE.Mesh(
            new THREE.BoxGeometry(18.6, 0.3, 11.4),
            new THREE.MeshStandardMaterial({ color: 0xFDE68A, roughness: 0.8 })
        );
        sandBase.position.set(0, 0.1, 0.4);
        categorySortGroup.add(sandBase);

        const meadow = new THREE.Mesh(
            new THREE.BoxGeometry(17.8, 0.36, 10.6),
            new THREE.MeshStandardMaterial({ color: 0x86EFAC, roughness: 0.72 })
        );
        meadow.position.set(0, 0.18, 0.4);
        meadow.receiveShadow = true;
        categorySortGroup.add(meadow);

        // 南岸 4 個選項擺放軟墊區
        const cardDockStrip = new THREE.Mesh(
            new THREE.BoxGeometry(13.8, 0.05, 2.8),
            new THREE.MeshStandardMaterial({ color: 0xFEF9C3, roughness: 0.65 })
        );
        cardDockStrip.position.set(0, 0.37, 2.55);
        categorySortGroup.add(cardDockStrip);

        // 2. 馬利奧啦啦隊隊長（企喺舞台後方拍手鼓勵）
        if (typeof marioHero !== 'undefined' && marioHero.group) {
            const hero = marioHero.group.clone();
            hero.scale.setScalar(0.88);
            hero.position.set(0, 0.36, -3.55);
            catSortState.heroMesh = hero;
            categorySortGroup.add(hero);
        }

        catSortState.stageItemsGroup = new THREE.Group();
        categorySortGroup.add(catSortState.stageItemsGroup);
    }

    function create3DCategoryZone(categoryType, x, z) {
        const isFruit = (categoryType === 'fruit');
        const group = new THREE.Group();
        group.position.set(x, 0.36, z);

        // 底部柔和磁吸/提示光環
        const glowRingMat = new THREE.MeshBasicMaterial({
            color: isFruit ? 0xFB7185 : 0x38BDF8,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.55
        });
        const glowRing = new THREE.Mesh(new THREE.RingGeometry(1.75, 2.15, 36), glowRingMat);
        glowRing.rotation.x = -Math.PI / 2;
        glowRing.position.y = 0.04;
        group.add(glowRing);

        if (isFruit) {
            // 🧺 3D 立體藤編野餐水果籃
            const basketBody = new THREE.Mesh(
                new THREE.CylinderGeometry(1.58, 1.18, 0.86, 28),
                new THREE.MeshStandardMaterial({ color: 0xD97706, roughness: 0.6 })
            );
            basketBody.position.y = 0.44;
            group.add(basketBody);

            const innerCloth = new THREE.Mesh(
                new THREE.CylinderGeometry(1.44, 1.1, 0.2, 26),
                new THREE.MeshStandardMaterial({ color: 0xFFE4E6, roughness: 0.5 })
            );
            innerCloth.position.y = 0.82;
            group.add(innerCloth);

            const rim = new THREE.Mesh(
                new THREE.TorusGeometry(1.56, 0.13, 12, 32),
                new THREE.MeshStandardMaterial({ color: 0xB45309, roughness: 0.5 })
            );
            rim.rotation.x = Math.PI / 2;
            rim.position.y = 0.86;
            group.add(rim);

            const handle = new THREE.Mesh(
                new THREE.TorusGeometry(1.48, 0.09, 12, 28, Math.PI),
                new THREE.MeshStandardMaterial({ color: 0x92400E, roughness: 0.5 })
            );
            handle.position.set(0, 0.86, -0.15);
            group.add(handle);
        } else {
            // 🚏 3D 立體香港交通工具車站台
            const stationPad = new THREE.Mesh(
                new THREE.CylinderGeometry(1.62, 1.72, 0.34, 32),
                new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.55 })
            );
            stationPad.position.y = 0.17;
            group.add(stationPad);

            const yellowCurb = new THREE.Mesh(
                new THREE.TorusGeometry(1.64, 0.11, 12, 32),
                new THREE.MeshStandardMaterial({ color: 0xFACC15, roughness: 0.35 })
            );
            yellowCurb.rotation.x = Math.PI / 2;
            yellowCurb.position.y = 0.33;
            group.add(yellowCurb);

            [-0.75, -0.25, 0.25, 0.75].forEach(sx => {
                const stripe = new THREE.Mesh(
                    new THREE.BoxGeometry(0.26, 0.04, 1.5),
                    new THREE.MeshBasicMaterial({ color: 0xF8FAFC })
                );
                stripe.position.set(sx, 0.36, 0);
                group.add(stripe);
            });

            // 巴士站牌柱
            const pole = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.08, 1.7, 12),
                new THREE.MeshStandardMaterial({ color: 0xE2E8F0, roughness: 0.4 })
            );
            pole.position.set(1.45, 0.95, -0.45);
            const stopDisc = new THREE.Mesh(
                new THREE.CylinderGeometry(0.36, 0.36, 0.1, 20),
                new THREE.MeshStandardMaterial({ color: 0xEF4444, roughness: 0.35 })
            );
            stopDisc.rotation.x = Math.PI / 2;
            stopDisc.position.set(1.45, 1.85, -0.45);
            group.add(pole, stopDisc);
        }

        // 清晰上方分類標示牌
        const signCanvas = document.createElement('canvas');
        signCanvas.width = 512; signCanvas.height = 148;
        const sctx = signCanvas.getContext('2d');
        sctx.fillStyle = isFruit ? '#E11D48' : '#0284C7';
        catRoundRect(sctx, 8, 8, 496, 132, 42); sctx.fill();
        sctx.fillStyle = '#FFFFFF';
        catRoundRect(sctx, 18, 18, 476, 112, 34); sctx.fill();
        sctx.fillStyle = isFruit ? '#BE123C' : '#0369A1';
        sctx.font = '900 62px "Noto Sans TC", sans-serif';
        sctx.textAlign = 'center'; sctx.textBaseline = 'middle';
        sctx.fillText(isFruit ? '🧺 水果' : '🚏 交通工具', 256, 76);

        const signMesh = new THREE.Mesh(
            new THREE.BoxGeometry(3.15, 0.92, 0.12),
            new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(signCanvas) })
        );
        signMesh.position.set(0, 2.32, -0.65);
        group.add(signMesh);

        // 大範圍隱形點擊盒（支援輕觸輔助放入）
        const hitBox = new THREE.Mesh(
            new THREE.CylinderGeometry(2.1, 2.1, 2.6, 18),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hitBox.position.y = 1.1;
        group.add(hitBox);

        catSortState.stageItemsGroup.add(group);

        const zoneObj = {
            category: categoryType,
            x, z,
            group,
            glowRing,
            glowRingMat,
            hitBox,
            hintTimer: 0,
            placedCount: 0
        };
        hitBox.userData = { isCategoryZone: true, zoneObj };
        signMesh.userData = { isCategoryZone: true, zoneObj };
        return zoneObj;
    }

    function create3DCategoryOptionCard(itemKey, homeX, homeZ, slotIdx) {
        const itemObj = CATEGORY_ITEMS[itemKey];
        const group = new THREE.Group();
        group.position.set(homeX, 1.48, homeZ);

        // 底座淺色圓墊（固定於地面）
        const pad = new THREE.Mesh(
            new THREE.CylinderGeometry(0.95, 1.02, 0.12, 24),
            new THREE.MeshStandardMaterial({ color: 0xFDE68A, roughness: 0.5 })
        );
        pad.position.set(homeX, 0.41, homeZ);
        catSortState.stageItemsGroup.add(pad);

        // 溫和提示用嘅金色柔和光圈（答錯需要線索時先慢慢亮起）
        const hintHaloMat = new THREE.MeshBasicMaterial({
            color: 0xFACC15,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0
        });
        const hintHalo = new THREE.Mesh(new THREE.RingGeometry(1.08, 1.38, 32), hintHaloMat);
        hintHalo.rotation.x = -Math.PI / 2;
        hintHalo.position.set(0, -1.02, 0);
        group.add(hintHalo);

        const frontTex = createOptionCardTexture(itemObj, false);
        const sideMat = new THREE.MeshStandardMaterial({ color: 0xFBBF24, roughness: 0.38 });
        const frontMat = new THREE.MeshBasicMaterial({ map: frontTex });

        const cardMesh = new THREE.Mesh(
            new THREE.BoxGeometry(2.08, 2.28, 0.36),
            [sideMat, sideMat, sideMat, sideMat, frontMat, sideMat]
        );
        cardMesh.rotation.x = -0.18;
        cardMesh.castShadow = true;
        group.add(cardMesh);

        // 放大點擊感應框方便 K2 小朋友手指按住拖曳
        const hitMesh = new THREE.Mesh(
            new THREE.BoxGeometry(2.45, 2.65, 0.9),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        group.add(hitMesh);

        catSortState.stageItemsGroup.add(group);

        const cardObj = {
            slotIdx,
            itemKey,
            itemObj,
            homeX,
            homeY: 1.48,
            homeZ,
            targetX: homeX,
            targetY: 1.48,
            targetZ: homeZ,
            targetScale: 1.0,
            solved: false,
            hintGlow: false,
            wobbleTimer: 0,
            group,
            cardMesh,
            frontMat,
            hintHaloMat,
            hitMesh
        };
        hitMesh.userData = { isCategoryCard: true, cardObj };
        cardMesh.userData = { isCategoryCard: true, cardObj };
        return cardObj;
    }

    // ==================== 5. 介面（進度欄、「下一題」按鈕與 10 題完成總結畫面） ====================
    function ensureCategoryOverlayUI() {
        // 正向回饋 +「下一題」按鈕浮動列（擺喺右下角，唔遮擋中間舞台）
        let nextBar = document.getElementById('cat-next-bar');
        if (!nextBar) {
            nextBar = document.createElement('div');
            nextBar.id = 'cat-next-bar';
            nextBar.className = 'fixed right-3 sm:right-6 bottom-3 sm:bottom-5 z-40 pointer-events-auto hidden items-center gap-3 bg-emerald-500 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-3xl border-4 border-white shadow-2xl';
            nextBar.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="w-8 h-8 rounded-full bg-white text-emerald-600 font-black text-xl flex items-center justify-center shadow">✓</span>
                    <span id="cat-next-msg" class="font-black text-sm sm:text-lg">好叻呀！答啱喇！</span>
                </div>
                <button id="cat-next-btn" type="button" class="btn-toy bg-amber-300 hover:bg-amber-200 text-slate-950 font-black px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl border-2 border-amber-500 shadow-md text-sm sm:text-lg whitespace-nowrap">
                    下一題 ➔
                </button>
            `;
            document.body.appendChild(nextBar);
            document.getElementById('cat-next-btn').onclick = () => advanceCategoryQuestion();
        }

        // 完成 10 題後嘅簡單鼓勵總結視窗
        let sumModal = document.getElementById('cat-summary-modal');
        if (!sumModal) {
            sumModal = document.createElement('div');
            sumModal.id = 'cat-summary-modal';
            sumModal.className = 'fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm hidden items-center justify-center p-4';
            sumModal.innerHTML = `
                <div class="bg-white rounded-3xl border-4 border-amber-400 shadow-2xl max-w-md w-full p-6 text-center space-y-4">
                    <div class="text-5xl sm:text-6xl">🏆🎉</div>
                    <h2 class="text-2xl sm:text-3xl font-black text-slate-800">好叻呀！全部完成！</h2>
                    <p class="text-base sm:text-lg font-bold text-slate-600 leading-relaxed">
                        你已經完成晒 <span class="text-emerald-600 font-black">10 題</span> 分類挑戰，識得分清楚邊啲係「🧺 水果」、邊啲係「🚏 交通工具」喇！
                    </p>
                    <div id="cat-summary-stats" class="bg-amber-50 border-2 border-amber-200 rounded-2xl px-4 py-3 text-sm font-black text-amber-900"></div>
                    <div class="flex flex-col sm:flex-row gap-3 pt-2">
                        <button type="button" id="cat-replay-btn" class="flex-1 btn-toy bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black py-3.5 px-5 rounded-2xl border-2 border-emerald-600 shadow-lg text-lg">
                            🔄 再玩一次
                        </button>
                        <button type="button" id="cat-lobby-btn" class="btn-toy bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-3.5 px-4 rounded-2xl border-2 border-slate-300 text-base">
                            🏠 返回大廳
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(sumModal);
            document.getElementById('cat-replay-btn').onclick = () => restartCategoryQuiz();
            document.getElementById('cat-lobby-btn').onclick = () => {
                hideCategoryOverlays();
                openLobby('subject');
            };
        }
    }

    function hideCategoryOverlays() {
        const nb = document.getElementById('cat-next-bar');
        if (nb) { nb.classList.add('hidden'); nb.classList.remove('flex'); }
        const sm = document.getElementById('cat-summary-modal');
        if (sm) { sm.classList.add('hidden'); sm.classList.remove('flex'); }
    }

    window.selectCategorySubMode = function (sub) {
        if (typeof playPopSound === 'function') playPopSound(560);
        catSortState.subMode = sub;
        restartCategoryQuiz();
    };

    function renderCategoryTopProgressUI() {
        const tierBar = document.getElementById('maze-tier-bar');
        if (!tierBar) return;
        const curQ = Math.min(10, catSortState.qIndex + 1);
        const isSingle = (catSortState.subMode === 'single');

        let dotsHtml = '';
        for (let i = 0; i < 10; i++) {
            const cls = (i < catSortState.qIndex || (i === catSortState.qIndex && catSortState.questionSolved))
                ? 'bg-emerald-500 text-white'
                : (i === catSortState.qIndex ? 'bg-amber-400 text-slate-950 ring-2 ring-orange-500 scale-110' : 'bg-slate-200 text-slate-400');
            dotsHtml += `<span class="w-5 h-5 rounded-full text-[11px] font-black inline-flex items-center justify-center transition-all ${cls}">${i + 1}</span>`;
        }

        tierBar.innerHTML = `
            <div class="pointer-events-auto flex flex-wrap items-center justify-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border-2 border-emerald-400 shadow-lg">
                <span class="bg-emerald-600 text-white font-black text-xs sm:text-sm px-3 py-1 rounded-xl shadow-sm">
                    📋 第 ${curQ} / 10 題
                </span>
                <div class="hidden md:flex items-center gap-1">${dotsHtml}</div>
                <span class="text-slate-300 font-black">|</span>
                <button type="button" onclick="selectCategorySubMode('single')" class="btn-toy-sm px-2.5 py-1 rounded-xl font-black text-xs border ${isSingle ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm' : 'bg-slate-100 text-slate-600 border-slate-200'}">
                    🎯 四選一拖放
                </button>
                <button type="button" onclick="selectCategorySubMode('dual')" class="btn-toy-sm px-2.5 py-1 rounded-xl font-black text-xs border ${!isSingle ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm' : 'bg-slate-100 text-slate-600 border-slate-200'}">
                    🧺🚏 雙籃四卡分類
                </button>
            </div>
        `;
    }

    // ==================== 6. 載入單題、答對正向回饋與答錯溫和提示 ====================
    function loadCategoryQuestion(qIdx) {
        ensure3DCategoryStageBuilt();
        ensureCategoryOverlayUI();
        hideCategoryOverlays();

        catSortState.qIndex = qIdx;
        catSortState.hadRetryThisQ = false;
        catSortState.questionSolved = false;
        catSortState.sessionFinished = false;
        catSortState.draggingCard = null;
        catSortState.selectedCard = null;
        catSortState.hoveredZone = null;
        catSortState.zones = [];
        catSortState.optionCards = [];
        catSortState.stageItemsGroup.clear();

        const qData = CATEGORY_QUESTION_BANK[qIdx % CATEGORY_QUESTION_BANK.length];
        renderCategoryTopProgressUI();

        let optionKeys = [];
        if (catSortState.subMode === 'dual') {
            catSortState.zones.push(
                create3DCategoryZone('fruit', -3.0, -1.45),
                create3DCategoryZone('vehicle', 3.0, -1.45)
            );
            optionKeys = [...qData.dualPair].sort(() => Math.random() - 0.5);
        } else {
            catSortState.zones.push(create3DCategoryZone(qData.targetCat, 0, -1.45));
            optionKeys = [qData.answer, ...qData.distractors].sort(() => Math.random() - 0.5);
        }

        const xPositions = [-4.35, -1.45, 1.45, 4.35];
        optionKeys.forEach((k, idx) => {
            catSortState.optionCards.push(create3DCategoryOptionCard(k, xPositions[idx], 2.55, idx));
        });

        // 更新左下角目標章與語音提示
        const cardEl = document.getElementById('target-number-card');
        const numEl = document.getElementById('target-badge-num');
        const dotsEl = document.getElementById('target-badge-dots');
        if (cardEl && numEl && dotsEl) {
            if (catSortState.subMode === 'dual') {
                cardEl.style.background = 'linear-gradient(to bottom, #10B981, #059669)';
                cardEl.style.color = '#FFFFFF';
                numEl.textContent = '🧺🚏';
                dotsEl.textContent = '雙籃分類';
            } else if (qData.targetCat === 'fruit') {
                cardEl.style.background = 'linear-gradient(to bottom, #FB7185, #E11D48)';
                cardEl.style.color = '#FFFFFF';
                numEl.textContent = '🧺';
                dotsEl.textContent = '搵水果';
            } else {
                cardEl.style.background = 'linear-gradient(to bottom, #38BDF8, #0284C7)';
                cardEl.style.color = '#FFFFFF';
                numEl.textContent = '🚏';
                dotsEl.textContent = '交通工具';
            }
        }

        const banner = document.getElementById('counting-banner');
        if (banner) banner.classList.add('hidden');

        if (catSortState.subMode === 'dual') {
            setPromptUI(`第 ${qIdx + 1} 題：請將下面 4 張圖卡，分別拖入「水果籃」或者「交通工具站」啦！`, ``);
        } else if (qData.targetCat === 'fruit') {
            setPromptUI(`第 ${qIdx + 1} 題：邊個係「水果」呀？請拖去上面嘅水果籃度！`, ``);
        } else {
            setPromptUI(`第 ${qIdx + 1} 題：邊個係「交通工具」呀？請拖去上面嘅車站度！`, ``);
        }
        updateRightButtonForMode();
    }

    function evaluateCardDrop(card, zone) {
        if (!card || !zone || card.solved || catSortState.questionSolved) return;

        if (card.itemObj.category === zone.category) {
            // ✅ 答對回饋：清晰綠色視覺標示 + 正向簡潔鼓勵 + 彈出「下一題」按鈕
            card.solved = true;
            card.hintGlow = false;
            card.hintHaloMat.opacity = 0;
            card.frontMat.map.dispose();
            card.frontMat.map = createOptionCardTexture(card.itemObj, true);
            card.frontMat.needsUpdate = true;

            zone.placedCount += 1;
            const offsetX = (catSortState.subMode === 'dual') ? ((zone.placedCount === 1) ? -0.65 : 0.65) : 0;
            card.targetX = zone.x + offsetX;
            card.targetY = 1.45;
            card.targetZ = zone.z + 0.32;
            card.targetScale = 0.72;

            if (typeof playSuccessChime === 'function') playSuccessChime();
            if (typeof emitStarParticles === 'function') emitStarParticles(new THREE.Vector3(zone.x, 1.8, zone.z));
            catSortState.heroCheerTimer = 1.3;

            const allDone = (catSortState.subMode === 'single')
                ? true
                : catSortState.optionCards.every(c => c.solved);

            if (!allDone) {
                setPromptUI(`好叻呀！${card.itemObj.praise}繼續分埋淨低嘅圖卡啦！`, ``);
                return;
            }

            // 本題完成！記錄成績並顯示「下一題」按鈕
            catSortState.questionSolved = true;
            if (!catSortState.hadRetryThisQ) catSortState.firstTryCount += 1;
            else catSortState.retrySolvedCount += 1;

            // 隱藏未用嘅干擾卡，突顯正確答案視覺標示
            if (catSortState.subMode === 'single') {
                catSortState.optionCards.forEach(c => {
                    if (!c.solved) c.targetScale = 0.85;
                });
            }

            renderCategoryTopProgressUI();
            const isLast = (catSortState.qIndex >= CATEGORY_QUESTION_BANK.length - 1);
            const praiseMsg = `好叻呀！${card.itemObj.praise}`;
            setPromptUI(`🌟 ${praiseMsg}`, ``);

            const nextBar = document.getElementById('cat-next-bar');
            const nextMsg = document.getElementById('cat-next-msg');
            const nextBtn = document.getElementById('cat-next-btn');
            if (nextBar && nextMsg && nextBtn) {
                nextMsg.textContent = praiseMsg;
                nextBtn.textContent = isLast ? '完成總結 🏆' : '下一題 ➔';
                nextBar.classList.remove('hidden');
                nextBar.classList.add('flex');
            }
            updateRightButtonForMode();
        } else {
            // 💡 答錯回饋：絕無紅叉或懲罰，輕柔滑回原位 + 金色柔和光圈提示線索 + 鼓勵再試一次
            catSortState.hadRetryThisQ = true;
            if (typeof playGentleNudge === 'function') playGentleNudge();

            card.targetX = card.homeX;
            card.targetY = card.homeY;
            card.targetZ = card.homeZ;
            card.targetScale = 1.0;
            card.wobbleTimer = 0.55;

            // 點亮目標籃及正確選項嘅柔和金色提示光圈 (Scaffolding Highlight)
            zone.hintTimer = 2.0;
            catSortState.optionCards.forEach(c => {
                if (!c.solved && c.itemObj.category === zone.category) {
                    c.hintGlow = true;
                }
            });

            let gentleHint = '';
            if (zone.category === 'fruit') {
                gentleHint = `「${card.itemObj.name}」係搭車出街用㗎！試吓搵甜甜哋、食得嘅「水果」拖入果籃啦！`;
            } else {
                gentleHint = `「${card.itemObj.name}」係食得嘅水果嚟㗎！試吓搵載我哋去街街嘅「交通工具」拖去車站啦！`;
            }
            setPromptUI(`💡 ${gentleHint}`, ``);
        }
    }

    window.advanceCategoryQuestion = function () {
        if (typeof playPopSound === 'function') playPopSound(580);
        if (catSortState.qIndex < CATEGORY_QUESTION_BANK.length - 1) {
            loadCategoryQuestion(catSortState.qIndex + 1);
        } else {
            showCategoryCompletionSummary();
        }
    };

    function showCategoryCompletionSummary() {
        catSortState.sessionFinished = true;
        hideCategoryOverlays();
        if (typeof playStageClearFanfare === 'function') playStageClearFanfare();
        if (typeof emitStarParticles === 'function') {
            emitStarParticles(new THREE.Vector3(-2.2, 2.5, -1.2));
            emitStarParticles(new THREE.Vector3(2.2, 2.5, -1.2));
        }
        // 完成 10 題獎勵星星
        if (typeof gameState !== 'undefined' && typeof renderStarsBar === 'function') {
            gameState.stars = Math.min(5, (gameState.stars || 0) + 1);
            renderStarsBar();
        }

        const statsEl = document.getElementById('cat-summary-stats');
        if (statsEl) {
            statsEl.textContent = `🌟 完成 10 / 10 題 ｜ 獨立答啱：${catSortState.firstTryCount} 題 ｜ 提示後答啱：${catSortState.retrySolvedCount} 題`;
        }
        const sumModal = document.getElementById('cat-summary-modal');
        if (sumModal) {
            sumModal.classList.remove('hidden');
            sumModal.classList.add('flex');
        }
        speakCatText('好叻呀！你已經完成晒十題分類挑戰，識得分清楚水果同交通工具喇！撳再玩一次可以繼續挑戰㗎！', true);
    }

    window.restartCategoryQuiz = function () {
        if (typeof playPopSound === 'function') playPopSound(540);
        catSortState.firstTryCount = 0;
        catSortState.retrySolvedCount = 0;
        loadCategoryQuestion(0);
    };

    // ==================== 7. 60FPS 觸控拖放互動（支援直接拖放 + 輕觸輔助） ====================
    function updateRaycasterFromEvent(event) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
    }

    function bindCategoryPointerEvents() {
        if (!renderer || !renderer.domElement || renderer.domElement.dataset.catDragBound) return;
        renderer.domElement.dataset.catDragBound = 'true';
        const dom = renderer.domElement;

        dom.addEventListener('pointerdown', (e) => {
            if (gameState.inLobby || gameState.mode !== 'categorysort') return;
            e.stopImmediatePropagation();
            if (catSortState.questionSolved || catSortState.sessionFinished) return;
            if (typeof ensureAudioCtx === 'function') ensureAudioCtx();

            updateRaycasterFromEvent(e);

            // 1. 檢查係咪按住咗 4 個選項木牌之一
            const activeCardMeshes = catSortState.optionCards
                .filter(c => !c.solved)
                .flatMap(c => [c.hitMesh, c.cardMesh]);
            const hits = raycaster.intersectObjects(activeCardMeshes, false);

            if (hits.length > 0 && hits[0].object.userData.cardObj) {
                const card = hits[0].object.userData.cardObj;
                if (typeof playPopSound === 'function') playPopSound(560);
                catSortState.draggingCard = card;
                catSortState.selectedCard = card;
                catSortState.dragStartPos = { x: e.clientX, y: e.clientY };
                catSortState.pointerMovedDist = 0;
                card.targetY = 2.15;
                card.targetScale = 1.12;
                return;
            }

            // 2. 無障礙輔助：若幼兒已輕觸揀中某張卡，再篤一下上方分類籃亦可放入
            if (catSortState.selectedCard && !catSortState.selectedCard.solved) {
                const zoneMeshes = catSortState.zones.map(z => z.hitBox);
                const zHits = raycaster.intersectObjects(zoneMeshes, false);
                if (zHits.length > 0 && zHits[0].object.userData.zoneObj) {
                    const chosenCard = catSortState.selectedCard;
                    catSortState.selectedCard = null;
                    evaluateCardDrop(chosenCard, zHits[0].object.userData.zoneObj);
                }
            }
        }, true);

        dom.addEventListener('pointermove', (e) => {
            if (gameState.inLobby || gameState.mode !== 'categorysort' || !catSortState.draggingCard) return;
            e.stopImmediatePropagation();

            const card = catSortState.draggingCard;
            catSortState.pointerMovedDist = Math.hypot(
                e.clientX - catSortState.dragStartPos.x,
                e.clientY - catSortState.dragStartPos.y
            );

            updateRaycasterFromEvent(e);
            const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.65);
            const hitPt = new THREE.Vector3();
            if (raycaster.ray.intersectPlane(dragPlane, hitPt)) {
                card.targetX = THREE.MathUtils.clamp(hitPt.x, -6.4, 6.4);
                card.targetZ = THREE.MathUtils.clamp(hitPt.z, -2.9, 4.4);
                card.targetY = 2.18;

                // 檢查拖近邊個分類籃，放大發光提示可以放手
                let nearZone = null;
                let bestDist = 2.75;
                catSortState.zones.forEach(z => {
                    const d = Math.hypot(card.targetX - z.x, card.targetZ - z.z);
                    if (d < bestDist) { bestDist = d; nearZone = z; }
                });
                catSortState.hoveredZone = nearZone;
            }
        }, true);

        const finishDrag = (e) => {
            if (gameState.mode !== 'categorysort' || !catSortState.draggingCard) return;
            const card = catSortState.draggingCard;
            catSortState.draggingCard = null;
            const hovered = catSortState.hoveredZone;
            catSortState.hoveredZone = null;

            if (hovered) {
                catSortState.selectedCard = null;
                evaluateCardDrop(card, hovered);
            } else if (catSortState.pointerMovedDist < 12) {
                // 小朋友只係輕篤一下張卡：讀出物件名稱並微微托起，提示拖去上面個籃度
                card.targetX = card.homeX;
                card.targetZ = card.homeZ;
                card.targetY = 1.78;
                card.targetScale = 1.06;
                catSortState.optionCards.forEach(other => {
                    if (other !== card && !other.solved) {
                        other.targetY = other.homeY;
                        other.targetScale = 1.0;
                    }
                });
                speakCatText(`${card.itemObj.name}。請將佢拖去上面啱嘅籃度啦！`, true);
            } else {
                // 喺半路放開手指：順滑彈回原位
                catSortState.selectedCard = null;
                card.targetX = card.homeX;
                card.targetY = card.homeY;
                card.targetZ = card.homeZ;
                card.targetScale = 1.0;
            }
        };

        window.addEventListener('pointerup', finishDrag, true);
        window.addEventListener('pointercancel', finishDrag, true);
    }

    // ==================== 8. 每幀 3D 動畫更新與大廳/主系統無縫掛載 ====================
    function updateCategorySortFrame(dt, elapsed) {
        if (!categorySortGroup.visible) return;
        if (typeof environmentGroup !== 'undefined') environmentGroup.visible = false;

        // 1. 分類籃磁吸放大與提示閃爍動畫
        catSortState.zones.forEach(z => {
            const isHovered = (catSortState.hoveredZone === z);
            const targetS = isHovered ? 1.12 : 1.0;
            z.group.scale.setScalar(THREE.MathUtils.lerp(z.group.scale.x, targetS, dt * 12));

            if (z.hintTimer > 0) {
                z.hintTimer = Math.max(0, z.hintTimer - dt);
                z.glowRingMat.color.setHex(0xFACC15);
                z.glowRingMat.opacity = 0.55 + Math.sin(elapsed * 10) * 0.35;
            } else {
                z.glowRingMat.color.setHex(z.category === 'fruit' ? 0xFB7185 : 0x38BDF8);
                z.glowRingMat.opacity = isHovered ? 0.92 : (0.45 + Math.sin(elapsed * 3) * 0.12);
            }
        });

        // 2. 4 張立體選項圖卡順滑移動、溫和搖擺與金色線索光圈
        catSortState.optionCards.forEach((c, idx) => {
            const lerpRate = (catSortState.draggingCard === c) ? 22 : 11;
            c.group.position.x = THREE.MathUtils.lerp(c.group.position.x, c.targetX, Math.min(1, dt * lerpRate));
            c.group.position.z = THREE.MathUtils.lerp(c.group.position.z, c.targetZ, Math.min(1, dt * lerpRate));

            const idleBob = (!c.solved && catSortState.draggingCard !== c) ? Math.sin(elapsed * 2.8 + idx) * 0.05 : 0;
            c.group.position.y = THREE.MathUtils.lerp(c.group.position.y, c.targetY + idleBob, Math.min(1, dt * lerpRate));
            c.group.scale.setScalar(THREE.MathUtils.lerp(c.group.scale.x, c.targetScale, Math.min(1, dt * 10)));

            if (c.wobbleTimer > 0) {
                c.wobbleTimer = Math.max(0, c.wobbleTimer - dt);
                c.group.rotation.z = Math.sin(elapsed * 26) * 0.12;
            } else {
                c.group.rotation.z = THREE.MathUtils.lerp(c.group.rotation.z, 0, dt * 10);
            }

            if (c.hintGlow && !c.solved) {
                c.hintHaloMat.opacity = 0.55 + Math.sin(elapsed * 6) * 0.32;
            } else {
                c.hintHaloMat.opacity = 0;
            }
        });

        // 3. 馬利奧歡呼彈跳
        if (catSortState.heroMesh) {
            if (catSortState.heroCheerTimer > 0) {
                catSortState.heroCheerTimer = Math.max(0, catSortState.heroCheerTimer - dt);
                catSortState.heroMesh.position.y = 0.36 + Math.abs(Math.sin(elapsed * 14)) * 0.45;
            } else {
                catSortState.heroMesh.position.y = 0.36 + Math.sin(elapsed * 3) * 0.03;
            }
        }

        // 4. 最佳化俯視鏡頭角度（同時兼容橫向與直向 iPad）
        if (camera) {
            camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, dt * 5);
            camera.position.y = THREE.MathUtils.lerp(camera.position.y, 11.4, dt * 5);
            camera.position.z = THREE.MathUtils.lerp(camera.position.z, 11.8, dt * 5);
            camera.lookAt(0, 0.85, 0.45);
        }
    }

    function ensureCategoryLobbyButtons() {
        // A. 在主大廳「第1步：揀選主題樂園」加入【🧺 分類樂園】大按鈕
        const stepSubj = document.getElementById('lobby-step-subject');
        if (stepSubj && !document.getElementById('lobby-subj-category')) {
            const sampleBtn = stepSubj.querySelector('[onclick*="selectSubjectFromLobby"]');
            if (sampleBtn && sampleBtn.parentElement) {
                const catSubjBtn = document.createElement('button');
                catSubjBtn.id = 'lobby-subj-category';
                catSubjBtn.type = 'button';
                catSubjBtn.onclick = () => selectSubjectFromLobby('category');
                catSubjBtn.className = 'btn-toy group bg-gradient-to-b from-emerald-50 to-teal-100 hover:from-emerald-100 hover:to-teal-200 p-5 rounded-3xl border-4 border-emerald-400 flex flex-col items-center justify-center gap-2 shadow-lg transition-all';
                catSubjBtn.innerHTML = `
                    <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-4xl sm:text-5xl shadow-md group-hover:scale-110 transition-transform">🧺</div>
                    <span class="text-xl sm:text-2xl font-black text-slate-800">分類樂園</span>
                    <span class="text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-200/80 px-3 py-0.5 rounded-full">🍎 水果 vs 🚌 交通工具</span>
                `;
                sampleBtn.parentElement.appendChild(catSubjBtn);
            }
        }

        // B. 在「第2步：揀選遊戲模式」加入分類遊戲卡
        const treasureCard = document.getElementById('lobby-card-treasure');
        if (treasureCard && treasureCard.parentElement && !document.getElementById('lobby-card-categorysort')) {
            const modeGrid = treasureCard.parentElement;
            const card1 = document.createElement('button');
            card1.id = 'lobby-card-categorysort';
            card1.type = 'button';
            card1.onclick = () => { catSortState.subMode = 'single'; startGameFromLobby('categorysort'); };
            card1.className = 'btn-toy group sm:col-span-2 bg-gradient-to-r from-emerald-100 via-amber-50 to-sky-100 hover:from-emerald-200 hover:to-sky-200 p-5 rounded-3xl border-4 border-emerald-400 items-center gap-4 text-left shadow-lg hidden';
            card1.innerHTML = `
                <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 text-white flex items-center justify-center text-3xl sm:text-4xl shadow-md group-hover:scale-110 transition-transform flex-shrink-0">🍎🚌</div>
                <div class="flex-1">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                        <span class="text-lg sm:text-2xl font-black text-slate-800">水果與交通工具分類大挑戰（共 10 題）</span>
                        <span class="text-xs font-black bg-emerald-600 text-white px-3 py-1 rounded-full shadow-sm">🎯 K2 語義分類・拖放玩法</span>
                    </div>
                    <p class="text-xs sm:text-sm font-bold text-slate-600 mt-1">每題 4 個香港日常圖卡選項！用手指將立體木牌拖入 3D 水果籃或交通工具車站！</p>
                </div>
            `;
            modeGrid.appendChild(card1);
        }
    }

    function hookMainSystem() {
        SUBJECT_DISPLAY_META.category = { icon: '🧺', title: '分類樂園', short: '🧺 分類' };
        MODE_DISPLAY_META.categorysort = '🍎🚌 水果與交通分類';
        if (gameState && gameState.settings && gameState.settings.lockedTargets) {
            gameState.settings.lockedTargets.category = [];
        }

        // 支援 getCognitiveItemMeta 查詢分類詞彙
        if (typeof window.getCognitiveItemMeta === 'function') {
            const _origMeta = window.getCognitiveItemMeta;
            window.getCognitiveItemMeta = getCognitiveItemMeta = function (key, subj) {
                if (CATEGORY_ITEMS[key]) {
                    const it = CATEGORY_ITEMS[key];
                    return {
                        key: it.id,
                        subject: 'category',
                        title: it.name,
                        shortLabel: it.name[0],
                        badgeSymbol: it.category === 'fruit' ? '🧺' : '🚏',
                        hex: it.category === 'fruit' ? '#E11D48' : '#0284C7',
                        subBadge: it.category === 'fruit' ? '水果' : '交通工具',
                        spawnCount: 1,
                        itemEmoji: it.category === 'fruit' ? '🍎' : '🚌',
                        itemName: it.name
                    };
                }
                return _origMeta(key, subj);
            };
        }

        const _origOpenLobby = openLobby;
        window.openLobby = openLobby = function (step = 'subject') {
            ensureCategoryLobbyButtons();
            hideCategoryOverlays();
            _origOpenLobby(step);

            const treasureCard = document.getElementById('lobby-card-treasure');
            const catCard = document.getElementById('lobby-card-categorysort');
            if (step !== 'subject' && treasureCard && treasureCard.parentElement && catCard) {
                const isCatSubj = (gameState.subject === 'category');
                Array.from(treasureCard.parentElement.children).forEach(child => {
                    if (child.id === 'lobby-card-categorysort') {
                        child.classList.toggle('hidden', !isCatSubj);
                        child.classList.toggle('flex', isCatSubj);
                    } else if (isCatSubj) {
                        child.dataset.hiddenByCat = child.classList.contains('hidden') ? '1' : '0';
                        child.classList.add('hidden');
                        child.classList.remove('flex');
                    } else if (child.dataset.hiddenByCat !== undefined) {
                        if (child.dataset.hiddenByCat === '0') {
                            child.classList.remove('hidden');
                        }
                        delete child.dataset.hiddenByCat;
                    }
                });
                if (!isCatSubj) {
                    // 重新觸發原有主題卡片篩選
                    ['lobby-card-treasure', 'lobby-card-addition'].forEach(id => {
                        const c = document.getElementById(id);
                        if (c) { c.classList.toggle('hidden', gameState.subject !== 'number'); c.classList.toggle('flex', gameState.subject === 'number'); }
                    });
                    const sb = document.getElementById('lobby-card-shapebridge');
                    if (sb) { sb.classList.toggle('hidden', gameState.subject !== 'shape'); sb.classList.toggle('flex', gameState.subject === 'shape'); }
                    const cs = document.getElementById('lobby-card-colorsplash');
                    if (cs) { cs.classList.toggle('hidden', gameState.subject !== 'color'); cs.classList.toggle('flex', gameState.subject === 'color'); }
                }
            }
        };

        const _origSwitchSubject = switchSubject;
        window.switchSubject = switchSubject = function (newSubject) {
            if (newSubject === 'category') {
                gameState.subject = 'category';
                switchMode('categorysort');
                return;
            }
            if (gameState.mode === 'categorysort') {
                hideCategoryOverlays();
                categorySortGroup.visible = false;
                gameState.mode = 'gacha';
            }
            _origSwitchSubject(newSubject);
        };

        const _origSwitchMode = switchMode;
        window.switchMode = switchMode = function (newMode) {
            bindCategoryPointerEvents();
            if (newMode === 'categorysort') {
                gameState.subject = 'category';
                ensure3DCategoryStageBuilt();
            } else {
                hideCategoryOverlays();
                categorySortGroup.visible = false;
            }
            _origSwitchMode(newMode);

            if (newMode === 'categorysort') {
                categorySortGroup.visible = true;
                if (typeof gachaMachineGroup !== 'undefined') gachaMachineGroup.visible = false;
                if (typeof trainGroup !== 'undefined') trainGroup.visible = false;
                if (typeof marioStageGroup !== 'undefined') marioStageGroup.visible = false;
                if (typeof treasureIslandGroup !== 'undefined') treasureIslandGroup.visible = false;
                if (typeof additionArenaGroup !== 'undefined') additionArenaGroup.visible = false;
                if (typeof shapeBridgeGroup !== 'undefined') shapeBridgeGroup.visible = false;
                if (typeof colorSplashGroup !== 'undefined') colorSplashGroup.visible = false;
                if (typeof environmentGroup !== 'undefined') environmentGroup.visible = false;
                const mainFloor = scene ? scene.getObjectByName('mainFloor') : null;
                if (mainFloor) mainFloor.visible = false;

                // 隱藏右下角十字方向盤，留空位置俾「下一題」按鈕
                const dpad = document.getElementById('treasure-dpad-bar');
                if (dpad) { dpad.classList.add('hidden'); dpad.classList.remove('flex'); }
                renderCategoryTopProgressUI();
            }
        };

        const _origStartNewRound = startNewRound;
        window.startNewRound = startNewRound = function () {
            if (gameState.mode === 'categorysort') {
                if (typeof clearCountingObjects === 'function') clearCountingObjects();
                if (typeof numberBlocksGroup !== 'undefined') numberBlocksGroup.clear();
                interactiveBlocks = [];
                gameState.isBusy = false;
                catSortState.firstTryCount = 0;
                catSortState.retrySolvedCount = 0;
                loadCategoryQuestion(0);
                if (typeof window.refreshVisualStepFlowchart === 'function') window.refreshVisualStepFlowchart(true);
                return;
            }
            categorySortGroup.visible = false;
            hideCategoryOverlays();
            _origStartNewRound();
        };

        const _origUpdateRightBtn = updateRightButtonForMode;
        window.updateRightButtonForMode = updateRightButtonForMode = function () {
            _origUpdateRightBtn();
            if (gameState.mode === 'categorysort') {
                const rightLabel = document.getElementById('right-btn-label');
                const rightIcon = document.getElementById('right-btn-icon');
                if (rightLabel && rightIcon) {
                    rightLabel.textContent = catSortState.questionSolved ? '下一題' : '重聽題目';
                    rightIcon.className = catSortState.questionSolved ? 'fa-solid fa-forward-step' : 'fa-solid fa-volume-high';
                }
            }
        };

        const _origRightAction = handleRightActionBtn;
        window.handleRightActionBtn = handleRightActionBtn = function () {
            if (gameState.mode === 'categorysort') {
                if (catSortState.questionSolved) advanceCategoryQuestion();
                else speakCatText(document.getElementById('prompt-text')?.textContent || '', true);
                return;
            }
            _origRightAction();
        };

        // 連動右上角「💡 提示」掣：點亮金色柔和光圈與語音引導
        const _origHint = triggerVisualHint;
        window.triggerVisualHint = triggerVisualHint = function (manualClick = false) {
            if (gameState.mode === 'categorysort') {
                if (catSortState.questionSolved || catSortState.sessionFinished) return;
                if (manualClick && typeof playPopSound === 'function') playPopSound(660);
                const targetZone = catSortState.zones[0];
                if (targetZone) targetZone.hintTimer = 2.5;
                catSortState.optionCards.forEach(c => {
                    if (!c.solved && (catSortState.subMode === 'dual' || c.itemObj.category === targetZone.category)) {
                        c.hintGlow = true;
                    }
                });
                return;
            }
            _origHint(manualClick);
        };

        // 連動頂部 1-2-3 視覺步驟流程條 (Patch Step 6)
        if (typeof window.refreshVisualStepFlowchart === 'function') {
            const _origFlow = window.refreshVisualStepFlowchart;
            window.refreshVisualStepFlowchart = function (force = false) {
                if (gameState.mode !== 'categorysort' || gameState.inLobby) {
                    _origFlow(force);
                    return;
                }
                const row = document.getElementById('visual-flowchart-row');
                if (!row) { _origFlow(force); return; }
                row.style.display = (gameState.settings && gameState.settings.showStepFlow === false) ? 'none' : 'flex';
                const stepIdx = catSortState.sessionFinished ? 3 : (catSortState.questionSolved ? 2 : (catSortState.draggingCard || catSortState.selectedCard ? 1 : 0));
                const steps = [
                    { label: '👀 睇4張圖卡', spk: '第一步，聽題目同觀察四張圖卡' },
                    { label: '✋ 拖入分類籃', spk: '第二步，將正確圖卡拖去上面嘅籃度' },
                    { label: '⏭️ 撳下一題', spk: '第三步，答啱之後撳下一題繼續' }
                ];
                row.innerHTML = `<div class="pointer-events-auto inline-flex items-center gap-1.5 bg-white/92 backdrop-blur-md px-2.5 py-1 rounded-full border-2 border-emerald-300 shadow-md">` +
                    steps.map((s, i) => {
                        const cls = i < stepIdx ? 'bg-emerald-500 text-white' : (i === stepIdx ? 'bg-amber-400 text-slate-950 border-2 border-orange-500 font-black scale-105' : 'bg-slate-100 text-slate-400');
                        return `<button type="button" onclick="window.__speakFlowStep && window.__speakFlowStep('${s.spk}')" class="px-2.5 py-0.5 rounded-full text-xs font-extrabold ${cls}">${i < stepIdx ? '✓ ' : `${i + 1}. `}${s.label}</button>`;
                    }).join('<span class="text-xs text-slate-300 font-black">➔</span>') +
                    `</div>`;
            };
        }

        // 掛入主 60FPS 迴圈
        const _origAnim = animate;
        let _lastCatNow = performance.now();
        window.animate = animate = function () {
            const now = performance.now();
            const dt = Math.min((now - _lastCatNow) / 1000, 0.1);
            _lastCatNow = now;
            if (categorySortGroup.visible) {
                updateCategorySortFrame(dt, now / 1000);
            }
            _origAnim();
            if (!gameState.inLobby && gameState.mode === 'categorysort') {
                const tb = document.getElementById('maze-tier-bar');
                if (tb) tb.style.display = 'flex';
            }
        };
    }

    const bootCategoryModule = () => {
        hookMainSystem();
        ensureCategoryLobbyButtons();
        bindCategoryPointerEvents();
        if (typeof window.dockTopFloatingBars === 'function') setTimeout(window.dockTopFloatingBars, 120);
    };

    if (document.readyState === 'complete') setTimeout(bootCategoryModule, 320);
    else window.addEventListener('load', () => setTimeout(bootCategoryModule, 320));
})();
