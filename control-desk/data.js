// Sample data for the Control Desk UI. UI only: nothing here comes from the
// backend yet. The shapes follow CONTRACTS.md closely enough that swapping
// these arrays for API responses later is a small change.

const ZONES = [
  "Northern Railway", "Central Railway", "Eastern Railway", "Western Railway",
  "Southern Railway", "South Central Railway", "North Western Railway",
];

// Times are "HH:MM" (24h). A closure whose end is earlier than its start runs past midnight.
const CLOSURES = [
  {
    id: "BLK-101", from: "New Delhi", to: "Ghaziabad", start: "15:30", end: "17:00",
    teams: ["Track", "Signal"], status: "approved",
    why: "The quietest gap between trains this afternoon; both repairs fit inside it.",
    trains: [{ name: "Vande Bharat 22436", at: "14:50" }, { name: "Shatabdi 12004", at: "17:40" }],
  },
  {
    id: "BLK-102", from: "Mumbai CSMT", to: "Thane", start: "18:00", end: "19:30",
    teams: ["Electric wires", "Signal"], status: "waiting",
    why: "The only evening gap long enough for both teams before the night locals start.",
    trains: [{ name: "Deccan Queen 12124", at: "17:10" }, { name: "Vande Bharat 22226", at: "19:40" }],
  },
  {
    id: "BLK-103", from: "Howrah", to: "Bardhaman", start: "23:00", end: "02:00",
    teams: ["Track", "Signal", "Electric wires"], status: "approved",
    why: "Night gap with no passenger trains; all three teams work in one closure instead of three.",
    trains: [{ name: "Coromandel Express 12841", at: "21:40" }, { name: "Local 37811", at: "04:30" }],
  },
  {
    id: "BLK-104", from: "Chennai Central", to: "Arakkonam", start: "10:00", end: "11:30",
    teams: ["Track"], status: "approved",
    why: "Mid-morning lull after the office rush.",
    trains: [{ name: "Lalbagh Express 12607", at: "09:20" }, { name: "Local 43811", at: "12:10" }],
  },
  {
    id: "BLK-105", from: "Jaipur", to: "Ajmer", start: "13:00", end: "14:00",
    teams: ["Signal"], status: "sent-back",
    why: "Sent back: the signal team was not ready.",
    trains: [{ name: "Shatabdi 12015", at: "12:20" }, { name: "Intercity 12991", at: "14:40" }],
  },
];

// level: "urgent" | "important" | "info". closureId links an alert to a closure, if any.
const ALERTS = [
  { id: 1, level: "urgent", title: "Broken rail, needs repair soon",
    detail: "Bayana Jn → Dumariya · Track team · overdue 1,487 days · very likely to fail", action: "plan" },
  { id: 2, level: "urgent", title: "Plan failed the safety check",
    detail: "Mumbai CSMT → Thane · the closure ended too close to a passing train (needs a 15-minute gap)",
    action: "why", closureId: "BLK-102" },
  { id: 3, level: "urgent", title: "Signal fault, needs repair soon",
    detail: "Mumbai CSMT → Thane · Signal team · overdue 210 days · very likely to fail", action: "plan" },
  { id: 4, level: "important", title: "Closure waiting for your approval",
    detail: "Mumbai CSMT → Thane · 18:00 – 19:30", action: "why", closureId: "BLK-102" },
  { id: 5, level: "important", title: "Weld crack reported",
    detail: "Kanpur → Etawah · Track team · overdue 45 days", action: "plan" },
  { id: 6, level: "important", title: "Overhead wire sagging",
    detail: "Itarsi → Bhopal · Electric wires team · overdue 12 days", action: "plan" },
  { id: 7, level: "info", title: "Shared closure confirmed",
    detail: "Howrah → Bardhaman · Track, Signal and Electric wires teams told", action: "why", closureId: "BLK-103" },
  { id: 8, level: "info", title: "Closure finished on time",
    detail: "Chennai Central → Arakkonam · line open again", action: "why", closureId: "BLK-104" },
];

const SEND_BACK_REASONS = ["Clashes with a train", "A team is not ready", "Weather or site problem", "Other reason"];
