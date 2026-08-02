import * as THREE from 'three';

let playerLight;

export function initLighting(scene, camera) {
    // Dim ambient moonlight
    const hemiLight = new THREE.HemisphereLight(0x444455, 0x111111, 0.5); 
    scene.add(hemiLight);

    // Tactical Flashlight attached to the player
    playerLight = new THREE.PointLight(0xffeedd, 1.5, 25);
    scene.add(playerLight);
    
    // (Optional) Function to update light position based on camera can be exported
}
