import { CONFIG } from './config.js';

const API_KEY = CONFIG.API_KEY; 

// Store current weather condition
let currentWeatherCondition = 'Default';

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
    currentWeatherCondition = weatherCondition;
    
    // Notify popup to apply theme
    chrome.runtime.sendMessage({ weatherCondition }).catch(() => {});
    
    return weatherCondition;
  } catch (error) {
    console.error('Error fetching weather:', error);
    currentWeatherCondition = 'Default';
    
    chrome.runtime.sendMessage({ error: 'Failed to fetch weather' }).catch(() => {});
    
    return 'Default';
  }
}

// Run when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('weatherUpdate', { periodInMinutes: 30 });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'refreshWeather') {
    fetchWeather(request.lat, request.lon).then((weather) => {
      sendResponse({ weatherCondition: weather });
    });
    return true;
  }
  
  if (request.action === 'getWeather') {
    sendResponse({ weatherCondition: currentWeatherCondition });
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