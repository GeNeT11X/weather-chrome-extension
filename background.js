import { CONFIG } from './config.js';
import { themes } from './themes.js';

const API_KEY = CONFIG.API_KEY;

// Resolve the runtime theming API. Firefox exposes it as browser.theme (and
// also chrome.theme); Chrome has NO runtime theming API at all, so this is null
// there and the popup handles visuals instead (see popup.js applyPopupTheme).
const themeAPI =
  (typeof browser !== 'undefined' && browser.theme && browser.theme.update) ? browser.theme :
  (typeof chrome !== 'undefined' && chrome.theme && chrome.theme.update) ? chrome.theme :
  null;

// Apply the real browser-chrome theme (Firefox). No-op on Chrome.
function applyTheme(weatherCondition) {
  if (!themeAPI) {
    return; // Not supported in this browser (e.g. Chrome) — popup handles visuals.
  }
  const theme = themes[weatherCondition] || themes.Default;
  try {
    themeAPI.update({ colors: theme.colors });
    console.log('Theme applied:', weatherCondition);
  } catch (error) {
    console.error('Theme error:', error);
  }
}

// Free-tier endpoint (Current Weather Data, API 2.5) — no subscription/card required.
// The paid One Call 3.0 API is intentionally NOT used.
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5/weather';

// The placeholder shipped in config.example.js — treated as "no key configured".
const PLACEHOLDER_KEYS = ['', 'your_api_key_here', 'YOUR_API_KEY'];

async function fetchWeather(lat, lon) {
  // Surface a clear, actionable message when no key has been set yet.
  if (!API_KEY || PLACEHOLDER_KEYS.includes(API_KEY)) {
    const msg = 'No API key set. Add a free OpenWeatherMap key in config.js.';
    console.error(msg);
    const fallback = { weatherCondition: 'Default', weatherIcon: '01d', error: msg };
    await chrome.storage.local.set({ weatherCondition: 'Default', weatherIcon: '01d' });
    return fallback;
  }

  try {
    const response = await fetch(
      `${WEATHER_API_BASE}?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    );

    if (!response.ok) {
      // 401 from OpenWeatherMap means the key is invalid OR newly created and
      // not yet activated (activation can take up to ~2 hours after signup).
      if (response.status === 401) {
        throw new Error(
          'Invalid API key (401). If the key is new, it can take up to 2 hours to activate.'
        );
      }
      throw new Error(`Weather service error (HTTP ${response.status}).`);
    }

    const data = await response.json();
    const weatherCondition = data.weather[0].main;
    const weatherIcon = data.weather[0].icon;

    console.log('Weather fetched:', weatherCondition, weatherIcon);

    // Bug 6 fix: persist to storage instead of relying on module-level vars
    // (service workers are killed after inactivity, resetting all module-level state)
    await chrome.storage.local.set({ weatherCondition, weatherIcon });

    // Bug 3 fix: apply theme here in the background, not in the popup
    applyTheme(weatherCondition);

    // Notify popup to update its display
    chrome.runtime.sendMessage({ weatherCondition, weatherIcon }).catch(() => { });

    return { weatherCondition, weatherIcon };
  } catch (error) {
    console.error('Error fetching weather:', error);

    const fallback = { weatherCondition: 'Default', weatherIcon: '01d', error: error.message };
    await chrome.storage.local.set({ weatherCondition: 'Default', weatherIcon: '01d' });

    chrome.runtime.sendMessage({ error: error.message }).catch(() => { });

    return fallback;
  }
}

// Bug 1 fix: re-create alarm on browser startup
// Alarms are cleared whenever the browser restarts; onInstalled alone is not enough
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create('weatherUpdate', { periodInMinutes: 15 });
  updateWeatherFromStorage();
});

// Run when extension is first installed or updated
chrome.runtime.onInstalled.addListener((details) => {
  chrome.alarms.create('weatherUpdate', { periodInMinutes: 15 });
  // Bug 5 fix: flag that the popup should trigger the first geolocation fetch
  // (service workers can't call navigator.geolocation, so the popup must do it)
  chrome.storage.local.set({ needsInitialFetch: true });

  // On a fresh install, open the setup page so the user can grant location
  // permission once, via a click, in a persistent tab. This is far more
  // reliable than prompting from the ephemeral popup.
  if (details.reason === 'install') {
    chrome.tabs.create({ url: 'permission.html' });
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'refreshWeather') {
    fetchWeather(request.lat, request.lon).then((weather) => {
      sendResponse({
        weatherCondition: weather.weatherCondition,
        weatherIcon: weather.weatherIcon,
        error: weather.error,
      });
    });
    return true; // keep the message channel open for the async response
  }

  if (request.action === 'getWeather') {
    // Bug 6 fix: read from storage, not module-level vars that reset on SW restart
    // Bug 2 fix: return true so the async sendResponse call is valid
    chrome.storage.local.get(['weatherCondition', 'weatherIcon']).then((result) => {
      sendResponse({
        weatherCondition: result.weatherCondition || 'Default',
        weatherIcon: result.weatherIcon || '01d',
      });
    });
    return true; // keep the message channel open for the async response
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'weatherUpdate') {
    updateWeatherFromStorage();
  }
});

async function updateWeatherFromStorage() {
  const result = await chrome.storage.local.get(['lat', 'lon']);
  if (result.lat && result.lon) {
    fetchWeather(result.lat, result.lon);
  }
}