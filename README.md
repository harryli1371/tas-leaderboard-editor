# TAS Leaderboard + Editor (PolyModLoader mod)

A PolyModLoader mod for PolyTrack 0.6.3 that adds:

- **Show TAS** next to "Only verified" on the leaderboard screen: lists runs from a community TAS leaderboard and replays a clicked run in the real game.
- **E** (rebindable): a TAS editor panel for custom tracks. Press E again and the game runs your edited inputs as a ghost.
- Optional **Submit to TasLB** (off by default, asks every time, uses a separate random TAS token; never your PolyTrack account token).

## Install

In PolyModLoader's **Mods** screen click **Add** and paste the import link, then **Load** and **Apply**:

    https://cdn.polymodloader.com/gh/harryli1371/tas-leaderboard-editor/main/

**This is the only official copy of the link; do not install copies from elsewhere.**

## What it contacts

- The leaderboard server `taslb.jadestone.dev` (only the read-only `leaderboard` and `recordings` requests, only while Show TAS is on; `submit` only if you enable it).
- The editor page `127.0.0.1:8780`, shown in a sandboxed frame.
- Nothing else. TAS runs are never sent to the official PolyTrack servers; the mod refuses to if the server address ends in `kodub.com`.

## For the maintainer

- Do not rename or delete the account or repo this is hosted in: the install link contains their names, and a renamed or deleted name can be taken over by someone else.
- Keep 2FA on, keep collaborators to a minimum, and only point `latest` in `manifest.json` at versions you have reviewed.
- Regenerate with `python make_pml_mod.py --tas-base https://<leaderboard> --editor-base https://<editor host>`.
- Add a LICENSE file of your choice before publishing.
