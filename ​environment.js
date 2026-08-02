// ==========================================
// environment.js - GOD LEVEL (ZERO LAG & BOSS ARENA)
// ==========================================

window.buildEnvironment = function() {
    if (!window.scene) return;

    // ==========================================
    // 1. INFINITE GROUND (Optimized Low-Poly)
    // ==========================================
    const floorGeo = new THREE.PlaneGeometry(800, 800, 1, 1); 
    const floorMat = new THREE.MeshStandardMaterial({ 
        color: 0x1a2b1a, // Dark green moonlight visible color
        roughness: 1.0, 
        metalness: 0.0 
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    window.scene.add(floor);

    // ==========================================
    // 2. PROCEDURAL FOREST (Zero Lag Instancing)
    // ==========================================
    const treeCount = 180; // Perfect balance for mobile 60 FPS
    
    const trunkGeo = new THREE.CylinderGeometry(0.4, 0.7, 4, 6);
    const leavesGeo = new THREE.ConeGeometry(3.5, 9, 6);
    
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x1c120a, roughness: 1.0 });
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x0a210f, roughness: 0.9 });

    // InstancedMesh = 1 Draw Call for 180 trees = NO LAG
    const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    const leavesMesh = new THREE.InstancedMesh(leavesGeo, leavesMat, treeCount);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < treeCount; i++) {
        let x = (Math.random() - 0.5) * 400;
        let z = (Math.random() - 0.5) * 400;
        
        // SAFE ZONES: Keep trees away from Player Spawn & Boss Arena
        if ((Math.abs(x) < 20 && Math.abs(z) < 20) || (z < -80 && Math.abs(x) < 50)) continue;

        // God Level Detail: Randomize tree size and rotation so it looks natural
        let scale = 0.7 + Math.random() * 0.6; 
        let rotY = Math.random() * Math.PI * 2;

        // Set Trunk
        dummy.position.set(x, 2 * scale, z);
        dummy.rotation.set(0, rotY, 0);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        trunkMesh.setMatrixAt(i, dummy.matrix);

        // Set Leaves
        dummy.position.set(x, (2 * scale) + (4 * scale), z);
        dummy.updateMatrix();
        leavesMesh.setMatrixAt(i, dummy.matrix);
    }
    
    // Cast shadows only if PC (handled automatically by our main.js config)
    trunkMesh.castShadow = true;
    leavesMesh.castShadow = true;
    
    window.scene.add(trunkMesh);
    window.scene.add(leavesMesh);

    // ==========================================
    // 3. THE NORTH CASTLE (Boss Arena & Lights)
    // ==========================================
    const ruinsGroup = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });

    // Main Wall
    const wallGeo = new THREE.BoxGeometry(50, 12, 4);
    const backWall = new THREE.Mesh(wallGeo, stoneMat);
    backWall.position.set(0, 6, -130);
    ruinsGroup.add(backWall);

    // Dark Pillars
    const pillarGeo = new THREE.CylinderGeometry(2, 2.5, 16, 8);
    const pillarLeft = new THREE.Mesh(pillarGeo, stoneMat);
    pillarLeft.position.set(-20, 8, -120);
    ruinsGroup.add(pillarLeft);

    const pillarRight = new THREE.Mesh(pillarGeo, stoneMat);
    pillarRight.position.set(20, 8, -120);
    ruinsGroup.add(pillarRight);

    // Ominous Red Boss Lights (Guides the player where to go)
    const redGlow1 = new THREE.PointLight(0xff0000, 4.0, 30);
    redGlow1.position.set(-20, 10, -118);
    ruinsGroup.add(redGlow1);

    const redGlow2 = new THREE.PointLight(0xff0000, 4.0, 30);
    redGlow2.position.set(20, 10, -118);
    ruinsGroup.add(redGlow2);

    window.scene.add(ruinsGroup);
    
    console.log("God Level Environment Loaded: Zero Lag Instancing & Boss Arena Active!");
};
