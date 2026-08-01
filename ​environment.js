window.environmentColliders = [];

function buildEnvironment() {
    if (!window.scene) return;
    createGround();
    createProceduralForest();
    createCastleRuins();
    addAtmosphericLights();
}

function createGround() {
    const floorGeo = new THREE.PlaneGeometry(300, 300, 16, 16);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0a140a, roughness: 1.0 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.1;
    window.scene.add(floor);
}

function createProceduralForest() {
    const treeCount = 150; // Optimized count for zero lag on mobile
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 3, 5);
    const leavesGeo = new THREE.ConeGeometry(2, 5, 5);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x1a120c });
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x0a1f0a });

    const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    const leavesMesh = new THREE.InstancedMesh(leavesGeo, leavesMat, treeCount);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < treeCount; i++) {
        let x = (Math.random() - 0.5) * 300;
        let z = (Math.random() - 0.5) * 300;
        if (Math.abs(x) < 12 && Math.abs(z) < 12) continue;
        if (z < -70 && Math.abs(x) < 40) continue;

        dummy.position.set(x, 1.5, z);
        dummy.updateMatrix();
        trunkMesh.setMatrixAt(i, dummy.matrix);

        dummy.position.set(x, 4, z);
        dummy.updateMatrix();
        leavesMesh.setMatrixAt(i, dummy.matrix);
    }
    window.scene.add(trunkMesh);
    window.scene.add(leavesMesh);
}

function createCastleRuins() {
    const group = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    
    const wall = new THREE.Mesh(new THREE.BoxGeometry(40, 8, 2), stoneMat);
    wall.position.set(0, 4, -120);
    group.add(wall);
    window.scene.add(group);
}

function addAtmosphericLights() {
    const bossLight = new THREE.PointLight(0xff0000, 4, 30);
    bossLight.position.set(0, 3, -115);
    window.scene.add(bossLight);
}

