import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [networkReady, setNetworkReady] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = Boolean(
        state.isConnected && state.isInternetReachable !== false,
      );

      setIsOnline(connected);
      setNetworkReady(true);
    });

    return () => unsubscribe();
  }, []);

  return {
    isOnline,
    networkReady,
  };
}
