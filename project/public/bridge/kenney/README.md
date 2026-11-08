# Kenney 3D models (CC0)

The world code (`src/videos/bridge/world.ts`) loads small 3D props (trees, bushes, flowers, market stalls, banners, a
cart, a windmill, a lantern, a canoe) from this folder as `.glb` files, for example `tree_oak.glb`.

These models are not stored in this repository. They are free and public domain (CC0) from https://kenney.nl/assets.
Download the kits, unzip them, and copy the `.glb` files you need into THIS folder (no sub-folders).

- Nature Kit: trees, plants, flowers, grass (names like `tree_oak`, `plant_bushLarge`, `flower_redA`, `grass_large`)
- Fantasy Town Kit: stalls, banners, cart, windmill and similar town props

I could not verify which kit each file comes from. Run `npm run doctor` from the project folder: it lists exactly which
models are still missing.

If a model is missing, the code skips it and the scene still renders, just emptier (no trees or market props where
those models would have been). Nothing crashes.

The full list of names is the `KENNEY` array near the top of `src/videos/bridge/world.ts`.
