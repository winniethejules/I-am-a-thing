---
name: voxelparty-kvalitet
description: The quality bar and working order for Voxel Party games, used together with voxelparty-game. Load it whenever you create, revamp or polish a Voxel Party game, and always when the request is ambitious or about feel and looks ("a copy of <game>", "as engaging/atmospheric as possible", "use the engine to the fullest", "it looks low effort", "make it look better", "total revamp"). It puts the visible first (a finished look slice before systems), asks for a real design plan with an art bible, fixed photo points with before/after pictures every session, measurable image and feel tests, kit-of-parts environments, own characters and enemies with states, and measuring before tuning.
---

# Voxel Party: the quality bar

This sits **beside** `voxelparty-game`; it doesn't replace it. Keep that skill's hard rules, netcode
patterns, tests and `vp check` / `vp shot` / `vp gallery` workflow. This skill changes two things:
**the order you build in** and **how good "done" is**.

Why it exists: following the default order (rules, bots and netcode proven first, art and sound
after) gave a game that worked well and looked like boxes in fog, with party avatars as the
characters. The person called it low effort. What fixed it was building the visible first, to a
measurable bar, with pictures every session. That's written down here so it happens from the start.

## 0. Size the request

- **Small or casual** (a quick minigame, a toy, a jam idea): the light version.
  - Do the look slice (§2) and the feel test (§4).
  - Take before/after pictures at each change.
  - Do everything else as `voxelparty-game` says.
- **Ambitious** (a copy of a known game, "atmospheric", "polished", "to the fullest", a revamp,
  or anyone unhappy with the depth): the full process below. Say which one you picked, in a line.

## 1. Order of work: the visible first

1. **The design plan** (§3), written as a file in the project, for example `PLAN.md`, in the
   person's language. Show it, and ask only the decisions that are really theirs to make.
2. **The look slice.** Build one small hero area, such as a street corner, an arena's corner or
   one room, at **final** quality: the setting, the characters, the held weapon or tool, the light,
   the sky and the grade.
   - Render 2–3 lighting/grade variants from the same photo point, side by side, and let the
     person pick one. Change it until they say yes.
   - Nothing else gets built first. Port or write only the systems the slice needs to run.
3. **The feel slice.** The main verb (shoot, jump, drive, build) with every reaction (§4), and
   enemies or obstacles with all their states. Prove it with film strips, measurements and tests.
4. **Grow it place by place.** Each place is finished, photographed and played before the next
   one starts: depth over breadth. Systems (a director, progression, more netcode) come in the
   phase where something visible needs them, never in a pass of their own with nothing to see.
5. **Every work session ends with pictures:** before/after from the same photo points, and strips
   of what moves. Send them as they're made, with a short note in the person's language.
6. **Stop at each phase** so the person can play it, and ask the short playtest questions (§6).

## 2. Photo points and before/after

- **Fixed camera positions in code:** a list of `{ name, pos, look }` next to the map. Add a hook
  (`game.photo(name)`) that holds the camera there, and a `vp shot` script that shoots them all.
  There's a template in `templates/photos.ts`.
- **Take the "before" pictures before you change anything.** `vp shot` wipes `.vp/shots` on every
  run, so copy each set out right away: `qa/<phase>/fore/`, then `qa/<phase>/efter/` (or
  before/after in the person's language).
- **Show them side by side,** labelled and in one picture. There are composition scripts in
  `templates/compose/` (Windows PowerShell; on another system, do the same with what's at hand):
  - `pair.ps1`: before and after side by side;
  - `stack.ps1`: film strips one under another;
  - `grid.ps1`: a contact sheet of every photo point;
  - `image-test.ps1`: the numbers in §4.
- **Gameplay changes get before/after too:** film the old behaviour, switch it back for one run
  if you must, then film the new.

## 3. The design plan (template: `templates/plan-template.md`)

For an ambitious request it covers:
- **What makes the reference great:** 4–6 pillars, in plain words.
- **The first 90 seconds as a script:** what you see, hear and do, moment by moment. It's the
  target for the first phases.
- **The quality bar (§4),** with its numbers.
- **The art bible:**
  - a palette with hex codes and a role for each colour (the way, safety, danger, the signature colour);
  - a light budget: how many real lights, which ones cast shadows, block lights in dimmer groups;
  - sky, fog and mist, and the grade;
  - a texture and material list;
  - **every model, grouped by place;**
  - characters and enemies: builds, variants, states and poses;
  - the held item and its animations; effects; the HUD.
- **The world as places.** For each place:
  - its size and how it looks;
  - a landmark;
  - **the story it tells** (traces of people, signs, notes);
  - its light and sound, what happens there in play, and which photo points it has.
  - Text in the world is short (at most 6 words you must read) and lit.
- **Sound and music:** an ambience per place, sound effects by group, music by state, and
  levels (shots loudest, ambience lowest).
- **Mechanics with numbers,** as starting values.
- **Phases.** Each one says what you'll see, its tasks, when it's done, and its **proof**: which
  pictures and strips.
- **Risks, and the decisions for the person.**

## 4. The quality bar

A piece is done when it passes all five:

1. **The image test,** at every photo point and at random points along the way. The picture has:
   - a sky with something in it (a skyline, clouds, a distant glow, a searchlight);
   - a roofline or horizon against that sky;
   - a facade or wall with depth (recesses, sills, signs);
   - something in the foreground;
   - a light source that draws the eye;
   - at least one readable sign or story detail.

   Measured, so "good enough" isn't an opinion:
   - the top third is at most 85% near-black;
   - at least three brightness levels (dark, mid, light), each on at least 10% of the pixels;
   - the brightest 1% are light sources (lamps, neon, fire), not haze;
   - no bright blob covers more than 3% of the picture;
   - at most two signal colours dominate at once.

   `templates/compose/image-test.ps1` measures these numbers from screenshots. The thresholds are
   starting values. **Calibrate them on the look-slice picture the person approved:** its numbers
   are the floor for every other photo point. A night game is darker, so move `-dark` and
   `-light`. Shave the HUD off with `-ignoreTop`. The script can't tell whether the brightest pixels
   are lamps or haze, so look at the picture for that.
2. **The three-second test.** A new player can say where they are, what's dangerous, and where
   to go.
3. **The feel test.** Every action gets a picture, a sound and a reaction on the same frame:
   - **a shot:** recoil, muzzle flash, a casing, a sound, and a hit effect for the material;
   - **a hit on an enemy:** a flinch, a spray and a sound;
   - **a kill:** it falls the way the shot pushed it, and a headshot takes the head;
   - **reloads and melee:** their own hand animations.

   Big moments (a horde, a boss, an alarm) get a timeline: a sound from where it will come,
   then music, then the world reacting (lights flicker, things flare), then a callout, then it arrives.
4. **The comparison test.** Before and after side by side. If the difference isn't obvious at a
   glance, it isn't done.
5. **The person's test.** They play it and answer "do you want to play again right now?"

## 5. Recipes that get the detail

**Environments**
- **A big world** is a 1 m block volume (streets, walls, roofs, terrain), with **kit models** at
  1/16 m on top of it: windows in four states, shopfronts, signs, cornices, awnings, drainpipes,
  AC units, fire escapes, water towers, chimneys, cars, lamps, bins.
- **Buildings come from a parameter list:** width, storeys, wall material, ground-floor kind,
  sign, awning, roof clutter. Don't place every window by hand.
- **Draw kit models as greedy boxes,** not voxel face by voxel face: about a tenth of the
  triangles. Build each model once by key, merge still ones per stretch or district, and give the
  ones that animate their own tagged mesh.
- **Model conventions:**
  - facade pieces: local x runs along the wall and z points out of it, with the origin on the wall's face;
  - free-standing props: the origin is the middle of their footprint, on the ground.
- **Text in the world** is built from voxel letters: 5×7 for signs, 3×5 for notes. The SDK's own
  text always turns to face the camera.
- **Light:**
  - block lights in **dimmer groups** that game code animates: breathing, flickering before an
    event, alarms blinking;
  - only a few real lights, and only the player's own torch casts shadows;
  - lit windows and neon are glowing materials, which feed the bloom.
- **Sky:** backdrop cards (skyline silhouettes, a distant glow, a searchlight) so the top third
  isn't empty. Make their textures with TexDefs or a shader: a canvas texture gives a `vp check` ⚠.
- **Indoors:** when the camera is inside, turn off rain particles and the ground mist, muffle the
  rain, and play the room's own ambience.
- **The grade follows your state:** red when hurt, a tunnel when down, grey on your last life.
- **No overlaps:** run `vp shot` and read its z-fighting ⚠. Props that touch must be flush, not
  inside each other (curbs under barriers, lamps inside bins).
- **Every place tells a story.** People's traces (abandoned things, notes, barricades, signs)
  explain what happened there before anyone says a word.

**Characters and enemies**
- **No party avatars in a game with a theme.** Make your own character volumes, with
  silhouettes that differ: the gallery's look-alike check proves it.
- **Enemies in parts:** one `Crowd` per part (torso, head, arms), posed per state:
  - idle or asleep, waking, running;
  - **a telegraph before every attack**;
  - a flinch when hit, a stagger, climbing in;
  - death falling the way the shot pushed, the head gone on a headshot, the body left lying a while.
- **Variety:** builds × clothing tints × hair × scale, all chosen from the enemy's id.
- **Enemies arrive from somewhere:** over fences, out of the water, round corners. They never
  just appear.
- **In first person,** the held item has hands, sways, recoils, and reloads shell by shell or
  magazine by magazine, with casings that land.

**Sound:** an ambience per place (positional, louder near), landmark sounds, about ten effects per
group, music by state (a calm drone, drums when danger comes, warm when safe), and voices as
synth chirps with subtitles.

## 6. How to work

- **Look at every screenshot, strip and gallery page yourself** before showing or describing anything.
- **Measure what feels wrong before you tune it.** Measure it headless and in the page through
  `t.eval`, and find the root cause. For example, a shove that "doesn't push": `push()` adds to
  the velocity, so a running enemy ate it, and zeroing the velocity first fixed it. Turn each
  fixed bug into a test.
- **Stage scenes deterministically in `vp shot` scripts:**
  - clear the area and place the camera;
  - spawn what you need, and reset scripted triggers so the event happens in shot;
  - film it, then measure. There's a template in `templates/scene.ts`.
- **Every ⚠ is a bug,** or a written exception the person has agreed to.
- **A reviewer agent** plays as a new player, read-only, and asks: what do you see in the first
  10 seconds, what's ugly, what's unclear? It never moves the visible work later in the plan.
- **Be honest:** say what's done and verified, what isn't done, and what doesn't show. If a part
  drags, show what exists and say what's missing.
- **The playtest after each phase:**
  1. play without explanation;
  2. what happened?
  3. what was best, and what was worst?
  4. when were you lost?
  5. was anything unfair, ugly or confusing?
  6. do you want to play again right now?

## 7. Pitfalls already paid for

- `vp shot` wipes `.vp/shots` on every run: copy the pictures out first.
- Take the before pictures before the first edit; they can't be recreated afterwards.
- In PowerShell, variable names ignore case: `$w` and `$W` are the same variable, and so are `$o`
  and `$O`. For å, ä and ö in arguments use `[char]` codes, for example `$([char]0xE5)`.
- In Windows PowerShell 5.1, `Set-Content` and `Get-Content` corrupt UTF-8: edit files with the
  Edit or Write tools.
- The built-in browser pane may have no WebGL. Use `vp shot` scripts to see the game.
- A netcode test that compares counters while CPUs keep playing is racy: an event can be on its
  way. Compare against the host's value from a moment ago, and allow it to be in flight.
- A scripted event that something else already set off won't happen in shot: reset its flag in
  the script.
