/********************************************************************
         * [FILE: js/scene3d.js]
         * 3. THREE.JS 3D SCENE, LIGHTING & TOY MODELS
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

        // NEW: Treasure Island 3D Free-Roaming Hero State (尋寶小英雄)
        let treasureHero = {
            group: null,
            compassRing: null,
            currentX: 0,
            currentZ: 3.1,
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

        // Mode 5 Centerpiece: 3D Treasure Island & Free-Roaming Mario Explorer (尋寶小英雄)
        function build3DTreasureIsland() {
            treasureIslandGroup.clear();
            treasureIslandGroup.visible = false;

            // 1. Sparkling Ocean Water Ring around the island
            const waterGeo = new THREE.CylinderGeometry(11.5, 11.5, 0.18, 48);
            const waterMat = new THREE.MeshStandardMaterial({ color: 0x38BDF8, roughness: 0.25, metalness: 0.1 });
            const waterMesh = new THREE.Mesh(waterGeo, waterMat);
            waterMesh.position.set(0, -0.05, 0.4);
            waterMesh.receiveShadow = true;
            treasureIslandGroup.add(waterMesh);

            // 2. Sandy Beach Rim
            const sandGeo = new THREE.CylinderGeometry(6.8, 7.3, 0.26, 40);
            const sandMat = new THREE.MeshStandardMaterial({ color: 0xFDE68A, roughness: 0.8 });
            const sandMesh = new THREE.Mesh(sandGeo, sandMat);
            sandMesh.position.set(0, 0.04, 0.4);
            sandMesh.receiveShadow = true;
            treasureIslandGroup.add(sandMesh);

            // 3. Lush Green Adventure Island Top
            const turfGeo = new THREE.CylinderGeometry(5.9, 6.2, 0.32, 40);
            const turfMat = new THREE.MeshStandardMaterial({ color: 0x4ADE80, roughness: 0.7 });
            const turfMesh = new THREE.Mesh(turfGeo, turfMat);
            turfMesh.position.set(0, 0.12, 0.4);
            turfMesh.receiveShadow = true;
            treasureIslandGroup.add(turfMesh);

            // 4. Cute Cobblestone Stepping Path in Center
            const stoneMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, roughness: 0.6 });
            [
                { x: 0, z: 2.3, r: 0.45 },
                { x: 0, z: 1.3, r: 0.5 },
                { x: -1.2, z: 0.4, r: 0.42 },
                { x: 1.2, z: 0.4, r: 0.42 },
                { x: 0, z: -0.4, r: 0.45 }
            ].forEach(st => {
                const stone = new THREE.Mesh(new THREE.CylinderGeometry(st.r, st.r * 1.08, 0.06, 16), stoneMat);
                stone.position.set(st.x, 0.29, st.z);
                stone.receiveShadow = true;
                treasureIslandGroup.add(stone);
            });

            // 5. Decorative Palm / Island Trees on Back Edge
            const palmPositions = [
                { x: -4.6, z: -2.2, s: 0.9 },
                { x: 4.6, z: -2.2, s: 0.9 },
                { x: -4.9, z: 1.6, s: 0.75 },
                { x: 4.9, z: 1.6, s: 0.75 }
            ];
            palmPositions.forEach(p => {
                const tree = new THREE.Group();
                const trunk = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.16, 0.24, 1.3, 12),
                    new THREE.MeshStandardMaterial({ color: 0x92400E, roughness: 0.8 })
                );
                trunk.position.y = 0.65;
                trunk.castShadow = true;
                tree.add(trunk);

                const crown = new THREE.Mesh(
                    new THREE.SphereGeometry(0.75, 16, 16),
                    new THREE.MeshStandardMaterial({ color: 0x16A34A, roughness: 0.5 })
                );
                crown.scale.set(1.2, 0.7, 1.2);
                crown.position.y = 1.4;
                crown.castShadow = true;
                tree.add(crown);

                tree.position.set(p.x, 0.25, p.z);
                tree.scale.setScalar(p.s);
                treasureIslandGroup.add(tree);
            });

            // 6. Glowing Compass Foot Ring under Treasure Hero
            const ringGeo = new THREE.RingGeometry(0.52, 0.72, 32);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0xFACC15,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.9
            });
            const compassRing = new THREE.Mesh(ringGeo, ringMat);
            compassRing.rotation.x = Math.PI / 2;
            compassRing.position.set(0, 0.31, 3.1);
            treasureHero.compassRing = compassRing;
            treasureIslandGroup.add(compassRing);

            // 7. Clone the cute 3D Mario Hero for Treasure Island Exploration
            const explorer = marioHero.group.clone();
            explorer.position.set(0, 0.28, 3.1);
            treasureHero.group = explorer;
            treasureIslandGroup.add(explorer);
        }

        // Create a 3D Wooden & Gold Treasure Chest with a Big Number Badge & Hinged Lid
        function create3DTreasureChest(num, x, z) {
            const meta = getCognitiveItemMeta(num, 'number');
            const group = new THREE.Group();
            const baseY = 0.28;
            group.position.set(x, baseY, z);

            const woodMat = new THREE.MeshStandardMaterial({ color: 0xB45309, roughness: 0.55 });
            const goldMat = new THREE.MeshStandardMaterial({ color: 0xFACC15, roughness: 0.25, metalness: 0.35 });
            const darkInsideMat = new THREE.MeshBasicMaterial({ color: 0x451A03 });

            // Chest Base Box
            const baseBox = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.82, 1.15), woodMat);
            baseBox.position.y = 0.41;
            baseBox.castShadow = true;
            baseBox.receiveShadow = true;
            baseBox.userData = { isNumberBlock: true, itemKey: num, number: num, parentWrapper: null };
            group.add(baseBox);

            // Golden Trim Straps on Base
            [-0.55, 0.55].forEach(sx => {
                const strap = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.84, 1.19), goldMat);
                strap.position.set(sx, 0.41, 0);
                group.add(strap);
            });

            // Glowing Gold Lock Plate on Front
            const lockPlate = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.38, 0.1), goldMat);
            lockPlate.position.set(0, 0.72, 0.58);
            group.add(lockPlate);

            // Inner Gold Glow when Chest Opens
            const innerTreasure = new THREE.Mesh(
                new THREE.BoxGeometry(1.35, 0.15, 0.95),
                new THREE.MeshBasicMaterial({ color: 0xFDE047 })
            );
            innerTreasure.position.y = 0.78;
            group.add(innerTreasure);

            // Hinged Chest Lid (Pivots around back edge z = -0.55, y = 0.82)
            const lidPivot = new THREE.Group();
            lidPivot.position.set(0, 0.82, -0.55);

            const lidBox = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.42, 1.15), woodMat);
            lidBox.position.set(0, 0.21, 0.55);
            lidBox.castShadow = true;
            lidBox.userData = { isNumberBlock: true, itemKey: num, number: num, parentWrapper: null };
            lidPivot.add(lidBox);

            [-0.55, 0.55].forEach(sx => {
                const lidStrap = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.45, 1.19), goldMat);
                lidStrap.position.set(sx, 0.21, 0.55);
                lidPivot.add(lidStrap);
            });
            group.add(lidPivot);

            // High-Contrast Floating Number Signboard above the Chest (Tilted toward top-down camera)
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = meta.hex;
            roundRectCanvas(ctx, 8, 8, 240, 240, 44);
            ctx.fill();

            ctx.fillStyle = '#FFFFFF';
            roundRectCanvas(ctx, 24, 24, 208, 208, 32);
            ctx.fill();

            ctx.fillStyle = '#0F172A';
            ctx.font = '900 138px "Fredoka", "Noto Sans TC", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(num), 128, 118);

            // Quantity dots at bottom of chest sign
            ctx.fillStyle = meta.hex;
            const dotR = 7;
            const gap = 18;
            const startX = 128 - ((num - 1) * gap) / 2;
            for (let i = 0; i < num; i++) {
                ctx.beginPath();
                ctx.arc(startX + i * gap, 204, dotR, 0, Math.PI * 2);
                ctx.fill();
            }

            const signTex = new THREE.CanvasTexture(canvas);
            const signCard = new THREE.Mesh(
                new THREE.BoxGeometry(1.38, 1.38, 0.16),
                [
                    new THREE.MeshStandardMaterial({ color: meta.hex }),
                    new THREE.MeshStandardMaterial({ color: meta.hex }),
                    new THREE.MeshStandardMaterial({ color: meta.hex }),
                    new THREE.MeshStandardMaterial({ color: meta.hex }),
                    new THREE.MeshBasicMaterial({ map: signTex }),
                    new THREE.MeshStandardMaterial({ color: meta.hex })
                ]
            );
            signCard.position.set(0, 1.98, 0);
            signCard.rotation.x = -0.35; // Tilted slightly upward for top-down camera readability
            signCard.castShadow = true;
            signCard.userData = { isNumberBlock: true, itemKey: num, number: num, parentWrapper: null };
            group.add(signCard);

            // Golden Ground Halo Ring around the Chest (For Visual Hint)
            const haloGeo = new THREE.RingGeometry(1.05, 1.35, 32);
            const haloMat = new THREE.MeshBasicMaterial({
                color: 0xFFEA00,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.0
            });
            const haloMesh = new THREE.Mesh(haloGeo, haloMat);
            haloMesh.rotation.x = Math.PI / 2;
            haloMesh.position.set(0, 0.05, 0);
            group.add(haloMesh);

            const wrapper = {
                num,
                itemKey: num,
                isMarioBrick: false,
                isTreasureChest: true,
                group,
                bodyMesh: signCard,
                extraHitMeshes: [baseBox, lidBox, signCard],
                lidPivot,
                lidOpen: false,
                haloMesh,
                baseX: x,
                baseY,
                baseZ: z,
                baseScale: 1.0,
                state: 'idle',
                animTime: Math.random() * Math.PI * 2,
                wrongTimer: 0,
                celebrateTimer: 0,
                bumpOffset: 0
            };

            baseBox.userData.parentWrapper = wrapper;
            lidBox.userData.parentWrapper = wrapper;
            signCard.userData.parentWrapper = wrapper;
            numberBlocksGroup.add(group);
            return wrapper;
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

                // Countable dots at bottom
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

        // Create a Floating 3D Mario Brick Block supporting Numbers, Colors, and Shapes
        function create3DMarioBrick(itemKey, x, y, z) {
            const meta = getCognitiveItemMeta(itemKey);
            const group = new THREE.Group();
            group.position.set(x, y, z);

            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');

            // Golden Question Block Border (or Color-tinted in Color mode)
            ctx.fillStyle = meta.subject === 'color' ? meta.hex : '#F59E0B';
            ctx.fillRect(0, 0, 512, 512);

            // Inner Cream Card
            ctx.fillStyle = '#FFFBEB';
            roundRectCanvas(ctx, 28, 28, 456, 456, 42);
            ctx.fill();

            // 4 Classic Corner Rivets
            ctx.fillStyle = '#B45309';
            [[56, 56], [456, 56], [56, 456], [456, 456]].forEach(([rx, ry]) => {
                ctx.beginPath();
                ctx.arc(rx, ry, 14, 0, Math.PI * 2);
                ctx.fill();
            });

            if (meta.subject === 'color') {
                // Big vibrant color swatch circle + Chinese label
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

            // Golden Hint Halo behind the brick
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
