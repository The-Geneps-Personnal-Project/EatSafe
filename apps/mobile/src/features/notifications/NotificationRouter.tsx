import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import * as Linking from "expo-linking";

import { ensurePublicIdForSiret } from "../../services/shareService";
import { captureError, trackEvent } from "../../telemetry/telemetry";

type UnknownData = Record<string, unknown>;

function asString(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s ? s : undefined;
}

function tryExtractPublicId(data: UnknownData): string | undefined {
  return (
    asString(data.publicId) ||
    asString(data.public_id) ||
    asString(data.restaurantPublicId) ||
    asString(data.restaurant_public_id)
  );
}

function tryExtractSiret(data: UnknownData): string | undefined {
  return asString(data.siret) || asString(data.restaurantSiret) || asString(data.restaurant_siret);
}

function tryExtractPublicIdFromUrl(rawUrl: string): string | undefined {
  try {
    const url = new URL(rawUrl);
    // Supports both https://eatsafe.adabin.fr/r/<publicId> and eatsafe://r/<publicId>
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length >= 2 && parts[0] === "r") {
      return decodeURIComponent(parts[1]);
    }
    return undefined;
  } catch {
    return undefined;
  }
}

async function openRestaurant(publicId: string) {
  const deepLink = Linking.createURL(`r/${encodeURIComponent(publicId)}`);
  trackEvent({ name: "push_open_restaurant", props: { by: "publicId" } });
  await Linking.openURL(deepLink);
}

async function handleNotificationData(data: UnknownData) {
  const directUrl = asString(data.url) || asString(data.deepLink) || asString(data.deeplink);
  if (directUrl) {
    const pid = tryExtractPublicIdFromUrl(directUrl);
    if (pid) {
      await openRestaurant(pid);
      return;
    }
  }

  const publicId = tryExtractPublicId(data);
  if (publicId) {
    await openRestaurant(publicId);
    return;
  }

  const siret = tryExtractSiret(data);
  if (siret) {
    trackEvent({ name: "push_open_restaurant", props: { by: "siret_resolve" } });
    const pid = await ensurePublicIdForSiret(siret);
    await openRestaurant(pid);
    return;
  }

  trackEvent({ name: "push_open_ignored", props: { reason: "no_target" } });
}

export function NotificationRouter() {
  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const process = async (response: Notifications.NotificationResponse) => {
      try {
        const raw = response.notification.request.content.data as UnknownData;
        await handleNotificationData(raw ?? {});
      } catch (e) {
        captureError(e, { where: "NotificationRouter.process" });
        trackEvent({ name: "push_open_failed" });
      }
    };

    void (async () => {
      try {
        const initial = await Notifications.getLastNotificationResponseAsync();
        if (initial) {
          trackEvent({ name: "push_open_initial" });
          await process(initial);
        }
      } catch (e) {
        captureError(e, { where: "NotificationRouter.initial" });
      }
    })();

    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      trackEvent({ name: "push_open_tap" });
      void process(resp);
    });

    return () => {
      sub.remove();
    };
  }, []);

  return null;
}
