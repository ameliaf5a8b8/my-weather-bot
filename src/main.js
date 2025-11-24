import { sendNotification } from "./notify.js";
import { get2HourForecast, getDailyForecast } from "./weather.js";
import { loadState, saveState } from "./state.js";

import 'dotenv/config';

// Will be called once an hour
async function main() {
    const HOME_REGION = process.env.HOME_REGION;
    const HOME_LOCATION = process.env.HOME_LOCATION;
    const OFFICE_LOCATION = process.env.OFFICE_LOCATION;
    const OFFICE_REGION = process.env.OFFICE_REGION;

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun,1=Mon,etc.

    const state = loadState();

    // Forecast for office tomorrow morning at 8:30am
    if (now.getHours() >= 20 && now.getHours() < 21 && dayOfWeek < 5) { 
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(8, 30, 0, 0);

        const forecast = String(await getDailyForecast(OFFICE_REGION, tomorrow))
            .toLowerCase();

        if (forecast.includes("showers") || forecast.includes("rain")) {
            await sendNotification({
                title: "Office Weather Alert",
                body_msg: `Rain expected at office tomorrow morning. Forecast: ${forecast}`
            });
        }
    }

    // Forecast for office later today (6:40am - 7:40am)
    if (now.getHours() === 6 || now.getHours() === 7) {
        const forecast = String(await get2HourForecast(OFFICE_LOCATION)).toLowerCase();

        if (forecast.includes("showers") || forecast.includes("rain")) {
            await sendNotification({
                title: "Office Weather Alert",
                body_msg: `Rain expected at office later. Forecast: ${forecast}`
            });
        }
    }

    // Forecast for home
    const homeForecast = String(await get2HourForecast(HOME_LOCATION)).toLowerCase();


    if (homeForecast.includes("rain") || homeForecast.includes("showers") ) {
        // Reset memory to 0 hours
        state.hoursSinceRain = 0;
    } else {
        // Increment hours since last rain
        state.hoursSinceRain += 1;
    }

    // Only notify if it's raining AND last rain was > 2 hours ago
    if (homeForecast.includes("showers")  && state.hoursSinceRain > 2) {
        await sendNotification({
            title: "Rain soon",
            body_msg: `Forecast: ${homeForecast}`
        });
    }

    saveState(state);

}

await main();
