import Expo, { ExpoPushMessage } from 'expo-server-sdk';
const expo = new Expo();

function getMessages(tokens: string[], body: string, title: string, data: object) {
    const messages = []
    for (let pushToken of tokens) {
        if (!Expo.isExpoPushToken(pushToken)) {
            console.error(`Push token ${pushToken} is not a valid Expo push token`);
            continue;
        }

        messages.push({
            to: pushToken,
            sound: 'default',
            body: body || "Push notification description",
            title: title || "Push notification title",
            data,
        })
    }
    return messages
}

async function sentChunk(chunks) {
    let tickets = []
    for (let chunk of chunks) {
        try {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        } catch (error) {
            console.log('error:', error)
        }
    }
    return tickets
}

export async function pushNotification(tokens: string[], title: string, body: string, data: object) {
    data = { ...data }
    try {
        let messages = getMessages(tokens, body, title, data)
        let chunks = expo.chunkPushNotifications(messages);
        const tickets = await sentChunk(chunks);
        return true
    } catch (error) {
        return false
    }
}
