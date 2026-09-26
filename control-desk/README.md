# Control Desk: simplified UI for railway traffic Controllers

A new, simpler front end built from scratch for the people who run the
control room on long day and night shifts. It follows the wireframes in
[`docs/wireframes/control-desk.html`](../docs/wireframes/control-desk.html).

**UI only.** It runs on sample data (`data.js`) and isn't connected to the
backend yet. Reloading the page resets the sample data.

## Run it
No install and no build step. It's plain HTML, CSS and JavaScript.
```bash
python -m http.server 8766 --directory control-desk
```
Then open http://127.0.0.1:8766. Opening `index.html` directly also works in
most browsers.

## What's in it
| Screen | How to get there | What it does |
|---|---|---|
| Home | 🏠 or Esc | "N things need you now", the four main buttons in the centre, next closures |
| Urgent alerts | button 1 / 🔔 | Plain-language alerts in Urgent / Important / For information tabs; "Seen, plan it" or "See why" |
| Approve | button 2, or "Open" on any closure | Who, why, safety check, nearby trains. APPROVE is disabled until the safety check passes. SEND BACK asks for a reason. Both ask Yes/No first |
| Closures | button 3 / 📅 | All closures, filtered by All / Waiting / Approved / Sent back |
| Try a change | button 4, or "Try a different time" | Move a closure 15 minutes earlier or later and see SAFE / NOT SAFE at once. Nothing changes until "Use this time" is confirmed |
| Settings | ⚙ | Night mode (automatic 19:00–07:00, always day, always night), text size, sound for urgent alerts |
| Shift handover | 👤 or H | Summary for the next Controller: open urgent alerts, waiting approvals, closures happening now |

Try the built-in example: press **2**. The Mumbai CSMT → Thane closure is
NOT SAFE (10 minutes from a train), so press **Try a different time**, then
**←**. It's now SAFE; press **Enter** and confirm, then **Enter** again to
approve.

## Design rules it follows
- **Colours:** blue background, white buttons and cards, black text on
  them, white text directly on the blue. At night the blue deepens and the
  white softens to cut glare.
- **Top-bar icons:** 50 × 50 px.
- **Big buttons:** the four most-used actions sit in the centre, in the same
  place on every home screen. Keys 1–4 work too.
- **Keyboard:** Enter approve, B send back, ← → move time, Esc back,
  H handover.
- **Nothing moves or flashes.** Text is at least 18px, everything clickable
  is at least 48px tall, and focus is clearly visible on both blue and white.
- **Plain words, never colour alone.** Urgent alerts say URGENT and use a
  solid icon.

## Files
| File | What it holds |
|---|---|
| `index.html` | page shell: top bar, icons, dialog |
| `styles.css` | palette, sizes, night mode, phone layout |
| `app.js` | pages, actions, keyboard, safety check, night mode |
| `data.js` | sample closures, trains and alerts, to be replaced by the backend API later |

## Connecting it later
Replace the arrays in `data.js` with calls to the backend. Alerts already
match `backend_api`'s `notifications.json` fields closely (`level` ↔
`severity`, `title`, `detail` ↔ `message`). Closures will come from the
validated plan (CONTRACTS.md Interface 5). The safety check in `app.js` is a
simple train-gap rule for the demo. The real one is the Layer 7 validator.
