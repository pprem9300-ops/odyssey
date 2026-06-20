# 🫁 Launch Odyssey — the simple guide

Three ways to open Odyssey. Pick whichever you need. No coding required.

---

## 1. Run it on your Mac (start here)

**Double-click `Odyssey.command`** in the `odyssey` folder.

- A Terminal window opens and Odyssey appears in your browser automatically.
- Leave that little Terminal window open while you use the app.
- To stop it later, just close that window.

> **First time only:** macOS may say *"Odyssey.command can't be opened because it
> is from an unidentified developer."* Fix it once: **right-click** the file →
> **Open** → **Open**. After that, double-click works normally.

---

## 2. Open it on your iPhone (same Wi-Fi) — quickest

When you run `Odyssey.command`, the Terminal window prints two web addresses.
The second one looks like:

```
http://192.168.1.20:4178
```

On your iPhone (connected to the **same Wi-Fi** as your Mac):

1. Open **Safari** and type that exact address.
2. Tap the **Share** button (the square with the arrow).
3. Tap **Add to Home Screen** — now Odyssey has its own icon, like a real app.

> Your Mac must be awake and the Terminal window open for this to work — the phone
> is reaching the app *on your Mac*. The numbers (`192.168.x.x`) can change between
> sessions, so always copy the address the Terminal prints that day.

---

## 3. Put it online with a permanent link (works anywhere)

Want a link that works on cellular data, from anywhere, even when your Mac is off?

**Double-click `deploy.command`.**

- **First run:** a browser tab opens to sign in to **Vercel** (free, no credit card —
  "Continue with Email" is fine). Approve it once.
- **Every run after:** no login; it finishes in a few seconds.
- When it's done, it prints a permanent link like:

```
https://odyssey-xxxx.vercel.app
```

Open that link on your iPhone → **Share** → **Add to Home Screen**. Done — a public
Odyssey you can share with anyone, no Wi-Fi or Mac required.

> Re-run `deploy.command` any time you change the app to push the update live.

---

### Quick cheat sheet

| I want to… | Do this |
|---|---|
| Use it on my Mac | Double-click **Odyssey.command** |
| Use it on my iPhone, fast, at home | Run Odyssey.command, open the printed **192.168.x.x:4178** in Safari |
| Have a permanent link, anywhere | Double-click **deploy.command**, open the **vercel.app** link |
| Make it feel like a real app | In Safari: **Share → Add to Home Screen** |
