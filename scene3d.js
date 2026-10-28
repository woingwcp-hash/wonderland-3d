/********************************************************************
         * [FILE: js/scene3d.js]
         * 3. THREE.JS 3D SCENE, LIGHTING & TOY MODELS
         ********************************************************************/
        let scene, camera, renderer, raycaster, pointer;
        let clock = new THREE.Clock()function build3DTreasureIsland() {;

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
        let interactiveBlocks = []; // Array of NumberBlock3D / MarioBrick3D / TreasureChest3D wrappers
        let spawnedCountingItems = []; // Array of { mesh, num, worldPos }
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

        // NEW: Treasure Island 3D Free-Roaming Hero State (尋寶小英雄 2.0 大地圖版)
        let treasureHero = {
            group: null,
            compassRing: null,
            compassArrow: null,
            clickMarker: null,
            miniCoins: [],
            bouncePads: [],
            currentX: 0,
            currentZ: 6.2,
            jumpY: 0,
            jumpVel: 0,
            targetX: null,
            targetZ: null,
            moveDirX: 0,
            moveDirZ: 0,
            pendingChest: null,
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

            // Build Rich 3D Wonderland Scenery, 3D Gachapon, 3D Train, 3D Mario Stage & 3D Treasure Island
            buildWonderlandEnvironment();
            build3DGachaponMachine();
            build3DCartoonTrain();
            build3DMarioStage();
            build3DTreasureIsland();

            // Bind Unified Pointer Event (Single-finger Touch & Mouse Click) & Keyboard
            renderer.domElement.addEventListener('pointerdown', onCanvasPointerDown, false);
            window.addEventListener('keydown', onWindowKeyDown, false);
            window.addEventListener('keyup', onWindowKeyUp, false);
            window.addEventListener('resize', onWindowResize, false);
        }

        // Responsive Camera adjustment (Switches to elevated adventure view in Treasure Island Mode)
        function updateCameraForAspect() {
            if (!camera) return;
            const aspect = window.innerWidth / window.innerHeight;
            camera.aspect = aspect;

            if (gameState && gameState.mode === 'treasure') {
                if (aspect < 0.75) {
                    camera.position.set(0, 12.2, 14.8);
                    camera.lookAt(0, 0.2, 0.8);
                } else if (aspect < 1.15) {
                    camera.position.set(0, 10.4, 12.6);
                    camera.lookAt(0, 0.3, 0.6);
                } else {
                    camera.position.set(0, 8.8, 10.4);
                    camera.lookAt(0, 0.4, 0.5);
                }
            } else {
                if (aspect < 0.75) {
                    // Tall mobile portrait
                    camera.position.set(0, 6.2, 16.8);
                    camera.lookAt(0, 1.1, 0);
                } else if (aspect < 1.15) {
                    // Tablet portrait / square
                    camera.position.set(0, 5.6, 14.0);
                    camera.lookAt(0, 1.3, 0);
                } else {
                    // Landscape iPad / Interactive Whiteboard / Desktop
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

            // Pastel Rolling Hills in background
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

            // Cute 3D Toy Trees
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

            // Floating Puffy 3D Clouds
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

        // Mode 1 Centerpiece: 3D Gachapon Machine (扭蛋尋寶機)
        function build3DGachaponMachine() {
            gachaMachineGroup.clear();
            gachaMachineGroup.position.set(0, 1.15, -2.6);

            // Base Cylinder
            const baseMat = new THREE.MeshStandardMaterial({ color: 0xFF595E, roughness: 0.35 });
            const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.75, 1.7, 32), baseMat);
            baseMesh.position.y = 0.85;
            baseMesh.castShadow = true;
            gachaMachineGroup.add(baseMesh);

            // Middle Trim Ring
            const ringMat = new THREE.MeshStandardMaterial({ color: 0xFFCA3A, roughness: 0.3 });
            const ringMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.65, 0.22, 32), ringMat);
            ringMesh.position.y = 1.7;
            gachaMachineGroup.add(ringMesh);

            // Glass Dome
            const domeMat = new THREE.MeshPhysicalMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.38,
                roughness: 0.1
            });
            const domeMesh = new THREE.Mesh(new THREE.SphereGeometry(1.55, 32, 24), domeMat);
            domeMesh.position.y = 2.85;
            gachaMachineGroup.add(domeMesh);

            // Top Cap
            const capMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, 0.3, 24), baseMat);
            capMesh.position.y = 4.25;
            gachaMachineGroup.add(capMesh);

            // Colorful 3D Capsules inside the Dome
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

            // Golden Turn Dial on Front
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

        // Mode 2 Centerpiece: 3D Cartoon Train (數字小火車)
        function build3DCartoonTrain() {
            trainGroup.clear();
            trainAnimState.wheels = [];

            // Railway Track sleepers on ground
            const trackGroup = new THREE.Group();
            trackGroup.position.set(0, 0.01, -2.3);
            const railMat = new THREE.MeshStandardMaterial({ color: 0x64748B, roughness: 0.5 });
            const rail1 = new THREE.Mesh(new THREE.BoxGeometry(22, 0.08, 0.12), railMat);
            rail1.position.z = 0.6;
            const rail2 = rail1.clone();
            rail2.position.z = -0.6;
            trackGroup.add(rail1, rail2);
            trainGroup.add(trackGroup);

            // Moving Train Wrapper
            const mover = new THREE.Group();
            mover.name = 'trainMover';
            mover.position.set(0, 0.45, -2.3);

            // Locomotive Cabin & Boiler
            const cabinMat = new THREE.MeshStandardMaterial({ color: 0x1982C4, roughness: 0.35 });
            const boilerMat = new THREE.MeshStandardMaterial({ color: 0xFF595E, roughness: 0.35 });
            const yellowMat = new THREE.MeshStandardMaterial({ color: 0xFFCA3A, roughness: 0.3 });

            // Base Chassis
            const chassis = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.35, 1.7), yellowMat);
            chassis.position.set(0, 0.35, 0);
            chassis.castShadow = true;
            mover.add(chassis);

            // Cabin (Left side)
            const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.85, 1.6), cabinMat);
            cabin.position.set(-1.1, 1.4, 0);
            cabin.castShadow = true;
            mover.add(cabin);

            // Cabin Roof
            const roof = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.22, 1.8), yellowMat);
            roof.position.set(-1.1, 2.4, 0);
            mover.add(roof);

            // Front Boiler Cylinder (Right side)
            const boiler = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 2.1, 24), boilerMat);
            boiler.rotation.z = Math.PI / 2;
            boiler.position.set(0.85, 1.2, 0);
            boiler.castShadow = true;
            mover.add(boiler);

            // Chimney
            const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.85, 16), yellowMat);
            chimney.position.set(1.35, 2.1, 0);
            mover.add(chimney);

            // Big Target Number Signboard on the front/top of the Train
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

            // Wheels
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

        // Draw Vector Shape Helper on 2D Canvas (Circle, Square, Triangle, Star, Heart, Rectangle)
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
                // Draw big glossy color circle + Chinese name
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

        // Mode 4 Centerpiece: 3D Mario-Style Platformer Stage & Cute Hero Character (認知大冒險)
        function build3DMarioStage() {
            marioStageGroup.clear();

            // 1. Long Grass & Brick Adventure Walkway Platform
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

            // 2. Left Classic Green Warp Pipe
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

            // 3. Right Goal Flagpole & Mini Castle Tower
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

            // Sliding Victory Flag
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

            // 4. Floating Sky Mission Cloud Board (Shows Target Number + Dots in 3D Scene)
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

            // 5. Spotlight Ring on grass showing where Hero stands
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

            // 6. Cute 3D Mario-Style Hero Character
            const hero = new THREE.Group();
            hero.position.set(0, 0.45, 0.8);

            const redMat = new THREE.MeshStandardMaterial({ color: 0xEF4444, roughness: 0.35 });
            const blueMat = new THREE.MeshStandardMaterial({ color: 0x2563EB, roughness: 0.4 });
            const skinMat = new THREE.MeshStandardMaterial({ color: 0xFDBA74, roughness: 0.4 });
            const shoeMat = new THREE.MeshStandardMaterial({ color: 0x78350F, roughness: 0.6 });
            const whiteMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.3 });
            const yellowMat = new THREE.MeshStandardMaterial({ color: 0xFACC15, roughness: 0.3 });

            // Overalls Torso
            const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.44, 0.68, 20), blueMat);
            torso.position.y = 0.56;
            torso.castShadow = true;
            hero.add(torso);

            // Red Shirt Upper
            const shirt = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.39, 0.3, 20), redMat);
            shirt.position.y = 0.78;
            hero.add(shirt);

            // Yellow Overall Buttons
            [-0.16, 0.16].forEach(bx => {
                const btn = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), yellowMat);
                btn.position.set(bx, 0.64, 0.38);
                hero.add(btn);
            });

            // Head
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 24), skinMat);
            head.position.y = 1.25;
            head.castShadow = true;
            hero.add(head);

            // Cute Round Nose
            const nose = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), skinMat);
            nose.position.set(0, 1.22, 0.42);
            hero.add(nose);

            // Eyes
            const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0F172A });
            [-0.14, 0.14].forEach(ex => {
                const eye = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), pupilMat);
                eye.position.set(ex, 1.3, 0.37);
                hero.add(eye);
            });

            // Red Adventure Cap (Crown + Visor)
            const capCrown = new THREE.Mesh(new THREE.SphereGeometry(0.45, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), redMat);
            capCrown.position.y = 1.32;
            hero.add(capCrown);

            const capVisor = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.08, 20, 1, false, -0.8, 1.6), redMat);
            capVisor.position.set(0, 1.35, 0.18);
            capVisor.rotation.x = 0.15;
            hero.add(capVisor);

            // White Gloves / Hands
            [-0.5, 0.5].forEach((hx, idx) => {
                const hand = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), whiteMat);
                hand.position.set(hx, 0.68, 0.1);
                hand.name = idx === 0 ? 'leftHand' : 'rightHand';
                hero.add(hand);
            });

            // Brown Boots / Feet
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

        // ==================== Mode 5: 1-2-3-4-5 迷宮救兵大巡遊 (3D Grid Labyrinth & BFS Pathfinding) ====================
        const MAZE_TILE_SIZE = 1.65;
        const MAZE_COLS = 9;
        const MAZE_ROWS = 9;

        // 3 款精心設計嘅 9x9 真・迷宮地圖 (1 = 迷宮樹籬牆, 0 = 可通行走廊, (col:4, row:0) = 北面城堡大門)
        const MAZE_LEVEL_DESIGNS = [
            {
                name: '🌳 翡翠森林迷宮',
                wallColor: 0x16A34A,
                topColor: 0x86EFAC,
                floorA: 0x4ADE80,
                floorB: 0x34D399,
                grid: [
                    [1, 1, 1, 1, 0, 1, 1, 1, 1], // Row 0: (4,0) 北面城堡大門
                    [1, 0, 0, 0, 0, 0, 0, 0, 1], // Row 1
                    [1, 0, 1, 1, 1, 0, 1, 0, 1], // Row 2
                    [1, 0, 0, 0, 1, 0, 0, 0, 1], // Row 3
                    [1, 1, 0, 1, 1, 1, 0, 1, 1], // Row 4
                    [1, 0, 0, 0, 0, 0, 0, 0, 1], // Row 5
                    [1, 0, 1, 1, 0, 1, 1, 0, 1], // Row 6
                    [1, 0, 0, 1, 0, 1, 0, 0, 1], // Row 7: (4,7) 馬利奧起點
                    [1, 1, 1, 1, 1, 1, 1, 1, 1]  // Row 8: 南面邊界牆
                ],
                spots: [
                    { col: 2, row: 7 }, // 左下秘密房
                    { col: 6, row: 7 }, // 右下秘密房
                    { col: 3, row: 3 }, // 中央迷宮房
                    { col: 1, row: 1 }, // 左上轉角房
                    { col: 7, row: 1 }  // 右上轉角房
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
            // 北面城堡大門 (col: 4, row: 0) 喺救齊 5 個數字後先會打開！
            if (row === 0 && col === 4) {
                return Boolean(treasureHero.allRescued);
            }
            return lvl.grid[row][col] === 0;
        }

        // BFS 智能迷宮尋路演算法（計算由起點格仔去終點格仔嘅最短轉彎路線）
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

            // 1. 碧海環繞底座與黃金沙灘島基
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

            // 2. 動態迷宮牆與棋盤格地板容器
            treasureIslandGroup.add(treasureHero.mazeLayoutGroup);

            // 3. 北面終點【🏰 奇幻皇冠城堡】與雙開大門 (位於 col:4, row:0 即 X=0, Z=-6.6)
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

            // 城堡雙開魔法大門 (位於 X=0, Z=-6.6)
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

            // 大門中央黃金鎖頭
            const lockMesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.48, 0.48, 0.24),
                new THREE.MeshStandardMaterial({ color: 0xFACC15, roughness: 0.2, metalness: 0.5 })
            );
            lockMesh.position.set(0, 0.85, 0.16);
            gateGroup.add(lockMesh);

            treasureHero.castleGate = { group: gateGroup, leftPivot, rightPivot, lockMesh };
            treasureIslandGroup.add(gateGroup);

            // 4. 迷宮路線發光腳印引導點 (最多 16 粒發光圓點)
            for (let i = 0; i < 16; i++) {
                const dot = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.2, 0.2, 0.06, 16),
                    new THREE.MeshBasicMaterial({ color: 0xFEF08A, transparent: true, opacity: 0.85 })
                );
                dot.position.set(0, 0.34, 0);
                dot.visible = false;
                treasureIslandGroup.add(dot);
                treasureHero.pathDots.push(dot);
            }

            // 5. 點擊地板導航光圈
            const clickRing = new THREE.Mesh(
                new THREE.RingGeometry(0.38, 0.62, 24),
                new THREE.MeshBasicMaterial({ color: 0xFDE047, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
            );
            clickRing.rotation.x = -Math.PI / 2;
            clickRing.position.set(0, 0.35, 0);
            clickRing.visible = false;
            treasureHero.clickMarker = clickRing;
            treasureIslandGroup.add(clickRing);

            // 6. 小英雄腳下黃金尋寶指南針 + 方向箭咀
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

            compassGroup.position.set(0, 0.34, 5.25);
            treasureHero.compassRing = compassGroup;
            treasureIslandGroup.add(compassGroup);

            // 7. 複製 3D 馬利奧小英雄
            const explorer = marioHero.group.clone();
            explorer.scale.setScalar(0.88);
            explorer.position.set(0, 0.3, 5.25);
            treasureHero.group = explorer;
            treasureIslandGroup.add(explorer);

            rebuild3DMazeWalls(0);
        }

        // 根據關卡索引動態建立 9x9 立體迷宮牆與棋盤格走廊
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

                        // 喺部份迷宮牆頂加粒可愛小果實／水晶點綴
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

            // 北面城堡前紅地毯通道 (col:4, row:0)
            const gatePos = mazeGridToWorld(4, 0);
            const carpet = new THREE.Mesh(
                new THREE.BoxGeometry(MAZE_TILE_SIZE * 0.9, 0.14, MAZE_TILE_SIZE * 1.6),
                new THREE.MeshStandardMaterial({ color: 0xF43F5E, roughness: 0.5 })
            );
            carpet.position.set(gatePos.x, 0.25, gatePos.z - 0.3);
            treasureHero.mazeLayoutGroup.add(carpet);
        }

        // 建立迷宮入面等待救援嘅 3D 數字公仔（帶可愛眼睛、小鞋仔與頭頂清晰數字皇冠牌）
        function create3DMazeNumberFriend(num, col, row) {
            const pos = mazeGridToWorld(col, row);
            const wrapper = create3DNumberCharacter(num, pos.x, pos.z, 0.68);
            wrapper.baseY = 0.95;
            wrapper.group.position.y = 0.95;
            wrapper.isTreasureChest = true; // 兼容原有觸控與光環邏輯
            wrapper.rescued = false;
            wrapper.gridCol = col;
            wrapper.gridRow = row;

            // 將地面提示光環改為水平放喺公仔腳下，令當前目標數字閃閃發光！
            if (wrapper.haloMesh) {
                wrapper.haloMesh.rotation.x = Math.PI / 2;
                wrapper.haloMesh.position.set(0, -0.82, 0);
            }

            // 微微向後仰 (-0.25 rad)，令俯視鏡頭清清楚楚睇到公仔正面嘅大數字與眼睛！
            wrapper.bodyMesh.rotation.x = -0.22;

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

        // Helper to create 3D Extruded Star or Heart Mesh for Shape Mode
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
            // Heart
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

            // High-resolution front face texture supporting Numbers, Colors, and Shapes
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
                // Big glossy color splash + Chinese color name
                ctx.fillStyle = colorHex;
                ctx.beginPath();
                ctx.arc(256, 200, 122, 0, Math.PI * 2);
                ctx.fill();
                ctx.lineWidth = 10;
                ctx.strokeStyle = '#1E293B';
                ctx.stroke();

                // Cute white highlight inside color circle
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

                // Subtle quantity dots at bottom of block for visual scaffolding
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

            // Main Toy Block Body
            const bodyGeo = new THREE.BoxGeometry(1.75, 2.0, 0.95);
            const bodyMesh = new THREE.Mesh(bodyGeo, materials);
            bodyMesh.castShadow = true;
            bodyMesh.receiveShadow = true;
            bodyMesh.userData = { isNumberBlock: true, itemKey: meta.key, number: meta.key, parentWrapper: null };
            group.add(bodyMesh);

            // In Color Mode: Add a cute 3D Paint Cap / Color Crown on top of the block!
            if (meta.subject === 'color') {
                const crown = new THREE.Mesh(
                    new THREE.SphereGeometry(0.42, 20, 16),
                    new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.2, metalness: 0.1 })
                );
                crown.scale.set(1.2, 0.55, 0.9);
                crown.position.set(0, 1.08, -0.05);
                group.add(crown);
            }

            // Cute 3D Cartoon Eyes on Top Edge
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

            // Little Shoes at Bottom
            const shoeGeo = new THREE.SphereGeometry(0.24, 16, 12);
            const shoeMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.4 });
            [-0.42, 0.42].forEach(sx => {
                const shoe = new THREE.Mesh(shoeGeo, shoeMat);
                shoe.scale.set(1.0, 0.65, 1.35);
                shoe.position.set(sx, -1.05, 0.12);
                shoe.castShadow = true;
                group.add(shoe);
            });

            // Golden Hint Halo Ring (Hidden until Visual Prompt activates)
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
                group,
                bodyMesh,
                haloMesh,
                baseX: x,
                baseY,
                baseZ: z,
                baseScale: scale,
                state: 'idle', // 'idle' | 'hint' | 'wrong' | 'celebrate'
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
         * 6. 3D QUANTITY & COGNITIVE OBJECT SPAWNER (數與量 / 顏色實物 / 立體幾何)
         ********************************************************************/
        function clearCountingObjects() {
            activeCountingTimeouts.forEach(t => clearTimeout(t));
            activeCountingTimeouts = [];
            countingObjectsGroup.clear();
            spawnedCountingItems = [];
            document.getElementById('counting-labels-container').innerHTML = '';
            document.getElementById('counting-banner').classList.add('hidden');
        }

        // Creates a 3D Apple, Gold Coin, Colored Gem/Ball, or 3D Geometric Shape for tactile reinforcement
        function createSingleCounting3DItem(index, total, x, z, isCoin = false, itemKey = null) {
            const meta = getCognitiveItemMeta(itemKey !== null ? itemKey : gameState.targetKey);
            const itemGroup = new THREE.Group();
            itemGroup.position.set(x, isCoin ? 1.1 : 0.62, z);

            if (meta.subject === 'shape') {
                // Spawn real 3D geometric shape (Circle cylinder, Cube, Triangle prism, Star, Heart, Rectangle)
                const shapeMesh = createCustom3DShapeMesh(meta.key, meta.hex);
                shapeMesh.scale.setScalar(0.45);
                shapeMesh.castShadow = true;
                itemGroup.add(shapeMesh);
            } else if (meta.subject === 'color') {
                // Spawn glossy 3D Colored Toy Balloon / Gem Sphere matching the target color
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
                // Shiny 3D Mario Gold Coin or Sparkling Ruby Gem in Treasure Mode
                if (gameState.mode === 'treasure') {
                    const gemMat = new THREE.MeshStandardMaterial({
                        color: 0xE11D48,
                        roughness: 0.12,
                        metalness: 0.35,
                        emissive: 0x9F1239,
                        emissiveIntensity: 0.25
                    });
                    const gemMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), gemMat);
                    gemMesh.castShadow = true;
                    itemGroup.add(gemMesh);
                } else {
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
                }
            } else {
                // Cute 3D Red Apple with Green Leaf
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

            // Create matching floating 2D badge above the 3D object
            const labelEl = document.createElement('div');
            labelEl.className = 'counting-pill absolute -translate-x-1/2 -translate-y-1/2 bg-amber-400 text-slate-900 font-black text-sm sm:text-lg px-2.5 h-7 sm:h-9 rounded-full border-2 border-white shadow-md flex items-center justify-center whitespace-nowrap';
            if (meta.subject === 'color') {
                labelEl.textContent = `${meta.shortLabel} ${index}`;
            } else if (meta.subject === 'shape') {
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

        // Spawn 3D burst of stars when a child taps the right block
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
