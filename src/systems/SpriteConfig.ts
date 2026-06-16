export interface AnimationConfig {
  name: string;
  frames: number[];
  speed: number;
}

export interface SpriteConfig {
  imagePath: string;
  frameWidth: number;
  frameHeight: number;
  animations: AnimationConfig[];
}

// Maki sprite configuration template
export const MAKI_SPRITE_CONFIG: SpriteConfig = {
  imagePath: '/assets/maki_spritesheet.png',
  frameWidth: 160,
  frameHeight: 192,
  animations: [
    { name: 'idle', frames: [0], speed: 0 },
    { name: 'walk', frames: [1, 2, 3, 4], speed: 0.2 },
    { name: 'attack', frames: [5, 6, 7], speed: 0.1 },
    { name: 'jump', frames: [8], speed: 0 },
    { name: 'hurt', frames: [11], speed: 0.3 }
  ]
};

// Enemy sprite configurations
export const GRUNT_SPRITE_CONFIG: SpriteConfig = {
  imagePath: '/assets/grunt_spritesheet.png',
  frameWidth: 160,
  frameHeight: 192,
  animations: [
    { name: 'idle', frames: [0], speed: 0 },
    { name: 'walk', frames: [1, 2], speed: 0.3 },
    { name: 'attack', frames: [3, 4], speed: 0.2 }
  ]
};

export const TOUGH_SPRITE_CONFIG: SpriteConfig = {
  imagePath: '/assets/tough_spritesheet.png',
  frameWidth: 160,
  frameHeight: 192,
  animations: [
    { name: 'idle', frames: [0], speed: 0 },
    { name: 'walk', frames: [1, 2], speed: 0.25 },
    { name: 'attack', frames: [3, 4, 5], speed: 0.15 }
  ]
};

export const BOSS_SPRITE_CONFIG: SpriteConfig = {
  imagePath: '/assets/boss_spritesheet.png',
  frameWidth: 160,
  frameHeight: 192,
  animations: [
    { name: 'idle', frames: [0], speed: 0 },
    { name: 'walk', frames: [1, 2], speed: 0.4 },
    { name: 'attack', frames: [3, 4, 5, 6], speed: 0.2 }
  ]
};
