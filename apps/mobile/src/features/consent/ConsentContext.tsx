import { createContext, PropsWithChildren, useContext } from "react";
import type { ConsentState } from "./consentStorage";

type ConsentContextValue = {
  consent: ConsentState;
  setConsent: (next: ConsentState) => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ consent, setConsent, children }: PropsWithChildren<{ consent: ConsentState; setConsent: (next: ConsentState) => void }>) {
  return <ConsentContext.Provider value={{ consent, setConsent }}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("ConsentProvider missing");
  return ctx;
}
