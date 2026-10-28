/********************************************************************
 * [FILE: scene3d.js]
 * 3. THREE.JS 3D SCENE, LIGHTING, TOY MODELS & 9x9 TRUE LABYRINTH MAZE
 ********************************************************************/
let scene, camera, renderer, raycaster, pointer;
let clock = new THREE.Clock();

// Scene Groups
let environmentGroup = new THREE.Group();
let gachaMachineGroup = new THREE.Group();
let trainGroup = new THREE.Group();
let marioStageGroup = new THREE.Group();
let treasureIslandGroup = new THREE.Group();
let numberBlocksGroup = new THREE.Group();
let countingObjectsGroup = new THREE.Group();
let particlesGroup = new THREE.Group();

// Interactive & Animated Lists
let interactiveBlocks = [];
let spawnedCountingItems = [];
let activeParticles = [];
let cloudsList = [];

// Train animation state
let trainAnimState = {
    targetX: 0,
    currentX: -14,
    signMesh: null,
    cargoGroup: null,
    wheels: []
};

// Mario Adventure 3D Character & Stage state
let marioHero = {
    group: null,
    selectionRing: null,
    flagMesh: null,
    missionSignMesh: null,
    currentX: 0,
    targetX: 0,
    baseY: 0.45,
    currentY: 0.45,
    jumpVel: 0,
    isJumping: false,
    hitTriggered: false,
    pendingBrick: null,
    autoJumpOnArrive: false,
    runningToFlag: false,
    flagSlideY: 3.35,
    walkCycle: 0
};

// Mode 5: 1-2-3-4-5 Maze Rescue Parade State (迷宮救兵大巡遊)
let treasureHero = {
    group: null,
    compassRing: null,
    clickMarker: null,
    mazeLayoutGroup: null,
    castleGate: null,
    pathDots: [],
    mazeLevelIdx: 0,
    sequence: [1, 2, 3, 4, 5],
    nextSeqIndex: 0,
    paradeFollowers: [],
    trail: [],
    pathQueue: [],
    allRescued: false,
    castleVictoryTriggered: false,
    currentX: 0,
    currentZ: 4.95,
    moveDirX: 0,
    moveDirZ: 0,
    walkCycle: 0,
    facingAngle: Math.PI
};

// Gachapon animation state
let gachaDialMesh = null;
let gachaSpinTimer = 0;

function initThreeScene() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#CBEBFB');

    camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
    updateCameraForAspect();

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();

    // Soft Toy Studio Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffe4b5, 0.78);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffdf5, 0.75);
    dirLight.position.set(6, 14, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 35;
    const d = 10;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    // Ground / Stage Platform
    const floorGeo = new THREE.CylinderGeometry(16, 16, 1, 48);
    const floorMat = new THREE.MeshStandardMaterial({
        color: 0x9AE66E,
        roughness: 0.85,
        metalness: 0.05
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(0, -0.6, 0);
    floorMesh.receiveShadow = true;
    floorMesh.name = 'mainFloor';
    scene.add(floorMesh);

    // Add Groups to Scene
    scene.add(environmentGroup);
    scene.add(gachaMachineGroup);
    scene.add(trainGroup);
    scene.add(marioStageGroup);
    scene.add(treasureIslandGroup);
    scene.add(numberBlocksGroup);
    scene.add(countingObjectsGroup);
    scene.add(particlesGroup);

    // Build All 3D Stages
    buildWonderlandEnvironment();
    build3DGachaponMachine();
    build3DCartoonTrain();
    build3DMarioStage();
    build3DTreasureIsland();

    // Bind Unified Pointer & Keyboard Events
    renderer.domElement.addEventListener('pointerdown', onCanvasPointerDown, false);
    window.addEventListener('keydown', onWindowKeyDown, false);
    window.addEventListener('keyup', onWindowKeyUp, false);
    window.addEventListener('resize', onWindowResize, false);
}

function updateCameraForAspect() {
    if (!camera) return;
    const aspect = window.innerWidth / window.innerHeight;
    camera.aspect = aspect;

    if (gameState && gameState.mode === 'treasure') {
        if (aspect < 0.75) {
            camera.position.set(0, 17.5, 13.5);
            camera.lookAt(0, 0.2, 0.2);
        } else if (aspect < 1.15) {
            camera.position.set(0, 15.5, 11.8);
            camera.lookAt(0, 0.2, 0.0);
        } else {
            camera.position.set(0, 13.8, 9.6);
            camera.lookAt(0, 0.2, -0.4);
        }
    } else {
        if (aspect < 0.75) {
            camera.position.set(0, 6.2, 16.8);
            camera.lookAt(0, 1.1, 0);
        } else if (aspect < 1.15) {
            camera.position.set(0, 5.6, 14.0);
            camera.lookAt(0, 1.3, 0);
        } else {
            camera.position.set(0, 5.0, 11.6);
            camera.lookAt(0, 1.4, 0);
        }
    }
    camera.updateProjectionMatrix();
}

function onWindowResize() {
    updateCameraForAspect();
    if (renderer) {
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

/********************************************************************
 * 4. 3D SCENERY, GACHAPON MACHINE & CARTOON TRAIN BUILDERS
 ********************************************************************/
function buildWonderlandEnvironment() {
    environmentGroup.clear();
    cloudsList = [];

    const hillPositions = [
        { x: -7.5, y: -0.5, z: -7.5, r: 4.5, color: 0x7ED957 },
        { x: 7.5, y: -0.5, z: -7.0, r: 4.2, color: 0x8CE063 },
        { x: 0, y: -1.2, z: -9.5, r: 5.5, color: 0xA3E97A }
    ];
    hillPositions.forEach(h => {
        const geo = new THREE.SphereGeometry(h.r, 24, 16);
        const mat = new THREE.MeshStandardMaterial({ color: h.color, roughness: 0.9 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.scale.set(1.3, 0.65, 0.8);
        mesh.position.set(h.x, h.y, h.z);
        mesh.receiveShadow = true;
        environmentGroup.add(mesh);
    });

    const treeCoords = [
        { x: -6.8, z: -4.2, scale: 1.0, color: 0x4CC9F0 },
        { x: -5.2, z: -5.5, scale: 0.85, color: 0xFF99C8 },
        { x: 6.5, z: -4.4, scale: 1.05, color: 0xFFCA3A },
        { x: 5.0, z: -5.6, scale: 0.8, color: 0x52B788 }
    ];
    treeCoords.forEach(t => {
        const tree = new THREE.Group();
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.26, 1.2, 12),
            new THREE.MeshStandardMaterial({ color: 0xA9714B, roughness: 0.8 })
        );
        trunk.position.y = 0.5;
        trunk.castShadow = true;
        tree.add(trunk);

        const crown = new THREE.Mesh(
            new THREE.SphereGeometry(0.85, 20, 20),
            new THREE.MeshStandardMaterial({ color: t.color, roughness: 0.5 })
        );
        crown.position.y = 1.45;
        crown.castShadow = true;
        tree.add(crown);

        tree.position.set(t.x, 0, t.z);
        tree.scale.setScalar(t.scale);
        environmentGroup.add(tree);
    });

    const cloudCoords = [
        { x: -5.5, y: 5.2, z: -6.5, speed: 0.25 },
        { x: 4.8, y: 5.6, z: -7.0, speed: 0.18 },
        { x: 0.2, y: 6.1, z: -8.0, speed: 0.22 }
    ];
    cloudCoords.forEach(c => {
        const cloud = new THREE.Group();
        const cloudMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.9 });
        [
            { x: 0, y: 0, r: 0.75 },
            { x: -0.65, y: -0.1, r: 0.55 },
            { x: 0.65, y: -0.1, r: 0.55 }
        ].forEach(p => {
            const puff = new THREE.Mesh(new THREE.SphereGeometry(p.r, 16, 16), cloudMat);
            puff.position.set(p.x, p.y, 0);
            cloud.add(puff);
        });
        cloud.position.set(c.x, c.y, c.z);
        cloud.userData = { baseX: c.x, speed: c.speed };
        environmentGroup.add(cloud);
        cloudsList.push(cloud);
    });
}

function build3DGachaponMachine() {
    gachaMachineGroup.clear();
    gachaMachineGroup.position.set(0, 1.15, -2.6);

    const baseMat = new THREE.MeshStandardMaterial({ color: 0xFF595E, roughness: 0.35 });
    const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.75, 1.7, 32), baseMat);
    baseMesh.position.y = 0.85;
    baseMesh.castShadow = true;
    gachaMachineGroup.add(baseMesh);

    const ringMat = new THREE.MeshStandardMaterial({ color: 0xFFCA3A, roughness: 0.3 });
    const ringMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.65, 0.22, 32), ringMat);
    ringMesh.position.y = 1.7;
    gachaMachineGroup.add(ringMesh);

    const domeMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.38,
        roughness: 0.1
    });
    const domeMesh = new THREE.Mesh(new THREE.SphereGeometry(1.55, 32, 24), domeMat);
    domeMesh.position.y = 2.85;
    gachaMachineGroup.add(domeMesh);

    const capMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, 0.3, 24), baseMat);
    capMesh.position.y = 4.25;
    gachaMachineGroup.add(capMesh);

    const capsuleColors = [0xFF595E, 0xFFCA3A, 0x8AC926, 0x1982C4, 0xF15BB5, 0x00BBF9];
    for (let i = 0; i < 10; i++) {
        const capBall = new THREE.Mesh(
            new THREE.SphereGeometry(0.38, 16, 16),
            new THREE.MeshStandardMaterial({ color: capsuleColors[i % capsuleColors.length], roughness: 0.25 })
        );
        const angle = (i / 10) * Math.PI * 2;
        const radius = (i % 2 === 0) ? 0.78 : 0.38;
        capBall.position.set(
            Math.cos(angle) * radius,
            2.15 + (i % 3) * 0.38,
            Math.sin(angle) * radius
        );
        gachaMachineGroup.add(capBall);
    }

    const dialGroup = new THREE.Group();
    dialGroup.position.set(0, 1.0, 1.62);
    const dialPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.12, 24), ringMat);
    dialPlate.rotation.x = Math.PI / 2;
    dialGroup.add(dialPlate);

    const dialHandle = new THREE.Mesh(
        new THREE.BoxGeometry(0.72, 0.18, 0.18),
        new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.3 })
    );
    dialHandle.position.z = 0.1;
    dialGroup.add(dialHandle);
    gachaDialMesh = dialGroup;
    gachaMachineGroup.add(dialGroup);
}

function build3DCartoonTrain() {
    trainGroup.clear();
    trainAnimState.wheels = [];

    const trackGroup = new THREE.Group();
    trackGroup.position.set(0, 0.01, -2.3);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x64748B, roughness: 0.5 });
    const rail1 = new THREE.Mesh(new THREE.BoxGeometry(22, 0.08, 0.12), railMat);
    rail1.position.z = 0.6;
    const rail2 = rail1.clone();
    rail2.position.z = -0.6;
    trackGroup.add(rail1, rail2);
    trainGroup.add(trackGroup);

    const mover = new THREE.Group();
    mover.name = 'trainMover';
    mover.position.set(0, 0.45, -2.3);

    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x1982C4, roughness: 0.35 });
    const boilerMat = new THREE.MeshStandardMaterial({ color: 0xFF595E, roughness: 0.35 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xFFCA3A, roughness: 0.3 });

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.35, 1.7), yellowMat);
    chassis.position.set(0, 0.35, 0);
    chassis.castShadow = true;
    mover.add(chassis);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.85, 1.6), cabinMat);
    cabin.position.set(-1.1, 1.4, 0);
    cabin.castShadow = true;
    mover.add(cabin);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.22, 1.8), yellowMat);
    roof.position.set(-1.1, 2.4, 0);
    mover.add(roof);

    const boiler = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 2.1, 24), boilerMat);
    boiler.rotation.z = Math.PI / 2;
    boiler.position.set(0.85, 1.2, 0);
    boiler.castShadow = true;
    mover.add(boiler);

    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.85, 16), yellowMat);
    chimney.position.set(1.35, 2.1, 0);
    mover.add(chimney);

    const signHolder = new THREE.Group();
    signHolder.position.set(-0.2, 2.85, 0.5);
    const signFrame = new THREE.Mesh(
        new THREE.BoxGeometry(1.75, 1.75, 0.22),
        new THREE.MeshStandardMaterial({ color: 0xFFCA3A, roughness: 0.3 })
    );
    signHolder.add(signFrame);

    const signFaceGeo = new THREE.PlaneGeometry(1.48, 1.48);
    const signFaceMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const signFaceMesh = new THREE.Mesh(signFaceGeo, signFaceMat);
    signFaceMesh.position.z = 0.13;
    signHolder.add(signFaceMesh);
    trainAnimState.signMesh = signFaceMesh;
    mover.add(signHolder);

    const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.25, 20);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
    [-1.4, 0, 1.35].forEach(wx => {
        [0.9, -0.9].forEach(wz => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.x = Math.PI / 2;
            wheel.position.set(wx, 0.32, wz);
            mover.add(wheel);
            trainAnimState.wheels.push(wheel);
        });
    });

    trainGroup.add(mover);
}

function drawShapeSymbolOnCanvas(ctx, shapeId, cx, cy, radius, fillHex, strokeHex = '#FFFFFF') {
    ctx.save();
    ctx.fillStyle = fillHex;
    ctx.strokeStyle = strokeHex;
    ctx.lineWidth = 10;
    ctx.beginPath();

    if (shapeId === 'circle') {
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    } else if (shapeId === 'square') {
        const s = radius * 1.65;
        roundRectCanvas(ctx, cx - s / 2, cy - s / 2, s, s, 20);
    } else if (shapeId === 'rectangle') {
        const w = radius * 2.15;
        const h = radius * 1.25;
        roundRectCanvas(ctx, cx - w / 2, cy - h / 2, w, h, 18);
    } else if (shapeId === 'triangle') {
        const r = radius * 1.15;
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx + r * 0.95, cy + r * 0.78);
        ctx.lineTo(cx - r * 0.95, cy + r * 0.78);
        ctx.closePath();
    } else if (shapeId === 'star') {
        const spikes = 5;
        const outerR = radius * 1.12;
        const innerR = radius * 0.48;
        let rot = (Math.PI / 2) * 3;
        const step = Math.PI / spikes;
        ctx.moveTo(cx, cy - outerR);
        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
            rot += step;
            ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
            rot += step;
        }
        ctx.closePath();
    } else if (shapeId === 'heart') {
        const r = radius * 0.95;
        ctx.moveTo(cx, cy + r * 0.85);
        ctx.bezierCurveTo(cx - r * 1.35, cy + r * 0.1, cx - r * 1.2, cy - r * 0.95, cx, cy - r * 0.35);
        ctx.bezierCurveTo(cx + r * 1.2, cy - r * 0.95, cx + r * 1.35, cy + r * 0.1, cx, cy + r * 0.85);
        ctx.closePath();
    }

    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function updateTrainSignTexture(targetKey) {
    if (!trainAnimState.signMesh) return;
    const meta = getCognitiveItemMeta(targetKey);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = meta.hex || '#1982C4';
    ctx.lineWidth = 18;
    ctx.strokeRect(9, 9, 238, 238);

    if (meta.subject === 'color') {
        ctx.fillStyle = meta.hex;
        ctx.beginPath();
        ctx.arc(128, 102, 58, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#1E293B';
        ctx.stroke();

        ctx.fillStyle = '#1E293B';
        ctx.font = '900 52px "Noto Sans TC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(meta.title, 128, 200);
    } else if (meta.subject === 'shape') {
        drawShapeSymbolOnCanvas(ctx, meta.key, 128, 102, 56, meta.hex, '#1E293B');
        ctx.fillStyle = '#1E293B';
        ctx.font = '900 46px "Noto Sans TC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(meta.title, 128, 202);
    } else {
        ctx.fillStyle = '#1E293B';
        ctx.font = '900 155px "Fredoka", "Noto Sans TC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(meta.key), 128, 136);
    }

    const tex = new THREE.CanvasTexture(canvas);
    trainAnimState.signMesh.material.map = tex;
    trainAnimState.signMesh.material.needsUpdate = true;
}

function build3DMarioStage() {
    marioStageGroup.clear();

    const walkwayGroup = new THREE.Group();
    walkwayGroup.position.set(0, 0.1, 0.8);

    const soilMesh = new THREE.Mesh(
        new THREE.BoxGeometry(13.2, 0.48, 2.2),
        new THREE.MeshStandardMaterial({ color: 0xB45309, roughness: 0.75 })
    );
    soilMesh.position.y = 0.05;
    soilMesh.receiveShadow = true;
    walkwayGroup.add(soilMesh);

    const grassTop = new THREE.Mesh(
        new THREE.BoxGeometry(13.4, 0.18, 2.35),
        new THREE.MeshStandardMaterial({ color: 0x4ADE80, roughness: 0.65 })
    );
    grassTop.position.y = 0.32;
    grassTop.receiveShadow = true;
    walkwayGroup.add(grassTop);
    marioStageGroup.add(walkwayGroup);

    const pipeGroup = new THREE.Group();
    pipeGroup.position.set(-5.3, 0.45, 0.8);
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x22C55E, roughness: 0.28, metalness: 0.1 });
    const pipeBody = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.3, 24), pipeMat);
    pipeBody.position.y = 0.65;
    pipeBody.castShadow = true;
    pipeGroup.add(pipeBody);

    const pipeRim = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.32, 24), pipeMat);
    pipeRim.position.y = 1.35;
    pipeRim.castShadow = true;
    pipeGroup.add(pipeRim);

    const pipeHole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.52, 0.52, 0.06, 24),
        new THREE.MeshBasicMaterial({ color: 0x052E16 })
    );
    pipeHole.position.y = 1.5;
    pipeGroup.add(pipeHole);
    marioStageGroup.add(pipeGroup);

    const goalGroup = new THREE.Group();
    goalGroup.position.set(5.1, 0.45, 0.8);

    const baseBlock = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 0.5, 0.75),
        new THREE.MeshStandardMaterial({ color: 0xF59E0B, roughness: 0.4 })
    );
    baseBlock.position.y = 0.25;
    goalGroup.add(baseBlock);

    const poleMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 3.8, 16),
        new THREE.MeshStandardMaterial({ color: 0xFEF08A, roughness: 0.3, metalness: 0.3 })
    );
    poleMesh.position.y = 2.15;
    goalGroup.add(poleMesh);

    const topBall = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xFACC15, roughness: 0.2, metalness: 0.4 })
    );
    topBall.position.y = 4.1;
    goalGroup.add(topBall);

    const flagHolder = new THREE.Group();
    flagHolder.position.set(-0.48, 3.35, 0);
    const flagCloth = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.62, 0.08),
        new THREE.MeshStandardMaterial({ color: 0xEF4444, roughness: 0.4 })
    );
    flagHolder.add(flagCloth);
    marioHero.flagMesh = flagHolder;
    goalGroup.add(flagHolder);
    marioStageGroup.add(goalGroup);

    const skyBoard = new THREE.Group();
    skyBoard.position.set(0, 4.95, -0.6);
    const boardFrame = new THREE.Mesh(
        new THREE.BoxGeometry(3.4, 1.35, 0.2),
        new THREE.MeshStandardMaterial({ color: 0xFFCA3A, roughness: 0.3 })
    );
    skyBoard.add(boardFrame);

    const boardFace = new THREE.Mesh(
        new THREE.PlaneGeometry(3.15, 1.12),
        new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
    );
    boardFace.position.z = 0.12;
    skyBoard.add(boardFace);
    marioHero.missionSignMesh = boardFace;
    marioStageGroup.add(skyBoard);

    const ringGeo = new THREE.RingGeometry(0.55, 0.76, 32);
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0xFDE047,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.set(0, 0.49, 0.8);
    marioHero.selectionRing = ringMesh;
    marioStageGroup.add(ringMesh);

    const hero = new THREE.Group();
    hero.position.set(0, 0.45, 0.8);

    const redMat = new THREE.MeshStandardMaterial({ color: 0xEF4444, roughness: 0.35 });
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x2563EB, roughness: 0.4 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xFDBA74, roughness: 0.4 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x78350F, roughness: 0.6 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.3 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xFACC15, roughness: 0.3 });

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.44, 0.68, 20), blueMat);
    torso.position.y = 0.56;
    torso.castShadow = true;
    hero.add(torso);

    const shirt = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.39, 0.3, 20), redMat);
    shirt.position.y = 0.78;
    hero.add(shirt);

    [-0.16, 0.16].forEach(bx => {
        const btn = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), yellowMat);
        btn.position.set(bx, 0.64, 0.38);
        hero.add(btn);
    });

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 24), skinMat);
    head.position.y = 1.25;
    head.castShadow = true;
    hero.add(head);

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), skinMat);
    nose.position.set(0, 1.22, 0.42);
    hero.add(nose);

    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0F172A });
    [-0.14, 0.14].forEach(ex => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), pupilMat);
        eye.position.set(ex, 1.3, 0.37);
        hero.add(eye);
    });

    const capCrown = new THREE.Mesh(new THREE.SphereGeometry(0.45, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), redMat);
    capCrown.position.y = 1.32;
    hero.add(capCrown);

    const capVisor = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.08, 20, 1, false, -0.8, 1.6), redMat);
    capVisor.position.set(0, 1.35, 0.18);
    capVisor.rotation.x = 0.15;
    hero.add(capVisor);

    [-0.5, 0.5].forEach((hx, idx) => {
        const hand = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), whiteMat);
        hand.position.set(hx, 0.68, 0.1);
        hand.name = idx === 0 ? 'leftHand' : 'rightHand';
        hero.add(hand);
    });

    [-0.2, 0.2].forEach((fx, idx) => {
        const foot = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), shoeMat);
        foot.scale.set(1.0, 0.7, 1.4);
        foot.position.set(fx, 0.14, 0.08);
        foot.name = idx === 0 ? 'leftFoot' : 'rightFoot';
        hero.add(foot);
    });

    marioHero.group = hero;
    marioStageGroup.add(hero);
}

/********************************************************************
 * Mode 5: 1-2-3-4-5 迷宮救兵大巡遊 (9x9 True Labyrinth Maze & BFS Pathfinding)
 ********************************************************************/
const MAZE_TILE_SIZE = 1.65;
const MAZE_COLS = 9;
const MAZE_ROWS = 9;

const MAZE_LEVEL_DESIGNS = [
    {
        name: '🌳 翡翠森林迷宮',
        wallColor: 0x16A34A,
        topColor: 0x86EFAC,
        floorA: 0x4ADE80,
        floorB: 0x34D399,
        grid: [
            [1, 1, 1, 1, 0, 1, 1, 1, 1], // Row 0: (col:4, row:0) 北面皇冠城堡大門
            [1, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 1, 1, 0, 1, 0, 1],
            [1, 0, 0, 0, 1, 0, 0, 0, 1],
            [1, 1, 0, 1, 1, 1, 0, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 1, 0, 1, 1, 0, 1],
            [1, 0, 0, 1, 0, 1, 0, 0, 1], // Row 7: (col:4, row:7) 馬利奧起點
            [1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        spots: [
            { col: 2, row: 7 },
            { col: 6, row: 7 },
            { col: 3, row: 3 },
            { col: 1, row: 1 },
            { col: 7, row: 1 }
        ]
    },
    {
        name: '🏜️ 黃金沙洲迷宮',
        wallColor: 0xD97706,
        topColor: 0xFDE047,
        floorA: 0xFACC15,
        floorB: 0xFBBF24,
        grid: [
            [1, 1, 1, 1, 0, 1, 1, 1, 1],
            [1, 0, 0, 1, 0, 1, 0, 0, 1],
            [1, 1, 0, 1, 0, 1, 0, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 1, 1, 1, 1, 0, 1],
            [1, 0, 0, 0, 1, 0, 0, 0, 1],
            [1, 1, 1, 0, 1, 0, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        spots: [
            { col: 1, row: 7 },
            { col: 7, row: 7 },
            { col: 3, row: 5 },
            { col: 1, row: 1 },
            { col: 7, row: 1 }
        ]
    },
    {
        name: '👑 皇家花園迷宮',
        wallColor: 0x7E22CE,
        topColor: 0xE9D5FF,
        floorA: 0xC084FC,
        floorB: 0xA855F7,
        grid: [
            [1, 1, 1, 1, 0, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 0, 0, 1, 0, 1],
            [1, 0, 1, 1, 0, 1, 1, 0, 1],
            [1, 0, 0, 1, 0, 1, 0, 0, 1],
            [1, 1, 0, 1, 0, 1, 0, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        spots: [
            { col: 1, row: 7 },
            { col: 7, row: 7 },
            { col: 2, row: 5 },
            { col: 6, row: 5 },
            { col: 4, row: 3 }
        ]
    }
];

function mazeGridToWorld(col, row) {
    return {
        x: (col - 4) * MAZE_TILE_SIZE,
        z: (row - 4) * MAZE_TILE_SIZE
    };
}

function mazeWorldToGrid(x, z) {
    return {
        col: Math.max(0, Math.min(MAZE_COLS - 1, Math.round(x / MAZE_TILE_SIZE + 4))),
        row: Math.max(0, Math.min(MAZE_ROWS - 1, Math.round(z / MAZE_TILE_SIZE + 4)))
    };
}

function isMazeCellWalkable(col, row) {
    const lvl = MAZE_LEVEL_DESIGNS[(treasureHero.mazeLevelIdx || 0) % MAZE_LEVEL_DESIGNS.length];
    if (row < 0 || row >= MAZE_ROWS || col < 0 || col >= MAZE_COLS) return false;
    if (row === 0 && col === 4) {
        return Boolean(treasureHero.allRescued);
    }
    return lvl.grid[row][col] === 0;
}

function findMazePathBFS(startCol, startRow, goalCol, goalRow) {
    if (startCol === goalCol && startRow === goalRow) return [];
    const queue = [[startCol, startRow]];
    const visited = new Set([`${startCol},${startRow}`]);
    const parentMap = {};
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];

    while (queue.length > 0) {
        const [cx, cy] = queue.shift();
        if (cx === goalCol && cy === goalRow) {
            const path = [];
            let currKey = `${goalCol},${goalRow}`;
            while (currKey && currKey !== `${startCol},${startRow}`) {
                const [px, py] = currKey.split(',').map(Number);
                path.unshift(mazeGridToWorld(px, py));
                currKey = parentMap[currKey];
            }
            return path;
        }
        for (let i = 0; i < dirs.length; i++) {
            const nx = cx + dirs[i][0];
            const ny = cy + dirs[i][1];
            const key = `${nx},${ny}`;
            if (!visited.has(key) && (isMazeCellWalkable(nx, ny) || (nx === goalCol && ny === goalRow))) {
                visited.add(key);
                parentMap[key] = `${cx},${cy}`;
                queue.push([nx, ny]);
            }
        }
    }
    return [];
}

function build3DTreasureIsland() {
    treasureIslandGroup.clear();
    treasureIslandGroup.visible = false;

    treasureHero.mazeLevelIdx = 0;
    treasureHero.sequence = [1, 2, 3, 4, 5];
    treasureHero.nextSeqIndex = 0;
    treasureHero.paradeFollowers = [];
    treasureHero.trail = [];
    treasureHero.pathQueue = [];
    treasureHero.allRescued = false;
    treasureHero.castleVictoryTriggered = false;
    treasureHero.mazeLayoutGroup = new THREE.Group();
    treasureHero.pathDots = [];
    treasureHero.castleGate = null;

    const waterMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(30, 30, 0.25, 48),
        new THREE.MeshStandardMaterial({ color: 0x38BDF8, roughness: 0.22 })
    );
    waterMesh.position.set(0, -0.06, -0.8);
    treasureIslandGroup.add(waterMesh);

    const sandBase = new THREE.Mesh(
        new THREE.BoxGeometry(17.2, 0.3, 17.8),
        new THREE.MeshStandardMaterial({ color: 0xFDE68A, roughness: 0.8 })
    );
    sandBase.position.set(0, 0.08, -0.4);
    sandBase.receiveShadow = true;
    treasureIslandGroup.add(sandBase);

    treasureIslandGroup.add(treasureHero.mazeLayoutGroup);

    const gateZ = -4 * MAZE_TILE_SIZE; // -6.6
    const castleGroup = new THREE.Group();
    castleGroup.position.set(0, 0.3, gateZ - 2.1);

    const mainKeep = new THREE.Mesh(
        new THREE.BoxGeometry(4.6, 2.8, 1.8),
        new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.4 })
    );
    mainKeep.position.y = 1.4;
    mainKeep.castShadow = true;
    castleGroup.add(mainKeep);

    [-2.6, 2.6].forEach(tx => {
        const tower = new THREE.Mesh(
            new THREE.CylinderGeometry(0.85, 0.95, 3.3, 20),
            new THREE.MeshStandardMaterial({ color: 0xF1F5F9, roughness: 0.4 })
        );
        tower.position.set(tx, 1.65, 0.1);
        tower.castShadow = true;
        castleGroup.add(tower);

        const roof = new THREE.Mesh(
            new THREE.ConeGeometry(1.12, 1.4, 20),
            new THREE.MeshStandardMaterial({ color: 0xEC4899, roughness: 0.3 })
        );
        roof.position.set(tx, 3.95, 0.1);
        castleGroup.add(roof);
    });

    const crownBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.68, 0.58, 0.48, 16),
        new THREE.MeshStandardMaterial({ color: 0xFACC15, roughness: 0.2, metalness: 0.4 })
    );
    crownBase.position.set(0, 3.05, 0.2);
    castleGroup.add(crownBase);
    treasureIslandGroup.add(castleGroup);

    // North Castle Double Doors
    const gateGroup = new THREE.Group();
    gateGroup.position.set(0, 0.3, gateZ);

    const pillarMat = new THREE.MeshStandardMaterial({ color: 0xF59E0B, roughness: 0.35 });
    [-0.92, 0.92].forEach(px => {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 2.1, 16), pillarMat);
        pillar.position.set(px, 1.05, 0);
        gateGroup.add(pillar);
    });

    const arch = new THREE.Mesh(
        new THREE.TorusGeometry(0.92, 0.18, 12, 24, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0xFACC15, roughness: 0.25 })
    );
    arch.position.set(0, 2.0, 0);
    gateGroup.add(arch);

    const doorMat = new THREE.MeshStandardMaterial({ color: 0xEC4899, roughness: 0.35 });
    const leftPivot = new THREE.Group();
    leftPivot.position.set(-0.82, 0, 0);
    const leftDoor = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.5, 0.18), doorMat);
    leftDoor.position.set(0.4, 0.78, 0);
    leftPivot.add(leftDoor);
    gateGroup.add(leftPivot);

    const rightPivot = new THREE.Group();
    rightPivot.position.set(0.82, 0, 0);
    const rightDoor = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.5, 0.18), doorMat);
    rightDoor.position.set(-0.4, 0.78, 0);
    rightPivot.add(rightDoor);
    gateGroup.add(rightPivot);

    const lockMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.48, 0.24),
        new THREE.MeshStandardMaterial({ color: 0xFACC15, roughness: 0.2, metalness: 0.5 })
    );
    lockMesh.position.set(0, 0.85, 0.16);
    gateGroup.add(lockMesh);

    treasureHero.castleGate = { group: gateGroup, leftPivot, rightPivot, lockMesh };
    treasureIslandGroup.add(gateGroup);

    // Glowing Footprint Dots
    for (let i = 0; i < 16; i++) {
        const dot = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.2, 0.06, 16),
            new THREE.MeshBasicMaterial({ color: 0xFEF08A, transparent: true, opacity: 0.88 })
        );
        dot.position.set(0, 0.34, 0);
        dot.visible = false;
        treasureIslandGroup.add(dot);
        treasureHero.pathDots.push(dot);
    }

    const clickRing = new THREE.Mesh(
        new THREE.RingGeometry(0.38, 0.62, 24),
        new THREE.MeshBasicMaterial({ color: 0xFDE047, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    );
    clickRing.rotation.x = -Math.PI / 2;
    clickRing.position.set(0, 0.35, 0);
    clickRing.visible = false;
    treasureHero.clickMarker = clickRing;
    treasureIslandGroup.add(clickRing);

    const compassGroup = new THREE.Group();
    const ringMesh = new THREE.Mesh(
        new THREE.RingGeometry(0.52, 0.7, 32),
        new THREE.MeshBasicMaterial({ color: 0xFACC15, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    );
    ringMesh.rotation.x = -Math.PI / 2;
    compassGroup.add(ringMesh);

    const arrowMesh = new THREE.Mesh(
        new THREE.ConeGeometry(0.25, 0.5, 3),
        new THREE.MeshBasicMaterial({ color: 0xEA580C })
    );
    arrowMesh.rotation.x = Math.PI / 2;
    arrowMesh.position.set(0, 0.06, 0.95);
    compassGroup.add(arrowMesh);

    compassGroup.position.set(0, 0.34, 4.95);
    treasureHero.compassRing = compassGroup;
    treasureIslandGroup.add(compassGroup);

    const explorer = marioHero.group.clone();
    explorer.scale.setScalar(0.88);
    explorer.position.set(0, 0.3, 4.95);
    treasureHero.group = explorer;
    treasureIslandGroup.add(explorer);

    rebuild3DMazeWalls(0);
}

function rebuild3DMazeWalls(levelIdx) {
    if (!treasureHero.mazeLayoutGroup) return;
    treasureHero.mazeLayoutGroup.clear();

    const lvl = MAZE_LEVEL_DESIGNS[levelIdx % MAZE_LEVEL_DESIGNS.length];
    const wallGeo = new THREE.BoxGeometry(MAZE_TILE_SIZE * 0.94, 0.82, MAZE_TILE_SIZE * 0.94);
    const wallMat = new THREE.MeshStandardMaterial({ color: lvl.wallColor, roughness: 0.55 });
    const capGeo = new THREE.BoxGeometry(MAZE_TILE_SIZE * 0.98, 0.16, MAZE_TILE_SIZE * 0.98);
    const capMat = new THREE.MeshStandardMaterial({ color: lvl.topColor, roughness: 0.4 });
    const tileGeo = new THREE.BoxGeometry(MAZE_TILE_SIZE, 0.12, MAZE_TILE_SIZE);
    const floorMatA = new THREE.MeshStandardMaterial({ color: lvl.floorA, roughness: 0.7 });
    const floorMatB = new THREE.MeshStandardMaterial({ color: lvl.floorB, roughness: 0.7 });

    for (let r = 0; r < MAZE_ROWS; r++) {
        for (let c = 0; c < MAZE_COLS; c++) {
            const pos = mazeGridToWorld(c, r);
            const isEven = (r + c) % 2 === 0;
            const floorTile = new THREE.Mesh(tileGeo, isEven ? floorMatA : floorMatB);
            floorTile.position.set(pos.x, 0.24, pos.z);
            floorTile.receiveShadow = true;
            treasureHero.mazeLayoutGroup.add(floorTile);

            if (lvl.grid[r][c] === 1) {
                const wallGroup = new THREE.Group();
                const wMesh = new THREE.Mesh(wallGeo, wallMat);
                wMesh.position.y = 0.41;
                wMesh.castShadow = true;
                wMesh.receiveShadow = true;
                wallGroup.add(wMesh);

                const cMesh = new THREE.Mesh(capGeo, capMat);
                cMesh.position.y = 0.86;
                wallGroup.add(cMesh);

                if ((r * 3 + c) % 4 === 0) {
                    const berry = new THREE.Mesh(
                        new THREE.SphereGeometry(0.18, 10, 10),
                        new THREE.MeshStandardMaterial({ color: 0xF43F5E, roughness: 0.3 })
                    );
                    berry.position.set(0, 1.0, 0);
                    wallGroup.add(berry);
                }

                wallGroup.position.set(pos.x, 0.3, pos.z);
                treasureHero.mazeLayoutGroup.add(wallGroup);
            }
        }
    }

    const gatePos = mazeGridToWorld(4, 0);
    const carpet = new THREE.Mesh(
        new THREE.BoxGeometry(MAZE_TILE_SIZE * 0.9, 0.14, MAZE_TILE_SIZE * 1.6),
        new THREE.MeshStandardMaterial({ color: 0xF43F5E, roughness: 0.5 })
    );
    carpet.position.set(gatePos.x, 0.25, gatePos.z - 0.3);
    treasureHero.mazeLayoutGroup.add(carpet);
}

function create3DMazeNumberFriend(num, col, row) {
    const pos = mazeGridToWorld(col, row);
    const wrapper = create3DNumberCharacter(num, pos.x, pos.z, 0.68);
    wrapper.baseY = 0.95;
    wrapper.group.position.y = 0.95;
    wrapper.isMazeFriend = true;
    wrapper.isTreasureChest = false;
    wrapper.rescued = false;
    wrapper.gridCol = col;
    wrapper.gridRow = row;

    if (wrapper.haloMesh) {
        wrapper.haloMesh.rotation.x = Math.PI / 2;
        wrapper.haloMesh.position.set(0, -0.82, 0);
    }

    wrapper.bodyMesh.rotation.x = -0.22;
    return wrapper;
}

/********************************************************************
 * Mode 6: 🛸 3D 競技場：馬利奧捉小兵合體大作戰 (三台並列 A + B = C 完整算式版)
 ********************************************************************/
let additionArenaGroup = new THREE.Group();
let additionState = {
    built: false,
    tier: 'sum5', // 'sum5' | 'sum10' | 'missing' | 'free2' | 'sum12'
    numA: 2,
    numB: 3,
    targetSum: 5,
    caughtA: null,
    caughtB: null,
    caughtSum: null,
    phase: 'catch', // 'catch' | 'fusing' | 'readyToFire' | 'firing' | 'celebrate'
    fuseTimer: 0,
    fireProgress: 0,
    ufoHitTimer: 0,
    heroX: 0,
    heroZ: 3.8,
    targetX: null,
    targetZ: null,
    moveDirX: 0,
    moveDirZ: 0,
    walkCycle: 0,
    facingAngle: Math.PI,
    heroMesh: null,
    compassRing: null,
    clickMarker: null,
    leftPodMinion: null,
    midPodMinion: null,
    rightPodMinion: null,
    cannonGroup: null,
    ufoGroup: null,
    plusSignMesh: null,
    equalSignMesh: null,
    questionHoloMesh: null,
    energyDotsGroup: null
};

// 擴充支援 11 - 20 雙位數小兵（例如 6 + 6 = 12）
function ensureExtendedNumbersConfig() {
    const extWords = {
        11: '十一', 12: '十二', 13: '十三', 14: '十四', 15: '十五',
        16: '十六', 17: '十七', 18: '十八', 19: '十九', 20: '二十'
    };
    const extColors = {
        11: '#EC4899', 12: '#8B5CF6', 13: '#06B6D4', 14: '#10B981', 15: '#F59E0B',
        16: '#EF4444', 17: '#3B82F6', 18: '#D946EF', 19: '#14B8A6', 20: '#F97316'
    };
    if (typeof NUMBER_WORDS_HK !== 'undefined') Object.assign(NUMBER_WORDS_HK, extWords);
    if (typeof BLOCK_COLORS !== 'undefined') Object.assign(BLOCK_COLORS, extColors);
}

function ensure3DAdditionArenaBuilt() {
    if (additionState.built) return;
    additionState.built = true;
    ensureExtendedNumbersConfig();
    additionArenaGroup.clear();
    additionArenaGroup.visible = false;
    if (scene) scene.add(additionArenaGroup);

    // 1. 碧海與寬闊圓形競技場舞台
    const sea = new THREE.Mesh(
        new THREE.CylinderGeometry(30, 30, 0.25, 48),
        new THREE.MeshStandardMaterial({ color: 0x38BDF8, roughness: 0.25 })
    );
    sea.position.set(0, -0.08, -0.5);
    additionArenaGroup.add(sea);

    const outerRim = new THREE.Mesh(
        new THREE.CylinderGeometry(9.4, 9.8, 0.36, 48),
        new THREE.MeshStandardMaterial({ color: 0xFACC15, roughness: 0.5 })
    );
    outerRim.position.set(0, 0.1, 0.6);
    additionArenaGroup.add(outerRim);

    const arenaFloor = new THREE.Mesh(
        new THREE.CylinderGeometry(8.8, 9.0, 0.4, 48),
        new THREE.MeshStandardMaterial({ color: 0x86EFAC, roughness: 0.7 })
    );
    arenaFloor.position.set(0, 0.16, 0.6);
    arenaFloor.receiveShadow = true;
    additionArenaGroup.add(arenaFloor);

    // 算式舞台底座墊 (後排 Z = -1.8，將算式區同前排散步區清晰分開！)
    const stageDeck = new THREE.Mesh(
        new THREE.BoxGeometry(11.4, 0.16, 2.8),
        new THREE.MeshStandardMaterial({ color: 0xFEF9C3, roughness: 0.6 })
    );
    stageDeck.position.set(0, 0.38, -1.8);
    stageDeck.receiveShadow = true;
    additionArenaGroup.add(stageDeck);

    // 2. 三座並列算式小兵台：[ 左台 A (-3.7) ]  +  [ 中台 B (0) ]  =  [ 右台答案 C (+3.7) ]
    const pods = [
        { x: -3.7, z: -1.8, color: 0xFB7185 }, // 左台：第一個數 (A)
        { x: 0.0,  z: -1.8, color: 0x38BDF8 }, // 中台：第二個數 (B)
        { x: 3.7,  z: -1.8, color: 0xF59E0B }  // 右台：總和答案位 (C) 兼發射台！
    ];
    pods.forEach((p, idx) => {
        const pad = new THREE.Group();
        const radius = idx === 2 ? 1.25 : 1.08;
        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(radius, radius + 0.14, 0.3, 28),
            new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.3 })
        );
        base.position.y = 0.15;
        pad.add(base);

        const glow = new THREE.Mesh(
            new THREE.CylinderGeometry(radius - 0.15, radius - 0.15, 0.34, 24),
            new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
        );
        glow.position.y = 0.16;
        pad.add(glow);

        pad.position.set(p.x, 0.42, p.z);
        additionArenaGroup.add(pad);
    });

    // 3. 立體「＋」加號 (擺喺左台與中台之間 X = -1.85)
    const signMat = new THREE.MeshStandardMaterial({ color: 0xF59E0B, roughness: 0.2, metalness: 0.3 });
    const plusGroup = new THREE.Group();
    const hBar = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.28, 0.28), signMat);
    const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.95, 0.28), signMat);
    plusGroup.add(hBar, vBar);
    plusGroup.position.set(-1.85, 1.35, -1.8);
    additionState.plusSignMesh = plusGroup;
    additionArenaGroup.add(plusGroup);

    // 4. 立體「＝」等號 (擺喺中台與右台之間 X = +1.85)
    const equalGroup = new THREE.Group();
    const eqTop = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.24, 0.28), signMat);
    eqTop.position.y = 0.24;
    const eqBot = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.24, 0.28), signMat);
    eqBot.position.y = -0.24;
    equalGroup.add(eqTop, eqBot);
    equalGroup.position.set(1.85, 1.35, -1.8);
    additionState.equalSignMesh = equalGroup;
    additionArenaGroup.add(equalGroup);

    // 5. 右邊答案台後方的【🌈 彩虹發射大砲】(位於 X = 3.7, Z = -3.5，唔會遮住算式同小兵！)
    const cannonGroup = new THREE.Group();
    cannonGroup.position.set(3.7, 0.42, -3.5);

    const cannonBase = new THREE.Mesh(
        new THREE.CylinderGeometry(1.1, 1.35, 0.6, 24),
        new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4, metalness: 0.3 })
    );
    cannonBase.position.y = 0.3;
    cannonGroup.add(cannonBase);

    const barrelGroup = new THREE.Group();
    barrelGroup.position.set(0, 0.75, 0);
    barrelGroup.rotation.x = -0.42;

    const barrelBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.75, 0.9, 1.8, 24),
        new THREE.MeshStandardMaterial({ color: 0xEC4899, roughness: 0.3, metalness: 0.2 })
    );
    barrelGroup.add(barrelBody);

    const muzzleRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.78, 0.14, 12, 24),
        new THREE.MeshStandardMaterial({ color: 0xFACC15, roughness: 0.2, metalness: 0.5 })
    );
    muzzleRing.rotation.x = Math.PI / 2;
    muzzleRing.position.y = 0.88;
    barrelGroup.add(muzzleRing);

    cannonGroup.add(barrelGroup);
    additionState.cannonGroup = cannonGroup;
    additionArenaGroup.add(cannonGroup);

    // 6. 空中搖擺【🛸 彩蛋飛碟大魔王】(升高至 Y = 4.5, Z = -6.2，清爽唔撞大砲)
    const ufoGroup = new THREE.Group();
    ufoGroup.position.set(0, 4.5, -6.2);

    const saucer = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 2.6, 0.6, 32),
        new THREE.MeshStandardMaterial({ color: 0xA855F7, roughness: 0.25, metalness: 0.3 })
    );
    ufoGroup.add(saucer);

    const ufoDome = new THREE.Mesh(
        new THREE.SphereGeometry(1.25, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
        new THREE.MeshStandardMaterial({ color: 0x38BDF8, roughness: 0.1, transparent: true, opacity: 0.85 })
    );
    ufoDome.position.y = 0.22;
    ufoGroup.add(ufoDome);

    for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const bulb = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 12, 12),
            new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xFDE047 : 0xF43F5E })
        );
        bulb.position.set(Math.cos(ang) * 2.1, -0.05, Math.sin(ang) * 2.1);
        ufoGroup.add(bulb);
    }

    additionState.ufoGroup = ufoGroup;
    additionArenaGroup.add(ufoGroup);

    // 7. 具象能量球群組 (顯示喺左台與中台小兵頭頂)
    additionState.energyDotsGroup = new THREE.Group();
    additionArenaGroup.add(additionState.energyDotsGroup);

    // 8. 點擊地面導航光圈與馬利奧主角
    const clickRing = new THREE.Mesh(
        new THREE.RingGeometry(0.4, 0.65, 24),
        new THREE.MeshBasicMaterial({ color: 0xFDE047, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    );
    clickRing.rotation.x = -Math.PI / 2;
    clickRing.position.set(0, 0.38, 0);
    clickRing.visible = false;
    additionState.clickMarker = clickRing;
    additionArenaGroup.add(clickRing);

    const compassRing = new THREE.Mesh(
        new THREE.RingGeometry(0.55, 0.75, 32),
        new THREE.MeshBasicMaterial({ color: 0xFACC15, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    );
    compassRing.rotation.x = -Math.PI / 2;
    compassRing.position.set(0, 0.38, 3.8);
    additionState.compassRing = compassRing;
    additionArenaGroup.add(compassRing);

    const hero = marioHero.group.clone();
    hero.scale.setScalar(0.92);
    hero.position.set(0, 0.36, 3.8);
    additionState.heroMesh = hero;
    additionArenaGroup.add(hero);
}

// 建立空位台上嘅「？ 號半透明目標框」，令小朋友一眼睇出邊個台缺咗小兵！
function createQuestionSlotMinion(x, z, borderColorHex = '#F59E0B') {
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
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.35, 1.55, 0.65),
        [sideMat, sideMat, sideMat, sideMat, mat, sideMat]
    );
    group.add(mesh);
    numberBlocksGroup.add(group);
    return group;
}

// 在左台 (-3.7) 與中台 (0.0) 小兵頭頂生成對應數量嘅 3D 能量球 (最多排兩行，清晰好數)
function spawnAdditionEnergyDots(countA, countB) {
    if (!additionState.energyDotsGroup) return;
    additionState.energyDotsGroup.clear();

    const makeDots = (count, centerX, colorHex) => {
        if (!count || count <= 0) return;
        const perRow = Math.min(count, 5);
        const spacing = 0.38;
        for (let i = 0; i < count; i++) {
            const row = Math.floor(i / 5);
            const col = i % 5;
            const rowCount = (row === 1) ? (count - 5) : perRow;
            const startX = centerX - ((rowCount - 1) * spacing) / 2;
            const ball = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 16, 16),
                new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.2, emissive: colorHex, emissiveIntensity: 0.3 })
            );
            ball.position.set(startX + col * spacing, 2.55 + row * 0.38, -1.8);
            additionState.energyDotsGroup.add(ball);
        }
    };

    makeDots(countA, -3.7, 0xF43F5E);
    makeDots(countB, 0.0, 0x0EA5E9);
}
function updateMarioMissionSign(targetKey) {
    if (!marioHero.missionSignMesh) return;
    const meta = getCognitiveItemMeta(targetKey);
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#FFFBEB';
    ctx.fillRect(0, 0, 512, 192);

    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 502, 182);

    ctx.fillStyle = '#B45309';
    ctx.font = '900 40px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('目標磚塊：', 26, 92);

    if (meta.subject === 'color') {
        ctx.fillStyle = meta.hex;
        ctx.beginPath();
        ctx.arc(275, 92, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#1E293B';
        ctx.stroke();

        ctx.fillStyle = '#1E293B';
        ctx.font = '900 58px "Noto Sans TC", sans-serif';
        ctx.fillText(meta.title, 345, 94);
    } else if (meta.subject === 'shape') {
        drawShapeSymbolOnCanvas(ctx, meta.key, 275, 92, 48, meta.hex, '#1E293B');
        ctx.fillStyle = '#1E293B';
        ctx.font = '900 52px "Noto Sans TC", sans-serif';
        ctx.fillText(meta.title, 340, 94);
    } else {
        const num = meta.key;
        ctx.fillStyle = meta.hex;
        ctx.font = '900 108px "Fredoka", "Noto Sans TC", sans-serif';
        ctx.fillText(String(num), 235, 78);

        ctx.fillStyle = '#475569';
        ctx.font = '900 44px "Noto Sans TC", sans-serif';
        ctx.fillText(`(${NUMBER_WORDS_HK[num]})`, 365, 78);

        ctx.fillStyle = '#F59E0B';
        const dotR = 11;
        const gap = 34;
        const startX = 256 - ((num - 1) * gap) / 2;
        for (let i = 0; i < num; i++) {
            ctx.beginPath();
            ctx.arc(startX + i * gap, 154, dotR, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const tex = new THREE.CanvasTexture(canvas);
    marioHero.missionSignMesh.material.map = tex;
    marioHero.missionSignMesh.material.needsUpdate = true;
}

function create3DMarioBrick(itemKey, x, y, z) {
    const meta = getCognitiveItemMeta(itemKey);
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = meta.subject === 'color' ? meta.hex : '#F59E0B';
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = '#FFFBEB';
    roundRectCanvas(ctx, 28, 28, 456, 456, 42);
    ctx.fill();

    ctx.fillStyle = '#B45309';
    [[56, 56], [456, 56], [56, 456], [456, 456]].forEach(([rx, ry]) => {
        ctx.beginPath();
        ctx.arc(rx, ry, 14, 0, Math.PI * 2);
        ctx.fill();
    });

    if (meta.subject === 'color') {
        ctx.fillStyle = meta.hex;
        ctx.beginPath();
        ctx.arc(256, 205, 118, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 12;
        ctx.strokeStyle = '#1E293B';
        ctx.stroke();

        ctx.fillStyle = '#1E293B';
        ctx.font = '900 92px "Noto Sans TC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(meta.title, 256, 405);
    } else if (meta.subject === 'shape') {
        drawShapeSymbolOnCanvas(ctx, meta.key, 256, 205, 112, meta.hex, '#1E293B');
        ctx.fillStyle = '#1E293B';
        ctx.font = '900 84px "Noto Sans TC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(meta.title, 256, 408);
    } else {
        const num = meta.key;
        ctx.fillStyle = '#1E293B';
        ctx.font = '900 280px "Fredoka", "Noto Sans TC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(num), 256, 250);

        ctx.fillStyle = meta.hex;
        const dotRadius = 13;
        const spacing = 34;
        const startX = 256 - ((num - 1) * spacing) / 2;
        for (let i = 0; i < num; i++) {
            ctx.beginPath();
            ctx.arc(startX + i * spacing, 434, dotRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const frontTex = new THREE.CanvasTexture(canvas);
    frontTex.anisotropy = 4;

    const sideColor = meta.subject === 'color' ? meta.hex : 0xF59E0B;
    const sideMat = new THREE.MeshStandardMaterial({ color: sideColor, roughness: 0.35, metalness: 0.1 });
    const frontMat = new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.3 });
    const materials = [sideMat, sideMat, sideMat, sideMat, frontMat, sideMat];

    const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.55, 1.15), materials);
    bodyMesh.castShadow = true;
    bodyMesh.userData = { isNumberBlock: true, itemKey: meta.key, number: meta.key, parentWrapper: null };
    group.add(bodyMesh);

    const haloGeo = new THREE.RingGeometry(1.05, 1.32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
        color: 0xFFEA00,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.0
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.position.set(0, 0, -0.62);
    group.add(haloMesh);

    const wrapper = {
        num: meta.key,
        itemKey: meta.key,
        isMarioBrick: true,
        group,
        bodyMesh,
        haloMesh,
        baseX: x,
        baseY: y,
        baseZ: z,
        baseScale: 1.0,
        state: 'idle',
        animTime: Math.random() * Math.PI * 2,
        wrongTimer: 0,
        celebrateTimer: 0,
        bumpOffset: 0
    };

    bodyMesh.userData.parentWrapper = wrapper;
    numberBlocksGroup.add(group);
    return wrapper;
}

/********************************************************************
 * 5. 3D CUTE COGNITIVE CHARACTER BLOCK BUILDER (數字・顏色・形狀)
 ********************************************************************/
function roundRectCanvas(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function createCustom3DShapeMesh(shapeId, colorHex) {
    const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.3, metalness: 0.08 });
    if (shapeId === 'circle') {
        const geo = new THREE.CylinderGeometry(0.95, 0.95, 0.55, 36);
        geo.rotateX(Math.PI / 2);
        return new THREE.Mesh(geo, mat);
    }
    if (shapeId === 'square') {
        return new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.65, 0.65), mat);
    }
    if (shapeId === 'rectangle') {
        return new THREE.Mesh(new THREE.BoxGeometry(2.05, 1.25, 0.65), mat);
    }
    if (shapeId === 'triangle') {
        const shape = new THREE.Shape();
        shape.moveTo(0, 1.02);
        shape.lineTo(0.98, -0.78);
        shape.lineTo(-0.98, -0.78);
        shape.closePath();
        const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 4 });
        geo.center();
        return new THREE.Mesh(geo, mat);
    }
    if (shapeId === 'star') {
        const shape = new THREE.Shape();
        const spikes = 5, outerR = 1.02, innerR = 0.45;
        let rot = Math.PI / 2;
        const step = Math.PI / spikes;
        shape.moveTo(0, outerR);
        for (let i = 0; i < spikes; i++) {
            shape.lineTo(Math.cos(rot) * outerR, Math.sin(rot) * outerR);
            rot += step;
            shape.lineTo(Math.cos(rot) * innerR, Math.sin(rot) * innerR);
            rot += step;
        }
        shape.closePath();
        const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.45, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.05, bevelSegments: 3 });
        geo.center();
        return new THREE.Mesh(geo, mat);
    }
    const shape = new THREE.Shape();
    shape.moveTo(0, -0.75);
    shape.bezierCurveTo(1.15, -0.1, 1.05, 0.85, 0, 0.35);
    shape.bezierCurveTo(-1.05, 0.85, -1.15, -0.1, 0, -0.75);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.45, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.05, bevelSegments: 4 });
    geo.center();
    return new THREE.Mesh(geo, mat);
}

function create3DNumberCharacter(itemKey, x, z, scale = 1.0) {
    const meta = getCognitiveItemMeta(itemKey);
    const group = new THREE.Group();
    const baseY = 1.15;
    group.position.set(x, baseY, z);

    const colorHex = meta.hex;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = '#FFFFFF';
    roundRectCanvas(ctx, 28, 28, 456, 456, 64);
    ctx.fill();

    if (meta.subject === 'color') {
        ctx.fillStyle = colorHex;
        ctx.beginPath();
        ctx.arc(256, 200, 122, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 10;
        ctx.strokeStyle = '#1E293B';
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.beginPath();
        ctx.arc(215, 158, 32, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1E293B';
        ctx.font = '900 96px "Noto Sans TC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(meta.title, 256, 405);
    } else if (meta.subject === 'shape') {
        drawShapeSymbolOnCanvas(ctx, meta.key, 256, 198, 114, colorHex, '#1E293B');
        ctx.fillStyle = '#1E293B';
        ctx.font = '900 88px "Noto Sans TC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(meta.title, 256, 405);
    } else {
        const num = meta.key;
        ctx.fillStyle = '#1E293B';
        ctx.font = '900 285px "Fredoka", "Noto Sans TC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(num), 256, 245);

        ctx.fillStyle = colorHex;
        const dotRadius = 13;
        const spacing = 34;
        const startX = 256 - ((num - 1) * spacing) / 2;
        for (let i = 0; i < num; i++) {
            ctx.beginPath();
            ctx.arc(startX + i * spacing, 435, dotRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const frontTex = new THREE.CanvasTexture(canvas);
    frontTex.anisotropy = 4;

    const sideMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.32 });
    const frontMat = new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.28 });
    const materials = [sideMat, sideMat, sideMat, sideMat, frontMat, sideMat];

    const bodyGeo = new THREE.BoxGeometry(1.75, 2.0, 0.95);
    const bodyMesh = new THREE.Mesh(bodyGeo, materials);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    bodyMesh.userData = { isNumberBlock: true, itemKey: meta.key, number: meta.key, parentWrapper: null };
    group.add(bodyMesh);

    if (meta.subject === 'color') {
        const crown = new THREE.Mesh(
            new THREE.SphereGeometry(0.42, 20, 16),
            new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.2, metalness: 0.1 })
        );
        crown.scale.set(1.2, 0.55, 0.9);
        crown.position.set(0, 1.08, -0.05);
        group.add(crown);
    }

    const eyeWhiteGeo = new THREE.SphereGeometry(0.19, 16, 16);
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const pupilGeo = new THREE.SphereGeometry(0.09, 12, 12);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

    [-0.38, 0.38].forEach(ex => {
        const eyeGroup = new THREE.Group();
        const whiteMesh = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
        const pupilMesh = new THREE.Mesh(pupilGeo, pupilMat);
        pupilMesh.position.z = 0.15;
        eyeGroup.add(whiteMesh, pupilMesh);
        eyeGroup.position.set(ex, 1.08, 0.25);
        group.add(eyeGroup);
    });

    const shoeGeo = new THREE.SphereGeometry(0.24, 16, 12);
    const shoeMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.4 });
    [-0.42, 0.42].forEach(sx => {
        const shoe = new THREE.Mesh(shoeGeo, shoeMat);
        shoe.scale.set(1.0, 0.65, 1.35);
        shoe.position.set(sx, -1.05, 0.12);
        shoe.castShadow = true;
        group.add(shoe);
    });

    const haloGeo = new THREE.RingGeometry(1.25, 1.52, 32);
    const haloMat = new THREE.MeshBasicMaterial({
        color: 0xFFEA00,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.0
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.position.set(0, 0, -0.52);
    group.add(haloMesh);

    group.scale.setScalar(scale);

    const wrapper = {
        num: meta.key,
        itemKey: meta.key,
        isMarioBrick: false,
        isMazeFriend: false,
        group,
        bodyMesh,
        haloMesh,
        baseX: x,
        baseY,
        baseZ: z,
        baseScale: scale,
        state: 'idle',
        animTime: Math.random() * Math.PI * 2,
        wrongTimer: 0,
        celebrateTimer: 0,
        bumpOffset: 0
    };

    bodyMesh.userData.parentWrapper = wrapper;
    numberBlocksGroup.add(group);
    return wrapper;
}

/********************************************************************
 * 6. 3D QUANTITY & COGNITIVE OBJECT SPAWNER
 ********************************************************************/
function clearCountingObjects() {
    activeCountingTimeouts.forEach(t => clearTimeout(t));
    activeCountingTimeouts = [];
    countingObjectsGroup.clear();
    spawnedCountingItems = [];
    document.getElementById('counting-labels-container').innerHTML = '';
    document.getElementById('counting-banner').classList.add('hidden');
}

function createSingleCounting3DItem(index, total, x, z, isCoin = false, itemKey = null) {
    const meta = getCognitiveItemMeta(itemKey !== null ? itemKey : gameState.targetKey);
    const itemGroup = new THREE.Group();
    itemGroup.position.set(x, isCoin ? 1.1 : 0.62, z);

    if (meta.subject === 'shape') {
        const shapeMesh = createCustom3DShapeMesh(meta.key, meta.hex);
        shapeMesh.scale.setScalar(0.45);
        shapeMesh.castShadow = true;
        itemGroup.add(shapeMesh);
    } else if (meta.subject === 'color') {
        const colorMat = new THREE.MeshStandardMaterial({
            color: meta.hex,
            roughness: 0.18,
            metalness: 0.15
        });
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.4, 24, 24), colorMat);
        sphere.castShadow = true;
        itemGroup.add(sphere);

        const crownRing = new THREE.Mesh(
            new THREE.TorusGeometry(0.16, 0.04, 12, 24),
            new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.3 })
        );
        crownRing.rotation.x = Math.PI / 2;
        crownRing.position.y = 0.4;
        itemGroup.add(crownRing);
    } else if (isCoin) {
        const coinMat = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            roughness: 0.2,
            metalness: 0.6,
            emissive: 0xF59E0B,
            emissiveIntensity: 0.2
        });
        const coinCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.12, 24), coinMat);
        coinCylinder.rotation.x = Math.PI / 2;
        coinCylinder.castShadow = true;
        itemGroup.add(coinCylinder);
    } else {
        const appleMat = new THREE.MeshStandardMaterial({ color: 0xFF3B30, roughness: 0.25 });
        const appleBody = new THREE.Mesh(new THREE.SphereGeometry(0.36, 20, 20), appleMat);
        appleBody.scale.set(1.05, 0.95, 1.05);
        appleBody.castShadow = true;
        itemGroup.add(appleBody);

        const leafMat = new THREE.MeshStandardMaterial({ color: 0x4CD964, roughness: 0.4 });
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), leafMat);
        leaf.scale.set(1.5, 0.45, 0.8);
        leaf.position.set(0.12, 0.36, 0);
        leaf.rotation.z = -0.4;
        itemGroup.add(leaf);
    }

    itemGroup.scale.setScalar(0.01);
    countingObjectsGroup.add(itemGroup);

    const labelEl = document.createElement('div');
    labelEl.className = 'counting-pill absolute -translate-x-1/2 -translate-y-1/2 bg-amber-400 text-slate-900 font-black text-sm sm:text-lg px-2.5 h-7 sm:h-9 rounded-full border-2 border-white shadow-md flex items-center justify-center whitespace-nowrap';
    if (meta.subject === 'color' || meta.subject === 'shape') {
        labelEl.textContent = `${meta.shortLabel} ${index}`;
    } else {
        labelEl.textContent = String(index);
    }
    document.getElementById('counting-labels-container').appendChild(labelEl);

    spawnedCountingItems.push({
        group: itemGroup,
        labelEl,
        baseY: isCoin ? 1.1 : 0.62,
        targetScale: total > 6 ? 0.82 : 1.0,
        currentScale: 0.01,
        bouncePhase: 0
    });
}

function emitStarParticles(originPos) {
    const colors = [0xFFCA3A, 0xFF595E, 0x8AC926, 0x00BBF9, 0xF15BB5];
    for (let i = 0; i < 18; i++) {
        const mat = new THREE.MeshBasicMaterial({ color: colors[i % colors.length] });
        const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), mat);
        mesh.position.copy(originPos);
        mesh.position.z += 0.6;
        particlesGroup.add(mesh);

        const angle = Math.random() * Math.PI * 2;
        const speed = 2.5 + Math.random() * 3.5;
        activeParticles.push({
            mesh,
            vx: Math.cos(angle) * speed,
            vy: 2.5 + Math.random() * 4.0,
            vz: (Math.random() - 0.5) * 3.0,
            life: 1.0
        });
    }
}
