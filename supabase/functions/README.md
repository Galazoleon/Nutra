# Turning on photo reading and the live AI coach

Nutra uses two small server functions. Your Claude API key is stored on the server (Supabase) as a
private secret. It is **never** put in the app, in GitHub, or in a chat.

| Function | What it does | Code |
|---|---|---|
| `analyze-meal` | Looks at a meal photo and lists the foods ("2 eggs, 1 slice toast, 1 coffee"). You still review it before saving. | `analyze-meal/index.ts` |
| `coach` | Answers questions the 14 built-in answers don't cover, with safety rules and gentle mode. | `coach/index.ts` |

Both use Claude (`claude-opus-5-5`).

## Setup (about 15 minutes, all in your web browser)

### 1. Get a Claude API key
1. Go to **console.anthropic.com** and sign in.
2. Open **API Keys** and click **Create Key**. Name it "Nutra".
3. Copy the key. Keep this page open; you'll paste it in step 3.
4. Recommended: under **Limits** (billing), set a monthly spending limit you're comfortable with.

### 2. Create a Supabase project
1. Go to **supabase.com**, sign up (free), and click **New project**.
2. Name it "Nutra", pick a strong database password (save it somewhere), choose the region nearest you.
3. Wait a minute or two for it to finish.

### 3. Save the key as a secret
1. In your Supabase project, open **Edge Functions** in the left menu, then **Secrets**.
2. Add a secret with name `ANTHROPIC_API_KEY` and paste your key as the value. Click **Save**.

### 4. Create the two functions
Do this twice, once for each function:
1. In **Edge Functions**, click **Deploy a new function** → **Via Editor**.
2. Name it exactly `analyze-meal` (the second time: `coach`).
3. Delete the sample code, then paste in the whole file from this folder
   (`analyze-meal/index.ts`, then `coach/index.ts`). Click **Deploy**.
4. Open the function's **Details** (or settings) and turn **off** "Enforce JWT verification"
   (Verify JWT). If you'd rather leave it on, see step 5b.

### 5. Connect the app
1. In Supabase, open **Project Settings** → **Data API** (or **API**) and copy the **Project URL**
   (looks like `https://abcdefgh.supabase.co`).
2. In the Nutra folder, open `project.yml` in TextEdit and put the URL between the quotes:
   `NutraBackendURL: "https://abcdefgh.supabase.co"`
3. 5b (only if JWT verification is on): also copy the **anon public** key from the same page into
   `NutraBackendAnonKey: "..."`. This key is meant to be public; it is not your Claude key.
4. Save, then double-click **Open Nutra.command** again so Xcode picks up the change.

You can send me the Project URL safely. Never send the Claude API key.

## Check it works
- Log tab → **Photo** → pick a meal photo. Nutra should fill in the foods and open Review.
- Coach → **Ask a question** → ask something unusual, like "What's a good snack before swimming?"

If something doesn't work, open the function in Supabase and look at **Logs**. A message like
"ANTHROPIC_API_KEY secret is missing or wrong" means step 3 needs another look.

## Notes
- Costs: each photo or question is a small Claude API charge on your Anthropic account.
  The app only uses the coach function after its built-in answers, and free users get 3 questions a day.
- Safety: the server refuses diagnoses, treatment and weight-loss promises, keeps gentle mode number-free,
  and the app sends safety topics to a "please see a professional" reply before calling the server.
- If Claude's safety checks decline a request, Anthropic automatically retries it on a suitable
  model (`fallbacks: "default"`).
- Not built yet: `lookup-food` (barcode lookup) and `suggest-food`.
