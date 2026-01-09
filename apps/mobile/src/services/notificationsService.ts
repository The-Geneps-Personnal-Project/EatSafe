import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

import { http } from "./http";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  const existing = await Notifications.getPermissionsAsync();
  let granted = existing.granted;

  if (!granted) {
    const req = await Notifications.requestPermissionsAsync();
    granted = req.granted;
  }

  if (!granted) {
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

export async function sendPushTokenToBackend(token: string): Promise<void> {
  // Backend to implement: POST /notifications/register
  // Body can be extended later (userId, deviceId, platform, locale, etc.)
  await http.post("/notifications/register", { token });
}
