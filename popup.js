import { themes } from './themes.js';

// Wait for DOM to load before setting up event listeners
document.addEventListener("DOMContentLoaded", function () {
  const refreshBtn = document.getElementById("refresh-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", refreshWeather);
  }

  requestInitialWeather();
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
    applyTheme(weatherCondition);
    
    const weatherInfo = document.getElementById("weather-info");
    if (weatherInfo) {
      weatherInfo.textContent = `Current Theme: ${weatherCondition}`;
    }
  });
}

function applyTheme(weather) {
  const theme = themes[weather] || themes.Default;
  
  try {
    chrome?.theme?.update({ colors: theme.colors });
    console.log('Theme applied:', weather);
  } catch (error) {
    console.error('Theme error:', error);
  }
}

function getWeather() {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          chrome.storage.local.set({ lat: latitude, lon: longitude });

          chrome.runtime.sendMessage(
            {
              action: "refreshWeather",
              lat: latitude,
              lon: longitude,
            },
            (response) => {
              const weatherCondition = response?.weatherCondition || "Default";
              applyTheme(weatherCondition);
              resolve(weatherCondition);
            }
          );
        },
        (error) => {
          console.error("Geolocation error:", error);
          resolve("Default");
        }
      );
    } else {
      console.error("Geolocation not supported");
      resolve("Default");
    }
  });
}

function refreshWeather() {
  const weatherInfo = document.getElementById("weather-info");
  if (weatherInfo) {
    weatherInfo.textContent = "Refreshing weather...";
  }
  
  getWeather();
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const weatherInfo = document.getElementById("weather-info");

  if (message.weatherCondition) {
    applyTheme(message.weatherCondition);
    if (weatherInfo) {
      weatherInfo.textContent = `Current Theme: ${message.weatherCondition}`;
    }
  }

  if (message.error && weatherInfo) {
    weatherInfo.textContent = "Error: Unable to fetch weather";
  }
});