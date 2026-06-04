# 🌦 Weather-Based Browser Theme Extension

This browser extension automatically changes the browser's theme colors based on the current weather in your location.

## 🚀 Features

- Live weather detection using OpenWeatherMap (free Current Weather 2.5 API)
- Dynamic theme updates (sunny, rainy, cloudy, etc.)
- Clean and simple popup interface and UI

## 🦊 Firefox vs 🟦 Chrome — important

| | Firefox | Chrome |
|---|---|---|
| Recolors the **real browser chrome** (tabs/toolbar) | ✅ Yes (via the `theme` API) | ❌ Not possible — Chrome has **no runtime theming API** |
| Recolors the **extension popup** | ✅ Yes | ✅ Yes |

**Chrome cannot dynamically theme its own toolbar/tabs at runtime** — that API (`theme.update()`) is Firefox-only. In Chrome the extension still works, but only the *popup* changes color. **For the real browser frame to change with the weather, use Firefox.**

## 🔧 Setup

1. Clone this repo:

```bash
git clone https://github.com/GeNeT11X/theme-change-firefox-extension.git
cd theme-change-firefox-extension
```

2. Create your config from the example (`config.js` is git-ignored so your key is never committed):

```bash
cp config.example.js config.js
```

3. Get a **free** [OpenWeatherMap API key](https://home.openweathermap.org/users/sign_up), then open `config.js` and paste it in:

```js
export const CONFIG = {
    API_KEY: 'your_api_key_here'
};
```

   > ℹ️ A newly created key can take **up to ~2 hours to activate**. Until then the API returns `401 Invalid API key`. This extension uses the free **Current Weather Data (2.5)** endpoint — no paid plan or credit card is required.

4. Install the build tooling:

```bash
npm install
```

## 🦊 Install in Firefox

### A) Quick test — temporary (removed when Firefox restarts)

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…** and select `manifest.json`
3. The setup tab opens → click **Enable Location** and allow the prompt

### B) Permanent install — signed (stays after restart) ✅ recommended

Normal Firefox only runs add-ons **signed by Mozilla**. Signing is free and, using the **unlisted** channel, your add-on stays private (it is *not* published to the public store). The result is a `.xpi` file you install permanently.

1. **Create AMO API credentials** (one-time): sign in at [addons.mozilla.org](https://addons.mozilla.org), then go to **[Manage API Keys](https://addons.mozilla.org/developers/addon/api/key/)** and click **Generate new credentials**. Copy the **JWT issuer** and **JWT secret**.

2. **Use a unique add-on ID.** Open `manifest.json` and set your own value for `browser_specific_settings.gecko.id` (an email-style string you control), e.g.:

   ```json
   "id": "weather-theme@your-name.example"
   ```

   > Each person who signs must use a *different* ID — Mozilla ties the ID to the account that first signs it.

3. **Sign it** (downloads a signed `.xpi` into `web-ext-artifacts/`):

```bash
npm run sign -- --api-key="YOUR_JWT_ISSUER" --api-secret="YOUR_JWT_SECRET"
```

4. **Install the signed `.xpi`:** open `about:addons` → click the **gear ⚙️** → **Install Add-on From File…** → select the `.xpi` from `web-ext-artifacts/`. Confirm.

5. On first install the setup tab opens → click **Enable Location**. The browser theme now matches the weather, refreshes every 15 minutes, and **persists across restarts**.

## 👥 Installing it on another user's computer

Anyone can run this permanently on their own machine by following the **same steps above** with their own details:

1. Clone the repo and run `cp config.example.js config.js` + `npm install` (Setup steps 1–4).
2. Add **their own** free OpenWeatherMap key to `config.js` (so each person uses their own request quota — a single shared key would hit rate limits).
3. Set **their own** unique `gecko.id` in `manifest.json` (see Permanent install step 2).
4. Create **their own** AMO API credentials and run `npm run sign -- --api-key=... --api-secret=...`.
5. Install the produced `.xpi` via `about:addons` → gear → **Install Add-on From File**.

> **Want one-click install for everyone instead?** Publish it as a **listed** add-on: run `npm run sign -- --channel=listed ...` (or submit the zip on AMO) and pass Mozilla's review. Users then install it from your public AMO page with a single **Add to Firefox** button — no cloning, signing, or API keys required on their end (though they'd still need their own OpenWeatherMap key unless you ship a backend proxy).

## 🟦 Load in Chrome (popup-only coloring)

1. Go to `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load unpacked** and select this folder

## 🧪 Development

```bash
npm run lint     # validate against Firefox rules (Mozilla web-ext linter)
npm run build    # produce an unsigned .zip in web-ext-artifacts/
npm run sign     # sign as an unlisted .xpi (needs --api-key / --api-secret)
```

## 🛠 To-Do

- [ ] Add background gradients for weather
- [ ] Add city selection option
- [x] Add weather icons in popup

## 🤝 Contributing

1. Fork the repo
2. Create a new branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m "Added feature"`
4. Push to your fork: `git push origin feature-name`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.
