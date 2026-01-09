import { PropsWithChildren, useEffect, useRef } from "react";
import NetInfo from "@react-native-community/netinfo";

import { useAuth } from "../../auth/authState";
import { fetchRestaurantDetailBySiret } from "../../services/restaurantService";
import { captureError, trackEvent } from "../../telemetry/telemetry";
import { listPinnedTargets } from "../../storage/pinnedQuery";
import { upsertFullForPinned } from "../../storage/restaurantCache";

const MIN_INTERVAL_MS = 15 * 60 * 1000;
const MAX_PER_RUN = 25;

export function PinnedDetailsSyncManager({ children }: PropsWithChildren) {
  const { isGuest } = useAuth();

  const inFlightRef = useRef(false);
  const lastRunAtRef = useRef<number>(0);

  useEffect(() => {
    const run = async (reason: "startup" | "net_online") => {
      if (isGuest) return;
      if (inFlightRef.current) return;

      const now = Date.now();
      if (now - lastRunAtRef.current < MIN_INTERVAL_MS) return;

      inFlightRef.current = true;
      lastRunAtRef.current = now;

      try {
        const targets = (await listPinnedTargets()).slice(0, MAX_PER_RUN);
        trackEvent({ name: "pinned_sync_start", props: { reason, count: targets.length } });

        let ok = 0;
        let failed = 0;

        for (const t of targets) {
          try {
            const details = await fetchRestaurantDetailBySiret(t.siret);
            await upsertFullForPinned(details, { bookmarked: t.bookmarked === 1, pinned: true });
            ok += 1;
          } catch (e) {
            failed += 1;
            captureError(e, { where: "PinnedDetailsSyncManager.item", siret: t.siret });
          }
        }

        trackEvent({ name: "pinned_sync_done", props: { ok, failed } });
      } catch (e) {
        captureError(e, { where: "PinnedDetailsSyncManager.run" });
        trackEvent({ name: "pinned_sync_failed" });
      } finally {
        inFlightRef.current = false;
      }
    };

    // Best-effort startup sync if online.
    void (async () => {
      try {
        const state = await NetInfo.fetch();
        if (state.isConnected) {
          await run("startup");
        }
      } catch {
        // ignore
      }
    })();

    const sub = NetInfo.addEventListener((state) => {
      if (!state.isConnected) return;
      void run("net_online");
    });

    return () => {
      sub();
    };
  }, [isGuest]);

  return children;
}
