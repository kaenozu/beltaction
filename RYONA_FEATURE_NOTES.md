# Ryona Feature Notes

Ideas to make the game feel better as a ryona-leaning beat-em-up.

## Reaction Flow

- Add clearer reaction tiers:
  - light hurt
  - heavy hurt
  - knee-buckle / stagger
  - knockback death
  - down
  - down hit
- Route reactions by attack type and remaining HP, not only by raw damage.
- Keep the transition readable: heavy hit -> death/knockback -> down -> downhit -> down.

## Enemy Attack Variety

- Add enemy heavy attack, such as a body blow.
- Add enemy kick.
- Consider a grab attack later, once regular attacks feel good.
- Each enemy attack should trigger a distinct Maki reaction where possible.
- Added standing body blow: shorter knockback, longer stun, reuses the body-blow enemy sprite.
- Added downed pressure attack: enemies can step in for a distinct down-hit attempt while Maki is grounded.
- Added Chain enemy: mid-range chain bind, short pull, low sweep into knockdown, and down-drag pressure.
- Chain enemy now has a dedicated 5-frame sprite sheet; the old code-drawn hood/chain details remain only as a fallback.

## Downed-State Rules

- Keep a short grace window after knockdown.
- Allow limited down hits before final game over.
- Return from downhit back to down.
- Keep post-game replay hits as a debug/optional mode.
- After several live downed hits, force an invincible get-up so down pressure cannot loop forever.

## Impact Presentation

- Tune hitstop per attack strength.
- Use stronger screen shake for heavy hits.
- Consider a short hurt flash or palette flash.
- Consider longer KO pause on final death.

## Pose And Expression Variants

- Add more facial/pose variation to hurt states.
- Add a down variant with eyes closed or more exhausted posture.
- Add a get-up animation if recovery becomes part of the rules.

## Recommended Next Step

Add an enemy heavy attack and connect it to Maki's heavy hurt reaction.
This improves both gameplay readability and the ryona reaction variety.
