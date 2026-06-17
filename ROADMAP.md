# Final Fight 2 Prototype Roadmap

## Goal

Make the prototype feel good as a one-screen beat-em-up first, then expand it into a stage-based game.

The current focus is combat feel: player hit reactions, enemy participation, knockdown states, and clear visual feedback.

## 1. Finish Damage and Down States

Tighten the full damage flow so it feels intentional.

- Normal hurt reaction
- Death reaction
- Down state
- Down-hit reaction when attacked on the ground
- Game over state
- Enemy behavior after the player is down

Open questions:

- Should enemies keep attacking the downed player, back off, or stop after game over?
- Should there be a short invulnerability window after down-hit?
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

Potential shortcut set:

- `E`: spawn enemy
- `H`: toggle hitboxes
- `R`: restart

## 6. Build Stage Progression

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

## 7. Organize Sprite Assets and Generation Flow

Generated sprites are starting to accumulate, so the asset pipeline should become explicit.

- Keep source/generated images under `assets/`
- Keep runtime game assets under `public/assets/`
- Document which source image produced each runtime asset
- Keep prompt blocks in `SPRITE_PROMPTS.md`
- Keep conversion commands near the relevant prompt or in a small asset notes file

Recommended convention:

- `assets/maki/`: source and generated Maki images
- `assets/enemies/grunt/`: source and generated Grunt images
- `public/assets/`: only files loaded by the game

## Suggested Next Step

Implement enemy death/down presentation next.

Reason:

- Player down/down-hit is already in progress.
- Applying the same idea to enemies will make attacks feel more consequential.
- It creates a natural foundation for cleanup, waves, and stage progression.
