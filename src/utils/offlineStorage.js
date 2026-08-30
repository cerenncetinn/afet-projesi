import AsyncStorage from "@react-native-async-storage/async-storage";

const SYNC_QUEUE_KEY = "afet_sync_queue";
const IMPORTANT_INFO_CACHE_KEY = "important_info_cache";
const REPORTS_CACHE_KEY = "reports_cache";
const EARTHQUAKES_CACHE_KEY = "earthquakes_cache";
const TASKS_CACHE_KEY = "tasks_cache";

const createQueueId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const STORAGE_KEYS = {
  SYNC_QUEUE_KEY,
  IMPORTANT_INFO_CACHE_KEY,
  REPORTS_CACHE_KEY,
  EARTHQUAKES_CACHE_KEY,
  TASKS_CACHE_KEY,
};

export async function saveLocal(key, data) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.log("Local kaydetme hatası:", error);
  }
}

export async function loadLocal(key, fallback = null) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.log("Local okuma hatası:", error);
    return fallback;
  }
}

export async function removeLocal(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.log("Local silme hatası:", error);
  }
}

export async function saveCache(key, data) {
  try {
    await saveLocal(key, {
      data,
      savedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.log("Cache kaydetme hatası:", error);
  }
}

export async function getCache(key) {
  try {
    return await loadLocal(key, null);
  } catch (error) {
    console.log("Cache okuma hatası:", error);
    return null;
  }
}

export async function getSyncQueue() {
  return await loadLocal(SYNC_QUEUE_KEY, []);
}

export async function addToSyncQueue(item) {
  try {
    const queue = await getSyncQueue();

    const queueItem = {
      id: createQueueId(),
      type: item.type,
      payload: item.payload,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      status: "waiting",
    };

    const nextQueue = [...queue, queueItem];

    await saveLocal(SYNC_QUEUE_KEY, nextQueue);

    return queueItem;
  } catch (error) {
    console.log("Sync kuyruğuna ekleme hatası:", error);
    throw error;
  }
}

export async function removeFromSyncQueue(queueId) {
  try {
    const queue = await getSyncQueue();
    const nextQueue = queue.filter((item) => item.id !== queueId);
    await saveLocal(SYNC_QUEUE_KEY, nextQueue);
  } catch (error) {
    console.log("Sync kuyruğundan silme hatası:", error);
  }
}

export async function updateSyncQueueItem(queueId, updates) {
  try {
    const queue = await getSyncQueue();

    const nextQueue = queue.map((item) =>
      item.id === queueId
        ? {
            ...item,
            ...updates,
          }
        : item,
    );

    await saveLocal(SYNC_QUEUE_KEY, nextQueue);
  } catch (error) {
    console.log("Sync kuyruğu güncelleme hatası:", error);
  }
}

export async function clearSyncQueue() {
  try {
    await removeLocal(SYNC_QUEUE_KEY);
  } catch (error) {
    console.log("Sync kuyruğu temizleme hatası:", error);
  }
}

export async function getSyncQueueCount() {
  const queue = await getSyncQueue();
  return queue.length;
}
