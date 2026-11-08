# CLAUDE.md: Nutra project handoff

Read `docs/STATUS.md` first, then `docs/SIMPLICITY.md`. The product brief is `docs/BRIEF.md`.

## Layout
- `project.yml`: XcodeGen. Never edit the generated `.xcodeproj`; it is git-ignored. Never create targets any other way.
- `NutraCore/` (Swift package, `swift test`): models, TargetsEngine + safety rails, FoodParser, MealAnalyzer,
  Mulberry32 + MealPlanner + ShoppingList, WorkoutPlanner, CoachEngine, DashboardBuilder (gentle mode), Disclaimers,
  and JSON data in `Sources/NutraCore/Resources`. Do not restructure `Package.swift`.
- `NutraNutritionCoach/`: SwiftUI app. `Store/AppStore.swift` is the single source of truth (@MainActor @Observable).
- `scripts/data/*.py` generate the JSON. Change data there and re-run; adding a goal/recipe/etc. is data-only.

## Commands
- Logic tests: `cd NutraCore && swift test`
- Project: `xcodegen generate`
- Build: `xcodebuild build -project NutraNutritionCoach.xcodeproj -scheme NutraNutritionCoach -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO`
- No-red check: `./scripts/check-no-red.sh`

## Hard rules (tested; never break)
- Under 18 or pregnant: no calorie numbers, no weight-change goals (`GoalRules`), gentle mode forced.
- Floors 1,200 kcal female / 1,500 male or unspecified; deficit capped (20% and 500 kcal). 14-day trend rule.
- Gentle mode hides numbers in the view model (`DashboardBuilder`), never by scrubbing text. `GentleModeTests` scans every goal.
- No red in the UI, no `role: .destructive`, no shame, no streaks. Amber = heads-up, indigo = emphasis.
- "Estimate" and "educational, not medical advice" labels stay. Strings live in `Disclaimers.swift`.
- Never put an AI key in the app. Server calls go through `BackendService` to Supabase functions.
- Stubs are real code paths ending in `// NEEDS: <what>`.
- Keep it simple: see `docs/SIMPLICITY.md` before adding any screen or setting.

## Git
This project now lives on GitHub (`Galazoleon/Nutra`). Commit with clear messages. Do not change signing settings
or invent a Team; the bundle id `com.example.nutra` is a placeholder for the owner to replace.
