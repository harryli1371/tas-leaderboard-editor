# TAS Leaderboard + Editor (PolyModLoader mod)

A PolyModLoader mod for PolyTrack 0.6.3 that adds:

- **Show TAS** next to "Only verified" on the leaderboard screen: lists runs from a community TAS leaderboard and replays a clicked run in the real game.
- **E** (rebindable): a TAS editor panel for custom tracks. Press E again and the game runs your edited inputs as a ghost.
- Optional **Submit to TasLB** (off by default, asks every time, uses a separate random TAS token; never your PolyTrack account token).

## Install

In PolyModLoader's **Mods** screen click **Add** and paste the import link, then **Load** and **Apply**:

    https://cdn.polymodloader.com/<cb|gh>/<owner>/<repo>/<branch>/<folder containing manifest.json>

(Replace the parts in angle brackets with where this folder is hosted. **This is the only official copy of the link; do not install copies from elsewhere.**)

## What it contacts

- The leaderboard server `taslb.jadestone.dev` (only the read-only `leaderboard` and `recordings` requests, only while Show TAS is on; `submit` only if you enable it).
- The editor page `127.0.0.1:8780`, shown in a sandboxed frame.
- Nothing else. TAS runs are never sent to the official PolyTrack servers; the mod refuses to if the server address ends in `kodub.com`.