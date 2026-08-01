// ==========================================
// environment.js - PROCEDURAL FOREST, CASTLE & ATMOSPHERE
// ==========================================

// Global array jisme hum saari deewarein aur ped daalenge (Collision detection ke liye)
window.environmentColliders = [];

function buildEnvironment() {
    if (!window.scene) {
        console.error("Engine not initialized yet! Call initEngine() first.");
        return;
    }

    console.log("Generating Procedural Environment...");

    createGround();
    createProceduralForest();
    createCastleRuins();
    addAtmosphericLights();
}

// ==========================================
// 1. TERRAIN / GROUND GENERATION
// ==========================================
function createGround() {
    // Ek massive zameen (500x500 meters)
    const floorGeo = new THREE.PlaneGeometry(500, 500, 32, 32);
    
    // Wireframe noise approach for bumpy ground (Procedural terrain displacement)
    const pos = floorGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vy = pos.getY(i);
        // Halki si bumpiness add kar rahe hain (z axis in PlaneGeometry is the up axis before rotation)
        const bump = Math.sin(vx * 0.1) * Math.cos(vy * 0.1) * 1.5;
        pos.setZ(i, bump);
    }
    floorGeo.computeVertexNormals();

    const floorMat = new THREE.MeshStandardMaterial({ 
        color: 0x0a140a, // Very dark mossy green
        roughness: 1.0,
        metalness: 0.0,
        flatShading: true // Low-poly AAA stylized look
    });

    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.1; // Thoda sa neeche taaki player freely move kare
    floor.receiveShadow = true;
    
    window.scene.add(floor);
}

// ==========================================
// 2. PROCEDURAL FOREST (INSTANCED MESH FOR 60 FPS)
// ==========================================
function createProceduralForest() {
    const treeCount = 1500; // 1500 ped lagayenge bina kisi lag ke!
    
    // Master Geometries
    const trunkGeo = new THREE.CylinderGeometry(0.4, 0.7, 4, 7);
    const leavesGeo = new THREE.ConeGeometry(2.5, 6, 7);
    
    // Master Materials
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x1a120c, roughness: 0.9 });
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x0a1f0a, roughness: 0.8 });

    // Instanced Meshes (GPUs love this)
    const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    const leavesMesh = new THREE.InstancedMesh(leavesGeo, leavesMat, treeCount);
    
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    leavesMesh.castShadow = true;
    leavesMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();

    for (let i = 0; i < treeCount; i++) {
        // Random positions (-200 to 200), lekin centre area thoda khali rakhenge spawn ke liye
        let x = (Math.random() - 0.5) * 400;
        let z = (Math.random() - 0.5) * 400;

        // Player spawn area (0,0) ko clear rakho
        if (Math.abs(x) < 15 && Math.abs(z) < 15) {
            x += 20 * Math.sign(x);
            z += 20 * Math.sign(z);
        }

        // Castle area (z = -100 to -150) ko clear rakho
        if (z < -80 && Math.abs(x) < 50) continue; 

        // Random Scaling & Rotation
        const scale = 0.8 + Math.random() * 0.7;
        const rotY = Math.random() * Math.PI;

        // Set Trunk
        dummy.position.set(x, 2 * scale, z);
        dummy.rotation.set(0, rotY, 0);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        trunkMesh.setMatrixAt(i, dummy.matrix);

        // Set Leaves (Upar)
        dummy.position.set(x, (4 * scale) + (3 * scale), z);
        dummy.updateMatrix();
        leavesMesh.setMatrixAt(i, dummy.matrix);
    }

    window.scene.add(trunkMesh);
    window.scene.add(leavesMesh);
}

// ==========================================
// 3. CASTLE RUINS GENERATION (QUEEN'S LAIR)
// ==========================================
function createCastleRuins() {
    const castleGroup = new THREE.Group();
    const wallGeo = new THREE.BoxGeometry(10, 8, 2);
    const towerGeo = new THREE.CylinderGeometry(3, 3, 12, 8);
    
    const stoneMat = new THREE.MeshStandardMaterial({ 
        color: 0x111111, // Dark scary stone
        roughness: 0.9,
        metalness: 0.2
    });

    // Outer Walls (Creating a U-shape)
    const wall1 = new THREE.Mesh(wallGeo, stoneMat);
    wall1.position.set(-15, 4, -100);
    wall1.castShadow = true;
    castleGroup.add(wall1);

    const wall2 = new THREE.Mesh(wallGeo, stoneMat);
    wall2.position.set(15, 4, -100);
    wall2.castShadow = true;
    castleGroup.add(wall2);

    // Left Long Wall
    const wall3 = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 40), stoneMat);
    wall3.position.set(-20, 4, -120);
    wall3.castShadow = true;
    castleGroup.add(wall3);

    // Right Long Wall
    const wall4 = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 40), stoneMat);
    wall4.position.set(20, 4, -120);
    wall4.castShadow = true;
    castleGroup.add(wall4);

    // Back Wall (The Throne Room)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(40, 10, 2), stoneMat);
    backWall.position.set(0, 5, -140);
    backWall.castShadow = true;
    castleGroup.add(backWall);

    // Towers
    const towerPositions = [
        [-20, 6, -100], [20, 6, -100],
        [-20, 6, -140], [20, 6, -140]
    ];

    towerPositions.forEach(pos => {
        const tower = new THREE.Mesh(towerGeo, stoneMat);
        tower.position.set(pos[0], pos[1], pos[2]);
        tower.castShadow = true;
        castleGroup.add(tower);
    });

    window.scene.add(castleGroup);

    // Add walls to collision array so player doesn't walk through them
    // (Actual bounding box logic will be needed in playerControls.js for true collision)
    window.environmentColliders.push(wall1, wall2, wall3, wall4, backWall);
}

// ==========================================
// 4. ATMOSPHERIC LIGHTING & FOG
// ==========================================
function addAtmosphericLights() {
    // Castle Entrance Torches (Creepy Red/Orange glow)
    createTorch(-10, 3, -98, 0xff4400);
    createTorch(10, 3, -98, 0xff4400);

    // Throne Room Epic Red Light (Where the Zombie Queen will be)
    const bossLight = new THREE.PointLight(0xff0000, 5, 40);
    bossLight.position.set(0, 4, -135);
    window.scene.add(bossLight);
}

function createTorch(x, y, z, colorHex) {
    // Light Source
    const light = new THREE.PointLight(colorHex, 2, 20);
    light.position.set(x, y, z);
    
    // Add a slight flicker effect logic (we will attach this to a global array if we want it to animate)
    light.userData = { isFlickering: true, baseIntensity: 2 };
    if (!window.torchLights) window.torchLights = [];
    window.torchLights.push(light);

    window.scene.add(light);
}

// Global update function for environment animations (e.g., flickering torches)
window.updateEnvironment = function() {
    if (window.torchLights) {
        window.torchLights.forEach(light => {
            // Random flicker math
            light.intensity = light.userData.baseIntensity + (Math.random() * 0.5 - 0.25);
        });
    }
};

// ==========================================
// ATTACH TO MAIN ENGINE
// ==========================================
// Delay build slightly to ensure main.js has created the scene
setTimeout(() => {
    if (window.scene) {
        buildEnvironment();
    } else {
        // If main hasn't run yet, we hook into window.startGame or wait
        console.warn("Waiting for main.js to initialize scene...");
        const originalInit = window.initEngine;
        window.initEngine = function() {
            if (originalInit) originalInit();
            buildEnvironment();
        };
    }
}, 500);

