CLASS PORTRAITS

The avatar shows a rank-based class portrait, loaded from this folder as
optimized WebP (~70KB each, resized to 640px):

  seer.webp       (Lv 1+   — hooded mystic)
  vanguard.webp   (Lv 15+  — steel knight)
  warden.webp     (Lv 30+  — winged guardian)
  sovereign.webp  (Lv 45+  — crowned enchanter)
  titan.webp      (Lv 60+  — horned champion)
  samurai.webp    (Lv 80+  — oni samurai warlord, apex)

To add or replace art: hand the full-res PNG to the dev — it gets resized +
converted to WebP and dropped here. Any class without a file falls back to the
built-in SVG avatar automatically.

Source art: transparent background, square (1:1), composed for a circular crop
(face + upper chest centred). Level breakpoints live in src/data/classes.ts.
