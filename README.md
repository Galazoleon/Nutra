# Nutra

An educational nutrition and fitness app for iPhone (SwiftUI, iOS 17+, Swift 6).
Nutra is educational, is not medical advice, and is not a medical device.
All built-in nutrition values are estimates, not USDA-verified.

## Run it on your Mac (easiest way)

1. Install Xcode from the Mac App Store and open it once.
2. Unzip Nutra, then double-click **Open Nutra.command**.
   (If your Mac says it can't be opened, right-click it, choose **Open**, then **Open** again.)
3. When Xcode opens, pick an iPhone simulator at the top and press Run (⌘R).

## Run it on your Mac (by hand)

1. Install Xcode (from the Mac App Store) and XcodeGen (`brew install xcodegen`).
2. Get this repository onto your Mac and open Terminal in its folder.
3. Make the Xcode project:
   ```bash
   xcodegen generate
   ```
4. Open `NutraNutritionCoach.xcodeproj`, choose an iPhone simulator at the top, press Run (⌘R).

To run the logic tests (fast, no simulator needed):
```bash
cd NutraCore && swift test
```

## What's where

| Folder | What it holds |
|---|---|
| `project.yml` | The project recipe. Change this, not the `.xcodeproj`, then run `xcodegen generate`. |
| `NutraCore/` | All pure logic and built-in data (foods, goals, recipes, workouts, coach). Tested with `swift test`. |
| `NutraNutritionCoach/` | The iPhone app screens. |
| `scripts/data/` | Python scripts that build the JSON data files. Edit and re-run them to change data. |
| `docs/` | Status, simplicity rules, build log and the product brief. |
| `supabase/functions/` | Contract for the server functions (AI keys live on the server, never in the app). |

Start with `docs/STATUS.md` to see what works, what is stubbed, and what is next.
