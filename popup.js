// Wait for DOM to load before setting up event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Connect the refresh button to the refreshWeather function
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshWeather);
    }
    
    // Request initial weather info when popup opens
    requestInitialWeather();
});

function refreshWeather() {
    // Show loading state
    const weatherInfo = document.getElementById('weather-info');
    if (weatherInfo) {
        weatherInfo.textContent = 'Refreshing weather...';
    }
    
    // Send refresh request to background script
    chrome.runtime.sendMessage({ action: 'refreshWeather' }, (response) => {
        if (chrome.runtime.lastError) {
            console.error('Extension error:', chrome.runtime.lastError);
            if (weatherInfo) {
                weatherInfo.textContent = 'Error refreshing weather';
            }
            return;
        }
        console.log('Weather refresh requested');
    });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const weatherInfo = document.getElementById('weather-info');
    
    if (message.weatherCondition && weatherInfo) {
        weatherInfo.textContent = `Current Theme: ${message.weatherCondition}`;
    }
    
    // Handle error messages
    if (message.error && weatherInfo) {
        weatherInfo.textContent = 'Error: Unable to fetch weather';
    }
});

function requestInitialWeather() {
    chrome.runtime.sendMessage({ action: 'getWeather' }, (response) => {
        if (chrome.runtime.lastError) {
            console.error('Extension error:', chrome.runtime.lastError);
            const weatherInfo = document.getElementById('weather-info');
            if (weatherInfo) {
                weatherInfo.textContent = 'Error loading weather';
            }
            return;
        }
        
        const weatherInfo = document.getElementById('weather-info');
        if (weatherInfo) {
            weatherInfo.textContent = 
                `Current Theme: ${response?.weatherCondition || 'Default'}`;
        }
    });
}