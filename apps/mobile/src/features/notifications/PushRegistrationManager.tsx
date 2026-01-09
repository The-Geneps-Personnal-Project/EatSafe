import { PropsWithChildren, useEffect, useRef } from "react";

import { getPushEnabled } from "./pushPrefs";
import { registerForPushNotifications, sendPushTokenToBackend } from "../../services/notificationsService";

export function PushRegistrationManager({ children }: PropsWithChildren) {
    const didRunRef = useRef(false);

    useEffect(() => {
        if (didRunRef.current) return;
        didRunRef.current = true;

        void (async () => {
            try {
                const enabled = await getPushEnabled();
                if (!enabled) return;

                const token = await registerForPushNotifications();
                if (!token) return;

                await sendPushTokenToBackend(token);
            } catch {
                // Best-effort: do not block app start if push registration fails.
            }
        })();
    }, []);

    return children;
}
