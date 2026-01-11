import { env } from "./env";

export function isDemoMode(): boolean {
  return __DEV__ || Boolean(env.forceMockApi);
}
