// ==========================================
// environment.js - GUARANTEED TREES
// ==========================================

window.buildEnvironment = function() {
    if (!window.scene) return;

    // 1. Zameen (Floor)
    const floorGeo = new THREE.PlaneGeometry(500, 500, 16, 16);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0a140a, roughness: 1.0 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    window.scene.add(floor);

    // 2. Ped (Trees)
    const treeCount = 150;
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 3, 5);
    const leavesGeo = new THREE.ConeGeometry(2, 6, 5);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x1a120c });
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x0a1f0a });

    const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    const leavesMesh = new THREE.InstancedMesh(leavesGeo, leavesMat, treeCount);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < treeCount; i++) {
        let x = (Math.random() - 0.5) * 400;
        let z = (Math.random() - 0.5) * 400;
        
        // Spawn area me ped nahi ugenge
        if (Math.abs(x) < 15 && Math.abs(z) < 15) continue;

        dummy.position.set(x, 1.5, z);
        dummy.updateMatrix();
        trunkMesh.setMatrixAt(i, dummy.matrix);

        dummy.position.set(x, 4.5, z);
        dummy.updateMatrix();
        leavesMesh.setMatrixAt(i, dummy.matrix);
    }
    
    window.scene.add(trunkMesh);
    window.scene.add(leavesMesh);
    
    console.log("Trees Loaded!");
};
