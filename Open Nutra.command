#!/bin/bash
# Double-click this file on your Mac to set up and open Nutra in Xcode.
# It makes the Xcode project from project.yml (using XcodeGen) and opens it.
cd "$(dirname "$0")" || exit 1
echo "Setting up Nutra..."

if ! xcode-select -p >/dev/null 2>&1 || [ ! -d "/Applications/Xcode.app" ]; then
  echo ""
  echo "Xcode is not installed yet. Install it free from the Mac App Store, open it once, then double-click this file again."
  open "macappstore://apps.apple.com/app/xcode/id497799835"
  read -r -p "Press Return to close."
  exit 1
fi

XCODEGEN="$(command -v xcodegen)"
if [ -z "$XCODEGEN" ]; then
  echo "Downloading XcodeGen (one time only)..."
  mkdir -p .tools
  curl -fsSL -o .tools/xcodegen.zip https://github.com/yonaskolb/XcodeGen/releases/latest/download/xcodegen.zip || {
    echo "Download failed. Check your internet connection and try again."; read -r -p "Press Return to close."; exit 1; }
  unzip -oq .tools/xcodegen.zip -d .tools
  XCODEGEN="$(pwd)/.tools/xcodegen/bin/xcodegen"
fi

"$XCODEGEN" generate || { echo "Project generation failed (see above)."; read -r -p "Press Return to close."; exit 1; }
echo "Opening Nutra in Xcode. Pick an iPhone simulator at the top and press the Run button (or Command-R)."
open NutraNutritionCoach.xcodeproj
