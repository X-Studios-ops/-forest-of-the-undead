import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Arrays export kar rahe hain taaki playerControls.js inpar goli chala sake
export const zombies = []; 
export const zombieHitboxes = []; 
let sceneRef;

class Zombie {
    constructor(x, z, gltfScene, gltfAnimations) {
        this.health = 100;
        this.speed = 1.5 + Math.random() * 0.5; // Har zombie ki speed thodi alag hogi
        this.state = 'chase';
        
        // 1. Invisible Hitbox (Goli lagne ke liye sabse best method)
        const geo = new THREE.CylinderGeometry(0.6, 0.6, 1.8, 8);
        const mat = new THREE.MeshBasicMaterial({ visible: false }); // Hitbox gayab rahega
        this.hitbox = new THREE.Mesh(geo, mat);
        this.hitbox.position.set(x, 0.9, z); 
        
        // Custom data jisse hit-detection kaam karegi
        this.hitbox.userData = { isZombie: true, instance: this };
        sceneRef.add(this.hitbox);
        zombieHitboxes.push(this.hitbox);

        // 2. Visual GLB Model Setup
        this.model = gltfScene.clone();
        // Model chota karne ke liye scale (apne hisaab se adjust kar lena)
        this.model.scale.setScalar(0.015);
        this.model.position.y = -0.9; // Model ko hitbox ke pairo(feet) tak neeche laya
        this.hitbox.add(this.model);

        // 3. Animation Setup
        this.mixer = null;
        if (gltfAnimations && gltfAnimations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.model);
            // Assuming pehli animation chalne ki hai (Index 0)
            const walkAnim = this.mixer.clipAction(gltfAnimations[0]);
            walkAnim.play();
        }
    }

    takeDamage(amount) {
        if (this.state === 'dead') return;
        this.health -= amount;
        
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.state = 'dead';
        
        // Raycaster (Goli) list se turant hata do taaki mari hui body par goli na lage
        const index = zombieHitboxes.indexOf(this.hitbox);
        if (index > -1) zombieHitboxes.splice(index, 1);

        // Fake Ragdoll: Zameen par gira do
        this.hitbox.rotation.x = -Math.PI / 2;
        this.hitbox.position.y = 0.2;

        // 5 second baad body ko scene se delete kardo taaki game lag na kare
        setTimeout(() => {
            sceneRef.remove(this.hitbox);
            const zIndex = zombies.indexOf(this);
            if (zIndex > -1) zombies.splice(zIndex, 1);
        }, 5000);
    }

    update(delta, playerPos) {
        if (this.state === 'dead') return;

        // Animation update
        if (this.mixer) this.mixer.update(delta);

        // Distance aur Direction calculate karo
        const dx = playerPos.x - this.hitbox.position.x;
        const dz = playerPos.z - this.hitbox.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        // Zombie hamesha player ki taraf dekhega
        this.hitbox.rotation.y = Math.atan2(dx, dz);

        // Agar zombie door hai, toh aage badho
        if (distance > 1.5) {
            this.hitbox.translateZ(this.speed * delta);
        } else {
            // TODO: Player ko damage dene ka logic yahan aayega
        }
    }
}

export function initEnemies(scene) {
    sceneRef = scene;
    const loader = new GLTFLoader();
    
    console.log("Loading Zombie Horde...");
    
    // YAHAN DHYAN DENA: zombie.glb tere public ya root folder me hona chahiye
    loader.load('./zombie.glb', (gltf) => {
        console.log("Zombie Models Loaded Successfully!");
        
        // 5 Zombies player ke theek saamne (andhere mein) spawn honge
        for (let i = 0; i < 5; i++) {
            const randomX = (Math.random() - 0.5) * 20; // Thoda left-right spread
            const randomZ = -20 - (Math.random() * 15); // Player se 20-35 unit door
            
            const zombie = new Zombie(randomX, randomZ, gltf.scene, gltf.animations);
            zombies.push(zombie);
        }
    }, undefined, (error) => {
        console.error("FATAL ZOMBIE LOAD ERROR: ", error);
    });
}

export function updateEnemies(delta, cameraPos) {
    // Har frame par saare zindo zombies ko update karo
    for (let i = zombies.length - 1; i >= 0; i--) {
        zombies[i].update(delta, cameraPos);
    }
}
