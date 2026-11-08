# Build log

## 2026-11-08: first version written from the master prompt
- Repository was empty; prototype and spec files were not available, so the app was built from the
  master prompt (summarized in `docs/BRIEF.md`).
- Built: XcodeGen project, NutraCore package (logic + data + tests), SwiftUI app (onboarding, Today, Log,
  Review, Coach, Profile).
- Simplified the structure for accessibility (see `docs/SIMPLICITY.md`).
- Verified here: JSON data generated and checked (calorie math, counts); meal planner and Mulberry32
  checked against a Python re-implementation; no-red script passes.
- Not verified here: Swift compile, `swift test`, simulator run. No Swift toolchain in the cloud workspace.

## 2026-11-08: server functions for photo reading and live coach
- Added Supabase Edge Functions `analyze-meal` and `coach` (Claude `claude-opus-5-5`, key as server secret only,
  refusal fallback on). Type-checked with Deno against `@anthropic-ai/sdk@1.6.0`; locally tested the
  input checks, the missing-key message and a rejected-key reply. Not tested with a real key.
- App: photos are converted to JPEG and shrunk before upload; coach sends gentle mode and under-18 flags;
  optional Supabase anon key header.
