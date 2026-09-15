# Focus Lab — Pomodoro + Focus Analytics

> Offline research lab to track focus sessions, interruptions & flow, and generate a data-driven report. Split from StudyFlow, focused only on **focus**.

**Live:** https://flynntaggart26.github.io/focus-lab/ · **Stack:** Vanilla HTML/CSS/JS · **Storage:** `localStorage` (no account)

---

## What it does

A Pomodoro timer is easy. Understanding *why* you were focused is research.

### ⏱ Timer
- Presets: **25/5, 50/10, 45/15, 90/20 Flow** + Custom
- Task + tag, **interruption counter** (+1 per distraction), circular progress
- Cycle tracking (long break every 4), auto-start, sound (Web Audio beep), browser notification
- After each focus block: **rate focus 1-5** → Save or Discard

### 📊 Analytics (the research part)
- Filter: Last 7 / 30 / All
- KPIs: total focus minutes, sessions, avg focus, interruptions/session, deep work %, streak
- **Daily bar** (focus minutes), **Hourly heatmap** (when you peak), **Technique comparison** (avg focus by preset), **Interruptions vs Focus scatter**
- **Auto-insights:** e.g. “0 interruptions → +0.8 focus”, “Peak 09:00 (4.3/5)”, “Best technique: 50/10” — generated from your data

### 📝 Sessions
- Table with search / type / min-focus filters, delete, CSV/JSON

### 📄 Report
- Print-ready research report: period, totals, insights, filtered session table, methodology. **Print / Save as PDF** + CSV/JSON

---

## How to use (30s)

1. Pick preset (start with 25/5)
2. Type task → Start → work until beep → rate focus → Save
3. Check **Analytics** after 5+ sessions — insights appear
4. Switch preset to 50/10 for a day, compare in Technique chart

---

## Data & methodology

- Each session: `task, planned, duration, interruptions (self-counted), focus (1-5), preset, timestamps`
- **Deep work** = ≥25 min + 0 interruptions + ≥4/5
- All data stays in browser (`localStorage` keys `fl-sessions`, `fl-settings`). No tracking.
- Sample data preloaded for demo.

---

## Project structure

```
focus-lab/
├── index.html
├── style.css
├── app.js
└── README.md
```

## Getting started

```bash
git clone https://github.com/Flynntaggart26/focus-lab.git
cd focus-lab
open index.html
```

## License

MIT
