import { getPushEnabled, setPushEnabled } from "./pushPrefs";
import {
  registerForPushNotifications,
  sendPushTokenToBackend,
} from "../../services/notificationsService";

export async function loadPushState(): Promise<boolean> {
  return await getPushEnabled();
}

export async function enablePush(): Promise<{
  enabled: boolean;
  reason?: "permission_denied" | "no_device";
}> {
  const token = await registerForPushNotifications();
  if (!token) {
    await setPushEnabled(false);
    return { enabled: false, reason: "permission_denied" };
  }

  // Persist preference even if backend register fails (we'll retry later).
  await setPushEnabled(true);
  try {
    await sendPushTokenToBackend(token);
  } catch {
    // ignore here; UX handles warning elsewhere
  }
  return { enabled: true };
}

export async function disablePush(): Promise<void> {
  await setPushEnabled(false);
}
