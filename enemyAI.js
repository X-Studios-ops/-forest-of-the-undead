// ==========================================
// enemyAI.js - ZOMBIE SPAWNING, PATHFINDING & BOSS FIGHT
// ==========================================

window.zombies = []; // Zombie logic objects store karne ke liye
window.zombieMeshes = []; // Raycaster (Shooting) ke liye sirf meshes
window.bossActive = false;
window.bossEntity = null;

// ==========================================
// 1. ZOMBIE CLASS SETUP
// ==========================================
class Zombie {
    constructor(x, z, isBoss = false) {
        this.isBoss = isBoss;
        this.health = isBoss ? 2000 : 100;
        this.maxHealth = this.health;
        this.speed = isBoss ? 3.5 : 1.5 + Math.random(); // Boss is faster, normal zombies have random speeds
        this.attackDamage = isBoss ? 25 : 10;
        this.attackRange = isBoss ? 3.0 : 1.8;
        this.attackCooldown = 0;
        this.isDead = false;

        this.createMesh(x, z);
    }

    createMesh(x, z) {
        // Base shape for Zombie (Cylinder looks slightly better than a plain box for enemies)
        const radius = this.isBoss ? 1.2 : 0.6;
        const height = this.isBoss ? 3.5 : 1.8;
        
        const geo = new THREE.CylinderGeometry(radius, radius, height, 8);
        
        // Colors: Sickly Green for normal, Blood Red / Black for Boss
        const colorHex = this.isBoss ? 0x8b0000 : 0x2d4c1e;
        const mat = new THREE.MeshStandardMaterial({ 
            color: colorHex, 
            roughness: 0.8,
            metalness: this.isBoss ? 0.3 : 0.0 
        });

        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.set(x, height / 2, z);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        // Save reference to this class instance in the mesh for raycaster damage
        this.mesh.userData = { parent: this, takeDamage: (amt) => this.takeDamage(amt) };

        window.scene.add(this.mesh);
        window.zombieMeshes.push(this.mesh);
    }

    takeDamage(amount) {
        if (this.isDead) return;

        this.health -= amount;
        
        // Flash Effect (White when hit)
        const originalColor = this.mesh.material.color.getHex();
        this.mesh.material.color.setHex(0xffffff);
        setTimeout(() => {
            if (!this.isDead) this.mesh.material.color.setHex(originalColor);
        }, 100);

        // Update Boss UI if it's the Queen
        if (this.isBoss) {
            updateBossUI(this.health, this.maxHealth);
            
            // Enrage Mechanics: Spawn minions at certain health thresholds
            if (this.health % 500 === 0) {
                spawnZombies(3, this.mesh.position.x, this.mesh.position.z + 5);
            }
        }

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        
        // Fall down animation logic (handled in update loop)
        this.mesh.userData.isDying = true;
        
        // Remove from targeting array immediately so player can't shoot a dead body
        const index = window.zombieMeshes.indexOf(this.mesh);
        if (index > -1) window.zombieMeshes.splice(index, 1);

        if (this.isBoss) {
            window.bossActive = false;
            // Hide Boss UI
            document.getElementById('boss-ui').classList.add('hidden');
            // Trigger Victory
            if (window.logAction) window.logAction("QUEEN DEFEATED! HUMANITY SAVED!", "text-yellow-400 font-bold text-xl");
        } else {
            if (window.logAction) window.logAction("Zombie Killed", "text-gray-500");
        }

        // Cleanup mesh after 3 seconds
        setTimeout(() => {
            window.scene.remove(this.mesh);
        }, 3000);
    }

    update(delta, playerPos) {
        if (this.isDead) {
            // Death Animation: Fall over
            if (this.mesh.rotation.x < Math.PI / 2) {
                this.mesh.rotation.x += delta * 3;
                this.mesh.position.y -= delta * 2;
            }
            return;
        }

        // AI PATHFINDING: Move towards player
        const dx = playerPos.x - this.mesh.position.x;
        const dz = playerPos.z - this.mesh.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        // Turn to face player (Lock Y axis so they don't tilt up/down)
        const targetPos = playerPos.clone();
        targetPos.y = this.mesh.position.y; 
        this.mesh.lookAt(targetPos);

        // If player is out of reach, move closer
        if (distance > this.attackRange) {
            // Normalize direction vector
            const dirX = dx / distance;
            const dirZ = dz / distance;

            this.mesh.position.x += dirX * this.speed * delta;
            this.mesh.position.z += dirZ * this.speed * delta;
        } 
        // If close enough, ATTACK!
        else {
            if (this.attackCooldown <= 0) {
                this.attackPlayer();
                this.attackCooldown = 1.5; // Attack every 1.5 seconds
            }
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }
    }

    attackPlayer() {
        // Attack Animation: Slight lunge forward
        this.mesh.position.add(this.mesh.getWorldDirection(new THREE.Vector3()).multiplyScalar(0.5));
        setTimeout(() => {
            if (!this.isDead) this.mesh.position.add(this.mesh.getWorldDirection(new THREE.Vector3()).multiplyScalar(-0.5));
        }, 200);

        // Call global takeDamage function (located in playerControls.js)
        if (window.takeDamage) {
            window.takeDamage(this.attackDamage);
            if (this.isBoss) {
                if (window.logAction) window.logAction("Queen hit you!", "text-red-500 font-bold");
            }
        }
    }
}

// ==========================================
// 2. SPAWN LOGIC
// ==========================================

function spawnZombies(count, centerX = 0, centerZ = -30, radius = 40) {
    for (let i = 0; i < count; i++) {
        // Random position within radius
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * radius;
        const x = centerX + Math.cos(angle) * r;
        const z = centerZ + Math.sin(angle) * r;

        // Avoid spawning too close to the player spawn (0,0)
        if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;

        const zombie = new Zombie(x, z, false);
        window.zombies.push(zombie);
    }
    console.log(`${count} Zombies spawned!`);
}

function spawnZombieQueen() {
    if (window.bossEntity) return; // Only one queen allowed
    
    // Spawn in the throne room (defined in environment.js at z: -140)
    window.bossEntity = new Zombie(0, -135, true);
    window.zombies.push(window.bossEntity);
    window.bossActive = true;

    // Show Boss Health UI
    document.getElementById('boss-ui').classList.remove('hidden');
    updateBossUI(window.bossEntity.health, window.bossEntity.maxHealth);

    if (window.logAction) window.logAction("THE ZOMBIE QUEEN AWAKENS!", "text-red-600 font-black text-lg");
}

function updateBossUI(current, max) {
    const healthBar = document.getElementById('boss-health');
    if (healthBar) {
        const percentage = Math.max(0, (current / max) * 100);
        healthBar.style.width = percentage + '%';
    }
}

// ==========================================
// 3. MAIN UPDATE LOOP (Called from main.js)
// ==========================================

window.updateEnemies = function(delta) {
    if (!window.camera || !window.gameActive) return;

    const playerPos = window.camera.position;

    // Check if player entered the Castle area to trigger Boss Fight
    if (!window.bossActive && !window.bossEntity && playerPos.z < -90 && Math.abs(playerPos.x) < 20) {
        spawnZombieQueen();
    }

    // Loop through all zombies and update their AI
    for (let i = window.zombies.length - 1; i >= 0; i--) {
        const z = window.zombies[i];
        z.update(delta, playerPos);

        // Remove fully dead zombies from logic array after 3 seconds
        if (z.isDead && !z.mesh.parent) {
            window.zombies.splice(i, 1);
        }
    }
};

// ==========================================
// INITIAL SETUP DELAY
// ==========================================
// Wait for scene to be ready before spawning initial horde
setTimeout(() => {
    if (window.scene) {
        // Spawn 30 zombies in the forest initially
        spawnZombies(30, 0, -50, 60);
    }
}, 1000);

