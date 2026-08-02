// ==========================================
// enemyAI.js - FIXED SCALE & ATTACK LOGIC
// ==========================================

window.zombies = [];
window.zombieMeshes = [];
window.bossActive = false;

class Zombie {
    constructor(x, z, isBoss = false) {
        this.isBoss = isBoss;
        this.health = isBoss ? 2500 : 100;
        this.maxHealth = this.health;
        this.speed = isBoss ? 3.5 : 1.5 + (Math.random() * 0.5);
        this.attackDamage = isBoss ? 35 : 15;
        this.attackRange = this.isBoss ? 4.0 : 2.0;
        
        this.state = 'chase';
        this.attackCooldown = 0;
        this.mixer = null;
        this.animations = {};
        this.currentAction = null;

        this.createMesh(x, z);
    }

    createMesh(x, z) {
        const geo = new THREE.CylinderGeometry(this.isBoss ? 1.5 : 0.6, this.isBoss ? 1.5 : 0.6, this.isBoss ? 3.5 : 1.8, 8);
        const mat = new THREE.MeshBasicMaterial({ visible: false }); // Hitbox invisible rahega
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.set(x, this.isBoss ? 1.75 : 0.9, z);
        
        this.mesh.userData = { parent: this, takeDamage: (amt) => this.takeDamage(amt) };
        window.scene.add(this.mesh);
        window.zombieMeshes.push(this.mesh);

        if (window.gltfLoader) {
            const file = this.isBoss ? 'boss.glb' : 'zombie.glb';
            window.gltfLoader.load(file, (gltf) => {
                const model = gltf.scene;
                
                // 🚨 FIX: MODELS KO 100 GUNA CHHOTA KIYA 🚨
                const scaleAmount = this.isBoss ? 0.03 : 0.015; 
                model.scale.setScalar(scaleAmount);
                model.position.y = this.isBoss ? -1.75 : -0.9; 
                
                this.mesh.add(model);

                if (gltf.animations && gltf.animations.length > 0) {
                    this.mixer = new THREE.AnimationMixer(model);
                    this.animations.walk = this.mixer.clipAction(gltf.animations[0]);
                    this.animations.attack = this.mixer.clipAction(gltf.animations[1] || gltf.animations[0]);
                    this.playAnimation('walk');
                }
            });
        }
    }

    playAnimation(name) {
        if (!this.mixer || !this.animations[name]) return;
        const action = this.animations[name];
        if (this.currentAction === action) return;
        if (this.currentAction) this.currentAction.fadeOut(0.2);
        action.reset().fadeIn(0.2).play();
        this.currentAction = action;
    }

    takeDamage(amt) {
        if (this.state === 'dead') return;
        this.health -= amt;
        if (this.health <= 0) this.die();
    }

    die() {
        this.state = 'dead';
        const idx = window.zombieMeshes.indexOf(this.mesh);
        if (idx > -1) window.zombieMeshes.splice(idx, 1);
        setTimeout(() => window.scene.remove(this.mesh), 3000);
    }

    update(delta, playerPos) {
        if (this.state === 'dead') return;

        const dx = playerPos.x - this.mesh.position.x;
        const dz = playerPos.z - this.mesh.position.z;
        const distanceToPlayer = Math.sqrt(dx*dx + dz*dz);
        
        // Face Player
        this.mesh.rotation.y = Math.atan2(dx, dz);

        if (distanceToPlayer > this.attackRange) {
            // Move towards player
            this.state = 'chase';
            this.playAnimation('walk');
            this.mesh.position.x += (dx / distanceToPlayer) * this.speed * delta;
            this.mesh.position.z += (dz / distanceToPlayer) * this.speed * delta;
        } else {
            // Attack player
            this.state = 'attack';
            this.playAnimation('attack');
            if (this.attackCooldown <= 0) {
                if (window.takeDamage) window.takeDamage(this.attackDamage);
                this.attackCooldown = 1.5; // Attack har 1.5 second mein hoga
            }
        }

        if (this.attackCooldown > 0) this.attackCooldown -= delta;
        if (this.mixer) this.mixer.update(delta);
    }
}

window.spawnHorde = function(count = 15, cx = 0, cz = -40) {
    for(let i=0; i<count; i++) {
        let angle = Math.random() * Math.PI * 2;
        let radius = 10 + Math.random() * 20;
        window.zombies.push(new Zombie(cx + Math.cos(angle)*radius, cz + Math.sin(angle)*radius, false));
    }
}

window.updateEnemies = function(delta) {
    if (!window.camera || !window.gameActive) return;
    const pPos = window.camera.position;
    
    for (let i = window.zombies.length - 1; i >= 0; i--) {
        window.zombies[i].update(delta, pPos);
        if (window.zombies[i].state === 'dead' && !window.zombies[i].mesh.parent) {
            window.zombies.splice(i, 1);
        }
    }
};
