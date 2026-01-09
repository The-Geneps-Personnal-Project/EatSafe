import type { ConsentState } from "../features/consent/consentStorage";

export type TelemetryEvent = {
  name: string;
  props?: Record<string, string | number | boolean | null | undefined>;
};

let enabled = false;

export function configureTelemetry(consent: ConsentState) {
  enabled = Boolean(consent.decided && consent.analytics);
}

export function trackEvent(event: TelemetryEvent) {
  if (!enabled) return;
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log("[telemetry]", event.name, event.props ?? {});
  }
}

export function captureError(
  error: unknown,
  context?: Record<string, unknown>
) {
  if (!enabled) return;
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log("[telemetry:error]", error, context ?? {});
  }
}

export function setUser(user: { id: string } | null) {
  if (!enabled) return;
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log("[telemetry:user]", user?.id ?? null);
  }
}
