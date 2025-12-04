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

    const local = new Date();
    const nowSG = new Date(local.getTime() + local.getTimezoneOffset() * 60000 + 8 * 60 * 60000);
    const dayOfWeek = nowSG.getDay(); // 0=Sun,1=Mon,etc.

    console.log(`Time: ${nowSG.getHours()}, Day: ${nowSG.getDay()}`)

    const state = loadState();

    

    // Forecast for office tomorrow morning at 8:30am
    if (nowSG.getHours() >= 20 && nowSG.getHours() < 21 && dayOfWeek < 5) { 
        const tomorrow = new Date(nowSG);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(8, 30, 0, 0);

        const forecast = String(await getDailyForecast(OFFICE_REGION, tomorrow));
        const forecastLower = forecast.toLowerCase()


        if (forecastLower.includes("showers") || forecastLower.includes("rain")) {
            await sendNotification({
                title: "Office Weather Alert",
                body_msg: `Rain expected at office tomorrow morning. Forecast: ${forecast}`
            });
        }
    }

    // Forecast for office later today (6:40am - 7:40am)
    if (nowSG.getHours() == 6 || nowSG.getHours() == 7) {
        const forecast = String(await get2HourForecast(OFFICE_LOCATION));
        const forecastLower = forecast.toLowerCase()
        if (forecastLower.includes("showers") || forecastLower.includes("rain")) {
            await sendNotification({
                title: "Office Weather Alert",
                body_msg: `Rain expected at office later. Forecast: ${forecast}`
            });
        }
    }

    // Forecast for home
    // Send notification from 7 - 11
    if (nowSG.getHours() >= 7 && nowSG.getHours() < 23){
        const homeForecast = String(await get2HourForecast(HOME_LOCATION));
        const homeForecastLower = homeForecast.toLowerCase()
       
        // Only notify if it's raining AND last rain was > 2 hours ago
        if ((homeForecastLower.includes("moderate") || 
            homeForecastLower.includes("heavy") ||
            homeForecastLower.includes("thundery")) && state.hoursSinceRain >= 2) {

            await sendNotification({
                title: "Rain soon",
                body_msg: `Forecast: ${homeForecast}`
            });
            await sendNotification({
                title: "Rain soon",
                body_msg: `Forecast: ${homeForecast}`,
                token: process.env.MUM_PUSHBULLET_TOKEN
            });
        }
        else
            console.log(`Not sending nofication. Hours since rain: ${state.hoursSinceRain}`)

        // update state
        if (homeForecastLower.includes("moderate") || 
            homeForecastLower.includes("heavy") ||
            homeForecastLower.includes("thundery")){
            // Reset memory to 0 hours
            state.hoursSinceRain = 0;
        } else {
            // Increment hours since last rain
            state.hoursSinceRain += 1;
        }
    }

    saveState(state);

}

await main();
