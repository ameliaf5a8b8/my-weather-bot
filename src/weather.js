// Base URL for data.gov.sg API v2
const BASE_URL = "https://api-open.data.gov.sg/v2/real-time/api";
/** Retry helper */
async function fetchWithRetry(url, retries = 3) {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } catch (err) {
      lastError = err;
      if (i < retries - 1) {
        console.log(`fetchWithRetry: attempt ${i + 1} failed (${err.message}). Retrying...`);
        await new Promise(r => setTimeout(r, 500));
      }
    }
  }
  throw lastError;
}

/** 
@param {string} location - Jurong West 
*/
async function get2HourForecast(location) {
  const url = `${BASE_URL}/two-hr-forecast`;
  const data = await fetchWithRetry(url);

  const forecasts = data.data.items[0].forecasts;
  for (const forecastObj of forecasts) {
    if (forecastObj.area === location) {
      return forecastObj.forecast;
    }
  }
  throw new Error(`${location} not found in forecast!`);
}

/**
 * Get 24-hour forecast (or daily forecast)
 * @param {string} region - e.g. north/south/east/west/central
 * @param {Date} targetTime - Date object
 */
async function getDailyForecast(region, targetTime) {
  const url = `${BASE_URL}/twenty-four-hr-forecast`;
  const data = await fetchWithRetry(url);

  const periods = data.data.records[0].periods;
  for (const period of periods) {
    const start = new Date(period.start);
    const end = new Date(period.end);
    if (targetTime >= start && targetTime <= end) {
      if (period.regions[region]) {
        return period.regions[region].text;
      } else {
        throw new Error(`Region ${region} not found in period forecast`);
      }
    }
  }
  throw new Error(`No forecast found for ${targetTime}`);
}

export { get2HourForecast, getDailyForecast };