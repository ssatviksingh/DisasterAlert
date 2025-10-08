// backend/src/utils/notify.js
import { Expo } from "expo-server-sdk";

const expo = new Expo();

/**
 * Send single push (keeps backwards compatibility)
 */
export async function sendPushNotification(expoPushToken, message, data = {}) {
    if (!expoPushToken) return;
    if (!Expo.isExpoPushToken(expoPushToken)) {
        console.error(`Invalid push token: ${expoPushToken}`);
        return;
    }

    const messages = [
        {
            to: expoPushToken,
            sound: "default",
            title: "Disaster Alert",
            body: message,
            data,
        },
    ];

    try {
        const ticketChunk = await expo.sendPushNotificationsAsync(messages);
        console.log("Push ticket chunk:", ticketChunk);
    } catch (err) {
        console.error("Push send error:", err);
    }
}

/**
 * Send many push notifications (batched). tokens: string[]
 */
export async function sendPushNotifications(tokens = [], message, data = {}) {
    if (!Array.isArray(tokens) || tokens.length === 0) return;

    // Build messages for all tokens (filter invalid tokens)
    const messages = tokens
        .filter((t) => Expo.isExpoPushToken(t))
        .map((token) => ({
            to: token,
            sound: "default",
            title: "Disaster Alert",
            body: message,
            data,
        }));

    // Chunk and send
    const chunks = expo.chunkPushNotifications(messages);
    try {
        for (const chunk of chunks) {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            console.log("Push ticket chunk:", ticketChunk);
            // In production, you should record tickets and handle receipts
        }
    } catch (err) {
        console.error("Error sending push chunk:", err);
    }
}
