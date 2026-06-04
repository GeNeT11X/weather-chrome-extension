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

## 🔧 Installation

1. Clone this repo:

```bash
git clone https://github.com/YOUR_USERNAME/weather-theme-extension.git
```

2. Create your config from the example (`config.js` is git-ignored so your key never gets committed):

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

### 🦊 Load in Firefox (recommended — recolors the real browser chrome)

4. Open `about:debugging#/runtime/this-firefox`
5. Click **Load Temporary Add-on…**
6. Select the `manifest.json` file in this folder
7. On first install a **setup tab** opens — click **Enable Location** and allow the prompt. The browser theme now matches the weather and refreshes every 15 minutes.

> Temporary add-ons are removed when Firefox restarts. To install permanently, package and sign it via [addons.mozilla.org](https://addons.mozilla.org) (`web-ext sign`), or use **Firefox Developer/Nightly** with `xpinstall.signatures.required` set to `false`.

### 🟦 Load in Chrome (popup-only coloring)

4. Go to `chrome://extensions`
5. Enable **Developer Mode**
6. Click **Load unpacked** and select this folder

## 🧪 Development

Validate the extension against Firefox's rules with Mozilla's linter:

```bash
npx web-ext lint
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
