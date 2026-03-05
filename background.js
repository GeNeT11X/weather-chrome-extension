import { CONFIG } from './config.js';
import { themes } from './themes.js';

const API_KEY = CONFIG.API_KEY;

// Bug 3 fix: apply theme from background (chrome.theme is background-only in MV3)
function applyTheme(weatherCondition) {
  const theme = themes[weatherCondition] || themes.Default;
  try {
    chrome.theme.update({ colors: theme.colors });
    console.log('Theme applied:', weatherCondition);
  } catch (error) {
    console.error('Theme error:', error);
  }
}

async function fetchWeather(lat, lon) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
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

    const fallback = { weatherCondition: 'Default', weatherIcon: '01d' };
    await chrome.storage.local.set(fallback);

    chrome.runtime.sendMessage({ error: 'Failed to fetch weather' }).catch(() => { });

    return fallback;
  }
}

// Bug 1 fix: re-create alarm on browser startup
// Alarms are cleared whenever the browser restarts; onInstalled alone is not enough
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create('weatherUpdate', { periodInMinutes: 30 });
  updateWeatherFromStorage();
});

// Run when extension is first installed or updated
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('weatherUpdate', { periodInMinutes: 30 });
  // Bug 5 fix: flag that the popup should trigger the first geolocation fetch
  // (service workers can't call navigator.geolocation, so the popup must do it)
  chrome.storage.local.set({ needsInitialFetch: true });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'refreshWeather') {
    fetchWeather(request.lat, request.lon).then((weather) => {
      sendResponse({ weatherCondition: weather.weatherCondition, weatherIcon: weather.weatherIcon });
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