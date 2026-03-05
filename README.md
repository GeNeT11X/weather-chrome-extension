# 🌦 Weather-Based Chrome Theme Extension

This Chrome extension automatically changes the browser's theme colors based on the current weather in your location.

## 🚀 Features

- Live weather detection using OpenWeatherMap
- Dynamic theme updates (sunny, rainy, cloudy, etc.)
- Clean and simple popup interface and UI

## 🔧 Installation

1. Clone this repo:

```bash
git clone https://github.com/YOUR_USERNAME/weather-theme-extension.git
```

2. Open `config.js` and add your [OpenWeatherMap API key](https://openweathermap.org/api):

```js
export const CONFIG = {
    API_KEY: 'your_api_key_here'
};
```

3. Go to `chrome://extensions` in your browser

3. Enable **Developer Mode**

4. Click **Load unpacked**

5. Select the folder where this extension is located

## 🛠 To-Do

- [ ] Add background gradients for weather
- [ ] Add city selection option
- [ ] Add weather icons in popup

## 🤝 Contributing

1. Fork the repo
2. Create a new branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m "Added feature"`
4. Push to your fork: `git push origin feature-name`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.
