# Attack Feel Tuning + HUD Cleanup Design

## Goal
Improve player attack feel (hitbox accuracy, hitstop intensity, knockback, camera shake) and clean up HUD (HP bar, debug info, restart).

## Approach
- **Attack feel**: Differentiate hit reactions by attack type (punch vs kick). Add hitstop tiers, camera shake, and knockback direction from player to enemies.
- **HUD**: Replace text-only HP with a Canvas bar. Consolidate debug info. Add `R` key restart without page reload.

## Changes by file
1. `Player.ts` — expose attack kind, add hitstop/shake callback support
2. `SpawnSystem.ts` — pass knockback direction, hitstop/shake params from player
3. `Enemy.ts` / `ChainEnemy.ts` — accept knockback direction in `takeDamage`
4. `Game.ts` — add `restart()` method
5. `HitboxConfig.ts` — adjust maki punch/kick hitbox values
6. `main.ts` — hook up restart key, render HP bar, clean HUD text
