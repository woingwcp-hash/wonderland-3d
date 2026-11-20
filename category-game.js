/********************************************************************
 * [FILE: category-game.js]
 * 3D 雙區拖放語義分類模組：分辨「🧺 水果」與「🚏 交通工具」(K2 10題版)
 ********************************************************************/
(function initWonderland3DCategorySorting() {
    if (window.__wonderlandCategorySortingV2) return;
    window.__wonderlandCategorySortingV2 = true;

    // ==================== 1. 香港日常詞彙庫 ====================
    const CAT_DB = {
        // 水果 (Fruits)
        apple:      { id: 'apple',      name: '蘋果',     cat: 'fruit',   msg: '「蘋果」紅卜卜甜甜哋，係水果！' },
        banana:     { id: 'banana',     name: '香蕉',     cat: 'fruit',   msg: '「香蕉」剝咗皮就食得，係水果！' },
        orange:     { id: 'orange',     name: '橙',       cat: 'fruit',   msg: '「橙」酸酸甜甜多汁，係水果！' },
        watermelon: { id: 'watermelon', name: '西瓜',     cat: 'fruit',   msg: '「西瓜」清甜又解渴，係水果！' },
        strawberry: { id: 'strawberry', name: '士多啤梨', cat: 'fruit',   msg: '「士多啤梨」香甜好味，係水果！' },
        grapes:     { id: 'grapes',     name: '提子',     cat: 'fruit',   msg: '「提子」一粒粒甜甜哋，係水果！' },
        mango:      { id: 'mango',      name: '芒果',     cat: 'fruit',   msg: '「芒果」黃澄澄好香甜，係水果！' },
        pear:       { id: 'pear',       name: '梨',       cat: 'fruit',   msg: '「梨」爽脆又清甜，係水果！' },
        pineapple:  { id: 'pineapple',  name: '菠蘿',     cat: 'fruit',   msg: '「菠蘿」酸甜開胃，係水果！' },
        kiwi:       { id: 'kiwi',       name: '奇異果',   cat: 'fruit',   msg: '「奇異果」綠油油好味，係水果！' },

        // 香港常見交通工具 (Vehicles)
        bus:        { id: 'bus',        name: '雙層巴士', cat: 'vehicle', msg: '「雙層巴士」載好多人去街，係交通工具！' },
        taxi:       { id: 'taxi',       name: '的士',     cat: 'vehicle', msg: '紅色「的士」喺馬路載客，係交通工具！' },
        minibus:    { id: 'minibus',    name: '小巴',     cat: 'vehicle', msg: '「小巴」載我哋去唔同地方，係交通工具！' },
        airplane:   { id: 'airplane',   name: '飛機',     cat: 'vehicle', msg: '「飛機」喺天空飛去旅行，係交通工具！' },
        mtr:        { id: 'mtr',        name: '港鐵',     cat: 'vehicle', msg: '「港鐵」喺路軌飛快行駛，係交通工具！' },
        bicycle:    { id: 'bicycle',    name: '單車',     cat: 'vehicle', msg: '「單車」有兩個轆踩去公園，係交通工具！' },
        firetruck:  { id: 'firetruck',  name: '消防車',   cat: 'vehicle', msg: '「消防車」載消防員去救火，係交通工具！' },
        ambulance:  { id: 'ambulance',  name: '救護車',   cat: 'vehicle', msg: '「救護車」載病人去醫院，係交通工具！' },
        ferry:      { id: 'ferry',      name: '渡輪',     cat: 'vehicle', msg: '「渡輪」喺海面載人過海，係交通工具！' },
        tram:       { id: 'tram',       name: '電車',     cat: 'vehicle', msg: '叮叮「電車」喺馬路行駛，係交通工具！' }
    };

    // 10 題題庫（每題 4 個選項：2 水果 + 2 交通工具）
    const QUESTION_SETS = [
        ['apple', 'banana', 'bus', 'taxi'],
        ['orange', 'watermelon', 'minibus', 'airplane'],
        ['strawberry', 'grapes', 'mtr', 'bicycle'],
        ['mango', 'pear', 'firetruck', 'ambulance'],
        ['pineapple', 'kiwi', 'ferry', 'tram'],
        ['apple', 'strawberry', 'bus', 'mtr'],
        ['banana', 'watermelon', 'taxi', 'ferry'],
        ['orange', 'grapes', 'minibus', 'firetruck'],
        ['mango', 'pineapple', 'airplane', 'tram'],
        ['pear', 'kiwi', 'ambulance', 'bicycle']
    ];

    const categorySortGroup = new THREE.Group();
    window.categorySortGroup = categorySortGroup;

    const sortState = {
        built: false,
        difficulty: 'all4', // 'all4' = 每題拖晒4件分類 | 'one' = 每題4選1件拖入對應區
        qIndex: 0,
        totalQuestions: 10,
        hadHintThisQ: false,
        independentCount: 0,
        scaffoldedCount: 0,
        roundDone: false,
        quizFinished: false,
        zones: {},
        items: [],
        draggingItem: null,
        selectedItem: null,
        hoveredZone: null,
        dragShadowRing: null,
        pointerStart: { x: 0, y: 0 },
        movedPx: 0,
        heroMesh: null,
        heroJumpTimer: 0,
        dynamicGroup: null
    };
    window.catSortState = sortState;

    function speakCantonese(text, force = false) {
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

    function drawRoundBox(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    function makeLabelMesh(text, bgHex, textHex, width3D, height3D, fontSize = 58) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 160;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = bgHex;
        drawRoundBox(ctx, 8, 8, 496, 144, 44);
        ctx.fill();
        ctx.lineWidth = 10;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();

        ctx.fillStyle = textHex;
        ctx.font = `900 ${fontSize}px "Noto Sans TC", "PingFang HK", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 256, 84);

        const tex = new THREE.CanvasTexture(canvas);
        const mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(width3D, height3D),
            new THREE.MeshBasicMaterial({ map: tex, transparent: true })
        );
        return mesh;
    }

    // ==================== 2. 建立 3D 立體水果與香港交通工具模型 ====================
    function build3DItemModel(id) {
        const g = new THREE.Group();
        const mat = (hex, rough = 0.35) => new THREE.MeshStandardMaterial({ color: hex, roughness: rough });

        const addWheels = (w = 0.58, zOff = 0.42, r = 0.2) => {
            const wMat = mat(0x1E293B, 0.6);
            const hubMat = mat(0xE2E8F0, 0.3);
            [[-w, zOff], [w, zOff], [-w, -zOff], [w, -zOff]].forEach(([wx, wz]) => {
                const wheel = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.14, 16), wMat);
                wheel.rotation.x = Math.PI / 2;
                wheel.position.set(wx, r, wz);
                const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.48, r * 0.48, 0.16, 12), hubMat);
                hub.rotation.x = Math.PI / 2;
                hub.position.set(wx, r, wz);
                g.add(wheel, hub);
            });
        };

        const addLeafAndStem = (topY) => {
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.26, 10), mat(0x78350F, 0.7));
            stem.position.set(0, topY + 0.08, 0);
            const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), mat(0x16A34A, 0.4));
            leaf.scale.set(1.5, 0.35, 0.8);
            leaf.position.set(0.18, topY + 0.12, 0);
            leaf.rotation.z = -0.3;
            g.add(stem, leaf);
        };

        switch (id) {
            case 'apple': {
                const body = new THREE.Mesh(new THREE.SphereGeometry(0.56, 24, 20), mat(0xEF4444, 0.25));
                body.scale.set(1.06, 0.94, 1.06);
                body.position.y = 0.54;
                g.add(body);
                addLeafAndStem(1.0);
                break;
            }
            case 'banana': {
                const arc = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.19, 16, 28, Math.PI * 0.82), mat(0xFACC15, 0.3));
                arc.position.set(0, 0.68, 0);
                arc.rotation.z = Math.PI * 1.08;
                const tip = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), mat(0x78350F));
                tip.position.set(-0.54, 0.62, 0);
                g.add(arc, tip);
                break;
            }
            case 'orange': {
                const body = new THREE.Mesh(new THREE.SphereGeometry(0.56, 24, 20), mat(0xFB923C, 0.35));
                body.position.y = 0.56;
                g.add(body);
                addLeafAndStem(1.04);
                break;
            }
            case 'watermelon': {
                const rind = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.34, 24, 1, false, 0, Math.PI), mat(0x15803D, 0.4));
                rind.rotation.z = Math.PI / 2;
                rind.rotation.y = Math.PI / 2;
                rind.position.y = 0.72;
                const flesh = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.36, 24, 1, false, 0, Math.PI), mat(0xEF4444, 0.3));
                flesh.rotation.z = Math.PI / 2;
                flesh.rotation.y = Math.PI / 2;
                flesh.position.y = 0.72;
                g.add(rind, flesh);
                break;
            }
            case 'strawberry': {
                const berry = new THREE.Mesh(new THREE.ConeGeometry(0.54, 0.96, 22), mat(0xF43F5E, 0.3));
                berry.rotation.x = Math.PI;
                berry.position.y = 0.56;
                const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.12, 0.14, 7), mat(0x16A34A, 0.4));
                cap.position.y = 1.02;
                g.add(berry, cap);
                break;
            }
            case 'grapes': {
                const coords = [[-0.24, 0.82, 0], [0.24, 0.82, 0], [0, 0.84, 0.2], [0, 0.84, -0.2], [-0.16, 0.54, 0.14], [0.16, 0.54, 0.14], [0, 0.54, -0.16], [0, 0.28, 0]];
                coords.forEach(([gx, gy, gz]) => {
                    const b = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 14), mat(0x9333EA, 0.25));
                    b.position.set(gx, gy, gz);
                    g.add(b);
                });
                addLeafAndStem(1.0);
                break;
            }
            case 'mango': {
                const m = new THREE.Mesh(new THREE.SphereGeometry(0.52, 22, 18), mat(0xFBBF24, 0.3));
                m.scale.set(1.32, 0.86, 0.88);
                m.rotation.z = -0.28;
                m.position.y = 0.52;
                g.add(m);
                addLeafAndStem(0.92);
                break;
            }
            case 'pear': {
                const bot = new THREE.Mesh(new THREE.SphereGeometry(0.48, 20, 18), mat(0xA3E635, 0.35));
                bot.position.y = 0.46;
                const top = new THREE.Mesh(new THREE.SphereGeometry(0.32, 18, 16), mat(0xA3E635, 0.35));
                top.position.y = 0.88;
                g.add(bot, top);
                addLeafAndStem(1.14);
                break;
            }
            case 'pineapple': {
                const body = new THREE.Mesh(new THREE.SphereGeometry(0.48, 18, 16), mat(0xF59E0B, 0.45));
                body.scale.set(0.95, 1.22, 0.95);
                body.position.y = 0.56;
                const crown = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.52, 7), mat(0x16A34A, 0.4));
                crown.position.y = 1.22;
                g.add(body, crown);
                break;
            }
            case 'kiwi': {
                const outer = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.34, 24), mat(0x92400E, 0.65));
                outer.rotation.x = Math.PI / 3;
                outer.position.y = 0.56;
                const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.36, 24), mat(0x84CC16, 0.3));
                inner.rotation.x = Math.PI / 3;
                inner.position.y = 0.56;
                const core = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.38, 16), mat(0xFEF9C3, 0.3));
                core.rotation.x = Math.PI / 3;
                core.position.y = 0.56;
                g.add(outer, inner, core);
                break;
            }
            case 'bus': { // 香港雙層巴士
                const hull = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.05, 0.78), mat(0xD97706, 0.35));
                hull.position.y = 0.68;
                const belt = new THREE.Mesh(new THREE.BoxGeometry(1.57, 0.12, 0.8), mat(0xEF4444, 0.3));
                belt.position.y = 0.68;
                const winUpper = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.28, 0.81), mat(0xBAE6FD, 0.2));
                winUpper.position.y = 0.96;
                const winLower = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.26, 0.81), mat(0xBAE6FD, 0.2));
                winLower.position.y = 0.44;
                g.add(hull, belt, winUpper, winLower);
                addWheels(0.5, 0.38, 0.19);
                break;
            }
            case 'taxi': { // 香港紅色的士
                const base = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.42, 0.78), mat(0xEF4444, 0.3));
                base.position.y = 0.38;
                const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.36, 0.7), mat(0xF8FAFC, 0.3));
                cabin.position.y = 0.75;
                const glass = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.24, 0.72), mat(0x38BDF8, 0.2));
                glass.position.y = 0.74;
                const sign = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.18), mat(0xFEF08A, 0.2));
                sign.position.y = 0.98;
                g.add(base, cabin, glass, sign);
                addWheels(0.46, 0.38, 0.19);
                break;
            }
            case 'minibus': { // 香港紅頂小巴
                const body = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.68, 0.78), mat(0xFEF3C7, 0.35));
                body.position.y = 0.5;
                const roof = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.18, 0.8), mat(0xEF4444, 0.35));
                roof.position.y = 0.88;
                const win = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.26, 0.8), mat(0x7DD3FC, 0.2));
                win.position.y = 0.62;
                g.add(body, roof, win);
                addWheels(0.45, 0.38, 0.18);
                break;
            }
            case 'mtr': { // 港鐵列車
                const track = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.08, 0.9), mat(0x64748B, 0.6));
                track.position.y = 0.06;
                const car = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.74, 0.76), mat(0xF1F5F9, 0.3));
                car.position.y = 0.48;
                const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.78), mat(0xE11D48, 0.3));
                stripe.position.y = 0.34;
                const win = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.26, 0.79), mat(0x38BDF8, 0.2));
                win.position.y = 0.58;
                g.add(track, car, stripe, win);
                break;
            }
            case 'ferry': { // 天星小輪渡輪
                const hull = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.36, 0.78), mat(0x15803D, 0.4));
                hull.position.y = 0.26;
                const deck = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.38, 0.68), mat(0xFFFBEB, 0.4));
                deck.position.y = 0.62;
                const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.32, 14), mat(0xD97706, 0.4));
                funnel.position.y = 0.95;
                g.add(hull, deck, funnel);
                break;
            }
            case 'tram': { // 電車
                const body = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.12, 0.68), mat(0x15803D, 0.4));
                body.position.y = 0.68;
                const win1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.26, 0.7), mat(0xFEF08A, 0.3));
                win1.position.y = 0.96;
                const win2 = win1.clone();
                win2.position.y = 0.46;
                g.add(body, win1, win2);
                addWheels(0.32, 0.32, 0.15);
                break;
            }
            case 'firetruck': { // 消防車
                const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.68, 0.78), mat(0xDC2626, 0.3));
                body.position.y = 0.52;
                const ladder = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.1, 0.32), mat(0xE2E8F0, 0.3));
                ladder.position.set(-0.1, 0.92, 0);
                const siren = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.14, 12), mat(0x38BDF8, 0.2));
                siren.position.set(0.52, 0.93, 0);
                g.add(body, ladder, siren);
                addWheels(0.46, 0.38, 0.19);
                break;
            }
            case 'ambulance': { // 救護車
                const body = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.72, 0.78), mat(0xFFFFFF, 0.3));
                body.position.y = 0.54;
                const band = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.12, 0.8), mat(0xEF4444, 0.3));
                band.position.y = 0.38;
                const siren = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.32), mat(0x38BDF8, 0.2));
                siren.position.set(0.45, 0.96, 0);
                g.add(body, band, siren);
                addWheels(0.45, 0.38, 0.19);
                break;
            }
            case 'bicycle': { // 單車
                const w1 = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.06, 12, 24), mat(0x1E293B));
                w1.position.set(-0.46, 0.38, 0);
                const w2 = w1.clone();
                w2.position.set(0.46, 0.38, 0);
                const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.95, 10), mat(0x0284C7));
                bar.rotation.z = Math.PI / 2;
                bar.position.set(0, 0.56, 0);
                const seat = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.2), mat(0xEA580C));
                seat.position.set(-0.26, 0.74, 0);
                g.add(w1, w2, bar, seat);
                break;
            }
            case 'airplane': { // 飛機
                const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 1.55, 18), mat(0xF8FAFC, 0.3));
                fuselage.rotation.z = Math.PI / 2;
                fuselage.position.y = 0.62;
                const wing = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 1.55), mat(0x0284C7, 0.3));
                wing.position.y = 0.6;
                const tail = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.42, 4), mat(0x0284C7, 0.3));
                tail.position.set(-0.62, 0.88, 0);
                g.add(fuselage, wing, tail);
                break;
            }
        }
        return g;
    }

    // ==================== 3. 建立左右雙分類區（左：水果果籃 ｜ 右：交通工具停車場） ====================
    function ensureStageBuilt() {
        if (sortState.built) return;
        sortState.built = true;
        categorySortGroup.clear();
        categorySortGroup.visible = false;
        if (scene) scene.add(categorySortGroup);

        // 草地大舞台底座
        const sand = new THREE.Mesh(new THREE.BoxGeometry(19.2, 0.3, 11.8), new THREE.MeshStandardMaterial({ color: 0xFDE68A, roughness: 0.8 }));
        sand.position.set(0, 0.1, 0.4);
        categorySortGroup.add(sand);

        const grass = new THREE.Mesh(new THREE.BoxGeometry(18.4, 0.36, 11.0), new THREE.MeshStandardMaterial({ color: 0x86EFAC, roughness: 0.72 }));
        grass.position.set(0, 0.18, 0.4);
        grass.receiveShadow = true;
        categorySortGroup.add(grass);

        // 下方待分類物件木托盤長檯
        const tray = new THREE.Mesh(new THREE.BoxGeometry(14.6, 0.12, 2.9), new THREE.MeshStandardMaterial({ color: 0xFEF3C7, roughness: 0.6 }));
        tray.position.set(0, 0.4, 2.85);
        categorySortGroup.add(tray);

        // 拖曳時地面落點光圈
        const shadowRing = new THREE.Mesh(
            new THREE.RingGeometry(0.55, 0.85, 28),
            new THREE.MeshBasicMaterial({ color: 0xFACC15, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
        );
        shadowRing.rotation.x = -Math.PI / 2;
        shadowRing.position.y = 0.48;
        shadowRing.visible = false;
        sortState.dragShadowRing = shadowRing;
        categorySortGroup.add(shadowRing);

        // 馬利奧小裁判（企喺中間後方拍手鼓勵）
        if (typeof marioHero !== 'undefined' && marioHero.group) {
            const hero = marioHero.group.clone();
            hero.scale.setScalar(0.86);
            hero.position.set(0, 0.36, -2.55);
            sortState.heroMesh = hero;
            categorySortGroup.add(hero);
        }

        sortState.dynamicGroup = new THREE.Group();
        categorySortGroup.add(sortState.dynamicGroup);
    }

    function createTargetZones() {
        sortState.zones = {};

        const makeZone = (catKey, centerX, centerZ) => {
            const isFruit = (catKey === 'fruit');
            const root = new THREE.Group();
            root.position.set(centerX, 0.36, centerZ);

            // 感應外光環
            const ringMat = new THREE.MeshBasicMaterial({
                color: isFruit ? 0xFB7185 : 0x38BDF8,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.55
            });
            const ring = new THREE.Mesh(new THREE.RingGeometry(2.35, 2.75, 40), ringMat);
            ring.rotation.x = -Math.PI / 2;
            ring.position.y = 0.04;
            root.add(ring);

            if (isFruit) {
                // 左區：🧺 3D 大型野餐水果果籃（內設 2 個擺放格位）
                const matCloth = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.08, 2.8), new THREE.MeshStandardMaterial({ color: 0xFDA4AF, roughness: 0.6 }));
                matCloth.position.y = 0.05;
                const basketWall = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 1.85, 0.65, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0xD97706, roughness: 0.6, side: THREE.DoubleSide }));
                basketWall.position.y = 0.36;
                basketWall.scale.set(1.05, 1, 0.72);
                const basketFloor = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.14, 32), new THREE.MeshStandardMaterial({ color: 0xFFF1F2, roughness: 0.5 }));
                basketFloor.position.y = 0.12;
                basketFloor.scale.set(1.05, 1, 0.72);
                const archHandle = new THREE.Mesh(new THREE.TorusGeometry(1.95, 0.1, 12, 32, Math.PI), new THREE.MeshStandardMaterial({ color: 0x92400E, roughness: 0.5 }));
                archHandle.position.set(0, 0.65, -0.2);
                root.add(matCloth, basketWall, basketFloor, archHandle);
            } else {
                // 右區：🚏 3D 香港交通工具停車場（內設 2 個泊車格位 + 巴士站牌）
                const asphalt = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.18, 2.85), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.65 }));
                asphalt.position.y = 0.09;
                const curb = new THREE.Mesh(new THREE.BoxGeometry(4.56, 0.12, 3.0), new THREE.MeshStandardMaterial({ color: 0xFACC15, roughness: 0.4 }));
                curb.position.y = 0.04;
                root.add(curb, asphalt);

                // 白色泊車分隔線
                [-1.95, 0, 1.95].forEach(lx => {
                    const line = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 2.1), new THREE.MeshBasicMaterial({ color: 0xF8FAFC }));
                    line.position.set(lx, 0.19, 0.05);
                    root.add(line);
                });

                const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.8, 12), new THREE.MeshStandardMaterial({ color: 0xE2E8F0 }));
                pole.position.set(2.05, 0.98, -1.1);
                const stopHead = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.1, 20), new THREE.MeshStandardMaterial({ color: 0xEF4444 }));
                stopHead.rotation.x = Math.PI / 2;
                stopHead.position.set(2.05, 1.92, -1.1);
                root.add(pole, stopHead);
            }

            // 區內 2 個虛線擺放圓墊（清楚提示小朋友物件放喺邊）
            [-1.02, 1.02].forEach(sx => {
                const slotRing = new THREE.Mesh(
                    new THREE.RingGeometry(0.62, 0.76, 24),
                    new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
                );
                slotRing.rotation.x = -Math.PI / 2;
                slotRing.position.set(sx, 0.22, 0.1);
                root.add(slotRing);
            });

            // 巨型清晰類別標題牌
            const banner = makeLabelMesh(
                isFruit ? '🧺 水果' : '🚏 交通工具',
                isFruit ? '#E11D48' : '#0284C7',
                '#FFFFFF',
                3.4, 0.98, 64
            );
            banner.position.set(0, 2.38, -0.85);
            banner.rotation.x = -0.18;
            root.add(banner);

            // 答錯提示時彈出嘅金色向下引導大箭咀
            const hintArrow = new THREE.Mesh(
                new THREE.ConeGeometry(0.45, 0.85, 16),
                new THREE.MeshBasicMaterial({ color: 0xFACC15 })
            );
            hintArrow.rotation.x = Math.PI;
            hintArrow.position.set(0, 3.35, 0);
            hintArrow.visible = false;
            root.add(hintArrow);

            // 隱形點擊感應區
            const hitBox = new THREE.Mesh(
                new THREE.BoxGeometry(4.8, 2.8, 3.4),
                new THREE.MeshBasicMaterial({ visible: false })
            );
            hitBox.position.y = 1.2;
            root.add(hitBox);

            sortState.dynamicGroup.add(root);

            const zObj = {
                cat: catKey,
                x: centerX,
                z: centerZ,
                slots: [
                    { x: centerX - 1.02, z: centerZ + 0.12, taken: false },
                    { x: centerX + 1.02, z: centerZ + 0.12, taken: false }
                ],
                root,
                ringMat,
                hintArrow,
                hitBox,
                hintTimer: 0
            };
            hitBox.userData = { isSortZone: true, zoneObj: zObj };
            banner.userData = { isSortZone: true, zoneObj: zObj };
            sortState.zones[catKey] = zObj;
        };

        makeZone('fruit', -3.35, -1.15);
        makeZone('vehicle', 3.35, -1.15);
    }

    function createDraggable3DItem(itemKey, homeX, homeZ, idx) {
        const info = CAT_DB[itemKey];
        const wrap = new THREE.Group();
        wrap.position.set(homeX, 0.48, homeZ);

        // 托盤固定底墊
        const homePad = new THREE.Mesh(
            new THREE.CylinderGeometry(1.05, 1.12, 0.1, 24),
            new THREE.MeshStandardMaterial({ color: 0xFDE047, roughness: 0.5 })
        );
        homePad.position.set(homeX, 0.47, homeZ);
        sortState.dynamicGroup.add(homePad);

        // 物件圓形木底座
        const disc = new THREE.Mesh(
            new THREE.CylinderGeometry(0.92, 0.98, 0.16, 26),
            new THREE.MeshStandardMaterial({ color: 0xFFFBEB, roughness: 0.4 })
        );
        disc.position.y = 0.08;
        wrap.add(disc);

        // 3D 立體水果／交通工具模型
        const model = build3DItemModel(itemKey);
        model.position.y = 0.14;
        wrap.add(model);

        // 前方香港繁體中文名牌
        const nameTag = makeLabelMesh(info.name, '#1E293B', '#FFFFFF', 2.05, 0.62, 62);
        nameTag.position.set(0, 0.28, 1.05);
        nameTag.rotation.x = -0.52;
        wrap.add(nameTag);

        // 答啱後顯示嘅綠色剔號牌
        const okBadge = makeLabelMesh(`✓ ${info.name}`, '#16A34A', '#FFFFFF', 1.85, 0.56, 56);
        okBadge.position.set(0, 1.48, 0);
        okBadge.rotation.x = -0.25;
        okBadge.visible = false;
        wrap.add(okBadge);

        // 大範圍觸控感應框（方便幼兒手指直接按住拖動）
        const hitMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(1.28, 1.28, 2.2, 18),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hitMesh.position.y = 0.9;
        wrap.add(hitMesh);

        sortState.dynamicGroup.add(wrap);

        const itemObj = {
            idx,
            key: itemKey,
            info,
            homeX,
            homeY: 0.48,
            homeZ,
            targetX: homeX,
            targetY: 0.48,
            targetZ: homeZ,
            targetScale: 1.0,
            sorted: false,
            wobbleTimer: 0,
            wrap,
            model,
            nameTag,
            okBadge,
            hitMesh
        };
        hitMesh.userData = { isSortItem: true, itemObj };
        return itemObj;
    }

    // ==================== 4. 進度欄、「下一題」與完成總結 UI ====================
    function ensureCategoryHUD() {
        let nextBar = document.getElementById('cat-sort-next-bar');
        if (!nextBar) {
            nextBar = document.createElement('div');
            nextBar.id = 'cat-sort-next-bar';
            nextBar.className = 'fixed right-3 sm:right-6 bottom-3 sm:bottom-5 z-40 pointer-events-auto hidden items-center gap-3 bg-emerald-500 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-3xl border-4 border-white shadow-2xl';
            nextBar.innerHTML = `
                <span class="w-8 h-8 rounded-full bg-white text-emerald-600 font-black text-xl flex items-center justify-center shadow">✓</span>
                <span id="cat-sort-next-msg" class="font-black text-sm sm:text-lg">好叻呀！全部分啱晒！</span>
                <button id="cat-sort-next-btn" type="button" class="btn-toy bg-amber-300 hover:bg-amber-200 text-slate-950 font-black px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl border-2 border-amber-500 shadow-md text-sm sm:text-lg whitespace-nowrap">
                    下一題 ➔
                </button>
            `;
            document.body.appendChild(nextBar);
            document.getElementById('cat-sort-next-btn').onclick = () => window.nextCategorySortQuestion();
        }

        let modal = document.getElementById('cat-sort-summary-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'cat-sort-summary-modal';
            modal.className = 'fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm hidden items-center justify-center p-4';
            modal.innerHTML = `
                <div class="bg-white rounded-3xl border-4 border-amber-400 shadow-2xl max-w-md w-full p-6 text-center space-y-4">
                    <div class="text-5xl sm:text-6xl">🧺🏆🚌</div>
                    <h2 class="text-2xl sm:text-3xl font-black text-slate-800">好叻呀！分類大成功！</h2>
                    <p class="text-base sm:text-lg font-bold text-slate-600 leading-relaxed">
                        你已經完成晒 <span class="text-emerald-600 font-black">10 題</span> 挑戰，成功將「水果」同「交通工具」放晒去正確位置喇！
                    </p>
                    <div id="cat-sort-stats" class="bg-amber-50 border-2 border-amber-200 rounded-2xl px-4 py-3 text-sm font-black text-amber-900"></div>
                    <div class="flex flex-col sm:flex-row gap-3 pt-2">
                        <button type="button" id="cat-sort-replay-btn" class="flex-1 btn-toy bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black py-3.5 px-5 rounded-2xl border-2 border-emerald-600 shadow-lg text-lg">
                            🔄 再玩一次
                        </button>
                        <button type="button" id="cat-sort-home-btn" class="btn-toy bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-3.5 px-4 rounded-2xl border-2 border-slate-300 text-base">
                            🏠 返回大廳
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            document.getElementById('cat-sort-replay-btn').onclick = () => window.restartCategorySortQuiz();
            document.getElementById('cat-sort-home-btn').onclick = () => {
                hideSortModals();
                openLobby('subject');
            };
        }
    }

    function hideSortModals() {
        ['cat-sort-next-bar', 'cat-sort-summary-modal'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.classList.add('hidden'); el.classList.remove('flex'); }
        });
    }

    window.setCategorySortDifficulty = function (diff) {
        if (typeof playPopSound === 'function') playPopSound(560);
        sortState.difficulty = diff;
        window.restartCategorySortQuiz();
    };

    function renderSortTopBar() {
        const tierBar = document.getElementById('maze-tier-bar');
        if (!tierBar) return;
        const qNum = Math.min(10, sortState.qIndex + 1);
        const isAll4 = (sortState.difficulty === 'all4');
        const sortedNow = sortState.items.filter(i => i.sorted).length;
        const needCount = isAll4 ? 4 : 1;

        tierBar.innerHTML = `
            <div class="pointer-events-auto flex flex-wrap items-center justify-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border-2 border-emerald-400 shadow-lg">
                <span class="bg-emerald-600 text-white font-black text-xs sm:text-sm px-3 py-1 rounded-xl shadow-sm">
                    📋 第 ${qNum} / 10 題
                </span>
                <span class="bg-amber-100 text-amber-900 font-black text-xs sm:text-sm px-2.5 py-1 rounded-xl border border-amber-300">
                    本題已分類：${Math.min(needCount, sortedNow)} / ${needCount}
                </span>
                <button type="button" onclick="setCategorySortDifficulty('all4')" class="btn-toy-sm px-2.5 py-1 rounded-xl font-black text-xs border ${isAll4 ? 'bg-amber-400 text-slate-950 border-amber-500' : 'bg-slate-100 text-slate-600 border-slate-200'}">
                    🧺🚏 4件全分類
                </button>
                <button type="button" onclick="setCategorySortDifficulty('one')" class="btn-toy-sm px-2.5 py-1 rounded-xl font-black text-xs border ${!isAll4 ? 'bg-amber-400 text-slate-950 border-amber-500' : 'bg-slate-100 text-slate-600 border-slate-200'}">
                    🌱 單件指定分類
                </button>
            </div>
        `;
    }

    // ==================== 5. 題目載入與拖放判定邏輯 ====================
    function setupSortQuestion(qIdx) {
        ensureStageBuilt();
        ensureCategoryHUD();
        hideSortModals();

        sortState.qIndex = qIdx;
        sortState.hadHintThisQ = false;
        sortState.roundDone = false;
        sortState.quizFinished = false;
        sortState.draggingItem = null;
        sortState.selectedItem = null;
        sortState.hoveredZone = null;
        sortState.items = [];
        sortState.dynamicGroup.clear();
        if (sortState.dragShadowRing) sortState.dragShadowRing.visible = false;

        createTargetZones();

        const rawSet = QUESTION_SETS[qIdx % QUESTION_SETS.length];
        const shuffledKeys = [...rawSet].sort(() => Math.random() - 0.5);
        const xSlots = [-4.5, -1.5, 1.5, 4.5];
        shuffledKeys.forEach((k, idx) => {
            sortState.items.push(createDraggable3DItem(k, xSlots[idx], 2.85, idx));
        });

        renderSortTopBar();

        const cardEl = document.getElementById('target-number-card');
        const numEl = document.getElementById('target-badge-num');
        const dotsEl = document.getElementById('target-badge-dots');
        if (cardEl && numEl && dotsEl) {
            cardEl.style.background = 'linear-gradient(to bottom, #10B981, #059669)';
            cardEl.style.color = '#FFFFFF';
            numEl.textContent = '🧺🚏';
            dotsEl.textContent = `第${qIdx + 1}/10題`;
        }
        const banner = document.getElementById('counting-banner');
        if (banner) banner.classList.add('hidden');

        if (sortState.difficulty === 'one') {
            const wantCat = (qIdx % 2 === 0) ? 'fruit' : 'vehicle';
            sortState.targetSingleCat = wantCat;
            setPromptUI(
                wantCat === 'fruit'
                    ? `第 ${qIdx + 1} 題：請喺下面搵 1 個「水果」，拖去左邊「水果」果籃度！`
                    : `第 ${qIdx + 1} 題：請喺下面搵 1 架「交通工具」，拖去右邊「交通工具」停車場度！`,
                ``
            );
        } else {
            sortState.targetSingleCat = null;
            setPromptUI(`第 ${qIdx + 1} 題：請將下面 4 件物件分類，水果拖去左邊果籃，交通工具拖去右邊停車場！`, ``);
        }
        updateRightButtonForMode();
    }

    function handleDropOnZone(item, zone) {
        if (!item || !zone || item.sorted || sortState.roundDone) return;

        // 若喺「單件指定分類」模式，檢查係咪放緊指定類別
        if (sortState.difficulty === 'one' && sortState.targetSingleCat && item.info.cat !== sortState.targetSingleCat) {
            sortState.hadHintThisQ = true;
            if (typeof playGentleNudge === 'function') playGentleNudge();
            item.targetX = item.homeX; item.targetY = item.homeY; item.targetZ = item.homeZ; item.targetScale = 1.0;
            item.wobbleTimer = 0.55;
            const rightZ = sortState.zones[sortState.targetSingleCat];
            if (rightZ) rightZ.hintTimer = 2.4;
            const label = sortState.targetSingleCat === 'fruit' ? '水果（左邊果籃）' : '交通工具（右邊停車場）';
            setPromptUI(`💡 今題我哋先搵 1 個「${label}」試吓啦！`, ``);
            return;
        }

        if (item.info.cat === zone.cat) {
            // ✅ 分類正確：泊入果籃或停車場空位
            item.sorted = true;
            const freeSlot = zone.slots.find(s => !s.taken) || { x: zone.x, z: zone.z };
            freeSlot.taken = true;

            item.targetX = freeSlot.x;
            item.targetY = 0.66;
            item.targetZ = freeSlot.z;
            item.targetScale = 0.82;
            item.nameTag.visible = false;
            item.okBadge.visible = true;

            // 清除之前嘅錯誤提示箭咀
            Object.values(sortState.zones).forEach(z => { z.hintTimer = 0; z.hintArrow.visible = false; });

            if (typeof playSuccessChime === 'function') playSuccessChime();
            if (typeof emitStarParticles === 'function') emitStarParticles(new THREE.Vector3(freeSlot.x, 1.4, freeSlot.z));
            sortState.heroJumpTimer = 1.1;
            renderSortTopBar();

            const finishedThisRound = (sortState.difficulty === 'one')
                ? true
                : sortState.items.every(i => i.sorted);

            if (!finishedThisRound) {
                const remain = sortState.items.filter(i => !i.sorted).length;
                setPromptUI(`👍 啱喇！${item.info.msg}仲有 ${remain} 件，繼續拖去啱嘅位置啦！`, ``);
                return;
            }

            // 本題全部完成！彈出「下一題」按鈕
            sortState.roundDone = true;
            if (!sortState.hadHintThisQ) sortState.independentCount += 1;
            else sortState.scaffoldedCount += 1;

            const isLast = (sortState.qIndex >= sortState.totalQuestions - 1);
            setPromptUI(`🌟 好叻呀！${item.info.msg}本題分類完成！`, ``);

            const bar = document.getElementById('cat-sort-next-bar');
            const msg = document.getElementById('cat-sort-next-msg');
            const btn = document.getElementById('cat-sort-next-btn');
            if (bar && msg && btn) {
                msg.textContent = isLast ? '10 題全部分類完成！' : `第 ${sortState.qIndex + 1} 題完成！好叻呀！`;
                btn.textContent = isLast ? '睇總結獎勵 🏆' : '下一題 ➔';
                bar.classList.remove('hidden');
                bar.classList.add('flex');
            }
            updateRightButtonForMode();
        } else {
            // 💡 分類錯位：無紅叉懲罰，順滑回彈 + 點亮正確目標區金色箭咀引導再試
            sortState.hadHintThisQ = true;
            if (typeof playGentleNudge === 'function') playGentleNudge();

            item.targetX = item.homeX;
            item.targetY = item.homeY;
            item.targetZ = item.homeZ;
            item.targetScale = 1.0;
            item.wobbleTimer = 0.6;

            const correctZone = sortState.zones[item.info.cat];
            if (correctZone) correctZone.hintTimer = 2.8;

            if (item.info.cat === 'fruit') {
                setPromptUI(`💡「${item.info.name}」係甜甜哋食得㗎，試吓拖去左邊「🧺 水果」果籃啦！`, ``);
            } else {
                setPromptUI(`💡「${item.info.name}」係載我哋去街街㗎，試吓拖去右邊「🚏 交通工具」停車場啦！`, ``);
            }
        }
    }

    window.nextCategorySortQuestion = function () {
        if (typeof playPopSound === 'function') playPopSound(580);
        if (sortState.qIndex < sortState.totalQuestions - 1) {
            setupSortQuestion(sortState.qIndex + 1);
        } else {
            sortState.quizFinished = true;
            hideSortModals();
            if (typeof playStageClearFanfare === 'function') playStageClearFanfare();
            if (typeof awardStarProgress === 'function') awardStarProgress();
            const stats = document.getElementById('cat-sort-stats');
            if (stats) {
                stats.textContent = `🌟 完成 10 / 10 題 ｜ 獨立完成：${sortState.independentCount} 題 ｜ 提示後完成：${sortState.scaffoldedCount} 題`;
            }
            const modal = document.getElementById('cat-sort-summary-modal');
            if (modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
            speakCantonese('好叻呀！十題分類全部完成晒，你識得分清楚水果同交通工具喇！', true);
        }
    };

    window.restartCategorySortQuiz = function () {
        if (typeof playPopSound === 'function') playPopSound(540);
        sortState.independentCount = 0;
        sortState.scaffoldedCount = 0;
        setupSortQuestion(0);
    };

    // ==================== 6. 手指與滑鼠 3D 拖放控制 ====================
    function setRayFromPointer(e) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
    }

    function bindDragEvents() {
        if (!renderer || !renderer.domElement || renderer.domElement.dataset.catSortV2Bound) return;
        renderer.domElement.dataset.catSortV2Bound = 'true';
        const dom = renderer.domElement;

        dom.addEventListener('pointerdown', (e) => {
            if (gameState.inLobby || gameState.mode !== 'categorysort') return;
            e.stopImmediatePropagation();
            if (sortState.roundDone || sortState.quizFinished) return;
            if (typeof ensureAudioCtx === 'function') ensureAudioCtx();

            setRayFromPointer(e);

            // 1. 按住未分類嘅 3D 物件開始拖曳
            const itemHits = raycaster.intersectObjects(sortState.items.filter(i => !i.sorted).map(i => i.hitMesh), false);
            if (itemHits.length > 0 && itemHits[0].object.userData.itemObj) {
                const it = itemHits[0].object.userData.itemObj;
                if (typeof playPopSound === 'function') playPopSound(560);
                sortState.draggingItem = it;
                sortState.selectedItem = it;
                sortState.pointerStart = { x: e.clientX, y: e.clientY };
                sortState.movedPx = 0;
                it.targetY = 1.65;
                it.targetScale = 1.15;
                if (sortState.dragShadowRing) {
                    sortState.dragShadowRing.position.set(it.targetX, 0.48, it.targetZ);
                    sortState.dragShadowRing.visible = true;
                }
                return;
            }

            // 2. 點選輔助：若已篤選某物件，再篤左籃或右車場亦可放入
            if (sortState.selectedItem && !sortState.selectedItem.sorted) {
                const zoneHits = raycaster.intersectObjects(Object.values(sortState.zones).map(z => z.hitBox), false);
                if (zoneHits.length > 0 && zoneHits[0].object.userData.zoneObj) {
                    const chosen = sortState.selectedItem;
                    sortState.selectedItem = null;
                    handleDropOnZone(chosen, zoneHits[0].object.userData.zoneObj);
                }
            }
        }, true);

        dom.addEventListener('pointermove', (e) => {
            if (gameState.inLobby || gameState.mode !== 'categorysort' || !sortState.draggingItem) return;
            e.stopImmediatePropagation();

            const it = sortState.draggingItem;
            sortState.movedPx = Math.hypot(e.clientX - sortState.pointerStart.x, e.clientY - sortState.pointerStart.y);

            setRayFromPointer(e);
            const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.1);
            const pt = new THREE.Vector3();
            if (raycaster.ray.intersectPlane(plane, pt)) {
                it.targetX = THREE.MathUtils.clamp(pt.x, -6.8, 6.8);
                it.targetZ = THREE.MathUtils.clamp(pt.z, -2.8, 4.4);
                it.targetY = 1.7;

                if (sortState.dragShadowRing) {
                    sortState.dragShadowRing.position.set(it.targetX, 0.48, it.targetZ);
                    sortState.dragShadowRing.visible = true;
                }

                // 磁吸感應：拖近左邊果籃或右邊停車場即高亮放大
                let bestZone = null;
                Object.values(sortState.zones).forEach(z => {
                    if (Math.abs(it.targetX - z.x) < 2.65 && Math.abs(it.targetZ - z.z) < 2.15) {
                        bestZone = z;
                    }
                });
                sortState.hoveredZone = bestZone;
            }
        }, true);

        const onRelease = () => {
            if (gameState.mode !== 'categorysort' || !sortState.draggingItem) return;
            const it = sortState.draggingItem;
            sortState.draggingItem = null;
            const dropZone = sortState.hoveredZone;
            sortState.hoveredZone = null;
            if (sortState.dragShadowRing) sortState.dragShadowRing.visible = false;

            if (dropZone) {
                sortState.selectedItem = null;
                handleDropOnZone(it, dropZone);
            } else if (sortState.movedPx < 10) {
                // 輕觸物件：讀出名稱並微升，提示拖去左邊或右邊
                it.targetX = it.homeX; it.targetZ = it.homeZ; it.targetY = 0.95; it.targetScale = 1.08;
                sortState.items.forEach(o => {
                    if (o !== it && !o.sorted) { o.targetY = o.homeY; o.targetScale = 1.0; }
                });
                speakCantonese(`${it.info.name}。請拖去水果籃或者交通工具停車場啦！`, true);
            } else {
                sortState.selectedItem = null;
                it.targetX = it.homeX; it.targetY = it.homeY; it.targetZ = it.homeZ; it.targetScale = 1.0;
            }
        };

        window.addEventListener('pointerup', onRelease, true);
        window.addEventListener('pointercancel', onRelease, true);
    }

    // ==================== 7. 每幀動畫與主遊戲大廳掛載 ====================
    function updateSortScene(dt, elapsed) {
        if (!categorySortGroup.visible) return;
        if (typeof environmentGroup !== 'undefined') environmentGroup.visible = false;

        Object.values(sortState.zones).forEach(z => {
            const hovered = (sortState.hoveredZone === z);
            z.root.scale.setScalar(THREE.MathUtils.lerp(z.root.scale.x, hovered ? 1.08 : 1.0, dt * 12));

            if (z.hintTimer > 0) {
                z.hintTimer = Math.max(0, z.hintTimer - dt);
                z.ringMat.color.setHex(0xFACC15);
                z.ringMat.opacity = 0.6 + Math.sin(elapsed * 10) * 0.35;
                z.hintArrow.visible = true;
                z.hintArrow.position.y = 3.25 + Math.abs(Math.sin(elapsed * 7)) * 0.35;
            } else {
                z.hintArrow.visible = false;
                z.ringMat.color.setHex(z.cat === 'fruit' ? 0xFB7185 : 0x38BDF8);
                z.ringMat.opacity = hovered ? 0.95 : 0.5;
            }
        });

        sortState.items.forEach((it, idx) => {
            const speed = (sortState.draggingItem === it) ? 24 : 11;
            it.wrap.position.x = THREE.MathUtils.lerp(it.wrap.position.x, it.targetX, Math.min(1, dt * speed));
            it.wrap.position.z = THREE.MathUtils.lerp(it.wrap.position.z, it.targetZ, Math.min(1, dt * speed));
            const bob = (!it.sorted && sortState.draggingItem !== it) ? Math.sin(elapsed * 2.6 + idx) * 0.04 : 0;
            it.wrap.position.y = THREE.MathUtils.lerp(it.wrap.position.y, it.targetY + bob, Math.min(1, dt * speed));
            it.wrap.scale.setScalar(THREE.MathUtils.lerp(it.wrap.scale.x, it.targetScale, Math.min(1, dt * 10)));

            if (!it.sorted && sortState.draggingItem !== it) {
                it.model.rotation.y = Math.sin(elapsed * 1.4 + idx) * 0.25;
            } else {
                it.model.rotation.y = THREE.MathUtils.lerp(it.model.rotation.y, 0, dt * 8);
            }

            if (it.wobbleTimer > 0) {
                it.wobbleTimer = Math.max(0, it.wobbleTimer - dt);
                it.wrap.rotation.z = Math.sin(elapsed * 26) * 0.14;
            } else {
                it.wrap.rotation.z = THREE.MathUtils.lerp(it.wrap.rotation.z, 0, dt * 10);
            }
        });

        if (sortState.heroMesh) {
            if (sortState.heroJumpTimer > 0) {
                sortState.heroJumpTimer = Math.max(0, sortState.heroJumpTimer - dt);
                sortState.heroMesh.position.y = 0.36 + Math.abs(Math.sin(elapsed * 14)) * 0.42;
            } else {
                sortState.heroMesh.position.y = 0.36 + Math.sin(elapsed * 3) * 0.03;
            }
        }

        if (camera) {
            camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, dt * 5);
            camera.position.y = THREE.MathUtils.lerp(camera.position.y, 11.2, dt * 5);
            camera.position.z = THREE.MathUtils.lerp(camera.position.z, 11.6, dt * 5);
            camera.lookAt(0, 0.75, 0.55);
        }
    }

    function injectLobbyCards() {
        const stepSubj = document.getElementById('lobby-step-subject');
        if (stepSubj && !document.getElementById('lobby-subj-category')) {
            const firstBtn = stepSubj.querySelector('button[onclick*="selectSubjectFromLobby"]');
            if (firstBtn && firstBtn.parentElement) {
                const btn = document.createElement('button');
                btn.id = 'lobby-subj-category';
                btn.type = 'button';
                btn.onclick = () => {
                    gameState.subject = 'category';
                    startGameFromLobby('categorysort');
                };
                btn.className = 'btn-toy group bg-gradient-to-b from-emerald-50 to-teal-100 hover:from-emerald-100 hover:to-teal-200 p-5 rounded-3xl border-4 border-emerald-400 flex flex-col items-center justify-center gap-2 shadow-lg transition-all';
                btn.innerHTML = `
                    <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 text-white flex items-center justify-center text-3xl sm:text-4xl shadow-md group-hover:scale-110 transition-transform">🧺🚌</div>
                    <span class="text-xl sm:text-2xl font-black text-slate-800">分類樂園</span>
                    <span class="text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-200/80 px-3 py-0.5 rounded-full">水果 vs 交通工具</span>
                `;
                firstBtn.parentElement.appendChild(btn);
            }
        }
    }

    function connectToWonderland() {
        SUBJECT_DISPLAY_META.category = { icon: '🧺', title: '分類樂園', short: '🧺 分類' };
        MODE_DISPLAY_META.categorysort = '🧺🚏 水果與交通分類';

        const _origOpenLobby = openLobby;
        window.openLobby = openLobby = function (step = 'subject') {
            injectLobbyCards();
            hideSortModals();
            _origOpenLobby(step);
        };

        const _origSwitchMode = switchMode;
        window.switchMode = switchMode = function (newMode) {
            bindDragEvents();
            if (newMode === 'categorysort') {
                gameState.subject = 'category';
                ensureStageBuilt();
            } else {
                hideSortModals();
                categorySortGroup.visible = false;
            }
            _origSwitchMode(newMode);

            if (newMode === 'categorysort') {
                categorySortGroup.visible = true;
                [window.gachaMachineGroup, window.trainGroup, window.marioStageGroup, window.treasureIslandGroup, window.additionArenaGroup, window.shapeBridgeGroup, window.colorSplashGroup, window.environmentGroup].forEach(grp => {
                    if (grp) grp.visible = false;
                });
                const mainFloor = scene ? scene.getObjectByName('mainFloor') : null;
                if (mainFloor) mainFloor.visible = false;
                const dpad = document.getElementById('treasure-dpad-bar');
                if (dpad) { dpad.classList.add('hidden'); dpad.classList.remove('flex'); }
                renderSortTopBar();
            }
        };

        const _origStartNewRound = startNewRound;
        window.startNewRound = startNewRound = function () {
            if (gameState.mode === 'categorysort') {
                if (typeof clearCountingObjects === 'function') clearCountingObjects();
                if (typeof numberBlocksGroup !== 'undefined') numberBlocksGroup.clear();
                interactiveBlocks = [];
                gameState.isBusy = false;
                sortState.independentCount = 0;
                sortState.scaffoldedCount = 0;
                setupSortQuestion(0);
                return;
            }
            categorySortGroup.visible = false;
            hideSortModals();
            _origStartNewRound();
        };

        const _origHint = triggerVisualHint;
        window.triggerVisualHint = triggerVisualHint = function (manualClick = false) {
            if (gameState.mode === 'categorysort') {
                if (sortState.roundDone || sortState.quizFinished) return;
                if (manualClick && typeof playPopSound === 'function') playPopSound(660);
                const nextUnsorted = sortState.items.find(i => !i.sorted);
                if (nextUnsorted) {
                    nextUnsorted.targetY = 0.92;
                    const z = sortState.zones[nextUnsorted.info.cat];
                    if (z) z.hintTimer = 2.6;
                    speakCantonese(`試吓將「${nextUnsorted.info.name}」拖去${nextUnsorted.info.cat === 'fruit' ? '左邊水果籃' : '右邊交通工具停車場'}啦！`, true);
                }
                return;
            }
            _origHint(manualClick);
        };

        const _origUpdateRightBtn = updateRightButtonForMode;
        window.updateRightButtonForMode = updateRightButtonForMode = function () {
            _origUpdateRightBtn();
            if (gameState.mode === 'categorysort') {
                const lbl = document.getElementById('right-btn-label');
                const ico = document.getElementById('right-btn-icon');
                if (lbl && ico) {
                    lbl.textContent = sortState.roundDone ? '下一題' : '重聽提示';
                    ico.className = sortState.roundDone ? 'fa-solid fa-forward-step' : 'fa-solid fa-volume-high';
                }
            }
        };

        const _origRightAction = handleRightActionBtn;
        window.handleRightActionBtn = handleRightActionBtn = function () {
            if (gameState.mode === 'categorysort') {
                if (sortState.roundDone) window.nextCategorySortQuestion();
                else speakCantonese(document.getElementById('prompt-text')?.textContent || '', true);
                return;
            }
            _origRightAction();
        };

        const _origAnim = animate;
        let _lastT = performance.now();
        window.animate = animate = function () {
            const now = performance.now();
            const dt = Math.min((now - _lastT) / 1000, 0.1);
            _lastT = now;
            if (categorySortGroup.visible) updateSortScene(dt, now / 1000);
            _origAnim();
            if (!gameState.inLobby && gameState.mode === 'categorysort') {
                const tb = document.getElementById('maze-tier-bar');
                if (tb) tb.style.display = 'flex';
            }
        };
    }

    const boot = () => {
        connectToWonderland();
        injectLobbyCards();
        bindDragEvents();
    };
    if (document.readyState === 'complete') setTimeout(boot, 250);
    else window.addEventListener('load', () => setTimeout(boot, 250));
})();
