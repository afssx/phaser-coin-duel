// SplashScene (preloads via generated textures) and SetupScene (player names)

import Phaser from 'phaser';
import { GAME_W, GAME_H, gameState } from '../main.js';

class SplashScene extends Phaser.Scene {
  constructor() { super('SplashScene'); }

  preload() {
    this.generatePlaceholders();
    this.load.audio('bgm', '/assets/audio/music-game.mp3'); // carga del MP3
    this.load.image('p1_png', '/assets/img/p1.webp');
    this.load.image('p2_png', '/assets/img/p2.webp');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0f0f23');
    // crea el sonido (loop + volumen) pero NO lo reproduce aún
    let bgm = this.sound.get('bgm');
    if (!bgm) {
      bgm = this.sound.add('bgm', { loop: true, volume: 0.35 });
    }

    const startBGM = () => { if (!bgm.isPlaying) bgm.play(); };

    this.input.once('pointerdown', startBGM);
    this.input.keyboard.once('keydown', startBGM);
    this.sound.once('unlocked', startBGM);

    // Fake gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e);
    bg.fillRect(0, 0, GAME_W, GAME_H);

    const logo = this.add.text(GAME_W / 2, 60, 'DUELO DE\nFORTUNAS', {
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#ffd166',
      align: 'center',
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
    }).setOrigin(0.5);

    this.add.text(GAME_W / 2, 140, 'Un juego de estrategia y suerte', {
      fontSize: '18px',
      color: '#aaa',
      align: 'center'
    }).setOrigin(0.5);

    // Decorative coins
    for (let i = 0; i < 5; i++) {
      const x = 100 + i * 150;
      const y = 100 + Math.sin(i) * 50;
      const coin = this.add.sprite(x, y, 'coin_cara').setScale(0.6).setAlpha(0.3);
      this.tweens.add({
        targets: coin,
        rotation: Math.PI * 2,
        duration: 2000 + i * 500,
        repeat: -1,
        ease: 'linear'
      });
    }

    const continueBtn = this.makeButton(GAME_W / 2 - 90, GAME_H - 120, 'COMENZAR', () => {
      this.scene.start('SetupScene');
    });

    // === Panel con reglas encima del botón "COMENZAR" ===
    const pw = GAME_W - 80;             // ancho del panel
    const ph = 300;                      // alto del panel (ajústalo si el texto queda largo)
    const px = 40;                       // margen izquierdo
    const py = GAME_H - 120 - ph - 16;   // justo sobre el botón con 16px de margen

    const rulesContainer = this.add.container(px, py);

    const rulesBg = this.add.graphics();
    rulesBg.fillStyle(0x000000, 0.35)
      .fillRoundedRect(0, 0, pw, ph, 12)
      .lineStyle(1, 0xffffff, 0.18)
      .strokeRoundedRect(0, 0, pw, ph, 12);

    const rulesText = `Solo hace daño el que eligió Cara.

Se parte de 3 de daño y se aplican bonos por racha de Caras del atacante:
• 2 Caras seguidas: +1 (pasa a 4)
• 3 Caras seguidas: Crítico x2 (lo que tengas hasta ahí se duplica)
• 4+ Caras: Penetra (ignora defensa activa y armadura)

Luego se aplican las defensas del que eligió Sello:
• Defensa activa (por haber elegido Sello este turno): daño ×0.5 (redondea hacia abajo) si el atacante no penetra.
• Armadura (si el defensor venía con ≥2 Sellos seguidos y este turno también eligió Sello): −1 daño si el atacante no penetra.
• Escudo mágico (si el defensor alcanzó ≥3 Sellos seguidos en algún turno anterior y aún no lo consumió): bloquea todo el daño y se consume.
• Inmune (si el defensor llega a 4 Sellos seguidos este mismo turno): 0 daño (la inmunidad es solo ese turno).

- Por Catalina Amortegui - Andres Sabogal
`;

    const rules = this.add.text(12, 12, rulesText, {
      fontSize: '12px',
      color: '#ddd',
      lineSpacing: 4,
      wordWrap: { width: pw - 24 }
    });

    rulesContainer.add([rulesBg, rules]);

    logo.setScale(0);
    this.tweens.add({ targets: logo, scale: 1, duration: 800, ease: 'Back.easeOut' });

    this.add.text(GAME_W / 2, GAME_H - 60, 'Presiona ESPACIO o haz clic para continuar', {
      fontSize: '14px',
      color: '#666'
    }).setOrigin(0.5);

    this.input.keyboard.once('keydown-SPACE', () => this.scene.start('SetupScene'));
  }

  // Creates all placeholder textures using Graphics.generateTexture
  generatePlaceholders() {
    const mk = this.make.graphics({ x: 0, y: 0, add: false });

    // Characters
    const char = (key, color) => {
      mk.clear();
      mk.fillStyle(color, 1);
      mk.fillRoundedRect(0, 0, 128, 128, 18);
      mk.lineStyle(3, 0x000000, 0.25);
      mk.strokeRoundedRect(0, 0, 128, 128, 18);
      mk.fillStyle(0xffffff, 1);
      mk.fillCircle(40, 40, 8);
      mk.fillCircle(88, 40, 8);
      mk.fillStyle(0x000000, 1);
      mk.fillCircle(40, 40, 4);
      mk.fillCircle(88, 40, 4);
      mk.generateTexture(key, 128, 128);
    };
    char('char_p1', 0x4aa3df);
    char('char_p2', 0xdf9a4a);

    // FX
    mk.clear(); mk.fillStyle(0x6cf0cf, 0.2); mk.fillCircle(45, 45, 45); mk.lineStyle(2, 0x6cf0cf); mk.strokeCircle(45, 45, 45); mk.generateTexture('fx_shield', 90, 90);
    mk.clear(); mk.fillStyle(0xffffff, 1); mk.fillCircle(32, 32, 6); mk.fillCircle(20, 40, 4); mk.fillCircle(44, 20, 5); mk.generateTexture('fx_hit', 64, 64);
    mk.clear(); mk.fillStyle(0xffff99, 1); mk.fillCircle(32, 32, 10); mk.generateTexture('fx_crit', 64, 64);
    mk.clear(); mk.fillStyle(0xff55aa, 0.35); mk.fillCircle(48, 48, 46); mk.lineStyle(2, 0xff55aa, 1); mk.strokeCircle(48, 48, 46); mk.generateTexture('fx_burst', 96, 96);

    // Spinning coin frames
    for (let i = 0; i < 8; i++) {
      mk.clear();
      mk.fillStyle(0xf1c40f, 1);
      const w = 100 - i * 8;
      const x = (128 - w) / 2;
      mk.fillRoundedRect(x, 14, w, 100, 10);
      mk.lineStyle(2, 0x7f6a0a, 1); mk.strokeRoundedRect(x, 14, w, 100, 10);
      mk.generateTexture(`coin_spin_${i}`, 128, 128);
    }

    // Coin face
    mk.clear(); mk.fillStyle(0xf1c40f, 1); mk.fillCircle(64, 64, 50); mk.lineStyle(4, 0x7f6a0a, 1); mk.strokeCircle(64, 64, 50);
    mk.lineStyle(6, 0xffffff, 1); mk.beginPath(); mk.moveTo(40, 64); mk.lineTo(88, 64); mk.strokePath();
    mk.generateTexture('coin_cara', 128, 128);

    // Coin cross
    mk.clear(); mk.fillStyle(0xf1c40f, 1); mk.fillCircle(64, 64, 50); mk.lineStyle(4, 0x7f6a0a, 1); mk.strokeCircle(64, 64, 50);
    mk.lineStyle(6, 0xffffff, 1); mk.beginPath(); mk.moveTo(44, 44); mk.lineTo(84, 84); mk.moveTo(84, 44); mk.lineTo(44, 84); mk.strokePath();
    mk.generateTexture('coin_cruz', 128, 128);

    // UI button
    mk.clear(); mk.fillStyle(0x333333, 1); mk.fillRoundedRect(0, 0, 180, 44, 6); mk.lineStyle(1, 0xffffff, 0.25); mk.strokeRoundedRect(0, 0, 180, 44, 6); mk.generateTexture('ui_button', 180, 44);
  }

  makeButton(x, y, label, onClick) {
    const container = this.add.container(x, y);
    const rect = this.add.image(0, 0, 'ui_button').setOrigin(0, 0);
    const text = this.add.text(90, 22, label, { fontSize: '14px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    container.add([rect, text]);
    rect.setInteractive({ useHandCursor: true })
      .on('pointerover', () => rect.setTint(0x4d4d4d))
      .on('pointerout', () => rect.clearTint())
      .on('pointerdown', () => { if (onClick) onClick(); });
    return container;
  }
}

class SetupScene extends Phaser.Scene {
  constructor() { super('SetupScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    this.add.text(GAME_W / 2, 80, 'Jugadores', {
      fontSize: '32px', fontStyle: 'bold', color: '#ffd166'
    }).setOrigin(0.5);

    this.createPlayerInputs();

    this.add.sprite(200, 300, 'p1_png').setScale(0.8);
    this.add.sprite(600, 300, 'p2_png').setScale(0.8);

    this.add.text(200, 400, 'Jugador 1', { fontSize: '18px', color: '#4aa3df', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(600, 400, 'Jugador 2', { fontSize: '18px', color: '#df9a4a', fontStyle: 'bold' }).setOrigin(0.5);

    this.makeButton(GAME_W / 2 - 90, 480, 'COMENZAR BATALLA', () => {
      this.collectNames();
      this.scene.start('GameScene');
    });

    this.add.text(GAME_W / 2, 540, 'Controles: Jugador 1 [Q=Cara, A=Cruz] | Jugador 2 [P=Cara, L=Cruz]', {
      fontSize: '12px', color: '#aaa'
    }).setOrigin(0.5);
  }

  createPlayerInputs() {
    this.player1Input = this.createInputField(200, 450, gameState.player1Name);
    this.player2Input = this.createInputField(600, 450, gameState.player2Name);
  }

  createInputField(x, y, defaultText) {
    const inputBg = this.add.rectangle(x, y, 200, 30, 0x2a2a2a).setStrokeStyle(2, 0x4a4a4a);
    const inputText = this.add.text(x, y, defaultText, { fontSize: '14px', color: '#fff' }).setOrigin(0.5);

    inputBg.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      const newName = prompt('Nombre del jugador:', defaultText);
      if (newName && newName.trim()) inputText.setText(newName.trim());
    });

    return { text: inputText, bg: inputBg };
  }

  collectNames() {
    gameState.player1Name = this.player1Input.text.text;
    gameState.player2Name = this.player2Input.text.text;
  }

  makeButton(x, y, label, onClick) {
    const container = this.add.container(x, y);
    const rect = this.add.image(0, 0, 'ui_button').setOrigin(0, 0);
    const text = this.add.text(90, 22, label, { fontSize: '14px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    container.add([rect, text]);
    rect.setInteractive({ useHandCursor: true })
      .on('pointerover', () => rect.setTint(0x4d4d4d))
      .on('pointerout', () => rect.clearTint())
      .on('pointerdown', () => { if (onClick) onClick(); });
    return container;
  }
}

export { SplashScene, SetupScene };
