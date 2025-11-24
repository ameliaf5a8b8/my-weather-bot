import 'dotenv/config';

const BRYAN_TOKEN = process.env.PUSHBULLET_TOKEN;

export async function sendNotification({ title = "Weather alert", body_msg , token=BRYAN_TOKEN}) {

    const body = {
        type: "note",
        title: title,
        body: body_msg
    };


    fetch("https://api.pushbullet.com/v2/pushes", {
        method: "POST",
        headers: {
            "Access-Token": token,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    })
    .then(function(res) { console.log("Notification sent, status:", res.status); })
    .catch(function(err) { console.error(err); });

}