import * as THREE from 'three';

let playerLight;

export function initLighting(scene) {
    // Dim moonlight ambient lighting
    const hemiLight = new THREE.HemisphereLight(0x444455, 0x111111, 0.5); 
    scene.add(hemiLight);

    // Tactical Flashlight attached to player
    playerLight = new THREE.PointLight(0xffeedd, 1.5, 25);
    scene.add(playerLight);
}

export function updateLighting(camera) {
    if (playerLight && camera) {
        playerLight.position.copy(camera.position);
        
        // Offset the light to act like a gun barrel flashlight
        const lightOffset = new THREE.Vector3(0.3, -0.2, -0.5);
        lightOffset.applyQuaternion(camera.quaternion);
        playerLight.position.add(lightOffset);
    }
}
