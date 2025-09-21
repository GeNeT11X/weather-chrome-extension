const API_KEY = '780524575dc2d255d22d2582f5506d43'; // Replace with your OpenWeatherMap API key

const themes = {
  Clear: {
    colors: {
      frame: [255, 193, 7], // Amber for sunny
      toolbar: [255, 243, 205],
      tab_background_text: [51, 51, 51],
      bookmark_text: [51, 51, 51]
    }
  },
  Clouds: {
    colors: {
      frame: [108, 117, 125], // Gray for cloudy
      toolbar: [214, 214, 214],
      tab_background_text: [51, 51, 51],
      bookmark_text: [51, 51, 51]
    }
  },
  Rain: {
    colors: {
      frame: [23, 162, 184], // Teal for rainy
      toolbar: [209, 236, 241],
      tab_background_text: [51, 51, 51],
      bookmark_text: [51, 51, 51]
    }
  },
  Snow: {
    colors: {
      frame: [70, 130, 180], // Blue for snowy
      toolbar: [232, 240, 254],
      tab_background_text: [51, 51, 51],
      bookmark_text: [51, 51, 51]
    }
  },
  Default: {
    colors: {
      frame: [0, 123, 255], // Default blue
      toolbar: [240, 240, 240],
      tab_background_text: [51, 51, 51],
      bookmark_text: [51, 51, 51]
    }
  }
};

// Store current weather condition
let currentWeatherCondition = 'Default';

function applyTheme(weather) {
  const theme = themes[weather] || themes.Default;
  currentWeatherCondition = weather;
  
  chrome.theme.update({ colors: theme.colors });
  
  // Notify popup if it's open
  chrome.runtime.sendMessage({ weatherCondition: weather }).catch(() => {
    // Popup might not be open, ignore error
  });
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
    
    console.log('Weather fetched:', weatherCondition);
    applyTheme(weatherCondition);
    
    return weatherCondition;
  } catch (error) {
    console.error('Error fetching weather:', error);
    applyTheme('Default');
    
    // Notify popup about error
    chrome.runtime.sendMessage({ error: 'Failed to fetch weather' }).catch(() => {
      // Popup might not be open, ignore error
    });
    
    return 'Default';
  }
}

function getWeather() {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const weather = await fetchWeather(latitude, longitude);
          resolve(weather);
        },
        (error) => {
          console.error('Geolocation error:', error);
          applyTheme('Default');
          resolve('Default');
        }
      );
    } else {
      console.error('Geolocation not supported');
      applyTheme('Default');
      resolve('Default');
    }
  });
}

// Run on extension startup
chrome.runtime.onStartup.addListener(() => {
  getWeather();
});

// Run when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  getWeather();
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'refreshWeather') {
    getWeather().then((weather) => {
      sendResponse({ weatherCondition: weather });
    });
    return true; // Keep message port open for async response
  }
  
  if (request.action === 'getWeather') {
    // Return current weather condition immediately
    sendResponse({ weatherCondition: currentWeatherCondition });
  }
});

// Refresh weather periodically (every 30 minutes)
setInterval(() => {
  getWeather();
}, 30 * 60 * 1000);