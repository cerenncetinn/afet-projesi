import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { COLORS } from "../constants/theme";
import { auth, db } from "../firebase/firebaseConfig";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import {
    getSyncQueue,
    removeFromSyncQueue,
    updateSyncQueueItem,
} from "../utils/offlineStorage";

export default function OfflineSyncManager() {
  const { isOnline, networkReady } = useNetworkStatus();
  const syncingRef = useRef(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const checkQueue = async () => {
      const queue = await getSyncQueue();
      setPendingCount(queue.length);
    };

    checkQueue();
  }, [isOnline]);

  useEffect(() => {
    if (!networkReady) return;
    if (!isOnline) return;
    if (!auth.currentUser) return;

    syncQueue();
  }, [isOnline, networkReady]);

  const syncQueue = async () => {
    if (syncingRef.current) return;

    try {
      syncingRef.current = true;

      const queue = await getSyncQueue();

      if (queue.length === 0) {
        setPendingCount(0);
        return;
      }

      for (const item of queue) {
        try {
          if (item.type === "CREATE_REPORT") {
            await syncCreateReport(item);
            await removeFromSyncQueue(item.id);
          }
        } catch (error) {
          console.log("Queue item gönderilemedi:", error);

          await updateSyncQueueItem(item.id, {
            retryCount: (item.retryCount || 0) + 1,
            lastError: error?.message || "Bilinmeyen hata",
            lastTriedAt: new Date().toISOString(),
          });
        }
      }

      const remainingQueue = await getSyncQueue();
      setPendingCount(remainingQueue.length);
    } catch (error) {
      console.log("Offline sync genel hata:", error);
    } finally {
      syncingRef.current = false;
    }
  };

  const syncCreateReport = async (queueItem) => {
    const payload = queueItem.payload;

    if (!payload) {
      throw new Error("Payload bulunamadı.");
    }

    await addDoc(collection(db, "reports"), {
      ...payload,
      createdAt: serverTimestamp(),
      syncedAt: serverTimestamp(),
      offlineCreatedAt: payload.offlineCreatedAt || queueItem.createdAt,
      wasOffline: true,
    });
  };

  if (!networkReady) return null;

  if (!isOnline) {
    return (
      <View style={styles.offlineBanner}>
        <Text style={styles.offlineText}>
          Çevrimdışı moddasınız. Yeni ihbarlar cihazda saklanacak.
        </Text>
      </View>
    );
  }

  if (pendingCount > 0) {
    return (
      <View style={styles.syncBanner}>
        <Text style={styles.syncText}>
          Bekleyen {pendingCount} işlem senkronize ediliyor...
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  offlineBanner: {
    position: "absolute",
    top: 45,
    left: 16,
    right: 16,
    zIndex: 9999,
    backgroundColor: "#7F1D1D",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },

  offlineText: {
    color: "white",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "800",
  },

  syncBanner: {
    position: "absolute",
    top: 45,
    left: 16,
    right: 16,
    zIndex: 9999,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },

  syncText: {
    color: "#0F172A",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "900",
  },
});
