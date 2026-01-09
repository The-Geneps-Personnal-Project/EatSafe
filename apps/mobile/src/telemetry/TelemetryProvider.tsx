import { PropsWithChildren, useEffect } from "react";

import { useConsent } from "../features/consent/ConsentContext";
import { configureTelemetry } from "./telemetry";

export function TelemetryProvider({ children }: PropsWithChildren) {
    const { consent } = useConsent();

    useEffect(() => {
        configureTelemetry(consent);
    }, [consent]);

    return children;
}
