import { createContext, PropsWithChildren, useContext } from "react";
import type { ConsentState } from "./consentStorage";

type ConsentContextValue = {
  consent: ConsentState;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ consent, children }: PropsWithChildren<{ consent: ConsentState }>) {
  return <ConsentContext.Provider value={{ consent }}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("ConsentProvider missing");
  return ctx;
}
