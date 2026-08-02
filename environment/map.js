import * as THREE from 'three';

/**
 * Initializes the entire environment map including the ground, 
 * procedural forest, and the boss arena ruins.
 * @param {THREE.Scene} scene - The main game scene
 */
export function initMap(scene) {
    console.log("Generating Environment: Dark Forest & Ruins...");
    
    createGround(scene);
    createProceduralForest(scene);
    createBossArena(scene);
}

function createGround(scene) {
    // 1. Zameen (Floor) - Using a darker, muddy green for the horror vibe
    const floorGeo = new THREE.PlaneGeometry(800, 800, 1, 1); 
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x0a1c0a }); 
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    
    scene.add(floor);
}

function createProceduralForest(scene) {
    // 2. PROCEDURAL FOREST (Zero Lag Instancing)[span_1](start_span)[span_1](end_span)
    const treeCount = 180; // Perfect balance for medium graphics[span_2](start_span)[span_2](end_span)
    
    const trunkGeo = new THREE.CylinderGeometry(0.4, 0.7, 4, 6);
    const leavesGeo = new THREE.ConeGeometry(3.5, 9, 6);
    
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x1c120a, roughness: 1.0 });
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x0a210f, roughness: 0.9 });

    // InstancedMesh = 1 Draw Call for 180 trees = NO LAG[span_3](start_span)[span_3](end_span)
    const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    const leavesMesh = new THREE.InstancedMesh(leavesGeo, leavesMat, treeCount);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < treeCount; i++) {
        let x = (Math.random() - 0.5) * 400;
        let z = (Math.random() - 0.5) * 400;
        
        // SAFE ZONES: Keep trees away from Player Spawn & Boss Arena[span_4](start_span)[span_4](end_span)
        if ((Math.abs(x) < 20 && Math.abs(z) < 20) || (z < -80 && Math.abs(x) < 50)) continue;

        // Randomize tree size and rotation so it looks natural[span_5](start_span)[span_5](end_span)
        let scale = 0.7 + Math.random() * 0.6; 
        let rotY = Math.random() * Math.PI * 2;

        // Set Trunk[span_6](start_span)[span_6](end_span)
        dummy.position.set(x, 2 * scale, z);
        dummy.rotation.set(0, rotY, 0);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        trunkMesh.setMatrixAt(i, dummy.matrix);

        // Set Leaves[span_7](start_span)[span_7](end_span)
        dummy.position.set(x, (2 * scale) + (4 * scale), z);
        dummy.updateMatrix();
        leavesMesh.setMatrixAt(i, dummy.matrix);
    }
    
    scene.add(trunkMesh);
    scene.add(leavesMesh);
}

function createBossArena(scene) {
    // 3. THE NORTH CASTLE (Boss Arena & Lights)[span_8](start_span)[span_8](end_span)
    const ruinsGroup = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });

    // Main Wall[span_9](start_span)[span_9](end_span)
    const wallGeo = new THREE.BoxGeometry(50, 12, 4);
    const backWall = new THREE.Mesh(wallGeo, stoneMat);
    backWall.position.set(0, 6, -130);
    ruinsGroup.add(backWall);

    // Dark Pillars[span_10](start_span)[span_10](end_span)
    const pillarGeo = new THREE.CylinderGeometry(2, 2.5, 16, 8);
    const pillarLeft = new THREE.Mesh(pillarGeo, stoneMat);
    pillarLeft.position.set(-20, 8, -120);
    ruinsGroup.add(pillarLeft);

    const pillarRight = new THREE.Mesh(pillarGeo, stoneMat);
    pillarRight.position.set(20, 8, -120);
    ruinsGroup.add(pillarRight);

    // Ominous Red Boss Lights (Guides the player where to go)[span_11](start_span)[span_11](end_span)
    const redGlow1 = new THREE.PointLight(0xff0000, 4.0, 30);
    redGlow1.position.set(-20, 10, -118);
    ruinsGroup.add(redGlow1);

    const redGlow2 = new THREE.PointLight(0xff0000, 4.0, 30);
    redGlow2.position.set(20, 10, -118);
    ruinsGroup.add(redGlow2);

    scene.add(ruinsGroup);
}

