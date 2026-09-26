// RailOpt Control Desk: UI only, running on the sample data in data.js.
// Pages are chosen by the URL hash (#home, #alerts/urgent, #approve/BLK-102 ...),
// so the browser Back button works and every screen has its own link.

const SAFE_GAP_MIN = 15;           // minutes a closure must stay clear of any train
const STEP_MIN = 15;               // "earlier / later" step on Try a change
const NIGHT_FROM = 19, NIGHT_TO = 7;

const state = {
  closures: CLOSURES.map(c => ({ ...c, teams: [...c.teams], trains: [...c.trains] })),
  alerts: ALERTS.map(a => ({ ...a, seen: false })),
  tryOffset: {},                   // closure id -> minutes moved on Try a change
  message: null,                   // { text, hash }: a one-line confirmation, shown only on that page
  settings: load("settings", { night: "auto", large: false, sound: true }),
  zone: load("zone", ZONES[0]),
};

const app = document.getElementById("app");
const dialog = document.getElementById("dialog");

// ---------- small helpers ----------
function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem("controlDesk." + key)) ?? fallback; } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem("controlDesk." + key, JSON.stringify(value)); } catch { /* private mode: settings just won't persist */ }
}
function esc(text) {
  return String(text).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}
const toMin = hhmm => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const fmt = min => { const m = ((min % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
function span(c, offset = 0) {
  const start = toMin(c.start) + offset;
  let end = toMin(c.end) + offset;
  if (end <= start) end += 1440;   // runs past midnight
  return { start, end };
}
function length(c) {
  const { start, end } = span(c), mins = end - start, h = Math.floor(mins / 60), m = mins % 60;
  return [h && `${h} hour${h > 1 ? "s" : ""}`, m && `${m} minutes`].filter(Boolean).join(" ");
}
const closureById = id => state.closures.find(c => c.id === id);
const place = c => `${c.from} → ${c.to}`;
const teamsText = c => c.teams.length > 1 ? `${c.teams.join(" + ")} (shared)` : c.teams[0];
const statusTag = c => ({
  waiting: '<span class="tag solid">WAITING FOR YOU</span>',
  approved: '<span class="tag">✓ APPROVED</span>',
  "sent-back": '<span class="tag">SENT BACK</span>',
}[c.status]);

// Is this time slot clear of every train by SAFE_GAP_MIN? Checks the day before and after too,
// so a 23:00–02:00 closure sees a 00:30 train.
function safety(c, offset = 0) {
  const { start, end } = span(c, offset);
  for (const train of c.trains) {
    for (const shift of [-1440, 0, 1440]) {
      const t = toMin(train.at) + shift;
      if (t >= start && t <= end) {
        return { safe: false, text: `${train.name} runs at ${train.at}, during the closure.` };
      }
      const gap = t < start ? start - t : t - end;
      if (gap < SAFE_GAP_MIN) {
        const side = t < start ? "starts" : "ends";
        return { safe: false, text: `This ${side} only ${gap} minutes from ${train.name} (${train.at}). It needs a ${SAFE_GAP_MIN}-minute gap.` };
      }
    }
  }
  return { safe: true, text: `No train within ${SAFE_GAP_MIN} minutes.` };
}

function istNow() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const hour = Number(parts.find(p => p.type === "hour").value);
  const minute = Number(parts.find(p => p.type === "minute").value);
  return { hour, minute, text: fmt(hour * 60 + minute) };
}
const isNightTime = () => { const { hour } = istNow(); return hour >= NIGHT_FROM || hour < NIGHT_TO; };
const nightOn = () => state.settings.night === "night" || (state.settings.night === "auto" && isNightTime());

const openUrgent = () => state.alerts.filter(a => a.level === "urgent" && !a.seen);
const waiting = () => state.closures.filter(c => c.status === "waiting");

function beep() {
  try {
    const ctx = new AudioContext(), osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.frequency.value = 660; gain.gain.value = 0.08;
    osc.connect(gain).connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.25);
  } catch { /* no audio available */ }
}

// ---------- pages ----------
function pageHome() {
  const urgent = openUrgent().length, wait = waiting(), total = state.closures.filter(c => c.status !== "sent-back").length;
  const need = urgent + wait.length;
  const upcoming = state.closures.filter(c => c.status !== "sent-back").sort((a, b) => toMin(a.start) - toMin(b.start));
  return `
    <h1>${need ? `${need} thing${need > 1 ? "s" : ""} need${need > 1 ? "" : "s"} you now` : "Nothing needs you right now"}</h1>
    <p class="sub">Press a big button, or the number key shown on it</p>
    <div class="hub">
      <button class="big ${urgent ? "needs" : ""}" data-go="#alerts/urgent" data-key="1">⚠ URGENT ALERTS<span class="count">${urgent}</span><span class="key">1</span></button>
      <button class="big ${wait.length ? "needs" : ""}" data-go="${wait.length === 1 ? "#approve/" + wait[0].id : "#closures/waiting"}" data-key="2">✓ APPROVE PLAN<span class="count">${wait.length} waiting</span><span class="key">2</span></button>
      <button class="big" data-go="#closures" data-key="3">▦ ${nightOn() ? "TONIGHT'S" : "TODAY'S"} CLOSURES<span class="count">${total}</span><span class="key">3</span></button>
      <button class="big" data-go="#try" data-key="4">↻ TRY A CHANGE<span class="key">4</span></button>
    </div>
    <section class="card" aria-labelledby="next-h">
      <h2 id="next-h">Next closures on your zone</h2>
      ${upcoming.map(closureRow).join("")}
    </section>`;
}

function closureRow(c) {
  return `
    <div class="row">
      <span class="time">${esc(c.start)} – ${esc(c.end)}</span>
      <span class="grow">${esc(place(c))}</span>
      <span class="tag">${esc(teamsText(c))}</span>
      ${statusTag(c)}
      <button class="btn" data-go="#approve/${esc(c.id)}">Open</button>
    </div>`;
}

const LEVELS = [["urgent", "Urgent"], ["important", "Important"], ["info", "For information"]];

function pageAlerts(level = "urgent") {
  const shown = state.alerts.filter(a => a.level === level && !a.seen);
  const seen = state.alerts.filter(a => a.level === level && a.seen).length;
  const tabs = LEVELS.map(([key, label]) => {
    const n = state.alerts.filter(a => a.level === key && !a.seen).length;
    return `<button class="btn on-bg" aria-pressed="${key === level}" data-go="#alerts/${key}">${label} (${n})</button>`;
  }).join("");
  return `
    ${backButton()}
    <h1>${LEVELS.find(l => l[0] === level)[1]} alerts: ${shown.length} open</h1>
    <div class="tabs" role="group" aria-label="Alert level">${tabs}</div>
    <section class="card">
      ${shown.length ? shown.map(alertRow).join("") : '<p class="empty">Nothing here. Well done.</p>'}
      ${seen ? `<p class="muted" style="padding-bottom:12px">${seen} already marked as seen.</p>` : ""}
    </section>`;
}

function alertRow(a) {
  const urgent = a.level === "urgent";
  const button = a.action === "plan"
    ? `<button class="btn" data-act="seen" data-id="${a.id}">Seen, plan it</button>`
    : `<button class="btn" data-go="#approve/${esc(a.closureId)}">See why</button>`;
  return `
    <div class="row">
      <span class="warn ${urgent ? "" : "hollow"}" aria-hidden="true">!</span>
      <div class="grow">
        <b>${urgent ? "URGENT · " : ""}${esc(a.title)}</b><br>
        <span class="muted">${esc(a.detail)}</span>
      </div>
      ${button}
    </div>`;
}

const FILTERS = [["all", "All"], ["waiting", "Waiting for you"], ["approved", "Approved"], ["sent-back", "Sent back"]];

function pageClosures(filter = "all") {
  const list = state.closures
    .filter(c => filter === "all" || c.status === filter)
    .sort((a, b) => toMin(a.start) - toMin(b.start));
  const tabs = FILTERS.map(([key, label]) => {
    const n = state.closures.filter(c => key === "all" || c.status === key).length;
    return `<button class="btn on-bg" aria-pressed="${key === filter}" data-go="#closures/${key}">${label} (${n})</button>`;
  }).join("");
  return `
    ${backButton()}
    <h1>${nightOn() ? "Tonight's" : "Today's"} closures</h1>
    <div class="tabs" role="group" aria-label="Show">${tabs}</div>
    <section class="card">
      ${list.length ? list.map(closureRow).join("") : '<p class="empty">No closures in this list.</p>'}
    </section>`;
}

function pageApprove(id) {
  const c = closureById(id);
  if (!c) return notFound();
  const check = safety(c);
  const shared = c.teams.length > 1 ? ` working together (saves ${c.teams.length - 1} extra closure${c.teams.length > 2 ? "s" : ""})` : "";
  let actions;
  if (c.status === "waiting") {
    actions = `
      <div class="decide">
        <button class="big" data-act="approve" data-id="${esc(c.id)}" ${check.safe ? "" : "disabled"}>✓ APPROVE<span class="key">Enter</span></button>
        <button class="big" data-act="send-back" data-id="${esc(c.id)}">← SEND BACK<span class="key">B</span></button>
      </div>
      ${check.safe ? "" : '<p class="sub" style="margin:0">It can\'t be approved until it is safe. Try a different time.</p>'}`;
  } else {
    actions = `<p class="message">${c.status === "approved" ? "✓ Already approved. The teams have been told." : esc(c.why)}</p>`;
  }
  return `
    ${backButton()}
    <h1>Close ${esc(place(c))}</h1>
    <p class="sub" style="margin-top:-8px;font-size:1.3rem"><b>${esc(c.start)} – ${esc(c.end)}</b> (${length(c)})</p>
    <section class="card">
      <dl class="facts">
        <dt>Who works in it</dt><dd>${esc(c.teams.join(" + "))} team${c.teams.length > 1 ? "s" : ""}${shared}</dd>
        <dt>Why this time</dt><dd>${esc(c.why)}</dd>
        <dt>Safety check</dt><dd><b>${check.safe ? "PASSED ✓" : "NOT SAFE ✕"}</b> ${esc(check.text)}</dd>
        <dt>Trains nearby</dt><dd>${c.trains.map(t => `${esc(t.name)} at ${esc(t.at)}`).join("<br>")}</dd>
      </dl>
    </section>
    ${actions}
    <button class="btn on-bg" data-go="#try/${esc(c.id)}">↻ Try a different time</button>`;
}

function pageTry(id) {
  if (!id) {
    const list = state.closures.filter(c => c.status !== "sent-back").sort((a, b) => toMin(a.start) - toMin(b.start));
    return `
      ${backButton()}
      <h1>Which closure do you want to move?</h1>
      <p class="sub">Nothing changes for real until you press "Use this time"</p>
      <section class="card">
        ${list.map(c => `
          <div class="row">
            <span class="time">${esc(c.start)} – ${esc(c.end)}</span>
            <span class="grow">${esc(place(c))}</span>
            ${statusTag(c)}
            <button class="btn" data-go="#try/${esc(c.id)}">Choose</button>
          </div>`).join("")}
      </section>`;
  }
  const c = closureById(id);
  if (!c) return notFound();
  const offset = state.tryOffset[id] || 0;
  const { start, end } = span(c, offset);
  const check = safety(c, offset);
  return `
    ${backButton()}
    <h1>Try moving: ${esc(place(c))}</h1>
    <p class="sub">Now ${esc(c.start)} – ${esc(c.end)}. Nothing changes for real until you press "Use this time"</p>
    <div class="shift">
      <button class="big" data-act="earlier" data-id="${esc(id)}">◀ ${STEP_MIN} MIN EARLIER<span class="key">←</span></button>
      <div class="slot" aria-live="polite">${fmt(start)} – ${fmt(end)}</div>
      <button class="big" data-act="later" data-id="${esc(id)}">${STEP_MIN} MIN LATER ▶<span class="key">→</span></button>
    </div>
    <section class="card result" aria-live="polite">
      <p><b>${check.safe ? "Result: SAFE ✓" : "Result: NOT SAFE ✕"}</b> ${esc(check.text)}</p>
    </section>
    <div class="decide">
      <button class="big" data-act="use-time" data-id="${esc(id)}" ${check.safe && offset ? "" : "disabled"}>USE THIS TIME<span class="key">Enter</span></button>
      <button class="big" data-act="cancel-try" data-id="${esc(id)}">CANCEL<span class="key">Esc</span></button>
    </div>`;
}

function pageSettings() {
  const s = state.settings;
  const choice = (group, value, label) =>
    `<button class="btn" aria-pressed="${s[group] === value}" data-act="set" data-group="${group}" data-value="${JSON.stringify(value).replace(/"/g, "&quot;")}">${label}</button>`;
  return `
    ${backButton()}
    <h1>Settings</h1>
    <section class="card">
      <div class="setting"><span class="label">Night mode</span>
        ${choice("night", "auto", `Automatic (${fmt(NIGHT_FROM * 60)}–${fmt(NIGHT_TO * 60)})`)}${choice("night", "day", "Always day")}${choice("night", "night", "Always night")}</div>
      <div class="setting"><span class="label">Text size</span>
        ${choice("large", false, "Normal")}${choice("large", true, "Large")}</div>
      <div class="setting"><span class="label">Sound for urgent alerts</span>
        ${choice("sound", true, "On")}${choice("sound", false, "Off")}
        <button class="btn" data-act="test-sound">Test sound</button></div>
      <div class="setting"><span class="label">Keyboard</span>
        <span>1–4 main buttons · Enter approve · B send back · ← → move time · Esc back · H handover</span></div>
    </section>
    <section class="card">
      <h2>Moved off the main screens</h2>
      <p>The corridor map, charts, decision trace, COA circular and solver status stay in the full planning dashboard. They were taken off this desk so the Controller only sees what needs action.</p>
    </section>`;
}

function notFound() {
  return `${backButton()}<h1>That page doesn't exist</h1>`;
}
const backButton = () => `<div style="align-self:flex-start"><button class="btn on-bg" data-go="#home">← Back to Home <span class="key">Esc</span></button></div>`;

// ---------- rendering ----------
function route() {
  const [page, arg] = location.hash.replace(/^#/, "").split("/");
  return { page: page || "home", arg: arg && decodeURIComponent(arg) };
}

let lastHash = null;
function render() {
  const { page, arg } = route();
  const pages = { home: pageHome, alerts: pageAlerts, closures: pageClosures, approve: pageApprove, try: pageTry, settings: pageSettings };
  const html = (pages[page] || notFound)(arg);
  const msg = state.message && state.message.hash === location.hash ? state.message.text : "";
  app.innerHTML = (msg ? `<p class="message" role="status">${esc(msg)}</p>` : "") + html;

  const nav = { home: "home", alerts: "alerts", closures: "closures", approve: "closures", try: "home", settings: "settings" }[page];
  document.querySelectorAll(".nav .icon-btn").forEach(a => { if (a.dataset.page === nav) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });

  const urgent = openUrgent().length;
  document.getElementById("alert-badge").textContent = urgent || "";
  document.title = (urgent ? `(${urgent}) ` : "") + "RailOpt Control Desk";

  if (location.hash !== lastHash) {       // a new page: move focus to it (screen readers announce it)
    lastHash = location.hash;
    app.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
}

function updateChrome() {
  const now = istNow();
  document.body.classList.toggle("night", nightOn());
  document.body.classList.toggle("large", !!state.settings.large);
  document.getElementById("clock").innerHTML = `<b>${now.text} IST</b> · ${isNightTime() ? "Night" : "Day"} shift`;
  document.getElementById("foot").textContent = `Zone: ${state.zone} · Sample data: not connected to the live system yet`;
}

function go(hash) {
  if (location.hash === hash) render(); else location.hash = hash;
}

// Show a confirmation on the current page (and only there).
function say(text) {
  state.message = { text, hash: location.hash };
  render();
}

// ---------- dialogs (every irreversible action asks first) ----------
function ask({ title, body, yes, onYes, disabledYes = false }) {
  document.getElementById("dialog-title").textContent = title;
  document.getElementById("dialog-body").innerHTML = body;
  const actions = document.getElementById("dialog-actions");
  actions.innerHTML = `<button class="btn" value="no">${yes ? "No, go back" : "Close"}</button>` + (yes ? `<button class="btn" value="yes" ${disabledYes ? "disabled" : ""} style="background:var(--ink);color:var(--btn)">${esc(yes)}</button>` : "");
  actions.onclick = e => {
    const b = e.target.closest("button");
    if (!b) return;
    dialog.close();
    if (b.value === "yes") onYes();
  };
  dialog.showModal();
  actions.querySelector("button").focus();   // default focus on the safe choice
}

function handover() {
  const now = istNow(), nowMin = now.hour * 60 + now.minute;
  const running = state.closures.filter(c => {
    if (c.status !== "approved") return false;
    const { start, end } = span(c);
    return (nowMin >= start && nowMin <= end) || (nowMin + 1440 >= start && nowMin + 1440 <= end);
  });
  const list = items => items.length ? `<ul>${items.map(i => `<li>${esc(i)}</li>`).join("")}</ul>` : "<p class='muted'>None.</p>";
  ask({
    title: `Shift handover · ${now.text} IST`,
    body: `
      <p><b>Urgent alerts still open</b></p>${list(openUrgent().map(a => a.title + " — " + a.detail.split(" · ")[0]))}
      <p><b>Waiting for approval</b></p>${list(waiting().map(c => `${place(c)}, ${c.start} – ${c.end}`))}
      <p><b>Closures happening now</b></p>${list(running.map(c => `${place(c)}, until ${c.end}`))}`,
  });
}

// ---------- actions ----------
function act(btn) {
  const { act: name, id } = btn.dataset;
  const c = id && closureById(id);

  if (name === "seen") {
    const a = state.alerts.find(x => String(x.id) === id);
    a.seen = true;
    say(`Marked as seen: ${a.title}. It goes into the next plan.`);
  } else if (name === "approve") {
    ask({
      title: "Approve this closure?",
      body: `<p><b>${esc(place(c))}</b>, ${esc(c.start)} – ${esc(c.end)}</p><p>${esc(c.teams.join(" + "))} team${c.teams.length > 1 ? "s" : ""} will be told straight away.</p>`,
      yes: "Yes, approve",
      onYes: () => {
        c.status = "approved";
        state.alerts.filter(a => a.closureId === c.id && a.level !== "info").forEach(a => { a.seen = true; });
        go("#home");
        say(`Approved: ${place(c)}, ${c.start} – ${c.end}. The ${c.teams.join(" and ")} team${c.teams.length > 1 ? "s have" : " has"} been told.`);
      },
    });
  } else if (name === "send-back") {
    let reason = null;
    ask({
      title: "Send this closure back?",
      body: `<p>Choose why, so the planners know what to fix:</p>
        <div class="choices" id="reasons">${SEND_BACK_REASONS.map(r => `<button class="btn" aria-pressed="false" data-reason="${esc(r)}">${esc(r)}</button>`).join("")}</div>`,
      yes: "Yes, send back",
      disabledYes: true,
      onYes: () => {
        c.status = "sent-back";
        c.why = `Sent back: ${reason}.`;
        state.alerts.filter(a => a.closureId === c.id && a.level !== "info").forEach(a => { a.seen = true; });
        go("#home");
        say(`Sent back: ${place(c)} (${reason}). The planners have been told.`);
      },
    });
    document.getElementById("reasons").onclick = e => {
      const b = e.target.closest("button[data-reason]");
      if (!b) return;
      reason = b.dataset.reason;
      document.querySelectorAll("#reasons button").forEach(x => x.setAttribute("aria-pressed", x === b));
      document.querySelector('#dialog-actions button[value="yes"]').disabled = false;
    };
  } else if (name === "earlier" || name === "later") {
    state.tryOffset[id] = (state.tryOffset[id] || 0) + (name === "earlier" ? -STEP_MIN : STEP_MIN);
    render();
  } else if (name === "use-time") {
    const { start, end } = span(c, state.tryOffset[id]);
    ask({
      title: "Move this closure?",
      body: `<p><b>${esc(place(c))}</b></p><p>From ${esc(c.start)} – ${esc(c.end)} to <b>${fmt(start)} – ${fmt(end)}</b>.</p>${c.status === "approved" ? "<p>It was already approved, so it will need approving again.</p>" : ""}`,
      yes: "Yes, use this time",
      onYes: () => {
        c.start = fmt(start); c.end = fmt(end);
        if (c.status === "approved") c.status = "waiting";
        delete state.tryOffset[id];
        go("#approve/" + id);
        say(`Time changed to ${c.start} – ${c.end}. Safety check: ${safety(c).safe ? "PASSED" : "NOT SAFE"}.`);
      },
    });
  } else if (name === "cancel-try") {
    delete state.tryOffset[id];
    go("#approve/" + id);
  } else if (name === "set") {
    state.settings[btn.dataset.group] = JSON.parse(btn.dataset.value);
    save("settings", state.settings);
    updateChrome();
    render();
  } else if (name === "test-sound") {
    beep();
  }
}

app.addEventListener("click", e => {
  const b = e.target.closest("button");
  if (!b || b.disabled) return;
  if (b.dataset.go) go(b.dataset.go);
  else if (b.dataset.act) act(b);
});

// ---------- keyboard ----------
document.addEventListener("keydown", e => {
  if (dialog.open || e.ctrlKey || e.altKey || e.metaKey) return;
  if (["SELECT", "INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
  const onButton = e.target.tagName === "BUTTON" || e.target.tagName === "A";
  const { page } = route();
  const press = sel => { const b = app.querySelector(sel); if (b && !b.disabled) { e.preventDefault(); b.click(); } };

  if (e.key === "h" || e.key === "H") { e.preventDefault(); handover(); }
  else if (e.key === "Escape") {
    if (page === "try") press('[data-act="cancel-try"]');
    else if (page !== "home") { e.preventDefault(); go("#home"); }
  }
  else if (page === "home" && "1234".includes(e.key)) press(`[data-key="${e.key}"]`);
  else if (page === "approve" && e.key === "Enter" && !onButton) press('[data-act="approve"]');
  else if (page === "approve" && (e.key === "b" || e.key === "B")) press('[data-act="send-back"]');
  else if (page === "try" && e.key === "ArrowLeft") press('[data-act="earlier"]');
  else if (page === "try" && e.key === "ArrowRight") press('[data-act="later"]');
  else if (page === "try" && e.key === "Enter" && !onButton) press('[data-act="use-time"]');
});

// ---------- start ----------
const zoneSelect = document.getElementById("zone");
zoneSelect.innerHTML = ZONES.map(z => `<option ${z === state.zone ? "selected" : ""}>${esc(z)}</option>`).join("");
zoneSelect.addEventListener("change", () => { state.zone = zoneSelect.value; save("zone", state.zone); updateChrome(); });
document.getElementById("me").addEventListener("click", handover);
window.addEventListener("hashchange", () => { render(); });

updateChrome();
render();
setInterval(() => { updateChrome(); if (route().page === "home") render(); }, 20000);   // clock + automatic night mode
