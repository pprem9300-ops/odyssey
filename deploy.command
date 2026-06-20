#!/bin/bash
# ───────────────────────────────────────────────────────────────────────────
#  deploy.command  ·  double-click to publish Odyssey to a permanent public URL
#  Uses Vercel — free, no credit card. First run opens a browser login;
#  every run after that is one click and instant.
# ───────────────────────────────────────────────────────────────────────────

DIR="/Users/mikevandyke/Desktop/odyssey"
cd "$DIR" || { echo "Could not find $DIR"; exit 1; }

printf '\n'
printf '   ╭───────────────────────────────────────────────╮\n'
printf '   │   🚀  D E P L O Y   O D Y S S E Y             │\n'
printf '   │       free permanent public https link        │\n'
printf '   ╰───────────────────────────────────────────────╯\n'
printf '\n'

# Need Node / npx ----------------------------------------------------------
if ! command -v npx >/dev/null 2>&1; then
  printf '   ✗  Node.js is not installed (needed once for the deploy tool).\n'
  printf '\n'
  printf '      Install it free in 2 minutes:\n'
  printf '         1. Open  https://nodejs.org\n'
  printf '         2. Download the big green "LTS" button, run the installer.\n'
  printf '         3. Then double-click deploy.command again.\n'
  printf '\n'
  read -r -p "   Press Return to close… " _
  exit 1
fi

printf '   This publishes the Odyssey folder to the internet over HTTPS.\n'
printf '\n'
printf '     • FIRST time: a browser tab opens to log in to Vercel\n'
printf '       (free, no credit card — "Continue with Email" is fine).\n'
printf '     • EVERY time after: no login, deploy finishes in seconds.\n'
printf '\n'
printf '   When it finishes it prints a  https://…vercel.app  link.\n'
printf '   Open that on your iPhone, then  Share → Add to Home Screen.\n'
printf '\n'
printf '   ─────────────────────────────────────────────────\n'
printf '\n'

# One free public deploy ----------------------------------------------------
# --prod  → production URL (stable, not a preview)
# --yes   → accept the default project settings without prompting
npx --yes vercel deploy --prod --yes

STATUS=$?
printf '\n'
printf '   ─────────────────────────────────────────────────\n'
if [ "$STATUS" -eq 0 ]; then
  printf '   ✓  Done! Copy the https link printed just above.\n'
  printf '      Open it on your phone → Share → Add to Home Screen.\n'
else
  printf '   ✗  Deploy did not finish (exit code %s).\n' "$STATUS"
  printf '      Most often this just means the login was cancelled —\n'
  printf '      double-click deploy.command and try again.\n'
fi
printf '\n'
read -r -p "   Press Return to close… " _
