document.addEventListener("DOMContentLoaded", () => {
    // 1. ระบบ Start Game
    const btnStart = document.getElementById("btn-start");
    const startScreen = document.getElementById("start-screen");
    const gameContent = document.getElementById("game-content");

    if (btnStart) {
        btnStart.addEventListener("click", () => {
            startScreen.classList.add("hidden");
            gameContent.classList.remove("hidden");
            gameContent.classList.add("fade-in");
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            // Initialize Game World
            initGameWorld();
        });
    }

    // Modal logic
    const modalOverlay = document.getElementById("modal-overlay");
    const btnCloseModal = document.getElementById("btn-close-modal");
    const allModals = document.querySelectorAll(".modal-section");

    function openModal(sectionId) {
        // Hide all first
        allModals.forEach(m => m.classList.add("hidden"));
        // Show target
        const target = document.getElementById(sectionId);
        if (target) {
            target.classList.remove("hidden");
            modalOverlay.classList.remove("hidden");
            // Pause the game if possible, though Kaboom runs in background, we can just block movement
            isGamePaused = true;
        }
    }

    if (btnCloseModal) {
        btnCloseModal.addEventListener("click", () => {
            modalOverlay.classList.add("hidden");
            isGamePaused = false;
        });
    }

    let isGamePaused = false;

    // 2. ระบบ Tabs (รองรับหลายกลุ่ม)
    const tabGroups = document.querySelectorAll('.tabs');

    tabGroups.forEach(tabGroup => {
        // ดึงชื่อกลุ่มจาก data-tab-group
        const groupName = tabGroup.getAttribute('data-tab-group');
        const tabButtons = tabGroup.querySelectorAll('.nes-btn');
        // ค้นหาเนื้อหา Tab ทั้งหมดที่ตรงกับชื่อกลุ่มนี้
        const tabPanes = document.querySelectorAll(`.tab-pane[data-tab-group="${groupName}"]`);

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // เอาคลาส is-primary ออกจากปุ่มทั้งหมดใน "กลุ่มนี้"
                tabButtons.forEach(b => b.classList.remove('is-primary'));
                
                // ใส่คลาส is-primary ให้ปุ่มที่ถูกกด
                btn.classList.add('is-primary');
                
                // ซ่อนเนื้อหา Tab ทั้งหมดใน "กลุ่มนี้"
                tabPanes.forEach(pane => pane.classList.remove('active'));
                
                // แสดงเนื้อหาของ Tab ที่ถูกเลือก
                const targetId = btn.getAttribute('data-tab');
                const targetPane = document.getElementById(targetId);
                if (targetPane) {
                    targetPane.classList.add('active');
                }
            });
        });
    });
    // =========================================================
    // 3. VAMPIRE SURVIVORS FX LOGIC
    // =========================================================
    const fxLayer = document.getElementById('fx-layer');
    if (!fxLayer) return;

    const toggleFx = document.getElementById('toggle-fx');
    let fxEnabled = false; // ตั้งค่าเริ่มต้นให้ "ปิด" ระบบ

    // อีเวนต์เมื่อกดปุ่มสลับสถานะ
    if (toggleFx) {
        toggleFx.addEventListener('change', (e) => {
            fxEnabled = e.target.checked;
            if (!fxEnabled) {
                // ลบเอฟเฟกต์ทั้งหมดที่ค้างอยู่ออกจากหน้าจอเมื่อกดปิด
                fxLayer.innerHTML = '';
                gems = [];
            }
        });
    }

    let gems = [];
    const MAGNET_RADIUS = 200; // ระยะดูด (px)
    const MAGNET_SPEED = 0.15; // ความเร็วการดูด

    // 3.1 ระบบคลิกแล้วขึ้นตัวเลขดาเมจ
    document.addEventListener('click', (e) => {
        if (!fxEnabled) return; // ถ้ายังไม่เปิดสวิตช์ ให้ข้ามการทำงานทันที

        // ถ้ายุ่งกับปุ่ม, Label หรือคลิกค้างคาวอยู่ ไม่ต้องสุ่มดาเมจ
        if (e.target.classList.contains('bat-enemy') || e.target.tagName === 'BUTTON' || e.target.tagName === 'LABEL' || e.target.tagName === 'INPUT') return;
        spawnDamage(e.clientX, e.clientY);
    });

    function spawnDamage(x, y, isCritical = false) {
        const dmg = document.createElement('div');
        dmg.classList.add('damage-text');
        
        if (isCritical || Math.random() < 0.1) {
            dmg.classList.add('critical');
            dmg.innerText = 'CRITICAL ' + Math.floor(Math.random() * 50 + 50); // 50-99
        } else {
            dmg.innerText = '-' + Math.floor(Math.random() * 20 + 10); // 10-29
        }
        
        // ขยับตำแหน่งไม่ให้บังเมาส์พอดีเป๊ะ
        const offsetX = (Math.random() - 0.5) * 40;
        const offsetY = -20;
        
        dmg.style.left = `${x + offsetX}px`;
        dmg.style.top = `${y + offsetY}px`;
        
        fxLayer.appendChild(dmg);
        
        setTimeout(() => dmg.remove(), 1000);
    }

    // 3.2 ระบบสุ่มเกิด EXP Gem แบบพอประมาณ
    function spawnGem(x, y) {
        const gem = document.createElement('div');
        gem.classList.add('exp-gem');
        
        // สุ่มสีคริสตัล
        const r = Math.random();
        if (r > 0.9) gem.classList.add('red');
        else if (r > 0.6) gem.classList.add('green');
        
        gem.style.left = `${x}px`;
        gem.style.top = `${y}px`;
        fxLayer.appendChild(gem);
        
        gems.push({ el: gem, x: x, y: y, collected: false });
    }

    // สุ่มเกิดทุกๆ 4 วินาที (เพื่อให้ดู Subtle ไม่รกเกินไป)
    setInterval(() => {
        if (!fxEnabled) return; // ข้ามการทำงานถ้าปิดอยู่

        if (gems.length < 5 && Math.random() > 0.4) {
            const x = Math.random() * (window.innerWidth - 100) + 50;
            const y = Math.random() * (window.innerHeight - 100) + 50;
            spawnGem(x, y);
        }
    }, 4000);

    // 3.3 ระบบแม่เหล็กดูด EXP เข้าหาเมาส์
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function updateGems() {
        for (let i = gems.length - 1; i >= 0; i--) {
            const gem = gems[i];
            if (gem.collected) continue;
            
            const dx = mouseX - gem.x;
            const dy = mouseY - gem.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            // ถ้าเมาส์อยู่ใกล้คริสตัล
            if (dist < MAGNET_RADIUS) {
                gem.x += dx * MAGNET_SPEED;
                gem.y += dy * MAGNET_SPEED;
                gem.el.style.left = `${gem.x}px`;
                gem.el.style.top = `${gem.y}px`;
                
                // เก็บเมื่อใกล้มากๆ
                if (dist < 20) {
                    gem.collected = true;
                    gem.el.remove();
                    gems.splice(i, 1);
                    spawnExpText(mouseX, mouseY);
                }
            }
        }
        requestAnimationFrame(updateGems);
    }
    requestAnimationFrame(updateGems);

    function spawnExpText(x, y) {
        const txt = document.createElement('div');
        txt.classList.add('exp-text');
        txt.innerText = '+EXP';
        
        const offsetX = (Math.random() - 0.5) * 40;
        txt.style.left = `${x + offsetX}px`;
        txt.style.top = `${y - 20}px`;
        fxLayer.appendChild(txt);
        
        setTimeout(() => txt.remove(), 1000);
    }

    // 3.4 ระบบสุ่มเกิดค้างคาวบินผ่าน
    setInterval(() => {
        if (!fxEnabled) return; // ข้ามการทำงานถ้าปิดอยู่
        if (Math.random() > 0.5) return; // ไม่ออกบ่อยเกินไป (Subtle)
        
        const bat = document.createElement('div');
        bat.classList.add('bat-enemy');
        bat.innerText = '🦇';
        
        const startLeft = Math.random() > 0.5;
        let x = startLeft ? -50 : window.innerWidth + 50;
        let y = Math.random() * (window.innerHeight - 200) + 100;
        
        bat.style.left = `${x}px`;
        bat.style.top = `${y}px`;
        
        const targetX = startLeft ? window.innerWidth + 100 : -100;
        const targetY = y + (Math.random() - 0.5) * 200;
        
        fxLayer.appendChild(bat);
        
        // สั่งให้บินไปฝั่งตรงข้าม
        setTimeout(() => {
            bat.style.left = `${targetX}px`;
            bat.style.top = `${targetY}px`;
        }, 100);
        
        // ถ้าผู้ใช้คลิกโดนค้างคาว (ฆ่ามัน)
        bat.addEventListener('mousedown', (e) => {
            spawnDamage(e.clientX, e.clientY, true);
            spawnGem(e.clientX, e.clientY);
            bat.remove();
        });
        
        // ลบออกจาก DOM เมื่อบินพ้นจอ (ประมาณ 10 วินาที)
        setTimeout(() => {
            if (bat.parentNode) bat.remove();
        }, 10000);
    }, 12000); // เช็คทุกๆ 12 วินาที

    // =========================================================
    // 4. ระบบคำนวณ Level (อายุ)
    // =========================================================
    function updateAgeLevel(birthDateString) {
        const birthDate = new Date(birthDateString);
        const today = new Date();
        
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return `Level(age): ${age}`;
    }

    const levelText = updateAgeLevel("2006-07-11");
    
    const heroLevelElement = document.getElementById("hero-level");
    if (heroLevelElement) {
        heroLevelElement.innerText = levelText;
    }

    const aboutLevelElement = document.getElementById("about-level-container");
    if (aboutLevelElement) {
        aboutLevelElement.innerHTML = `${levelText}`;
    }

    // =========================================================
    // 5. KABOOM.JS GAME WORLD INITIALIZATION
    // =========================================================
    function initGameWorld() {
        kaboom({
            global: true,
            canvas: document.getElementById("game-canvas"),
            background: [ 33, 37, 41 ], // #212529 to match NES.css dark mode
            width: 800,
            height: 600,
            scale: 1.5,
            debug: true
        });

        loadBean();

        scene("main", () => {
            const levelConfig = {
                tileWidth: 48,
                tileHeight: 48,
                tiles: {
                    "=": () => [
                        rect(48, 48),
                        color(100, 100, 100),
                        area(),
                        body({ isStatic: true }),
                        "wall"
                    ],
                    "A": () => [
                        text("👦", { size: 32 }),
                        area(),
                        body({ isStatic: true }),
                        "sign",
                        { section: "modal-about", prompt: "About Me" }
                    ],
                    "E": () => [
                        text("🎓", { size: 32 }),
                        area(),
                        body({ isStatic: true }),
                        "sign",
                        { section: "modal-education", prompt: "Education" }
                    ],
                    "S": () => [
                        text("💡", { size: 32 }),
                        area(),
                        body({ isStatic: true }),
                        "sign",
                        { section: "modal-skills", prompt: "Skills" }
                    ],
                    "X": () => [
                        text("⚔️", { size: 32 }),
                        area(),
                        body({ isStatic: true }),
                        "sign",
                        { section: "modal-experience", prompt: "Experience" }
                    ],
                    "T": () => [
                        text("📜", { size: 32 }),
                        area(),
                        body({ isStatic: true }),
                        "sign",
                        { section: "modal-training", prompt: "Training" }
                    ],
                    "W": () => [
                        text("🏆", { size: 32 }),
                        area(),
                        body({ isStatic: true }),
                        "sign",
                        { section: "modal-awards", prompt: "Awards" }
                    ],
                    "V": () => [
                        text("🤝", { size: 32 }),
                        area(),
                        body({ isStatic: true }),
                        "sign",
                        { section: "modal-volunteer", prompt: "Volunteer" }
                    ]
                }
            };

            const map = [
                "=======================",
                "=                     =",
                "=    A           E    =",
                "=                     =",
                "=                     =",
                "=                     =",
                "=    S           X    =",
                "=                     =",
                "=                     =",
                "=                     =",
                "=    T           W    =",
                "=                     =",
                "=                     =",
                "=          V          =",
                "=                     =",
                "======================="
            ];

            const level = addLevel(map, levelConfig);

            // Add player (the bean)
            const player = add([
                sprite("bean"),
                pos(48 * 11, 48 * 7),
                area(),
                body(),
                "player"
            ]);

            const SPEED = 250;

            // Player movement
            onKeyDown("left", () => {
                if (!isGamePaused) player.move(-SPEED, 0);
            });
            onKeyDown("right", () => {
                if (!isGamePaused) player.move(SPEED, 0);
            });
            onKeyDown("up", () => {
                if (!isGamePaused) player.move(0, -SPEED);
            });
            onKeyDown("down", () => {
                if (!isGamePaused) player.move(0, SPEED);
            });
            onKeyDown("a", () => {
                if (!isGamePaused) player.move(-SPEED, 0);
            });
            onKeyDown("d", () => {
                if (!isGamePaused) player.move(SPEED, 0);
            });
            onKeyDown("w", () => {
                if (!isGamePaused) player.move(0, -SPEED);
            });
            onKeyDown("s", () => {
                if (!isGamePaused) player.move(0, SPEED);
            });

            // Camera follows player
            player.onUpdate(() => {
                camPos(player.pos);
            });

            // Interaction hint text (fixed to screen)
            const interactText = add([
                text("Press SPACE to interact", { size: 24 }),
                pos(width() / 2, height() - 50),
                anchor("center"),
                color(255, 255, 255),
                opacity(0),
                fixed()
            ]);

            let activeSign = null;

            player.onCollide("sign", (s) => {
                activeSign = s;
                interactText.text = `[ SPACE ] ${s.prompt}`;
                interactText.opacity = 1;
            });

            player.onCollideEnd("sign", (s) => {
                if (activeSign === s) {
                    activeSign = null;
                    interactText.opacity = 0;
                }
            });

            onKeyPress("space", () => {
                if (activeSign && !isGamePaused) {
                    openModal(activeSign.section);
                }
            });
            onKeyPress("enter", () => {
                if (activeSign && !isGamePaused) {
                    openModal(activeSign.section);
                }
            });
        });

        go("main");
    }

});
