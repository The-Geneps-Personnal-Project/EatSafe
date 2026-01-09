import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export function useNetwork() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const ok =
        Boolean(state.isConnected) &&
        Boolean(state.isInternetReachable ?? true);
      setIsOnline(ok);
    });
    return () => unsub();
  }, []);

  return { isOnline };
}
