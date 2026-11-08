# Server functions (contract)

The app never holds an AI or food-database key. It calls these Supabase Edge Functions,
which hold the keys as server secrets. Set the project URL in `project.yml` → `NutraBackendURL`.

All requests are `POST {NutraBackendURL}/functions/v1/<name>` with a JSON body. Any non-200 reply makes
the app fall back to its on-device behavior.

| Function | Request | Reply | Status |
|---|---|---|---|
| `analyze-meal` | `{ "imageBase64": "<jpeg>" }` | `{ "description": "2 eggs, toast, coffee" }` | Not deployed |
| `coach` | `{ "question": "...", "context": "Goal: ..." }` | `{ "answer": "..." }` | Not deployed |
| `lookup-food` | `{ "barcode": "..." }` or `{ "query": "..." }` | food fields | Not deployed |
| `suggest-food` | a person-made food | `{ "ok": true }` | Not deployed |

Server rules: the coach must refuse diagnoses, treatment and weight-loss promises, keep the
"educational, not medical advice" framing, and never give numbers to people under 18 or pregnant.
