# Implementation Plan: Final Fight 2-Style Beat 'Em Up Game (Maki Only)

## Overview
Create a side-scrolling beat 'em up featuring Maki from Final Fight 2. Single attack button with auto-combo, emergency evasion with HP cost.

## Architecture Decisions

### Technology Stack
- **Chosen**: TypeScript + HTML5 Canvas (browser-based)
- **Build**: Vite
- **Resolution**: 640x480 (modern)

### Art Style - SPRITE-FIRST APPROACH
**Priority**: Get sprites BEFORE gameplay to avoid later blocking.

### Sprite Requirements (by Task)
- **Player**: Maki 6 frames (idle, walk, attack1/2/3, jump, evade, hurt)
- **Enemies**: 3 types × 5 frames each (grunts in Tokyo, Yakuza in Dojo, Boss in Tower)
- **Backgrounds**: 3 stages × 3 parallax layers each

### Core Architecture
- ECS pattern for game objects
- Input manager: WASD (P1) + arrows (P2)
- Animation system: sprite sheet based with frame timing

## Task List (Revised Order)

### Phase 0: Sprite Preparation (YOU)
- [ ] Task S1: Generate Maki sprites (6 frames, 48x64px side view)
- [ ] Task S2: Generate enemy sprites (3 types × 5 frames)
- [ ] Task S3: Generate background tiles (3 stages)

### Phase 1: Foundation
- [ ] Task 1: Set up TypeScript/Vite project, Canvas 640x480
- [ ] Task 2: Sprite loading and rendering system
- [ ] Task 3: Input system (2 players)

### Phase 2: Player (Maki)
- [ ] Task 4: Movement (walk, jump, double jump)
- [ ] Task 5: Attack (auto-combo, hits trigger next frame)
- [ ] Task 6: Evade (HP cost, invincibility frames)

### Phase 3: Enemies
- [ ] Task 7: Enemy AI (follow + attack on proximity)
- [ ] Task 8: 3 enemy types (Grunt/Tough/Boss)
- [ ] Task 9: Spawn system (waves by position)

### Phase 4: Game Systems
- [ ] Task 10: Health + HUD display
- [ ] Task 11: 3 parallax stages
- [ ] Task 12: Win/lose conditions

### Phase 5: Polish
- [ ] Task 13: Sound effects
- [ ] Task 14: Particle effects
- [ ] Task 15: Screen shake

## Critical Risks
- **Sprite consistency**: AI may produce inconsistent frames - will need manual adjustments
- **Frame alignment**: All sprites must align to same grid for clean animation
- **Time investment**: Sprite generation could take several sessions

## If Sprites Fail
- Use colored rectangles labeled "Maki", "Enemy1/2/3"
- Maintain same frame count for drop-in replacement
