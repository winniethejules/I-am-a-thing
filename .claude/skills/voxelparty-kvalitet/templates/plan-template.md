<!--
The design plan for an ambitious Voxel Party game (voxelparty-kvalitet §3). Write it in the
person's language, put it in the project (PLAN.md), show it before building, and keep it current:
tick tasks and add a dated "Result" block at the end of each phase. Delete these comments.
-->

# <Game name>: the plan

## Summary
- **The goal in one sentence a child would get:**
- **Standalone or board; players (min–max); controls:**
- **What makes <reference> great** (4–6 pillars, plain words):
- **What we're not doing, and why** (engine limits, scope):

## 1. The first 90 seconds
<!-- A short script: what you see, hear and do, moment by moment. It's the target for the first
phases; everything in it must be possible with the engine. -->

## 2. The quality bar
<!-- Copy the five tests from voxelparty-kvalitet §4 with their numbers, adding anything specific
to this game. List 2–4 style references by name only (no images are downloaded). -->

## 3. Technical foundation
- **How the world is built:** block size, kit model size, merging, the draw-call budget.
- **Light budget:** real lights (which ones cast shadows), block lights, dimmer groups and what animates them.
- **Performance budget:** draw calls, triangles, 60 fps, `vp check --long`.
- **What's reused and what's rewritten.**

## 4. Art bible
- **Palette:**

  | Role | Colour | Where |
  |---|---|---|
  | The way | `#…` | |
  | Safety | `#…` | |
  | Danger | `#…` | |
  | The signature colour | `#…` | |

- **Sky, fog, mist, grade** (2–3 variants for the look test).
- **Textures:** world blocks and prop materials.
- **Kit models by place** (a table: group, models, phase).
- **Characters:** who they are, their silhouettes and variants.
- **Enemies:** builds, variants, and every state with its pose (idle, wake, run, telegraph, hit,
  stagger, arrive, death, corpse).
- **The held item:** its parts and every animation.
- **Effects:** one per moment, sized to it.
- **HUD:** what's shown, where, and why.

## 5. Sound and music
- **Ambience per place** (the bed, and its landmark sounds).
- **Effects by group.**
- **Music by state.**
- **Voices** (synth chirps with subtitles).
- **Levels.**

## 6. The world, place by place
<!-- For each place: size, look, landmark, the story it tells, light, sound, what happens there in
play, items, photo points. Add an overview map in text if the route matters. -->

### Photo points
| # | Where | Looking at |
|---|---|---|

## 7. Mechanics with numbers
<!-- Movement, actions, damage, enemies, pacing. Starting values, tuned in playtests. -->

## 8. Story and text
<!-- The premise, the timeline the places tell, every line of text in the world (max 6 words to
read, lit), notes, radio, voice lines by kind. -->

## 9. Phases
<!-- Each phase: the goal; what you'll see; its size (work sessions); tasks as checkboxes; done when;
proof (which before/after pairs and strips). Phase 0 is always the look test. -->

### Phase 0: the look test
**Goal:** lock the style before building much of it.
**You'll see:** <the hero area> at final quality, in 2–3 lighting variants.
- [ ] …

**Done when:** you've picked a look; the pictures pass the image test; 60 fps.
**Proof:** the variants side by side from the same photo point; the gallery pages.

## 10. Tests and playtest
- **Automatic tests** (the headless rules, plus any measured numbers).
- **The playtest** after each phase (the six questions).

## 11. Risks
| Risk | What we do |
|---|---|

## 12. Decisions for you
-
