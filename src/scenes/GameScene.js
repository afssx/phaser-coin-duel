// GameScene.js
// Core battle loop, HUD, buttons below characters, coin flip animation.

import Phaser from 'phaser';
import { GAME_W, GAME_H, INITIAL_HP, gameState, clampInt, makePlayer } from '../main.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.harmonyEnergy = 0;
        this.round = 1;
        this.turnActive = false;
        this.turnTimer = null;
        this.timeLeft = 3;
        this.revealing = false;
    }

    create() {
        this.logLines = [];

        this.cameras.main.setBackgroundColor('#181818');

        const g = this.add.graphics();
        g.fillStyle(0x242424, 1).fillRoundedRect(16, 16, GAME_W - 32, GAME_H - 32, 16);

        // Floor guide
        // g.lineStyle(2, 0x3a3a3a, 1).beginPath();
        // g.moveTo(32, GAME_H - 200);
        // g.lineTo(GAME_W - 32, GAME_H - 200);
        // g.strokePath();

        // Players with custom names
        this.p1 = makePlayer(gameState.player1Name);
        this.p2 = makePlayer(gameState.player2Name);

        const cx = GAME_W / 2;
        const top = 24;
        const pad = 10;

        // Top UI
        this.titleText = this.add.text(cx, top, 'Duelo de Fortunas', {
            fontSize: '28px', fontStyle: 'bold', color: '#ffd166',
            shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, fill: true }
        }).setOrigin(0.5, 0);

        this.roundText = this.add.text(cx, top + 32 + pad, 'Ronda 1', { fontSize: '18px', color: '#eee' }).setOrigin(0.5, 0);
        this.harmonyText = this.add.text(cx, top + 60 + pad, 'Energía de Armonía: 0/3', { fontSize: '16px', color: '#aaa' }).setOrigin(0.5, 0);

        // Player panels (top-left / top-right)
        this.makePlayerPanel(this.p1, 64, 120, 'left');
        this.makePlayerPanel(this.p2, GAME_W - 64, 120, 'right');

        // Characters + coins
        this.spawnCharactersAndCoins();

        // Timer + status
        this.timerText = this.add.text(cx, GAME_H - 164, 'Tiempo: 3', { fontSize: '24px', color: '#fff' }).setOrigin(0.5);
        this.statusText = this.add.text(cx, GAME_H - 134, 'Elige: Cara o Cruz', { fontSize: '20px', color: '#ffd166' }).setOrigin(0.5);

        // Battle log (UI)
        // this.logBox = this.add.rectangle(cx, GAME_H - 66, GAME_W - 64, 90, 0x000000, 0.25).setStrokeStyle(1, 0xffffff, 0.15);
        // this.logLines = [];
        // this.logText = this.add.text(40, GAME_H - 106, '', { fontSize: '14px', color: '#cfcfcf', wordWrap: { width: GAME_W - 120 } });

        // Keyboard controls
        this.input.keyboard.on('keydown-Q', () => this.selectFor(this.p1, 'cara'));
        this.input.keyboard.on('keydown-A', () => this.selectFor(this.p1, 'cruz'));
        this.input.keyboard.on('keydown-P', () => this.selectFor(this.p2, 'cara'));
        this.input.keyboard.on('keydown-L', () => this.selectFor(this.p2, 'cruz'));

        // Utility buttons
        this.makeButton(GAME_W - 204, 50, 'Reiniciar', () => this.resetGame());
        this.makeButton(100, 50, 'Menú', () => this.scene.start('SplashScene'));

        this.startTurn();
    }

    createHPBar(x, y, w = 220, h = 12) {
        const back = this.add.rectangle(x, y, w, h, 0x3a3a3a, 1).setOrigin(0, 0.5);
        const fill = this.add.rectangle(x, y, w, h, 0xff6b6b, 1).setOrigin(0, 0.5);
        return {
            back, fill, maxW: w,
            set: (value, max) => {
                const pct = Phaser.Math.Clamp(value / max, 0, 1);
                fill.width = Math.max(0.0001, w * pct);
                if (pct > 0.6) fill.setFillStyle(0x4dd4ac);
                else if (pct > 0.3) fill.setFillStyle(0xffd166);
                else fill.setFillStyle(0xff6b6b);
            }
        };
    }

    spawnCharactersAndCoins() {
        const groundY = GAME_H - 20;
        const leftX = 140;
        const rightX = GAME_W - 140;

        // P1
        const p1C = this.add.container(leftX, groundY);
        const p1Sprite = this.add.sprite(0, 0, 'p1_png').setOrigin(0.5, 1); // ⬅️ antes: 'char_p1'
        // p1Sprite.setScale(0.9); // opcional si tu PNG es grande
        p1C.add(p1Sprite);
        this.tweens.add({ targets: p1C, y: groundY - 4, duration: 1200, yoyo: true, repeat: -1, ease: 'sine.inOut' });
        this.p1.charContainer = p1C;
        this.p1.hpBar = this.createHPBar(leftX - 110, groundY);
        this.p1.hpBar.set(this.p1.hp, INITIAL_HP);
        this.p1.coinSprite = this.add.sprite(leftX, groundY - 180, 'coin_cara').setVisible(false).setScale(0.6);

        // P2
        const p2C = this.add.container(rightX, groundY);
        const p2Sprite = this.add.sprite(0, 0, 'p2_png').setOrigin(0.5, 1); // ⬅️ antes: 'char_p2'
        p2Sprite.setScale(0.9); // opcional
        p2C.add(p2Sprite);
        this.tweens.add({ targets: p2C, y: groundY - 4, duration: 1200, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 200 });
        this.p2.charContainer = p2C;
        this.p2.hpBar = this.createHPBar(rightX - 110, groundY);
        this.p2.hpBar.set(this.p2.hp, INITIAL_HP);
        this.p2.coinSprite = this.add.sprite(rightX, groundY - 180, 'coin_cara').setVisible(false).setScale(0.6);

        // Names above HP bars
        // this.add.text(leftX, groundY - 200, this.p1.name, { fontSize: '14px', color: '#4aa3df', fontStyle: 'bold' }).setOrigin(0.5);
        // this.add.text(rightX, groundY - 200, this.p2.name, { fontSize: '14px', color: '#df9a4a', fontStyle: 'bold' }).setOrigin(0.5);
    }


    makePlayerPanel(player, x, y, align) {
        const isLeft = align === 'left';
        const panelW = 320;
        const panelH = 180;
        const ox = isLeft ? x : x - panelW;

        const rect = this.add
            .rectangle(ox, y, panelW, panelH, 0x000000, 0.4)
            .setOrigin(0, 0)
            .setStrokeStyle(2, isLeft ? 0x4aa3df : 0xdf9a4a, 0.8);

        player.nameText = this.add.text(ox + 12, y + 8, player.name, { fontSize: '18px', color: '#fff', fontStyle: 'bold' });
        player.hpText = this.add.text(ox + 12, y + 36, `Vida: ${player.hp}`, { fontSize: '16px', color: '#ff6b6b' });
        player.energyText = this.add.text(ox + 12, y + 58, `Energía Defensa: ${player.defenseEnergy}`, { fontSize: '14px', color: '#4dd4ac' });
        player.streakText = this.add.text(ox + 12, y + 78, 'Racha: –', { fontSize: '14px', color: '#eee' });
        player.flagsText = this.add.text(ox + 12, y + 98, 'Estados: –', { fontSize: '12px', color: '#aaa' });
        this.add.text(ox + 12, y + 120, 'Últimas jugadas:', { fontSize: '12px', color: '#bbb' });
        player.historyText = this.add.text(ox + 12, y + 138, '–', { fontSize: '12px', color: '#ddd' });

        const by = y + panelH + 10;
        const bx1 = isLeft ? ox + 12 : ox + panelW - 12 - 120;
        const bx2 = isLeft ? ox + 12 + 130 : ox + panelW - 12 - (120 + 130);
        player.btnCara = this.makeButton(bx1, by, isLeft ? 'Cara (Q)' : 'Cara (P)', () => this.selectFor(player, 'cara'));
        player.btnCruz = this.makeButton(bx2, by, isLeft ? 'Cruz (A)' : 'Cruz (L)', () => this.selectFor(player, 'cruz'));
    }

    makeButton(x, y, label, onClick, width = 110, height = 44) {
        const container = this.add.container(x, y);

        // Imagen base
        const rect = this.add.image(0, 0, 'ui_button').setOrigin(0, 0);
        rect.setDisplaySize(width, height); // escala visual al nuevo tamaño

        // ⚠️ Ajusta explícitamente el área interactiva al nuevo tamaño
        rect.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, width, height),
            Phaser.Geom.Rectangle.Contains
        );

        // Texto centrado en el botón
        const text = this.add
            .text(width / 2, height / 2, label, { fontSize: '13px', color: '#fff' })
            .setOrigin(0.5);

        container.add([rect, text]);

        rect
            .on('pointerover', () => rect.setTint(0x4d4d4d))
            .on('pointerout', () => rect.clearTint())
            .on('pointerdown', () => { if (onClick) onClick(); });

        return container;
    }

    log(msg) {
        this.logLines.push(msg);
        if (this.logLines.length > 5) this.logLines.shift();
        console.log(`[Duelo] ${msg}`);

        // this.logText.setText(this.logLines.map((l, i) => `${i + 1}. ${l}`).join('\n'));
    }

    resetSelections() {
        this.p1.lastSelection = null;
        this.p2.lastSelection = null;
        this.p1.coinSprite.setVisible(false);
        this.p2.coinSprite.setVisible(false);
    }

    startTurn() {
        this.turnActive = true;
        this.revealing = false;

        this.countdownStarted = false;
        if (this.turnTimer) {
            this.time.removeEvent(this.turnTimer);
            this.turnTimer = null;
        }

        this.resetSelections();
        this.timeLeft = 3;
        this.updateTimerText();
        this.statusText.setText('Elige: Cara o Cruz');
        this.roundText.setText(`Ronda ${this.round}`);
    }

    startCountdown() {
        if (this.countdownStarted) return;

        // seguridad: limpia timers previos
        if (this.turnTimer) {
            this.time.removeEvent(this.turnTimer);
            this.turnTimer = null;
        }

        this.timeLeft = 3;
        this.updateTimerText();

        this.turnTimer = this.time.addEvent({
            delay: 1000,
            repeat: 2,                  // 3, 2, 1  (se ejecuta 3 veces contando el 0 con el callback final)
            callback: () => {
                this.timeLeft--;
                this.updateTimerText();
                if (this.timeLeft <= 0) {
                    // pequeño margen antes de resolver
                    this.time.delayedCall(100, () => this.finalizeSelections());
                }
            },
            callbackScope: this
        });

        this.countdownStarted = true;
    }


    updateTimerText() {
        this.timerText.setText(`Tiempo: ${this.timeLeft}`);
        this.timerText.setColor(this.timeLeft <= 1 ? '#ff6b6b' : '#fff');
    }

    selectFor(player, choice) {
        if (!this.turnActive || this.revealing) return;

        if (!player.lastSelection) {
            player.lastSelection = choice;
            this.statusText.setText(`${player.name} eligió.`);
            const btn = choice === 'cara' ? player.btnCara : player.btnCruz;
            this.tweens.add({ targets: btn, scale: { from: 1, to: 1.1 }, duration: 100, yoyo: true });

            if (!this.countdownStarted) this.startCountdown();

        }
        if (this.p1.lastSelection && this.p2.lastSelection) this.finalizeSelections();
    }

    finalizeSelections() {
        if (!this.p1.lastSelection) this.p1.lastSelection = Math.random() < 0.5 ? 'cara' : 'cruz';
        if (!this.p2.lastSelection) this.p2.lastSelection = Math.random() < 0.5 ? 'cara' : 'cruz';

        // limpia el countdown si estaba activo
        if (this.turnTimer) {
            this.time.removeEvent(this.turnTimer);
            this.turnTimer = null;
        }
        this.countdownStarted = false;

        this.turnActive = false;
        this.revealAndResolve();
    }

    playCoin(sprite, result) {
        sprite.setVisible(true).setScale(0.6);
        const frames = Array.from({ length: 8 }, (_, i) => `coin_spin_${i}`);
        let idx = 0;

        this.tweens.add({ targets: sprite, y: sprite.y - 30, duration: 300, ease: 'Quad.easeOut', yoyo: true });

        const spin = this.time.addEvent({
            delay: 60, repeat: 12, callback: () => {
                sprite.setTexture(frames[idx % frames.length]);
                idx++;
                if (idx > 12) {
                    sprite.setTexture(result === 'cara' ? 'coin_cara' : 'coin_cruz');
                    spin.remove();
                }
            }
        });
    }

    revealAndResolve() {
        this.revealing = true;
        this.statusText.setText('¡Revelando resultados!');

        this.playCoin(this.p1.coinSprite, this.p1.lastSelection);
        this.playCoin(this.p2.coinSprite, this.p2.lastSelection);

        this.time.delayedCall(800, () => this.applyTurn());
    }

    updateStreak(player, choice) {
        if (player.streak.type === choice) player.streak.count += 1;
        else { player.streak.type = choice; player.streak.count = 1; }
    }

    describeStreak(player) {
        if (!player.streak.type) return '–';
        const side = player.streak.type === 'cara' ? 'Cara' : 'Cruz';
        return `${side} x${player.streak.count}`;
    }

    applyDefenseStreakStates(player) {
        if (player.streak.type === 'cruz') {
            if (player.streak.count >= 4) player.immuneThisTurn = true;
            if (player.streak.count >= 3) player.magicShield = true;
        }
    }

    computeDamage(attacker, defender, attackerChoice, defenderChoice, combinedReady) {
        if (attackerChoice !== 'cara') return 0;

        let dmg = attacker.baseAtk;
        const notes = [];

        if (attacker.streak.type === 'cara') {
            if (attacker.streak.count >= 2) { dmg += 1; notes.push('+1 daño por 2 caras'); }
            if (attacker.streak.count >= 3) { dmg *= 2; notes.push('Crítico x2 por 3 caras'); }
        }

        if (combinedReady) { dmg = Math.round(dmg * 1.5) + 2; notes.push('Ataque Combinado'); }

        const defenderHasArmor = (defender.streak.type === 'cruz' && defender.streak.count >= 2);
        const attackerPenetrates = (attacker.streak.type === 'cara' && attacker.streak.count >= 4);

        if (defenderChoice === 'cruz' && !attackerPenetrates) { dmg = Math.floor(dmg * 0.5); notes.push('Defensa activa (50%)'); }
        if (defenderHasArmor && !attackerPenetrates) { dmg = Math.max(0, dmg - 1); notes.push('Armadura (-1)'); }
        if (attackerPenetrates) notes.push('Furia del Destino (penetra)');

        if (defender.immuneThisTurn) { notes.push('Inmune (daño 0)'); dmg = 0; }
        else if (defender.magicShield && dmg > 0) { notes.push('Escudo mágico bloquea'); dmg = 0; defender.magicShield = false; }

        if (combinedReady) {
            attacker.defenseEnergy = Math.max(0, attacker.defenseEnergy - 3);
            defender.defenseEnergy = Math.max(0, defender.defenseEnergy - 3);
        }

        const facing = `${attacker.name} → ${defender.name}`;
        this.log(`${facing}: ${notes.length ? notes.join(', ') : 'ataque base'} | ${dmg} daño`);

        return clampInt(dmg);
    }

    consumePostDamageFlags(player) { player.immuneThisTurn = false; }

    pushHistory(player, choice) {
        player.history.unshift(choice);
        if (player.history.length > 4) player.history.pop();
    }

    applyTurn() {
        const p1c = this.p1.lastSelection;
        const p2c = this.p2.lastSelection;

        this.updateStreak(this.p1, p1c);
        this.updateStreak(this.p2, p2c);

        this.applyDefenseStreakStates(this.p1);
        this.applyDefenseStreakStates(this.p2);

        if (p1c === 'cruz' && p2c === 'cruz') {
            this.p1.defenseEnergy += 1;
            this.p2.defenseEnergy += 1;
            this.harmonyEnergy += 1;
            this.log('Defensa sincronizada: +1 energía para ambos');
        }

        const combinedReady = (this.p1.defenseEnergy >= 3 && this.p2.defenseEnergy >= 3 && p1c === 'cara' && p2c === 'cara');

        const p1Deals = this.computeDamage(this.p1, this.p2, p1c, p2c, combinedReady);
        const p2Deals = this.computeDamage(this.p2, this.p1, p2c, p1c, combinedReady);

        this.animateCombat(p1c, p2c, p1Deals, p2Deals, combinedReady);

        this.p2.hp = clampInt(this.p2.hp - p1Deals);
        this.p1.hp = clampInt(this.p1.hp - p2Deals);

        this.consumePostDamageFlags(this.p1);
        this.consumePostDamageFlags(this.p2);

        this.pushHistory(this.p1, p1c);
        this.pushHistory(this.p2, p2c);

        this.refreshUI();

        if (this.p1.hp <= 0 && this.p2.hp <= 0) return this.showVictoryDialog('¡EMPATE!', 'Ambos guerreros cayeron con honor');
        if (this.p1.hp <= 0) return this.showVictoryDialog('¡VICTORIA!', `${this.p2.name} es el campeón`);
        if (this.p2.hp <= 0) return this.showVictoryDialog('¡VICTORIA!', `${this.p1.name} es el campeón`);

        this.round += 1;
        this.harmonyText.setText(`Energía de Armonía: ${this.harmonyEnergy}/3`);
        this.revealing = false;

        this.time.delayedCall(900, () => this.startTurn());
    }

    animateCombat(p1c, p2c, p1Deals, p2Deals, combinedReady) {
        const lunge = (container, dir) => {
            this.tweens.add({ targets: container, x: container.x + dir * 48, duration: 150, yoyo: true, ease: 'Back.easeOut' });
        };

        const showFX = (key, x, y) => {
            const s = this.add.sprite(x, y, key).setAlpha(0);
            this.tweens.add({
                targets: s, alpha: 1, scale: { from: 0.5, to: 1.2 }, duration: 200,
                onComplete: () => this.tweens.add({ targets: s, alpha: 0, duration: 200, onComplete: () => s.destroy() })
            });
        };

        const blockFX = (target) => {
            const s = this.add.sprite(target.x, target.y - 74, 'fx_shield').setAlpha(0);
            this.tweens.add({
                targets: s, alpha: { from: 0, to: 0.8 }, scale: { from: 0.8, to: 1.1 }, duration: 300, yoyo: true, onComplete: () => s.destroy()
            });
        };

        if (combinedReady) {
            showFX('fx_burst', GAME_W / 2, GAME_H - 250);
            this.cameras.main.flash(200, 255, 215, 102, false, 0.3);
        }

        if (p1c === 'cara') lunge(this.p1.charContainer, +1);
        if (p1c === 'cruz') blockFX(this.p1.charContainer);
        if (p2c === 'cara') lunge(this.p2.charContainer, -1);
        if (p2c === 'cruz') blockFX(this.p2.charContainer);

        if (p1Deals > 0) { showFX(p1Deals >= 6 ? 'fx_crit' : 'fx_hit', this.p2.charContainer.x, this.p2.charContainer.y - 90); this.cameras.main.shake(120, 0.003); }
        if (p2Deals > 0) { showFX(p2Deals >= 6 ? 'fx_crit' : 'fx_hit', this.p1.charContainer.x, this.p1.charContainer.y - 90); this.cameras.main.shake(120, 0.003); }
    }

    refreshUI() {
        for (const p of [this.p1, this.p2]) {
            p.hpText.setText(`Vida: ${p.hp}`);
            p.energyText.setText(`Energía Defensa: ${p.defenseEnergy}`);
            p.streakText.setText(`Racha: ${this.describeStreak(p)}`);

            const flags = [];
            if (p.magicShield) flags.push('Escudo');
            if (p.immuneThisTurn) flags.push('Inmune');
            p.flagsText.setText(`Estados: ${flags.length ? flags.join(', ') : '–'}`);

            const historyDisplay = p.history.length ? p.history.map(x => x === 'cara' ? 'C' : 'X').join(' ') : '–';
            p.historyText.setText(historyDisplay);

            p.hpBar.set(p.hp, INITIAL_HP);
        }
    }

    showVictoryDialog(title, message) {
        this.turnActive = false;
        this.revealing = false;

        const overlay = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.7);

        const dialogW = 400, dialogH = 250;
        const dialog = this.add.rectangle(GAME_W / 2, GAME_H / 2, dialogW, dialogH, 0x2a2a2a).setStrokeStyle(3, 0xffd166);

        const titleText = this.add.text(GAME_W / 2, GAME_H / 2 - 60, title, { fontSize: '32px', fontStyle: 'bold', color: '#ffd166' }).setOrigin(0.5);
        const msgText = this.add.text(GAME_W / 2, GAME_H / 2 - 10, message, { fontSize: '18px', color: '#fff', align: 'center' }).setOrigin(0.5);

        const stats = `Rondas jugadas: ${this.round}\n${this.p1.name}: ${this.p1.hp} HP restante\n${this.p2.name}: ${this.p2.hp} HP restante`;
        this.add.text(GAME_W / 2, GAME_H / 2 + 35, stats, { fontSize: '14px', color: '#aaa', align: 'center' }).setOrigin(0.5);

        const restartBtn = this.makeDialogButton(GAME_W / 2 - 80, GAME_H / 2 + 80, 'Reiniciar', () => {
            this.resetGame();
            overlay.destroy(); dialog.destroy(); titleText.destroy(); msgText.destroy();
            restartBtn.destroy(); menuBtn.destroy();
        });

        const menuBtn = this.makeDialogButton(GAME_W / 2 + 80, GAME_H / 2 + 80, 'Menú', () => this.scene.start('SplashScene'));

        dialog.setScale(0); titleText.setScale(0); msgText.setAlpha(0);
        this.tweens.add({ targets: dialog, scale: 1, duration: 400, ease: 'Back.easeOut' });
        this.tweens.add({ targets: titleText, scale: 1, duration: 400, delay: 200, ease: 'Back.easeOut' });
        this.tweens.add({ targets: msgText, alpha: 1, duration: 300, delay: 400 });

        // small celebratory FX
        this.time.addEvent({
            delay: 100, repeat: 10, callback: () => {
                const x = Phaser.Math.Between(50, GAME_W - 50);
                const y = Phaser.Math.Between(50, GAME_H - 50);
                const star = this.add.sprite(x, y, 'fx_hit').setScale(0.5).setAlpha(0.8);
                this.tweens.add({ targets: star, alpha: 0, scale: 0, duration: 1000, onComplete: () => star.destroy() });
            }
        });
    }

    makeDialogButton(x, y, label, onClick) {
        const container = this.add.container(x, y);
        const rect = this.add.rectangle(0, 0, 120, 35, 0x4a4a4a).setStrokeStyle(1, 0xffd166);
        const text = this.add.text(0, 0, label, { fontSize: '14px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        container.add([rect, text]);

        rect.setInteractive({ useHandCursor: true })
            .on('pointerover', () => { rect.setFillStyle(0x5a5a5a); text.setColor('#ffd166'); })
            .on('pointerout', () => { rect.setFillStyle(0x4a4a4a); text.setColor('#fff'); })
            .on('pointerdown', () => { if (onClick) onClick(); });

        return container;
    }

    resetGame() {
        // --- estado global de la escena
        this.harmonyEnergy = 0;
        this.round = 1;
        this.logLines = [];

        if (this.turnTimer) {
            this.time.removeEvent(this.turnTimer);
            this.turnTimer = null;
        }
        if (this.nextTurnCall) {              // si agregas el punto (b)
            this.nextTurnCall.remove(false);
            this.nextTurnCall = null;
        }

        this.countdownStarted = false;
        this.revealing = false;

        // --- helper: NO reemplaza el objeto; solo resetea campos mutables
        const resetPlayer = (p) => {
            p.hp = INITIAL_HP;
            p.defenseEnergy = 0;
            p.streak = { type: null, count: 0 };
            p.magicShield = false;
            p.immuneThisTurn = false;
            p.history = [];
            p.lastSelection = null;

            p.coinSprite?.setVisible(false);
            p.hpText?.setText(`Vida: ${p.hp}`);
            p.energyText?.setText(`Energía Defensa: ${p.defenseEnergy}`);
            p.streakText?.setText('Racha: –');
            p.flagsText?.setText('Estados: –');
            p.historyText?.setText('–');
            p.hpBar?.set(p.hp, INITIAL_HP);     // mantiene la barra existente

            p.btnCara?.list?.[0]?.clearTint?.();
            p.btnCruz?.list?.[0]?.clearTint?.();
        };

        resetPlayer(this.p1);
        resetPlayer(this.p2);

        this.harmonyText.setText('Energía de Armonía: 0/3');
        if (this.logText?.setText) this.logText.setText('');

        this.startTurn();
    }

}
