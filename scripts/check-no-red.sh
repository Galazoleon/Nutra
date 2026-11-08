#!/bin/sh
# Nutra rule: no red anywhere in the UI. Fails if app code uses red or destructive roles
# (destructive buttons render red in alerts, menus and swipe actions).
cd "$(dirname "$0")/.." || exit 1
if grep -rnE '\.red\b|Color\.red|UIColor\.red|systemRed|role: *\.destructive|\.pink\b' NutraNutritionCoach; then
  echo "Found red in the UI code above. Use Theme.amber for heads-ups instead."
  exit 1
fi
echo "No red found."
