# Keeping Nutra simple and accessible

Nutra covers a lot (37 goals, 58 foods, 32 recipes, workouts, a coach). The person using it
should never feel that weight. These rules decide how every screen is built.

## The ten rules

1. **One main action per screen.** It is the big indigo button. Everything else is quieter.
2. **Show a little, offer more.** Start with the few things most people need; put the rest behind
   "See more", "More detail" or a disclosure arrow.
3. **Only ask what's needed.** Setup needs a name and a goal. Everything else can be skipped and filled in later.
4. **Plain words.** "Feel better" instead of "Health aims". "Sore or injured?" instead of "Rehab".
   No jargon without a one-line explanation.
5. **Choose, don't type.** Chips, pickers and steppers instead of forms wherever possible.
6. **Never more than about six choices at once.** The 37 goals start as 7 popular ones, then 6 categories.
7. **Kind by default.** No red, no streaks, no "you went over". Going past an estimate gets a calm sentence.
   Gentle mode removes every number.
8. **Big targets.** Every tappable thing is at least 44 points tall (Nutra uses 48).
9. **Works with assistive tech.** Every control has a VoiceOver label, cards read as one sentence,
   text uses Dynamic Type styles (no fixed font sizes), and decoration is hidden from VoiceOver.
10. **Honest labels.** "Estimate", "Your food, not verified", and "educational, not medical advice"
    appear wherever numbers or advice appear.

## How the prototype's features were reorganized

| Prototype | iPhone app | Why |
|---|---|---|
| 37 goals on the first page | 7 "Most picked", then 6 categories behind "See more goals" | Avoid a wall of choices |
| Long layered onboarding (welcome, goals, training, body, life stage, diet, cuisine, kitchen, numbers, health, Pro, summary) | 6 pages: You, Goal, Body (skippable), Food (skippable), Style, Summary with an optional Pro section | Same information, fewer stops. Training details are asked in Coach → Workout plan when needed. |
| Coach: scrollable bar of 9 segments | A list with 3 groups: **Ask**, **Eat** (Meal ideas, Recipes, My foods), **Move** (Workout plan, Sore or injured?) | People scan a short list faster than a sideways bar |
| Review screen shows everything at once | Summary + quick take first; glycemic index/load and 10 micronutrients under "More detail" | Most people want the headline |
| Diets / Cuisines / Countries / Allergy segments | Allergies and diet style are applied automatically everywhere (planner, recipes, review heads-up). Cuisines and Countries are planned for later. | Fewer places to look; the protection just happens |
| Separate voice logging screen | "Speak" uses the iPhone keyboard's own dictation in the same box | One box for every way of logging; dictation is already accessible |

## Checklist before adding anything new
- Can it live inside an existing screen instead of a new one?
- Does the person need it on day one? If not, put it behind "More".
- Does it work in gentle mode with no numbers?
- Does it read well with VoiceOver and at the largest text size?
- Is there any red, pressure, or shame? Remove it.
