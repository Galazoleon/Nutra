# CornerMan

CornerMan is a free training coach that installs to your phone. It is a progressive web app (PWA): plain HTML, CSS and JavaScript with no build step, no backend and no API keys. Everything is stored on the device.

## What's inside

| Section | What it does |
|---|---|
| **Today** | Your next session, the weekly check-in when it's due, the event countdown with a daily camp checklist, and a quick "what did you learn today?" note |
| **Plan** | Four-week blocks built from sport, goal, days, minutes, gear and injuries. Weeks 1 to 3 build and week 4 recovers. Shows each check-in's changes |
| **Skills** | Technique chains (BJJ, MMA, wrestling, boxing), your own custom chains, 10 sports, and 259 exercises |
| **Journal** | Notes, class and sparring logs (rounds, subs, intensity, what worked, what to work on), clips from the device, and a film room |
| **Progress** | Volume and strength charts, goals with milestones, sparring stats and skill checklists |
| **Coach** | Offline rule-based coach: shorten, swap or ease a session, give technique cues, walk through chain links, open the check-in, save notes |

### How it adapts
- **Weekly check-in** (5 questions). Tired, poor sleep or beat up eases next week. Too easy adds sets. Fewer than half the sessions done repeats the week's targets. Pain removes exercises that load that area. Changing days rebuilds the remaining weeks. Travelling gives a bodyweight-only week.
- **Competition countdown.** Phases run base, build, sharpen, taper, the day before, event day, then recovery. Sessions in the final 7 days are cut by about 40% with effort capped. It never gives weight-cut advice.
- **New block** every four weeks. If two check-ins said training felt easy, it offers a level-up.

## Files
```
index.html            page shell
styles.css            all styles (light and dark)
js/data/sports.js     10 sports
js/data/exercises.js  exercise library, one row per exercise (data-only to extend)
js/data/chains.js     technique chains (data-only to extend)
js/engine.js          plan generator, check-in rules, countdown, taper, journal stats (pure functions)
js/coach.js           offline coach
js/store.js           localStorage state and IndexedDB clips
js/app.js             views and actions
sw.js                 offline cache (bump VERSION when files change)
manifest.webmanifest  install metadata and icons
tests/                node --test unit tests and a Playwright smoke test
```

## Tests
```bash
node --test tests/*.test.js
```
```bash
node tests/smoke.mjs
```
The smoke test serves the folder and runs onboarding, a workout, a check-in, chains, a journal entry with a clip, goals, the coach, backup and restore, then reloads offline.

## Hosting (needed before it can be installed)
A service worker needs HTTPS, so phones can only install CornerMan from a real web address. Any static host works because these files are the whole app:
- **Netlify Drop, Cloudflare Pages or Vercel** (free): upload or connect this `cornerman/` folder.
- **GitHub Pages**: works for a public repository, or a private one on a paid GitHub plan. Point Pages at this folder, or move it to its own repository.

Once hosted, open the address on a phone:
- **iPhone**: in Safari, tap Share, then Add to Home Screen.
- **Android**: in Chrome, use the Install button in Settings.

After the first visit it works offline.

When you change a file, bump `VERSION` in `sw.js` so phones get the update.

## Accounts, sync and AI: what they would need
This version needs no keys and no cloud account. Each of these needs a server:

| Feature | What it needs |
|---|---|
| Accounts and syncing between phone and computer | A backend such as Supabase (free tier). Its project URL and anon key can go in the app; protect the data with row-level security |
| Uploading clips to share with a coach | Cloud storage (Supabase Storage or S3). Cost grows with video size |
| Real community feed | Accounts plus moderation and reporting |
| Live AI coach | An Anthropic API key kept in a server function, **never in the app** |

Until then, Settings → Download a backup saves everything except clips to a file.

## Safety
CornerMan gives general fitness guidance, not medical advice. The coach checks every message for warning signs first (chest pain, fainting, head injury, disordered eating, weight cutting) and points to medical help.
