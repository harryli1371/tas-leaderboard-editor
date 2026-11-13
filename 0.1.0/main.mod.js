import { PolyMod, MixinType, SettingType } from "https://cdn.polymodloader.com/cb/PolyTrackMods/PolyModLoader/0.6.3/PolyTypes.js"; // path checked: resolves and exports PolyMod + MixinType (INSERT = 3)

const TAS_BASE_DEFAULT = "https://taslb.jadestone.dev";       // leaderboard API (same paths as the official one: /v6/leaderboard, /v6/recordings)
const TAS_EDITOR_DEFAULT = "http://127.0.0.1:8780"; // where the editor page (/editor) is served from

let CFG = null;   // set once in INSTALL()

// ---- part 1: state, and redirect of the two read-only leaderboard URLs while "Show TAS" is on ----
const INSTALL = () => {
  if (window.__tasInstalled) return;
  window.__tasInstalled = true;
  window.__tasMode = false;   // (the game-side patches read this one; it only switches the list, it cannot change where data goes)
  const ls = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  CFG = Object.freeze({ base: ls("tasBase") || TAS_BASE_DEFAULT, editorBase: ls("tasEditorBase") || TAS_EDITOR_DEFAULT });   // fixed here; later changes to window.* have no effect
  const redirect = (u) => {
    if (!window.__tasMode || typeof u !== "string") return u;
    const m = /^https:\/\/vps\.kodub\.com\/(v\d+)\/(leaderboard|recordings)\?(.*)$/.exec(u);   // not leaderboardUserEntry, not anything else
    return m ? CFG.base + "/" + m[1] + "/" + m[2] + "?" + m[3] : u;
  };
  const open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) { return open.call(this, method, redirect(String(url)), ...rest); };
  const f = window.fetch;
  window.fetch = function (input, init) {
    if (typeof input === "string") input = redirect(input);
    else if (input && input.url && window.__tasMode) { const r = redirect(input.url); if (r !== input.url) input = new Request(r, input); }
    return f.call(this, input, init);
  };

  // ---- part 2: the Show TAS button, added next to "Only verified" ----
  const addButton = () => {
    const ov = document.querySelector(".leaderboard-ui > .button-wrapper > .button.only-verified:not(.tas-toggle)");
    if (!ov || ov.parentNode.querySelector(".tas-toggle")) return;
    const b = document.createElement("button");
    b.className = "button only-verified tas-toggle" + (window.__tasMode ? "" : " disabled");
    b.textContent = "Show TAS";
    b.addEventListener("click", () => {
      window.__tasMode = !window.__tasMode;
      b.classList.toggle("disabled", !window.__tasMode);
      ov.click(); ov.click();   // toggles "Only verified" twice: back where it was, and the list is reloaded from the chosen server
    });
    ov.parentNode.appendChild(b);
  };
  new MutationObserver(addButton).observe(document.documentElement, { childList: true, subtree: true });
};

// ---- part 3: the E-key editor panel (same code as patch_game.py) ----
const EDITOR = "(()=>{let ui=null,ready=!1,open=!1,waiting=!1,nt=null;const note=(t,bad)=>{let n=document.getElementById('tas-note');if(!n){n=document.createElement('div');n.id='tas-note';n.style.cssText='position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:100000;padding:8px 14px;border-radius:6px;font:14px sans-serif;color:#fff;max-width:80vw;pointer-events:none';document.body.appendChild(n)}n.style.background=bad?'#8a2f2f':'#2a6a3c';n.textContent=t;n.style.display='block';clearTimeout(nt);nt=setTimeout(()=>{n.style.display='none'},9000)};const ed=()=>window.__tasEditorBase||window.__tasBase;const base=()=>{try{return new URL(ed()).origin}catch(_){return null}};const post=m=>{try{ui.f.contentWindow.postMessage(m,base())}catch(_){}};const mk=()=>{const w=document.createElement('div');w.style.cssText='position:fixed;inset:0;z-index:99999;display:none;background:#14161a';const f=document.createElement('iframe');f.style.cssText='width:100%;height:100%;border:0';f.setAttribute('sandbox','allow-scripts allow-same-origin allow-downloads');w.append(f);document.body.appendChild(w);return{w,f}};const sendTrack=async()=>{const p=window.__tasPage;let m;if(!p)m={error:'Open a track in the game first (the TAS editor works on the track you have open).'};else if(p.cat!=='custom')m={error:'The TAS editor only works on custom tracks (Custom tracks tab). This is not one.'};else try{const t=await p.getTrack();m={code:t.toExportString(p.meta),name:p.meta&&p.meta.name}}catch(e){m={error:'Could not read the track: '+e.message}}m.tasEditor='track';post(m)};const show=()=>{ui=ui||mk();open=!0;ui.w.style.display='block';if(!ui.f.src)ui.f.src=ed()+'/editor';else if(ready)sendTrack();setTimeout(()=>{try{ui.f.contentWindow.focus()}catch(_){}},50)};const hide=()=>{open=!1;if(ui)ui.w.style.display='none';try{document.activeElement&&document.activeElement.blur()}catch(_){}window.focus()};const tog=()=>{if(!open)return show();if(waiting){waiting=!1;hide();note('TAS: closed without running (editor did not answer).',1);return}if(ready){waiting=!0;note('TAS: asking the editor for your inputs \u2026 (press E again to cancel)');post({tasEditor:'requestClose'});setTimeout(()=>{if(open&&waiting){waiting=!1;hide();note('TAS: the editor did not answer in 90 s, nothing was started.',1)}},9e4)}else{hide();note('TAS: the editor panel was not ready, nothing was started.',1)}};window.__tasToggle=tog;addEventListener('keydown',e=>{if(window.__tasKeyOff||e.code!=='KeyE'||e.ctrlKey||e.metaKey||e.altKey)return;const t=e.target||{};if(/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||t.isContentEditable)return;tog();e.preventDefault()},true);addEventListener('message',e=>{if(!ui||e.source!==ui.f.contentWindow||e.origin!==base()||!e.data)return;const d=e.data;if(d.tasEditor==='ready'){ready=!0;if(open)sendTrack()}else if(d.tasEditor==='close'){waiting=!1;hide();if(!d.ghost)note(d.error?'TAS: '+String(d.error).slice(0,140):'TAS: the editor had no inputs to send.',1);else if(!window.__tasPage||!window.__tasRec)note('TAS: open a track page in the game first, then press E.',1);if(d.ghost&&typeof d.ghost==='string'&&d.ghost.length<2e6&&window.__tasPage&&window.__tasRec){try{const r=window.__tasPage.start(d.ghost,Math.max(1,Math.floor(Number(d.frames)||0)));if(r==='ok'){window.__tasLast={ghost:d.ghost,frames:Math.max(1,Math.floor(Number(d.frames)||0)),finished:!!d.finished,track:window.__tasPage.id,cat:window.__tasPage.cat};dispatchEvent(new Event('tas-last'))}if(r==='ok')note('TAS ghost '+d.ghost.slice(0,6)+' started ('+Math.floor(Number(d.frames)||0)+' frames'+(d.finished?'':', does NOT finish in the simulator')+'). Press a key to start.',!d.finished);else note('TAS: '+r,1)}catch(x){console.error('[TAS]',x)}}}})})();";

// the three code snippets inserted into the game (tokens match PML's main.bundle.js 0.6.3)
const PAGE_SNIPPET = `window.__tasPage={cat:d,id:u,meta:l,getTrack:async()=>h instanceof Function?await h():h,profile:()=>{const p=i.getCurrentUserProfile();return{nickname:p.nickname,countryCode:p.countryCode,carStyle:p.carStyle.serialize()}},start:(gh,fr)=>{console.info("[TAS] starting a race with ghost",gh.slice(0,6),"bytes",gh.length,"frames",fr);const rec=window.__tasRec&&window.__tasRec.deserialize(gh);if(!rec)return"bad ghost string";const pr=i.getCurrentUserProfile();y([{recording:rec,carStyle:pr.carStyle,nickname:"TAS "+gh.slice(0,6),time:new window.__tasTime(fr),isSelf:!1}]);return"ok"}};`;

// ---- part 4: optional "Submit to TasLB" (off by default; asks every time; uses a separate TAS token, never the PolyTrack account token) ----
const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const sha256hex = async (s) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, "0")).join("");
const tasToken = async () => {   // same format the game uses for its own tokens: 64 lowercase hex chars (sha256 of random bytes + uuid)
  let t = lsGet("tasToken");
  if (!/^[0-9a-f]{64}$/.test(t || "")) {
    t = await sha256hex(crypto.getRandomValues(new Uint8Array(32)).toString() + crypto.randomUUID());
    try { localStorage.setItem("tasToken", t); } catch (e) {}
  }
  return t;
};
// reads the ghost's input table (the same encoding the game uses) and returns the frame of its last input, or throws if it is not a valid ghost
const lastInputFrame = async (g) => {
  if (typeof g !== "string" || g.length > 400000 || !/^[A-Za-z0-9_-]+$/.test(g)) throw new Error("not a ghost string");
  const b = g.replace(/-/g, "+").replace(/_/g, "/");
  const raw = Uint8Array.from(atob(b + "=".repeat((4 - (b.length % 4)) % 4)), (c) => c.charCodeAt(0));
  const u = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream("deflate"))).arrayBuffer());
  let p = 0, last = 0;
  const rd = () => { if (p + 3 > u.length) throw new Error("ghost is cut off"); const v = u[p] | (u[p + 1] << 8) | (u[p + 2] << 16); p += 3; return v; };
  for (let k = 0; k < 5; k++) { const n = rd(); let f = 0; for (let i = 0; i < n; i++) { f += rd(); if (f > last) last = f; } }
  if (p !== u.length) throw new Error("ghost has extra data");
  return last;
};
const SUBMIT_UI = (pml) => {
  const enabled = () => String(pml.getSetting("tas_submit_enabled")) === "true";
  let box = null;
  const toast = (msg, bad) => {
    let n = document.getElementById("tas-submit-toast");
    if (!n) { n = document.createElement("div"); n.id = "tas-submit-toast"; n.style.cssText = "position:fixed;right:14px;bottom:60px;z-index:100000;padding:8px 14px;border-radius:6px;font:14px sans-serif;color:#fff;max-width:60vw"; document.body.appendChild(n); }
    n.style.background = bad ? "#8a2f2f" : "#2a6a3c"; n.textContent = msg; n.style.display = "block";
    setTimeout(() => { n.style.display = "none"; }, 12000);
  };
  const submit = async () => {
    const last = window.__tasLast, page = window.__tasPage;
    if (!enabled()) return toast("TAS submit is off (Settings > TAS).", true);
    if (!last || !last.finished || !page || page.id !== last.track || last.cat !== "custom") return toast("Nothing to submit: finish a run in the editor on this custom track first.", true);
    const prof = page.profile(), url = CFG.base + "/v6/leaderboard";
    let host = ""; try { host = new URL(url).hostname; } catch (e) {}
    if (!host || /(^|\.)kodub\.com$/i.test(host)) return toast("Refusing to submit: TAS runs are never sent to the official PolyTrack servers.", true);
    let lastIn;
    try { lastIn = await lastInputFrame(last.ghost); } catch (e) { return toast("Not submitting: " + e.message + ".", true); }
    const maxF = window.__tasRec && window.__tasRec.maxFrames;
    if (!Number.isSafeInteger(last.frames) || last.frames <= 0 || last.frames < lastIn || (Number.isFinite(maxF) && last.frames > maxF))
      return toast("Not submitting: the frame count (" + last.frames + ") does not fit the inputs (last input at frame " + lastIn + ").", true);
    const ok = confirm("Submit this TAS run?\n\nServer: " + new URL(url).host + "\nTrack id: " + last.track.slice(0, 12) + "...\nFrames: " + last.frames + "\nName: " + prof.nickname +
      "\n\nIt is sent with a separate TAS token (not your PolyTrack account token). The host verifies runs by hand.");
    if (!ok) return;
    const body = "version=0.6.3&userToken=" + encodeURIComponent(await tasToken()) + "&nickname=" + encodeURIComponent(prof.nickname) +
      (prof.countryCode ? "&countryCode=" + encodeURIComponent(prof.countryCode) : "") + "&carStyle=" + prof.carStyle + "&trackId=" + last.track + "&frames=" + last.frames + "&recording=" + last.ghost;
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
      const t = (await r.text()).slice(0, 200);
      toast(r.ok ? "Submitted (" + r.status + "). It stays unverified until the host checks it. " + t : "Server said " + r.status + ": " + t, !r.ok);
      if (r.ok && box) box.style.display = "none";
    } catch (e) { toast("Could not reach the server: " + e.message, true); }
  };
  const show = () => {
    if (!enabled() || !window.__tasLast || !window.__tasLast.finished) return;
    if (!box) {
      box = document.createElement("div");
      box.style.cssText = "position:fixed;right:14px;bottom:14px;z-index:99998;display:flex;gap:6px;font:14px sans-serif";
      const b = document.createElement("button"); b.textContent = "Submit this TAS run to TasLB"; b.style.cssText = "padding:8px 12px;border:0;border-radius:6px;background:#2a4a8a;color:#fff;cursor:pointer";
      b.addEventListener("click", submit);
      const x = document.createElement("button"); x.textContent = "×"; x.title = "Hide"; x.style.cssText = "padding:8px 10px;border:0;border-radius:6px;background:#444;color:#fff;cursor:pointer";
      x.addEventListener("click", () => { box.style.display = "none"; });
      box.append(b, x); document.body.appendChild(box);
    }
    box.style.display = "flex";
  };
  addEventListener("tas-last", show);
};

export let polyMod = new (class extends PolyMod {
  preInit = (pml) => {
    pml.registerGlobalMixin({ type: MixinType.INSERT, token: 'const U = document.createElement("button");', func: PAGE_SNIPPET });
    pml.registerGlobalMixin({ type: MixinType.INSERT, token: "getLeaderboard(e, t, n, i, r) {", func: "window.__tasRec=ie.A;window.__tasTime=xt.A;window.__tasTrackId=t;" });
    pml.registerGlobalMixin({ type: MixinType.INSERT, token: "getRecordings(e) {", func: "window.__tasMode&&(this.determinismState=Mo.Ok);" });
  };
  init = (pml) => {
    INSTALL();
    window.__tasKeyOff = true;   // the key is a PML keybind here (rebindable in the game's controls), not a fixed listener
    (0, eval)(EDITOR.split("window.__tasEditorBase||window.__tasBase").join(JSON.stringify(CFG.editorBase)));   // the editor frame address is pinned, not read from window
    pml.registerSettingCategory("TAS");
    pml.registerSetting("Allow submitting TAS runs to TasLB", "tas_submit_enabled", SettingType.BOOL, false);
    SUBMIT_UI(pml);
    pml.registerBindCategory("TAS");
    pml.registerKeybind("Open / close TAS editor", "tas_editor_toggle", "keydown", "KeyE", undefined, (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target || {};
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;   // typing a track name etc.
      if (window.__tasToggle) { window.__tasToggle(); e.preventDefault(); }
    });
  };
})();
