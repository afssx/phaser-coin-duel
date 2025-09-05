// Bootstraps Phaser + shares constants and tiny helpers used by Scenes.
import './style.css';
import Phaser from 'phaser';
import { SplashScene, SetupScene } from './scenes/MenuScenes.js';
import GameScene from './scenes/GameScene.js';

export const GAME_W = 800;
export const GAME_H = 600;
export const INITIAL_HP = 20;
export const BASE_ATK = 3;

export const gameState = {
  player1Name: 'Jugador 1',
  player2Name: 'Jugador 2'
};

export const clampInt = (n) => Math.max(0, Math.floor(n));

export function makePlayer(name) {
  return {
    name,
    hp: INITIAL_HP,
    baseAtk: BASE_ATK,
    defenseEnergy: 0,
    streak: { type: null, count: 0 },
    magicShield: false,
    immuneThisTurn: false,
    history: [],
    lastSelection: null,
    coinSprite: null,
    charContainer: null,
    hpBar: null
  };
}

const config = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  parent: 'game',
  backgroundColor: '#121212',
  scene: [SplashScene, SetupScene, GameScene],
  scale: {
    mode: Phaser.Scale.FIT,         // keep aspect ratio; fit into parent
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 400, height: 300 },
    max: { width: 1200, height: 900 }
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  }
};

new Phaser.Game(config);
