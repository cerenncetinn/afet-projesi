import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  arrayUnion,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS } from "../../src/constants/theme";
import { auth, db } from "../../src/firebase/firebaseConfig";
import { useNetworkStatus } from "../../src/hooks/useNetworkStatus";
import { calculateDistance } from "../../src/utils/geoUtils";
import { getCache, STORAGE_KEYS } from "../../src/utils/offlineStorage";

export default function YoldayimScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [task, setTask] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    const getTaskFromCache = async () => {
      const cachedReports = await getCache(STORAGE_KEYS.REPORTS_CACHE_KEY);
      const cachedTasks = await getCache(STORAGE_KEYS.TASKS_CACHE_KEY);

      return (
        cachedReports?.data?.find((item) => item.id === id) ||
        cachedTasks?.data?.find((item) => item.id === id) ||
        null
      );
    };

    const prepareScreen = async () => {
      try {
        if (!id) {
          Alert.alert("Hata", "Görev bilgisi bulunamadı.");
          router.back();
          return;
        }

        const cachedTask = await getTaskFromCache();

        if (cachedTask) {
          setTask(cachedTask);
        }

        if (isOnline) {
          const ref = doc(db, "reports", id);
          const snap = await getDoc(ref);

          if (snap.exists()) {
            setTask({ id: snap.id, ...snap.data() });
          } else if (!cachedTask) {
            Alert.alert("Hata", "Görev bulunamadı.");
            router.back();
            return;
          }
        } else if (!cachedTask) {
          Alert.alert(
            "Çevrimdışı Mod",
            "Bu görev daha önce cihazda kaydedilmediği için çevrimdışı görüntülenemiyor.",
          );
          router.back();
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          setUserLocation(loc.coords);
        }
      } catch (error) {
        console.log("Yoldayım ekranı hata:", error);

        try {
          const cachedTask = await getTaskFromCache();

          if (cachedTask) {
            setTask(cachedTask);
          } else {
            Alert.alert("Hata", "Görev bilgileri alınamadı.");
          }
        } catch {
          Alert.alert("Hata", "Görev bilgileri alınamadı.");
        }
      } finally {
        setLoading(false);
      }
    };

    prepareScreen();
  }, [id, isOnline, router]);

  const alreadyJoined = useMemo(() => {
    if (!task || !auth.currentUser) return false;
    return task.volunteers?.includes(auth.currentUser.uid);
  }, [task]);

  const distanceText = useMemo(() => {
    if (
      !userLocation ||
      !task?.location?.latitude ||
      !task?.location?.longitude
    ) {
      return "Mesafe hesaplanamadı";
    }

    const km = parseFloat(
      calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        task.location.latitude,
        task.location.longitude,
      ),
    );

    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
  }, [userLocation, task]);

  const neededVolunteers = task?.neededVolunteers || task?.volunteerCount || 1;
  const activeVolunteers = task?.activeVolunteers || 0;
  const remainingNeeded = Math.max(0, neededVolunteers - activeVolunteers);
  const isFull = activeVolunteers >= neededVolunteers;

  const handleJoinTask = async () => {
    if (!isOnline) {
      Alert.alert(
        "Çevrimdışı Mod",
        "Göreve katılım kaydedebilmek için internet bağlantısı gerekir. Şu an görev bilgisi önbellekten gösteriliyor.",
      );
      return;
    }

    if (!task || !auth.currentUser) {
      Alert.alert("Hata", "Oturum bilgisi bulunamadı.");
      return;
    }

    if (alreadyJoined) {
      Alert.alert("Bilgi", "Bu göreve zaten katıldınız.");
      return;
    }

    const needed = task.neededVolunteers || task.volunteerCount || 1;
    const active = task.activeVolunteers || 0;

    if (active >= needed) {
      Alert.alert(
        "Görev Doldu",
        "Bu görev için yeterli gönüllü yola çıktı. Lütfen başka bir göreve yönelin.",
      );
      return;
    }

    try {
      setJoining(true);

      const ref = doc(db, "reports", task.id);

      const freshSnap = await getDoc(ref);

      if (!freshSnap.exists()) {
        Alert.alert("Hata", "Görev artık mevcut değil.");
        return;
      }

      const freshTask = {
        id: freshSnap.id,
        ...freshSnap.data(),
      };

      const freshNeeded =
        freshTask.neededVolunteers || freshTask.volunteerCount || 1;
      const freshActive = freshTask.activeVolunteers || 0;
      const freshVolunteers = freshTask.volunteers || [];

      if (freshVolunteers.includes(auth.currentUser.uid)) {
        setTask(freshTask);
        Alert.alert("Bilgi", "Bu göreve zaten katıldınız.");
        return;
      }

      if (freshTask.status === "completed") {
        setTask(freshTask);
        Alert.alert("Görev Kapandı", "Bu görev tamamlanmış görünüyor.");
        return;
      }

      if (freshActive >= freshNeeded) {
        setTask(freshTask);
        Alert.alert(
          "Görev Doldu",
          "Bu görev için yeterli gönüllü yola çıktı. Lütfen başka bir göreve yönelin.",
        );
        return;
      }

      await updateDoc(ref, {
        activeVolunteers: increment(1),
        volunteers: arrayUnion(auth.currentUser.uid),
        status: "in_progress",
        isFull: freshActive + 1 >= freshNeeded,
        startedAt: freshTask.startedAt || serverTimestamp(),
        lastVolunteerJoinedAt: serverTimestamp(),
      });

      setTask((prev) => ({
        ...prev,
        activeVolunteers: (freshActive || 0) + 1,
        volunteers: [...freshVolunteers, auth.currentUser.uid],
        status: "in_progress",
        isFull: freshActive + 1 >= freshNeeded,
      }));

      Alert.alert("Başarılı", "Göreve katıldınız. Güvende kalın.");
    } catch (error) {
      console.log("Yoldayım update hata:", error.code, error.message);

      Alert.alert(
        "Hata",
        `${error.code || "unknown"}\n${
          error.message || "Göreve katılım kaydedilemedi."
        }`,
      );
    } finally {
      setJoining(false);
    }
  };

  const openMaps = () => {
    if (!task?.location?.latitude || !task?.location?.longitude) {
      Alert.alert("Hata", "Bu görev için konum bilgisi bulunamadı.");
      return;
    }

    const { latitude, longitude } = task.location;
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Görev hazırlanıyor...</Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.emptyBox}>
            <Ionicons name="alert-circle-outline" size={64} color="#334155" />
            <Text style={styles.emptyTitle}>Görev Bulunamadı</Text>
            <Text style={styles.emptyText}>
              Görev silinmiş, tamamlanmış veya çevrimdışı kullanım için daha
              önce kaydedilmemiş olabilir.
            </Text>

            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push("/gonullu/gonulluPaneli")}
            >
              <Text style={styles.emptyBtnText}>Görev Merkezine Dön</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={26} color="white" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>YOLDAYIM</Text>
            <Text style={styles.headerSub}>
              {isOnline
                ? "Saha görev katılım ekranı"
                : "Önbellekten görüntüleniyor"}
            </Text>
          </View>

          <View
            style={[
              styles.liveBadge,
              !isOnline && {
                backgroundColor: "rgba(127,29,29,0.35)",
              },
            ]}
          >
            <View
              style={[
                styles.liveDot,
                !isOnline && { backgroundColor: "#FCA5A5" },
              ]}
            />
            <Text style={[styles.liveText, !isOnline && { color: "#FCA5A5" }]}>
              {isOnline ? "CANLI" : "OFFLINE"}
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
        >
          {!isOnline && (
            <View style={styles.offlineNotice}>
              <Ionicons
                name="cloud-offline-outline"
                size={20}
                color="#FCA5A5"
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.offlineNoticeTitle}>
                  Çevrimdışı Görüntüleme
                </Text>
                <Text style={styles.offlineNoticeText}>
                  Bu görev son kaydedilen veriden gösteriliyor. Göreve katılım
                  kaydetmek için internet bağlantısı gerekir.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.heroCard}>
            <View style={styles.priorityBadge}>
              <Ionicons
                name="warning-outline"
                size={15}
                color={COLORS.primary}
              />
              <Text style={styles.priorityText}>
                {task?.priority || "AKTİF GÖREV"}
              </Text>
            </View>

            <Text style={styles.title}>
              {task?.title || `${task?.category || "Afet"} Yardım Görevi`}
            </Text>

            <Text style={styles.description}>
              {task?.description || "Görev açıklaması bulunamadı."}
            </Text>

            <View style={styles.locationRow}>
              <Ionicons name="location" size={18} color="#38BDF8" />
              <Text style={styles.locationText}>
                {task?.address || "Adres bilgisi yok"}
              </Text>
            </View>
          </View>

          <View style={styles.grid}>
            <View style={styles.infoCard}>
              <Ionicons name="navigate-outline" size={22} color="#38BDF8" />
              <Text style={styles.infoValue}>{distanceText}</Text>
              <Text style={styles.infoLabel}>Tahmini mesafe</Text>
            </View>

            <View style={styles.infoCard}>
              <Ionicons
                name="people-outline"
                size={22}
                color={COLORS.primary}
              />
              <Text style={styles.infoValue}>{activeVolunteers}</Text>
              <Text style={styles.infoLabel}>Aktif gönüllü</Text>
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="person-add-outline" size={22} color="#22C55E" />
              <Text style={styles.infoValue}>{remainingNeeded}</Text>
              <Text style={styles.infoLabel}>Kalan ihtiyaç</Text>
            </View>

            <View style={styles.infoCard}>
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color="#FBBF24"
              />
              <Text style={styles.infoValue}>{isFull ? "Dolu" : "Açık"}</Text>
              <Text style={styles.infoLabel}>Görev durumu</Text>
            </View>
          </View>

          <View style={styles.routeCard}>
            <Text style={styles.cardTitle}>Saha Talimatı</Text>

            <View style={styles.stepRow}>
              <View style={styles.stepNo}>
                <Text style={styles.stepNoText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Konuma güvenli rota üzerinden ilerleyin.
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepNo}>
                <Text style={styles.stepNoText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                Olay yerine varmadan önce çevre güvenliğini kontrol edin.
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepNo}>
                <Text style={styles.stepNoText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                Durumu teyit edip yardım sürecini başlatın.
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.mapBtn} onPress={openMaps}>
            <Ionicons name="map-outline" size={19} color="white" />
            <Text style={styles.mapBtnText}>Haritada Aç</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.joinBtn,
              alreadyJoined && { backgroundColor: "#16A34A" },
              isFull && !alreadyJoined && { backgroundColor: "#334155" },
              !isOnline && { backgroundColor: "#334155" },
              joining && { opacity: 0.7 },
            ]}
            onPress={handleJoinTask}
            disabled={joining || (isFull && !alreadyJoined)}
          >
            <Ionicons
              name={
                !isOnline
                  ? "cloud-offline-outline"
                  : alreadyJoined
                    ? "checkmark-circle"
                    : isFull
                      ? "lock-closed"
                      : "navigate"
              }
              size={20}
              color={
                !isOnline || (isFull && !alreadyJoined) ? "#94A3B8" : "#0F172A"
              }
            />

            <Text
              style={[
                styles.joinBtnText,
                (!isOnline || (isFull && !alreadyJoined)) && {
                  color: "#94A3B8",
                },
              ]}
            >
              {joining
                ? "Kaydediliyor..."
                : !isOnline
                  ? "Çevrimdışı"
                  : alreadyJoined
                    ? "Göreve Katıldınız"
                    : isFull
                      ? "Görev Doldu"
                      : "Yoldayım"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.detailBtn}
            onPress={() =>
              router.push({
                pathname: "/gonullu/ihbarAnalizi",
                params: { id: task.id },
              })
            }
          >
            <Text style={styles.detailBtnText}>AI Analiz Detayını Gör</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },

  loadingScreen: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: { color: "#94A3B8", marginTop: 12 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
    gap: 12,
  },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: { color: "white", fontSize: 20, fontWeight: "900" },

  headerSub: { color: "#64748B", fontSize: 12, marginTop: 3 },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34,197,94,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: "#22C55E",
  },

  liveText: { color: "#22C55E", fontSize: 10, fontWeight: "900" },

  offlineNotice: {
    backgroundColor: "rgba(127,29,29,0.55)",
    borderWidth: 1,
    borderColor: "rgba(252,165,165,0.35)",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },

  offlineNoticeTitle: {
    color: "#FCA5A5",
    fontSize: 13,
    fontWeight: "900",
  },

  offlineNoticeText: {
    color: "#FEE2E2",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },

  heroCard: {
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1E293B",
  },

  priorityBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(249,115,22,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 14,
  },

  priorityText: { color: COLORS.primary, fontSize: 11, fontWeight: "900" },

  title: { color: "white", fontSize: 24, fontWeight: "900", lineHeight: 31 },

  description: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 18,
  },

  locationText: { color: "#94A3B8", fontSize: 13, flex: 1 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
  },

  infoCard: {
    width: "48%",
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
  },

  infoValue: { color: "white", fontSize: 20, fontWeight: "900", marginTop: 10 },

  infoLabel: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "700",
  },

  routeCard: {
    backgroundColor: "#111827",
    borderRadius: 20,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
  },

  cardTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 14,
  },

  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
  },

  stepNo: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  stepNoText: { color: "#0F172A", fontWeight: "900", fontSize: 12 },

  stepText: { color: "#CBD5E1", flex: 1, fontSize: 13, lineHeight: 20 },

  mapBtn: {
    marginTop: 18,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  mapBtnText: { color: "white", fontWeight: "800" },

  joinBtn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    padding: 17,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  joinBtnText: { color: "#0F172A", fontSize: 16, fontWeight: "900" },

  detailBtn: {
    marginTop: 12,
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
  },

  detailBtnText: { color: "#94A3B8", fontWeight: "800" },

  emptyBox: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 100,
  },

  emptyTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 16,
  },

  emptyText: {
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 21,
    marginTop: 8,
  },

  emptyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 20,
  },

  emptyBtnText: { color: "#0F172A", fontWeight: "900" },
});
