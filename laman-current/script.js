// Replace with your OpenWeatherMap API key
const API_KEY = "9c9ed5165b89e5dcaa0daec33fa9638d";

const form = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const weatherCard = document.getElementById("weatherCard");
const errorMessage = document.getElementById("errorMessage");
const infoMessage = document.getElementById("infoMessage");

const cityNameEl = document.getElementById("cityName");
const localTimeEl = document.getElementById("localTime");
const weatherIconEl = document.getElementById("weatherIcon");
const temperatureEl = document.getElementById("temperature");
const weatherDescriptionEl = document.getElementById("weatherDescription");
const feelsLikeEl = document.getElementById("feelsLike");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const pressureEl = document.getElementById("pressure");
const sunriseEl = document.getElementById("sunrise");
const sunsetEl = document.getElementById("sunset");

/**
 * Fetch current weather data from OpenWeatherMap API
 */
async function fetchWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    city
  )}&appid=${API_KEY}&units=metric`;
  await requestWeather(url);
}

/**
 * Fetch weather using geographic coordinates
 */
async function fetchWeatherByCoords(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
  await requestWeather(url);
}

async function requestWeather(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        response.status === 404
          ? "City not found. Please try another name."
          : "Failed to fetch weather data. Please try again."
      );
    }

    const data = await response.json();
    updateWeatherCard(data);
  } catch (error) {
    displayError(error.message);
  }
}

/**
 * Update the UI with weather data
 */
function updateWeatherCard(data) {
  const { name, sys, main, weather, wind, dt, timezone } = data;
  const iconCode = weather[0]?.icon;

  cityNameEl.textContent = `${name}, ${sys.country}`;
  localTimeEl.textContent = formatLocalDateTime(dt, timezone);
  weatherIconEl.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  weatherIconEl.alt = weather[0]?.description ?? "Weather icon";
  temperatureEl.textContent = `${main.temp.toFixed(1)}°C`;
  weatherDescriptionEl.textContent = weather[0]?.description ?? "";
  feelsLikeEl.textContent = `Feels like ${main.feels_like.toFixed(2)}°C`;

  humidityEl.textContent = `${main.humidity}%`;
  windEl.textContent = `${(wind.speed * 3.6).toFixed(1)} km/h`;
  pressureEl.textContent = `${main.pressure} hPa`;
  sunriseEl.textContent = formatTime(sys.sunrise, timezone);
  sunsetEl.textContent = formatTime(sys.sunset, timezone);

  errorMessage.textContent = "";
  weatherCard.hidden = false;
}

/**
 * Format local date & time string based on timezone offset
 */
function formatLocalDateTime(timestamp, timezoneOffset) {
  const localMillis = (timestamp + timezoneOffset) * 1000;
  return new Date(localMillis).toLocaleString(undefined, {
    hour12: true,
    timeZone: "UTC",
  });
}

/**
 * Format sunrise/sunset time in HH:MM AM/PM
 */
function formatTime(timestamp, timezoneOffset) {
  const localMillis = (timestamp + timezoneOffset) * 1000;
  return new Date(localMillis).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
}

/**
 * Display error message neatly below the search bar
 */
function displayError(message) {
  errorMessage.textContent = message;
  weatherCard.hidden = true;
}

function setInfo(message) {
  if (infoMessage) {
    infoMessage.textContent = message;
  }
}

// Handle form submit + enter key
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();

  if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
    displayError("Please set your API key inside script.js.");
    return;
  }

  if (!city) {
    displayError("Please enter a city name.");
    return;
  }

  fetchWeather(city);
});

function initAutoLocationWeather() {
  if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
    setInfo("Set your OpenWeatherMap API key to enable auto-location.");
    return;
  }

  if (!navigator.geolocation) {
    setInfo("Geolocation not supported. Please search for a city.");
    return;
  }

  setInfo("Detecting your location…");
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      setInfo("Showing weather for your current location.");
      fetchWeatherByCoords(coords.latitude, coords.longitude);
    },
    () => {
      setInfo("Unable to detect your location. Please search manually.");
    }
  );
}

window.addEventListener("load", initAutoLocationWeather);
