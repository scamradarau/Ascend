# Rive Avatar — authoring spec

The app is wired to render the avatar from a **Rive** file when one exists,
and to fall back to the built-in SVG avatar when it doesn't. This means you
can design the character + helmets visually in [rive.app](https://rive.app),
export one file, drop it in, and it goes live — **no code changes needed**.

This doc is the contract between the Rive file and the code in
`src/components/RiveAvatar.tsx`. Match these names exactly.

---

## 1. Where the file goes

Export from Rive as a `.riv` and place it at:

```
app/public/avatar.riv
```

(That serves at `/avatar.riv`. The code loads exactly that path.)

## 2. Artboard

- One artboard, roughly **square** (e.g. 200 × 200 or 400 × 400).
- It's rendered with `Fit.Contain`, centered, so it scales cleanly to any size.
- Keep the design readable down to ~200px and up to ~300px (the hero sizes used
  on the Character, Settings, and Player pages).

## 3. State machine

- Create **one State Machine** named exactly:

  ```
  Avatar
  ```

## 4. Inputs (these drive the cosmetics)

Add **four Number inputs** on the `Avatar` state machine, named exactly:

| Input name | Meaning | Value = index into… |
|------------|---------|---------------------|
| `helmet`   | which helmet | the helmet list below |
| `aura`     | which aura/glow | the aura list below |
| `frame`    | portrait ring | the frame list below |
| `skin`     | energy/body colour | the skin list below |

The code sets each input to a **0-based index**. Build your state machine so
each index value shows the matching look (e.g. via a blend state, a number
comparison, or one timeline per value).

### Index → meaning (must match this order)

These come straight from `src/data/cosmetics.ts`. If you add/reorder cosmetics
there later, update the Rive states to match (the live ranges are also exposed
in code as `RIVE_INPUT_RANGES`).

**helmet** (0–9)
```
0 none        (bare)
1 hood        (initiate cloth hood)
2 circlet     (focus circlet / band)
3 knight      (closed great-helm, vision slit)
4 ranger      (visor + cheek guards)
5 samurai     (kabuto + horns + menpō mask)
6 mage        (deep arcane cowl)
7 warlord     (bronze Corinthian + plume)
8 ascendant   (halo of light)
9 phoenix     (fiery full helm + flame crest)
```

**aura** (0–6)
```
0 none
1 spark
2 ember
3 frost
4 void
5 solar
6 phoenix
```

**frame** (0–4)
```
0 basic
1 bronze
2 cyan
3 gold
4 prism
```

**skin** (0–4)  — the body/energy colour
```
0 cyan
1 violet
2 emerald
3 crimson
4 aurora
```

## 5. Animation notes

- Idle animation is fine to autoplay (breathing, slight float, aura shimmer).
- The component plays the state machine automatically; `animated={false}`
  callers (small contexts) won't use Rive anyway — they use the SVG.

## 6. How the code uses it

`src/components/RiveAvatar.tsx`:
- Loads `/avatar.riv`, plays the `Avatar` state machine.
- On every cosmetic change, sets `helmet`/`aura`/`frame`/`skin` inputs to the
  index of the equipped item.
- If the file is missing or fails to load, it renders the SVG `<Avatar/>`
  instead — so the app is never broken while the art is in progress.

Used for the **big hero avatars** (Character page, Settings preview, Player
profile). Small list thumbnails (leaderboard, friends) intentionally keep the
lightweight SVG avatar — don't put many Rive canvases on one screen.

## 7. Tips for authoring

- Design the **base body once**, then make each helmet a layer/group you
  toggle by the `helmet` index. Same for auras (particle/loop layers).
- For `skin`, recolor the body via a color property tied to the `skin` index.
- Test by scrubbing the inputs in Rive's preview before exporting.
- Free 3D-looking results: use Rive's meshes + gradients; or design flat,
  bold, iconic shapes that read at small sizes.
