import { CONFIG } from './config.js';

const API_KEY = CONFIG.API_KEY; 

// Store current weather condition
let currentWeatherCondition = 'Default';
let currentWeatherIcon = '01d';

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
    currentWeatherCondition = weatherCondition;
    currentWeatherIcon = weatherIcon;
    
    // Notify popup to apply theme
    chrome.runtime.sendMessage({ weatherCondition, weatherIcon }).catch(() => {});
    
    return { weatherCondition, weatherIcon };
  } catch (error) {
    console.error('Error fetching weather:', error);
    currentWeatherCondition = 'Default';
    currentWeatherIcon = '01d';
    
    chrome.runtime.sendMessage({ error: 'Failed to fetch weather' }).catch(() => {});
    
    return { weatherCondition: 'Default', weatherIcon: '01d' };
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
      sendResponse({ weatherCondition: weather.weatherCondition, weatherIcon: weather.weatherIcon });
    });
    return true;
  }
  
  if (request.action === 'getWeather') {
    sendResponse({ weatherCondition: currentWeatherCondition, weatherIcon: currentWeatherIcon });
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