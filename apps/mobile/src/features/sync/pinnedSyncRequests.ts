export type PinnedSyncRequestReason = "bookmark" | "list_add" | "manual";

type Listener = (reason: PinnedSyncRequestReason) => void;

const listeners = new Set<Listener>();

export function requestPinnedDetailsSync(
  reason: PinnedSyncRequestReason = "manual"
) {
  for (const l of listeners) {
    try {
      l(reason);
    } catch {
      // ignore
    }
  }
}

export function subscribePinnedDetailsSync(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
