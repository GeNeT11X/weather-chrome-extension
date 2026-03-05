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
    const iconUrl = `https://openweathermap.org/img/wn/${weatherIcon}@2x.png`;
    weatherInfo.innerHTML = `Current Theme: ${weatherCondition} <img src="${iconUrl}" alt="Weather icon" style="width: 40px; height: 40px; margin-right: 8px; margin-bottom: -10px;">`;
  }
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
          // Device geolocation denied or unavailable — fall back to IP location
          console.warn("Geolocation denied, falling back to IP-based location:", error.message);
          getLocationByIP(resolve);
        },
        { timeout: 8000 } // Don't wait forever if the browser hangs on the prompt
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