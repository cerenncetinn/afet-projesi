import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

import { db } from "../../firebase/firebaseConfig";
import { getCache, saveCache, STORAGE_KEYS } from "../../utils/offlineStorage";
import { useNetworkStatus } from "../useNetworkStatus";

const filterAvailableTasks = (reports) => {
  return reports.filter((task) => {
    // Tamamlanan görevler görev merkezinde görünmesin
    if (task.status === "completed") return false;

    const neededVolunteers = task.neededVolunteers || task.volunteerCount || 1;
    const activeVolunteers = task.activeVolunteers || 0;

    const remainingNeeded = Math.max(0, neededVolunteers - activeVolunteers);

    // Görev dolduysa yeni gönüllülere görünmesin
    if (remainingNeeded <= 0) return false;

    // Pending veya in_progress görevler görünsün
    return true;
  });
};

export const useFetchTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cacheSavedAt, setCacheSavedAt] = useState(null);

  const { isOnline, networkReady } = useNetworkStatus();

  useEffect(() => {
    let unsubscribe = null;
    let mounted = true;

    const loadCacheFirst = async () => {
      try {
        const cachedTasks = await getCache(STORAGE_KEYS.TASKS_CACHE_KEY);

        if (!mounted) return;

        if (cachedTasks?.data && Array.isArray(cachedTasks.data)) {
          setTasks(cachedTasks.data);
          setCacheSavedAt(cachedTasks.savedAt);
        }
      } catch (error) {
        console.log("Görev cache okuma hatası:", error);
      }
    };

    const listenTasksOnline = () => {
      const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));

      unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          const allReports = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          const taskList = filterAvailableTasks(allReports);

          if (!mounted) return;

          setTasks(taskList);

          await saveCache(STORAGE_KEYS.TASKS_CACHE_KEY, taskList);
          setCacheSavedAt(new Date().toISOString());
        },
        async (error) => {
          console.log("Görev çekme hatası:", error.code, error.message);

          const fallback = await getCache(STORAGE_KEYS.TASKS_CACHE_KEY);

          if (mounted && fallback?.data && Array.isArray(fallback.data)) {
            setTasks(fallback.data);
            setCacheSavedAt(fallback.savedAt);
          }
        },
      );
    };

    const start = async () => {
      setLoading(true);

      // 1. Önce cihazdaki son görev listesini yükle
      await loadCacheFirst();

      // 2. Cache geldikten sonra ekranı aç
      if (mounted) setLoading(false);

      // 3. NetInfo hazır değilse cache ekranda kalsın
      if (!networkReady) return;

      // 4. İnternet yoksa Firestore dinleme başlatma
      if (!isOnline) return;

      // 5. İnternet varsa güncel görevleri çek ve cache'i yenile
      listenTasksOnline();
    };

    start();

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [isOnline, networkReady]);

  return {
    tasks,
    loading,
    isOffline: networkReady && !isOnline,
    cacheSavedAt,
  };
};
