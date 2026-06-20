#!/bin/bash
# ───────────────────────────────────────────────────────────────────────────
#  Odyssey.command  ·  double-click to run Odyssey on your Mac
#  Serves the site at http://localhost:4178 and prints a phone-ready LAN URL.
# ───────────────────────────────────────────────────────────────────────────

DIR="/Users/mikevandyke/Desktop/odyssey"
PORT=4178

# Find python3 by absolute path (robust no matter how this is launched).
PY=""
for c in /usr/local/bin/python3 /opt/homebrew/bin/python3 /usr/bin/python3 python3; do
  command -v "$c" >/dev/null 2>&1 && { PY="$c"; break; }
done

# Pretty banner ------------------------------------------------------------
printf '\n'
printf '   ╭───────────────────────────────────────────────╮\n'
printf '   │   🫁  O D Y S S E Y   ·   breathe. build.     │\n'
printf '   ╰───────────────────────────────────────────────╯\n'
printf '\n'

# Is something already serving the port? -----------------------------------
if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "   ✓  A server is already running on port $PORT — reusing it."
else
  echo "   ▸  Starting a local server on port $PORT ..."
  # Start the no-cache static server, detached, logging to a file.
  nohup "$PY" "$DIR/serve.py" "$PORT" "$DIR" >/tmp/odyssey-server.log 2>&1 &
  # Wait until it actually responds (more reliable than a fixed sleep).
  for i in $(seq 1 40); do curl -s -o /dev/null "http://localhost:$PORT/" && break; sleep 0.15; done
  echo "   ✓  Server started (log: /tmp/odyssey-server.log)."
fi

# Work out the Mac's LAN IP (Wi-Fi en0, then en1) --------------------------
LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)"

LOCAL_URL="http://localhost:$PORT"

# Open in the default browser ----------------------------------------------
echo "   ▸  Opening $LOCAL_URL in your browser ..."
open "$LOCAL_URL"

# Final, copy-pasteable banner ---------------------------------------------
printf '\n'
printf '   ─────────────────────────────────────────────────\n'
printf '    ON THIS MAC:\n'
printf '       %s\n' "$LOCAL_URL"
printf '\n'
if [ -n "$LAN_IP" ]; then
  printf '    ON YOUR iPHONE  (same Wi-Fi network):\n'
  printf '       http://%s:%s\n' "$LAN_IP" "$PORT"
  printf '       → in Safari, tap  Share → Add to Home Screen\n'
else
  printf '    ON YOUR iPHONE:\n'
  printf '       Could not detect a Wi-Fi address (are you on Wi-Fi?).\n'
  printf '       Run  ipconfig getifaddr en0  to find your Mac IP,\n'
  printf '       then open  http://THAT-IP:%s  on your phone.\n' "$PORT"
fi
printf '   ─────────────────────────────────────────────────\n'
printf '\n'
printf '    Leave this window open while you use Odyssey.\n'
printf '    Close it (or run:  lsof -ti:%s | xargs kill) to stop the server.\n' "$PORT"
printf '\n'

# Keep the Terminal window from vanishing instantly on a fast machine.
read -r -p "   Press Return to close this window… " _
