# Final Fight 2 Prototype Roadmap

## Goal

Make the prototype feel good as a one-screen beat-em-up first, then expand it into a stage-based game.

The current focus is combat feel: player hit reactions, enemy participation, knockdown states, sprite consistency, and clear visual feedback.

## 1. Finish Damage and Down States

Tighten the full damage flow so it feels intentional.

Status: mostly implemented for the player.

- Done: normal hurt reaction with multiple variants
- Done: death reaction
- Done: down state
- Done: down-hit reaction when attacked on the ground
- Done: game over state
- Done: optional `POST-HIT` mode where enemies can keep attacking after game over
- Done: repeated post-game down hits can replay the death knockback
- Done: player shadow / grounding pass
- Remaining: final visual polish for down and down-hit sprites after the latest regenerated assets are judged in-game

Open questions:

- Should `POST-HIT` remain a debug-only mode or become an unlockable/setting later?
- Should down-hit have a short cooldown so repeated hits read more clearly?
- Should the player ever stand back up, or is down currently only for death?

## 2. Improve Enemy Attack Participation

Multiple enemies should feel like they are all involved in the fight, not waiting in a line.

- Keep the current approach/retreat/flank behavior
- Let enemies attack from front and back when in range
- Avoid enemies pushing each other unnaturally
- Make enemies reposition after attacking
- Keep attacks readable, not unfair

Target feel:

- With three enemies spawned, all three should try to participate.
- The player can get surrounded, but the screen should still read clearly.
- Enemies should not simply stand behind each other doing nothing.

## 3. Tune Player Attack Feel

Make landing attacks feel satisfying and reliable.

- Review player attack hitboxes against the fist position
- Tune active frames
- Tune hitstop duration
- Tune enemy knockback distance
- Add stronger hit feedback where needed
- Keep rapid attacks responsive without becoming visually messy

Success criteria:

- A punch visibly connects when the fist overlaps the enemy.
- Hitstop makes impact feel heavier without freezing too long.
- Enemy reaction makes the hit direction obvious.

## 4. Add Enemy Death and Down Presentation

Enemies need the same kind of finishing readability as the player.

- Enemy hurt animation
- Enemy death reaction
- Enemy down/grounded sprite
- Decide whether defeated enemies disappear or remain briefly on the ground
- Prevent defeated enemies from affecting collision and crowd movement
- Add enemy shadow tuning if grounded/down sprites are added

Recommended next implementation:

- Start with a Grunt down sprite.
- Reuse the same grounded-sprite drawing approach as the player.
- Then add cleanup timing after the down pose is visible.

## 5. Clarify HUD and Debug Information

Keep the game readable while still supporting development.

- Player HP display
- Enemy count display
- Game over message
- Restart shortcut
- Debug hitbox toggle display
- Spawn shortcut display
- `POST-HIT` toggle display

Potential shortcut set:

- `E`: spawn enemy
- `B`: toggle hitboxes
- `G`: toggle post-game hits
- `R`: restart

## 6. Improve Defeat and Damage Presentation

Raise the quality of the damage/defeat-focused experience while keeping it implemented as clear game systems.

- Route hurt animations by hit type instead of only cycling frames
- Add strong-hit reactions separate from light-hit reactions
- Tune down-hit timing, hitstop, and recovery so repeated hits read clearly
- Keep `POST-HIT` as an explicit optional mode
- Add a small damage/defeat test mode for checking reactions quickly
- Add camera shake tiers for strong hit, down-hit, and death replay
- Add sound hooks for light hurt, strong hurt, down-hit, and game over
- Keep presentation options controllable so intense defeat follow-up can be toggled

Recommended next implementation:

- Add a `DamageType` or `HitReactionType` enum.
- Let enemy attacks choose a reaction type.
- Map each reaction type to a specific player hurt/down animation.

## 7. Build Stage Progression

After one-screen combat feels good, move toward a simple Final Fight style stage loop.

- Camera scroll
- Player movement boundaries
- Enemy wave triggers
- Stop scrolling during combat
- Resume scrolling after enemies are defeated
- End-of-stage condition

First milestone:

- One short street segment
- Two enemy waves
- Simple clear message at the end

## 8. Organize Sprite Assets and Generation Flow

Generated sprites are starting to accumulate, so the asset pipeline should become explicit.

Status: partially implemented.

- Done: keep source/generated images under `assets/`
- Done: keep runtime game assets under `public/assets/`
- Done: keep prompt blocks in `SPRITE_PROMPTS.md`
- Done: added `tools/normalize_maki_sprite.py` for Maki sprite normalization
- Remaining: document which source image produced each runtime asset
- Remaining: add conversion examples near each prompt or in a small asset notes file

Recommended convention:

- `assets/maki/`: source and generated Maki images
- `assets/enemies/grunt/`: source and generated Grunt images
- `public/assets/`: only files loaded by the game

## Suggested Next Step

Implement enemy death/down presentation next.

Reason:

- Player down/down-hit is now mostly implemented.
- Applying the same idea to enemies will make attacks feel more consequential.
- It creates a natural foundation for cleanup, waves, and stage progression.

Concrete next slice:

- Generate or choose a Grunt down sprite.
- Add `downImage` support to `Enemy`.
- Change enemy death flow from `death -> inactive` to `death -> down -> cleanup`.
- Keep defeated enemies from blocking movement or being pushed.
