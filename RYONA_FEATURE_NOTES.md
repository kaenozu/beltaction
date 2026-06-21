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

## Pinch And Restraint Move Ideas

These should stay readable as beat-em-up pressure mechanics: restraint, stun, positioning, and escape timing. Avoid making them explicit; the goal is a tense gameplay state with clear counterplay.

1. Chain double bind
   - Chain enemy wraps Maki and holds her in place.
   - A grunt can join as a second grappler.
   - Button mashing or directional input shortens the bind.

2. Two-person hold with body blow follow-up
   - First enemy restrains Maki.
   - Grunt approaches, joins the grapple, then performs body blows as a follow-up loop.
   - Use overlay rendering so the attacking grunt reads as part of the hold.

3. Wall pin
   - Only triggers near screen edges.
   - Enemy presses Maki against the wall for a short restraint window.
   - Other enemies can approach for one follow-up attempt.

4. Arm-twist hold
   - Back grab that disables attacks and movement for a short time.
   - Low damage, but creates enemy setup pressure.
   - Escape input should be obvious and responsive.

5. Chain trip
   - Chain catches Maki low and pulls her into a knockdown.
   - Recovery is slightly slower than a normal trip.
   - Add cooldown or immunity so it cannot loop endlessly.

6. Knee-buckle body blow
   - Heavy body blow causes a brief forward bend / knee-buckle reaction.
   - No launch; instead it creates a longer standing stun.
   - Best used as a follow-up after a hold, not as a frequent neutral attack.

7. Exhausted stagger at low HP
   - At low health, certain heavy hits trigger a short stagger pose.
   - Keep control loss brief.
   - Use it mainly for visual danger feedback.

8. Boss wind-up restraint finisher
   - Boss starts a visible, slow finisher setup when Maki is restrained.
   - Other enemies or player escape input can interrupt the setup.
   - Big payoff, but never instant or unavoidable.

## Additional Restraint Technique Ideas

These are follow-up candidates after the current chain bind work. Keep them short, readable, and escapable so they add tension without breaking the beat-em-up flow.

1. Bound body-blow queue
   - While Maki is already restrained, nearby grunts reserve a follow-up slot instead of all crowding in at once.
   - The first grunt joins the grapple, lands one clear body blow, then either backs off or swaps with another waiting enemy.
   - This makes the situation feel coordinated without turning it into an unavoidable damage loop.

2. Chain cinch stagger
   - The chain enemy briefly tightens the wrapped chain before another enemy attacks.
   - Maki leans forward for a short stagger pose, making the incoming body blow line up visually with her abdomen.
   - Use this as a timing tell: the player can mash out before the follow-up connects.

3. Back hold into front punch
   - One grunt grabs Maki from behind and pins her arms.
   - A second grunt approaches from the front and performs a single heavy punch.
   - The camera and sprites should emphasize the two-enemy formation: holder behind, attacker in front, Maki centered.

4. Chain anchor pull
   - Chain enemy anchors Maki in place while a grunt tries to walk around to the correct side.
   - If the grunt reaches position, the restraint becomes a double-grapple state.
   - If the player escapes early, the grunt whiffs or stops, rewarding fast input.

5. Corner clamp
   - Only triggers near the edge of the arena.
   - Enemy pins Maki against the boundary for a short, high-pressure window.
   - Strong visually, but should have a strict cooldown so it does not replace normal movement play.

6. Low-HP desperation hold
   - At low HP, enemies become more likely to attempt restraints instead of neutral punches.
   - Damage stays modest, but the animation and stun sell the danger.
   - Good for late-fight drama while preserving player agency through escape input.

## Current Best Direction

Build around chain bind -> grunt joins grapple -> two-person body blow follow-up.
It uses the existing chainWrapped and grabFollowup systems, keeps the action readable, and gives the player a clear situation to escape from.

## Recommended Next Step

Add an enemy heavy attack and connect it to Maki's heavy hurt reaction.
This improves both gameplay readability and the ryona reaction variety.
