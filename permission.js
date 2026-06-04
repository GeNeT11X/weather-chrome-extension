// First-run setup page. Requesting geolocation here (in a persistent tab, on a
// user click) is far more reliable than doing it from the ephemeral popup.

const statusEl = document.getElementById("status");
const enableBtn = document.getElementById("enable-btn");

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function describeGeoError(error) {
  if (!error) return "Unknown geolocation error";
  switch (error.code) {
    case 1: return "Location permission denied";
    case 2: return "Location unavailable (network location service failed)";
    case 3: return "Location request timed out";
    default: return error.message || "Unknown geolocation error";
  }
}

/**
 * Sends coordinates to the background to fetch weather + apply the theme,
 * then marks first-run setup as complete.
 */
function fetchWeatherForCoords(latitude, longitude) {
  chrome.storage.local.set({ lat: latitude, lon: longitude });

  chrome.runtime.sendMessage(
    { action: "refreshWeather", lat: latitude, lon: longitude },
    (response) => {
      if (chrome.runtime.lastError) {
        setStatus("Error contacting the extension: " + chrome.runtime.lastError.message);
        return;
      }
      if (response?.error) {
        setStatus(response.error);
        return;
      }
      chrome.storage.local.remove("needsInitialFetch");
      setStatus(`Done! Theme set to "${response?.weatherCondition || "Default"}". You can close this tab.`);
    }
  );
}

/**
 * Approximate location from IP — no permission required (free, 1000 req/day).
 */
function getLocationByIP() {
  setStatus("Using approximate location based on your IP…");
  fetch("https://ipapi.co/json/")
    .then((res) => {
      if (!res.ok) throw new Error(`IP API error: ${res.status}`);
      return res.json();
    })
    .then((data) => {
      if (!data.latitude || !data.longitude) {
        throw new Error("IP API returned no coordinates");
      }
      fetchWeatherForCoords(data.latitude, data.longitude);
    })
    .catch((err) => {
      console.error("IP geolocation failed:", err);
      setStatus("Could not determine your location. Please check your connection and try again.");
    });
}

function requestLocation() {
  enableBtn.disabled = true;
  setStatus("Requesting location… (allow the prompt at the top of your browser)");

  if (!navigator.geolocation) {
    getLocationByIP();
    enableBtn.disabled = false;
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      setStatus("Location granted. Fetching weather…");
      fetchWeatherForCoords(latitude, longitude);
      enableBtn.disabled = false;
    },
    (error) => {
      console.warn("Geolocation failed:", describeGeoError(error));
      setStatus(describeGeoError(error) + " — falling back to approximate location.");
      getLocationByIP();
      enableBtn.disabled = false;
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
  );
}

enableBtn.addEventListener("click", requestLocation);
