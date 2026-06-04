# 🌦 Weather-Based Browser Theme Extension

This browser extension automatically changes the browser's theme colors based on the current weather in your location.

##  Features

- Live weather detection using OpenWeatherMap (free Current Weather 2.5 API)
- Dynamic theme updates (sunny, rainy, cloudy, etc.)
- Clean and simple popup interface and UI

## 🦊 Firefox vs 🟦 Chrome — important

| | Firefox | Chrome |
|---|---|---|
| Recolors the **real browser chrome** (tabs/toolbar) | ✅ Yes (via the `theme` API) | ❌ Not possible — Chrome has **no runtime theming API** |
| Recolors the **extension popup** | ✅ Yes | ✅ Yes |

**Chrome cannot dynamically theme its own toolbar/tabs at runtime** — that API (`theme.update()`) is Firefox-only. In Chrome the extension still works, but only the *popup* changes color. **For the real browser frame to change with the weather, use Firefox.**

##  Prerequisites

- **Firefox 140 or newer** — required to actually run the extension.
- *Only if you want to build/sign it yourself (Option 2):*
  - **[Node.js](https://nodejs.org) 18+** (this gives you the `npm` command)
  - A free **[OpenWeatherMap API key](https://home.openweathermap.org/users/sign_up)**
  - A free **[addons.mozilla.org](https://addons.mozilla.org) (AMO)** account

---

##  Option 1 — Install the ready-made file (easiest) 

Use this if someone gave you the signed **`.xpi`** file. You do **not** need Node.js, npm, or any API key.

1. Open **Firefox**.
2. Type `about:addons` in the address bar and press **Enter**.
3. Click the **gear ⚙️** icon near the top-right.
4. Click **Install Add-on From File…**.
5. Browse to and select the **`.xpi`** file you were given, then click **Open**.
6. In the popup, click **Add**, then **Okay**.
7. A **setup tab** opens automatically → click **Enable Location** and allow the browser's location prompt.

**Done.** The extension is now installed **permanently** — it stays after you close and reopen Firefox. Your tabs/toolbar recolor to match the weather (amber = clear, teal = rain, navy = thunderstorm, …) and refresh every 15 minutes.

> A shared `.xpi` uses the owner's OpenWeatherMap key, so everyone shares that key's request quota. To use your own key, follow **Option 2**.

---

## 🛠 Option 2 — Build & sign your own copy (your own API key)

Use this if you want your own API key/quota or you're developing the extension.

### Step 1 — Get the code and tooling
```bash
git clone https://github.com/GeNeT11X/theme-change-firefox-extension.git
cd theme-change-firefox-extension
npm install
```

### Step 2 — Add your free OpenWeatherMap key
```bash
cp config.example.js config.js
```
Open `config.js` and paste your key (it's git-ignored, so it's never committed):
```js
export const CONFIG = {
    API_KEY: 'your_api_key_here'
};
```
> ℹ️ A brand-new key can take **up to ~2 hours to activate** (until then you'll see `401 Invalid API key`). This uses the **free Current Weather 2.5 API** — no paid plan or credit card required.

### Step 3 — Set a unique add-on ID
Open `manifest.json` and change `browser_specific_settings.gecko.id` to your own email-style value:
```json
"id": "weather-theme@your-name.example"
```
> Each person must use a **different** ID — Mozilla ties an ID to the first account that signs it.

### Step 4 — Get your Mozilla signing credentials
Sign in at [addons.mozilla.org](https://addons.mozilla.org) → **[Manage API Keys](https://addons.mozilla.org/developers/addon/api/key/)** → **Generate new credentials**. Copy the **JWT issuer** and **JWT secret**.

### Step 5 — Sign it
```bash
npm run sign -- --api-key="YOUR_JWT_ISSUER" --api-secret="YOUR_JWT_SECRET"
```
This uploads to Mozilla and saves a **signed `.xpi`** in the `web-ext-artifacts/` folder.
>  If you won't reuse them, **revoke those credentials** on AMO afterward.

### Step 6 — Install it
Follow **Option 1, steps 2–7**, selecting the `.xpi` from the `web-ext-artifacts/` folder.

---

##  Just want to test quickly? (temporary, no signing)

Loads instantly but **disappears when Firefox closes**:

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…** and select `manifest.json`

---

##  Sharing it with other people

- **Easiest:** send them your signed `.xpi` → they follow **Option 1**. (They share your API quota.)
- **Independent:** they follow **Option 2** with their own key, ID, and AMO account.
- **Public store:** publish a **listed** add-on with `npm run sign -- --channel=listed ...` (passes Mozilla review) so anyone installs from your AMO page with one **Add to Firefox** click.

---

##  Using it in Chrome (popup colors only)

Chrome has no runtime theming API, so only the **popup** recolors (not the toolbar/tabs):

1. Go to `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load unpacked** and select the project folder

---

##  Developer scripts

```bash
npm run lint     # validate against Firefox rules (Mozilla web-ext linter)
npm run build    # produce an unsigned .zip in web-ext-artifacts/
npm run sign     # sign as an unlisted .xpi (needs --api-key / --api-secret)
```

## 🛠 To-Do

- [ ] Add background gradients for weather
- [ ] Add city selection option
- [x] Add weather icons in popup

##  Contributing

1. Fork the repo
2. Create a new branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m "Added feature"`
4. Push to your fork: `git push origin feature-name`
5. Open a Pull Request

---

##  License

This project is licensed under the MIT License.
