import { themes } from "./themes.js";

// Chrome can't recolor the browser chrome at runtime (chrome.theme.update is
// Firefox-only), so we paint the popup itself with the weather palette instead.
function rgb(arr) {
  return `rgb(${arr[0]}, ${arr[1]}, ${arr[2]})`;
}

function applyPopupTheme(weatherCondition) {
  const theme = themes[weatherCondition] || themes.Default;
  const c = theme.colors;

  // body sits on the "toolbar" color; header & button use the bolder "frame" color.
  document.body.style.backgroundColor = rgb(c.toolbar);
  document.body.style.color = rgb(c.bookmark_text);

  const h1 = document.querySelector("h1");
  if (h1) {
    h1.style.backgroundColor = rgb(c.frame);
    h1.style.color = rgb(c.tab_background_text);
  }

  const btn = document.getElementById("refresh-btn");
  if (btn) {
    btn.style.backgroundColor = rgb(c.frame);
    btn.style.color = rgb(c.tab_background_text);
  }
}

// Wait for DOM to load before setting up event listeners
document.addEventListener("DOMContentLoaded", function () {
  const refreshBtn = document.getElementById("refresh-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", refreshWeather);
  }

  // Bug 5 fix: on first install, trigger geolocation immediately so background
  // can store coords and apply the first theme
  chrome.storage.local.get(['needsInitialFetch'], (result) => {
    if (result.needsInitialFetch) {
      getWeather().then(() => {
        chrome.storage.local.remove('needsInitialFetch');
      });
    } else {
      requestInitialWeather();
    }
  });
});

function requestInitialWeather() {
  chrome.runtime.sendMessage({ action: "getWeather" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Extension error:", chrome.runtime.lastError);
      const weatherInfo = document.getElementById("weather-info");
      if (weatherInfo) {
        weatherInfo.textContent = "Error loading weather";
      }
      return;
    }

    const weatherCondition = response?.weatherCondition || "Default";
    const weatherIcon = response?.weatherIcon || "01d";
    displayWeatherInfo(weatherCondition, weatherIcon);
  });
}

function displayWeatherInfo(weatherCondition, weatherIcon) {
  const weatherInfo = document.getElementById("weather-info");
  if (weatherInfo) {
    // Build with DOM nodes instead of innerHTML (avoids the unsafe-assignment lint).
    weatherInfo.textContent = `Current Theme: ${weatherCondition} `;
    const img = document.createElement("img");
    img.src = `https://openweathermap.org/img/wn/${weatherIcon}@2x.png`;
    img.alt = "Weather icon";
    img.style.width = "40px";
    img.style.height = "40px";
    img.style.marginLeft = "8px";
    img.style.verticalAlign = "middle";
    weatherInfo.appendChild(img);
  }
  applyPopupTheme(weatherCondition);
}

/**
 * Sends lat/lon to the background to fetch weather and returns the condition.
 */
function fetchWeatherForCoords(latitude, longitude, resolve) {
  const weatherInfo = document.getElementById("weather-info");
  chrome.storage.local.set({ lat: latitude, lon: longitude });

  chrome.runtime.sendMessage(
    { action: "refreshWeather", lat: latitude, lon: longitude },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("Message error:", chrome.runtime.lastError);
        if (weatherInfo) weatherInfo.textContent = "Error refreshing weather";
        resolve("Default");
        return;
      }

      // Surface a specific reason (e.g. invalid/missing API key) instead of a silent fallback.
      if (response?.error) {
        if (weatherInfo) weatherInfo.textContent = response.error;
        resolve("Default");
        return;
      }

      const weatherCondition = response?.weatherCondition || "Default";
      const weatherIcon = response?.weatherIcon || "01d";
      displayWeatherInfo(weatherCondition, weatherIcon);
      resolve(weatherCondition);
    }
  );
}

/**
 * Fallback: get approximate location from IP if device geolocation is denied.
 * Uses ipapi.co (free, no key required, 1000 req/day).
 */
function getLocationByIP(resolve) {
  const weatherInfo = document.getElementById("weather-info");
  if (weatherInfo) weatherInfo.textContent = "Using approximate location...";

  fetch("https://ipapi.co/json/")
    .then((res) => {
      if (!res.ok) throw new Error(`IP API error: ${res.status}`);
      return res.json();
    })
    .then((data) => {
      if (!data.latitude || !data.longitude) {
        throw new Error("IP API returned no coordinates");
      }
      console.log("IP-based location:", data.latitude, data.longitude);
      fetchWeatherForCoords(data.latitude, data.longitude, resolve);
    })
    .catch((err) => {
      console.error("IP geolocation failed:", err);
      if (weatherInfo) weatherInfo.textContent = "Error: Could not determine location";
      resolve("Default");
    });
}

/**
 * Turns a GeolocationPositionError into a human-readable string.
 */
function describeGeoError(error) {
  if (!error) return "Unknown geolocation error";
  switch (error.code) {
    case 1: return "Location permission denied";
    case 2: return "Location unavailable (network location service failed)";
    case 3: return "Location request timed out";
    default: return error.message || "Unknown geolocation error";
  }
}

function getWeather() {
  return new Promise((resolve) => {
    const weatherInfo = document.getElementById("weather-info");

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeatherForCoords(latitude, longitude, resolve);
        },
        (error) => {
          // Device geolocation denied, unavailable, or timed out — log full error and show user
          console.warn("Geolocation unavailable, falling back to IP location:", describeGeoError(error));
          getLocationByIP(resolve);
        },
        // maximumAge lets a recent cached fix satisfy the request instantly;
        // the longer timeout avoids premature failures while the prompt is open.
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
      );
    } else {
      console.warn("Geolocation not supported, using IP-based location");
      if (weatherInfo) weatherInfo.textContent = "Using approximate location...";
      getLocationByIP(resolve);
    }
  });
}

function refreshWeather() {
  const weatherInfo = document.getElementById("weather-info");
  if (weatherInfo) {
    weatherInfo.textContent = "Refreshing weather...";
  }

  getWeather().catch(() => {
    if (weatherInfo) weatherInfo.textContent = "Error refreshing weather";
  });
}

// Bug 4 fix: removed the unreliable chrome.runtime.onMessage listener.
// Popup pages are ephemeral — they are destroyed when closed and cannot
// reliably receive background push messages. The popup now correctly pulls
// weather data itself via requestInitialWeather() and getWeather().
//
// Bug 3 fix: removed applyTheme() entirely — chrome.theme.update() does not
// work in popup pages in MV3. Theme is now applied by background.js.