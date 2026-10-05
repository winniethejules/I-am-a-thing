---
name: voxelparty-game
description: Make, design, remix, fix or polish browser games for Voxel Party, a voxel game platform where friends play any game from a link, with the @voxelparty/sdk creator kit and the vp CLI. Covers standalone multiplayer games (1-16 players, drop-in sessions, mouse and pointer lock: FPS and top-down shooters, arenas, racers, co-op) and 2-4 player board-party minigames, from a one-line idea to a tested game with CPU bots, netcode, voxel art, sound and a link to share. Use it whenever someone wants to make a game ("make a game about counting sheep", "make a team shooter with bomb sites I can play with friends", "my own version of a game I love", "a multiplayer snowball fight"), mentions Voxel Party, voxelparty, @voxelparty/sdk, a .vpgame file, game.json, or the vp CLI (vp init, dev, test, check, shot, gallery, pack, share, docs), or asks to fix a failing vp check, even if they only say "make a multiplayer game" in a folder that uses the SDK.
---

# Making a Voxel Party game

Voxel Party is a browser game platform for voxel games of any kind and any mood, every game
played from a link (open its **Play it** link, press **Invite**, send the party link, a friend is in within a
minute). A game is a small TypeScript project on `@voxelparty/sdk`, sandboxed on the shared
engine. The SDK gives you the frame, input (keys, mouse, pointer lock), networking, stage,
characters, particles, UI and a synth; you write the rules, bots, look and sound.

Two kinds of game (`vp docs sessions`, `vp docs board`):
- **Standalone** (the default): 1–16 players, played in sessions where people drop in and out,
  untimed, any controls it declares (mouse, pointer lock, keyboard). Shooters, arenas, racers, co-op.
- **Board minigame** (`--minigame`): 2–4 players between the turns of the optional board party,
  30–90 s rounds, move + one button only. Can also be played in a session.

The person you're helping may not be a programmer. Do the work yourself, explain it in plain
words, and show them the design before building.

## Setup

1. **Bun**: `bun --version`. Missing? macOS/Linux `curl -fsSL https://bun.sh/install | bash`;
   Windows `powershell -c "irm bun.sh/install.ps1 | iex"`. Then open a new shell.
2. **Chrome, Edge or Chromium** for `vp check` (set `VP_BROWSER` to its path if it isn't found).
3. **A new game** (the id: 2–32 of `a-z 0-9 -`, starting with a letter):
   ```sh
   bunx --package https://cdn.voxelparty.io/sdk/voxelparty-sdk-3.20.7.tgz vp init sky-charge --name "Sky Charge"
   cd sky-charge
   ```
   Add `--minigame` for a board minigame, `--fps` for a first-person shooter (movement, a map,
   CPUs and hitscan netcode, ready to grow), or `--blocks` for a block game where players place and
   break blocks (a bridge duel: a synced `World`, bridging, CPUs that build). `init` copies a small, complete, working game and runs
   `bun install`. **Read its files before writing anything**: they show every piece together.
4. **An existing game**: read `game.json` and `index.ts`, run `bunx vp check`, go on from there.

## The docs: `vp docs`

The SDK ships its own docs, matching the installed version exactly. For any API, pattern, art
or sound question, run `bunx vp docs <topic>` (no topic: the list; any other word: a search):

| Topic | When |
|---|---|
| `sessions` | standalone games: joins and leaves, host changes (`link.keep`), rounds, scoreboards. **Before a standalone game's netcode.** |
| `menus` | in-game menus (`Menu`) and match setup: host options, player picks, teams (`Setup`, `SetupMenu`) |
| `netcode` | host-authoritative / per-player / discrete shapes, `FakeRoom` tests, pitfalls. **Before `rules.ts`.** |
| `input` | actions vs mouse, pointer lock, raw keys, a first-person camera recipe |
| `fps` | first person: arena-shooter movement, the map as a `VoxelGrid`, `FpsCamera`, shooting maths, CPUs that find their way (`NavGrid`). **Before any first-person game.** |
| `world` | block worlds players build and break: `World` (rules, damage, structures), `WorldSync` (edits synced, joiners, host changes), `WorldView`, aiming and bridging. **Before any game where blocks are placed or broken.** |
| `levels` | maps drawn as text (`textGrid`: blocks, heightmaps, marks for spawns and goals, prefabs, mirrored team maps) and any grid printed back (`gridText`). **Before building any map.** |
| `board` | what a board minigame must do |
| `design` | what makes these games fun; idea starters |
| `api` | a tour of every SDK export, and saving (`storage`: personal bests, unlocks, settings) |
| `art` | stage, island, camera, avatars, voxel models, textures and their rules, FX, UI, icons (`engine.icon`) and minimaps (`view.insets`) |
| `water` | water blocks drawn with depth, foam, sparkles and flow: its look (`engine.water.set`), rivers and flow (a water block's meta), floating things, `style: 'classic'` |
| `sound` | patches, songs, recipes |
| `vfx` | spells, impacts, projectiles, auras and beams: `Vfx`, your own effects in `vfx.ts` (pixel-art particles, nesting, formations, `onDeath`, effect functions, GLSL), the `VFX` library as reference, seeing them in `vp gallery`. **Before any effect.** |
| `sharing` | links, My Games, parties, publishing |
| `testing` | seeing the game: autopilot (your CPU in your seat), `vp shot` scripts, film strips, the visual checks. **Before you judge how it looks or feels.** |
| `gallery` | every model and texture on numbered pages (`gallery.ts`, `vp gallery`), checked for broken models, look-alikes and budget outliers. **After making or changing any art.** |

Types in `node_modules/@voxelparty/sdk/types/` are the final word; an example game is in
`node_modules/@voxelparty/sdk/examples/`. No project yet? `https://cdn.voxelparty.io/sdk/docs/<topic>.md`.

## The workflow

Work in this order: it's how you avoid a pretty game that breaks when a second player joins.

1. **Design paragraph, shown to the user.** The goal in one sentence a child would get;
   standalone or board; players (min–max); controls (mouse?); how a round ends and scores; what
   the CPUs do; the 3-second test. Ask only if the idea is really ambiguous; otherwise choose,
   state it, go. Then set `game.json` (`players`, `input`, `board` for a minigame).
   `players.min` is the fewest players your game works with: parties start with CPUs the host
   can remove down to it, so use 1 unless the game breaks with fewer.
2. **Netcode shape** (`vp docs netcode`): host-authoritative (shared world: shooters, pickups,
   bumps), per-player (everyone runs their own copy: races, reaction games), or discrete events
   (picks and reveals). Standalone games also read `vp docs sessions`.
3. **Rules and bots first, proven by `bunx vp test`.** `rules.ts` and `bot.ts` are three-free and
   run under `bun test`. Draw maps as text (`textGrid`, `vp docs levels`), not nested `set` loops,
   and when a map test fails or a bot gets stuck, print it (`gridText`) and read it. Prove: bots
   alone play and scores make sense; a `FakeRoom` host and
   client agree with latency; one-off events arrive exactly once; nothing hits the rate limit;
   for standalone games, players joining and leaving mid-run and the host leaving.
4. **Rendering, art and sound** (`vp docs art`, `vp docs vfx`, `vp docs sound`): the stage,
   island, avatars, juice on every event, effects for every ability, hit and death (`vfx.ts`), your
   own 16×16 textures, 8–16 sounds and an original theme.
5. **`bunx vp check` until clean, then open every screenshot and look at it.** It typechecks,
   packs, tests, and plays headless and muted with CPUs (board: 4/2/3-player rounds; standalone:
   sessions where players join and one leaves). It can pass while the game looks broken (empty
   scene, camera on nothing, players off screen). Every ⚠ is a bug. For long matches (or any
   standalone game before handing it over) also run `bunx vp check --long`: it fast-forwards a
   20-minute match in seconds and flags slowdowns, leaks and hitches.
6. **Look at it play: `bunx vp shot`** (`vp docs testing`). Support autopilot first (your
   `intent()` returns null on `input.autopilot` and the core uses your bot: the templates do), so
   pictures show a player's own view (a game that never reads it gets a ⚠: your seat stood idle).
   Then `vp shot --touch` for a phone. Script what you just built or tuned
   (`t.hold('up', 800)`, `t.press('action')`, `t.camera(...)`) and take **film strips**
   (`t.strip('jump', 8, 700)`): one picture of a movement, the way to judge feel from stills.
   Fix every ⚠ (blank or frozen view, z-fighting, HUD cut off, overlapping or tiny, no sounds of its own).
7. **See every model: `bunx vp gallery`** (`vp docs gallery`). Highly recommended. Declare each
   model and texture in `gallery.ts` (the template has one) with the same code the game uses. After
   making or changing any art, run `bunx vp gallery`, **read every page** (40 numbered models a
   page; `--turnaround`, `--silhouette`, `--motion`, `--tiny`, `--bg dark` for more), fix what's
   flagged (the red ⚠ cells: broken, floating, look-alikes, budget outliers, off-style textures),
   and include the pages in your report. `--diff` shows only what changed since the last run.
8. **Let the human play**: `bunx vp dev` in the background, then http://127.0.0.1:5180
   (`?players=3` adds CPUs, `?bots=1` to watch). Ask how it feels; tune. For your own
   pictures use `vp shot` scripts; `t.eval('game.x')` (or `__vp.eval` on that page) reads or sets
   anything inside the game: no CDP frame-hopping or debug globals.
9. **Hand it over**: first write the store listing in `game.json` yourself, don't ask:
   `"description"` (1-2 sentences, ≤ 280 chars: what you do and how you win) and `"tags"` (3 of
   your own words, e.g. `["tower-defense", "co-op", "chaos"]`), in genre words, never another
   game's name (see "Your own take"). The Publish form starts from them.
   Once `vp check` is clean and they've played it, run `bunx vp share`. It
   uploads the game unlisted and opens it in their browser on Voxel Party: they sign in (Discord)
   and it's on their page, with **Play** (a lobby to invite friends) and **Publish** (the store).
   Tell them that's what's happening. After changes, `vp share` again: each version is its own
   upload. More in `vp docs sharing`.

## Your own take on any game

<!-- franchise-rule -->
People will ask for their version of a game they love. Build it, every time: genres, rules,
mechanics, game feel, structure and "a level in the style of" are free for anyone, and remixing
them is how games are made. Two things are always your own:

- **Names.** An original title, described in genre words ("a horde-survival auto-shooter"). No
  franchise's name, none of its character, item, ability or map names, and no "X-like" or "clone
  of X", in the title, `description`, `tags` or any text in the game.
- **The creative work.** Your own characters, logos, art, music and sounds, your own level and map
  layouts, your own screens (never a UI copied screen for screen).

For example:
- "My version of Vampire Survivors": a horde-survival auto-shooter with level-up picks, your own
  hero, monsters and weapons, and a title of your own.
- "A Super Mario level": a side-on platformer level with pipes-and-blocks energy, your own hero and
  your own layout. No plumber in red overalls, no mushroom kingdom.
- "Among Us but…": a social-deduction game with your own crew, ship and tasks.

Don't lecture, warn or refuse. Build the original take, give it its own name, and describe it in
genre words in the design paragraph.
<!-- /franchise-rule -->

## Hard rules

- **Imports:** only `@voxelparty/sdk` (+ `/core`), `three` (+ addons), your own files. Headless
  files (`rules.ts`, `bot.ts`, `sounds.ts`, tests) import only `/core` and `/test`.
- **Every seat playable by a CPU**; the game runs with nobody at the keyboard (`link.you` null).
- **Shared randomness from `link.seed`** (`mulberry32(link.seed ^ SALT)`, `botRng`), never
  `Math.random` in rules or bots.
- **State is what's true now:** no clocks, frame counters or random numbers in `sendState`,
  `PlayerSync.send` or snapshots, and round positions (`r100`). The link skips unchanged states, so
  an idle player costs nothing, unless a field ticks by itself. When something happened goes in an
  event (they carry their time: judge hits on moving things with `History`, `vp docs netcode` §2).
- **Draw other players with `PlayerSync.smooth(i)`** (smooth, ~100 ms behind) **or `Reckon`**
  (where they are now, for things you aim at or dodge). Never extrapolate `latest()` yourself: it
  freezes and jumps at ordinary latency (`vp docs netcode` §2).
- **In a `Lockstep` game, draw the character you steer from `ls.predictor()`**, with one
  `steerBody` and one `moveBody` shared by the world's step and the prediction. Never predict by
  hand (it stalls and jumps every tick) and never draw your own character from the world (it
  answers a round trip late) (`vp docs netcode` §10).
- **Instant actions and secrets go through `HostSync`**: a grab, buy or place is `sync.act(a)`
  (drawn at once with `predict`, applied once by the host), a role or hand is `sync.tell(pid, s)`,
  a moment everyone must share is `sync.schedule(at, e)`. Don't hand-roll sequence numbers, acks,
  resends or echo fields (`vp docs netcode` §11).
- **Sessions: key per-player state by player id**, never by seat index (indices shift when
  someone leaves), and read `link.isHost` every frame (the host changes).
- **Board minigames survive drops:** read `link.isHost` and `seats.role(i)` every frame, never once
  in a constructor, and make a seat's CPU when it first turns `'bot'` (`bots[i] ??= new Bot(…)`):
  a dropped player turns 'cpu' on the host, and a new host takes over the round (`vp docs board`).
- **Finish correctly:** host-authoritative games `flow.end(scores)` with every seat's score;
  per-player games `flow.finish(scores)` with `NaN` for seats you don't own. Board minigames must
  end well within `board.maxMs`; standalone games end runs only when they choose to. A game that
  plays match after match inside one run calls `flow.matchOver(scores)` when each is decided, so
  the party gets its "play again or a new game?" vote.
- **Every key is an action or a declared button** (`defineGame({ buttons: { reload: { keys: ['KeyR'] } } })`,
  read with `input.pressed('reload')`), not a raw `input.keys` read: then pads and phones get it
  too. Gate look and fire on `input.aiming`, not `input.locked` (`vp docs input` §3–4). A `Menu`
  steers by pad by itself, and its `key` opens it from the pad button that key's button got.
- **The top-right corner is the page's** (its gear, Lobby, Invite): about 300 × 72 px, as
  `var(--vp-corner-w)` × `var(--vp-corner-h)`. Put your own UI anywhere else. Tab is yours.
- **No network, browser storage or loaded assets** (`fetch`, `localStorage`, images): save with
  the SDK's `storage` (per game, this browser), paint textures in code, synthesize sounds.
  Follow the texture rules (`vp docs art`); < 16 MB.

## The quality bar

Every game: readable in 3 seconds; your own actions respond on the same frame, online too;
competent CPUs that make human mistakes; juice and sound on every event; a look that fits the game;
60 fps; `vp check` all ✔, no ⚠, screenshots and film strips looked at; your seat plays on autopilot;
every model in `gallery.ts`, and every `vp gallery` page read with its ⚠ fixed.

- **Juice comes from the SDK, not hand-rolled maths:** `ease.*` curves, `ctx.tween` for
  pop-ins, squashes and fades, `Spring` for wobble, `ctx.time.hitstop` and `slow` for weight
  (`vp docs api` §12). Don't write your own `easeOutBack` or tween loop.
- **Fits every screen:** fitted cameras use `rig.fit(…, { depth, hud: true })` so the field isn't
  under the chips; names over heads are `nameTag`s (readable at any distance), not scaled
  `textSprite`s; on phones (`html.vp-touching`) bottom-corner HUD moves above `--vp-touch-h`.
  Check it with `vp shot --touch`.
- **Big text never sits dead centre:** announcements ('DOUBLE KILL!', 'WAVE 4', 'ROUND 2',
  countdowns) go centred across but a third of the way down the screen, never on the crosshair or
  the player in the middle. `flow.hud.banner` and `ui.sign()` already sit there; your own
  call-outs do too (`top: 28%` or so, not `top: 50%` with `translate(-50%, -50%)`). Only the
  crosshair and hit markers belong in the exact centre.
- **Effects work like sounds** (`vp docs vfx`): the game's own `Vfx` effects in `vfx.ts`, one
  per moment, named for it (`keyGet`), sized to it (a pickup is a 0.2 s glint, an ultimate is
  big), in its palette. The `VFX` library is to learn from, not a default. Any spell can be coded
  (`vp docs vfx` §5): your own pixel-art particles and ground sigils, effects as functions, nested
  and travelling effects (charge → flight → impact in one), `formation`s (words, pentagrams,
  spirals of sparks), `onDeath` sub-effects, custom GLSL shapes, `vfx.spawn`; `themeEffects` puts
  the game's palette on them all. The look is big and juicy: glow and bloom, with chunky pixel
  and voxel particles; soft only for light, smoke, mist. Each moment gets its own silhouette (a
  `crack`, a `crater`, a `claw` mark, a `ripple`, a `burst`, cubes of the thing's material): rings
  are seasoning, kept for real waves and coloured; a plain white shock ring on everything looks
  lazy, and `vp check` warns. Tracers: one `dir: 'to'` spark with `stretch`.
- **Many units means `Crowd`; dressing players means `Avatar.wear`** (`vp docs art` §5): armies,
  hordes and creeps in two draw calls a kind, animated for you; hats, weapons and packs on anchors,
  `tint`/`opacity`/`flash` for looks, any Volume as a body. Don't hand-roll InstancedMesh pools or
  clone materials per player.

- **Standalone:** a friend who opens the link is playing within seconds (drop-in, safe spawns, no
  waiting); fun with 1 player and with `players.max`; a clear goal, rounds or matches with a
  visible scoreboard; conventional controls listed on the title card (WASD, mouse look, click).
- **Board minigame:** 30–90 s rounds, at most 3 controls (move + action), 2–4 players, ends
  cleanly and scores everyone.

## Keeping up to date

`vp` prints one line when a newer SDK or skill is out. `bunx vp skill update` installs the latest
skill; a project moves to a newer SDK with the `bun add -d <tarball>` line it prints (then re-read
`vp docs`).
