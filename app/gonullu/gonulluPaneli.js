import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import relativeTime from "dayjs/plugin/relativeTime";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AiRecommendation from "../../src/components/gonullu/aiRecommendation";
import GonulluBottomTab from "../../src/components/gonullu/gonulluBottomTab";
import TaskCard from "../../src/components/gonullu/taskCard";
import { COLORS } from "../../src/constants/theme";
import { auth, db } from "../../src/firebase/firebaseConfig";
import { useFetchTasks } from "../../src/hooks/gonullu/useFetchTasks";
import { calculateDistance } from "../../src/utils/geoUtils";

dayjs.extend(relativeTime);
dayjs.locale("tr");

const FILTERS = [
  { key: "ai", label: "AI Önerisi", icon: "sparkles-outline" },
  { key: "distance", label: "En Yakın", icon: "navigate-outline" },
  { key: "urgency", label: "En Acil", icon: "warning-outline" },
];

export default function GonulluPaneli() {
  const router = useRouter();

  const {
    tasks,
    loading: tasksLoading,
    isOffline,
    cacheSavedAt,
  } = useFetchTasks();

  const [userData, setUserData] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("Konum hazırlanıyor...");
  const [filter, setFilter] = useState("ai");
  const [filterModal, setFilterModal] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!auth.currentUser) return;
        const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (snap.exists()) setUserData(snap.data());
      } catch (e) {
        console.log("Kullanıcı bilgisi alınamadı:", e);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          setLocationStatus("Konum izni verilmedi");
          Alert.alert(
            "Konum İzni Gerekli",
            "Görevleri mesafeye göre sıralamak için konum izni vermelisin.",
          );
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setUserLocation(loc.coords);
        setLocationStatus("Konum aktif");
      } catch (e) {
        setLocationStatus("Konum alınamadı");
        console.log("Konum hatası:", e);
      }
    };

    getLocation();
  }, []);

  const formatCacheTime = (isoDate) => {
    if (!isoDate) return null;

    try {
      const date = new Date(isoDate);
      return date.toLocaleString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  };

  const processedTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];

    const expertice = `${userData?.expertice || ""} ${
      userData?.experticeDetail || ""
    }`
      .toLowerCase()
      .trim();

    const getUrgency = (task) => {
      if (typeof task.urgency === "number") return task.urgency;

      const p = (task.priority || "").toUpperCase();

      if (p === "KRİTİK") return 1;
      if (p === "ACİL" || p === "YÜKSEK") return 0.75;
      if (p === "ORTA") return 0.5;
      return 0.3;
    };

    const getPriority = (urgency, priority) => {
      if (priority) return priority.toUpperCase();

      if (urgency >= 0.85) return "KRİTİK";
      if (urgency >= 0.65) return "ACİL";
      if (urgency >= 0.45) return "ORTA";
      return "BİLGİ";
    };

    const getExpertScore = (task) => {
      if (!expertice) return 10;

      const category = (task.category || "").toLowerCase();
      const title = (task.title || "").toLowerCase();
      const desc = (task.description || "").toLowerCase();
      const skill = (task.requiredSkill || "").toLowerCase();

      const joined = `${category} ${title} ${desc} ${skill}`;

      if (joined.includes(expertice)) return 30;

      if (
        (expertice.includes("sağlık") ||
          expertice.includes("doktor") ||
          expertice.includes("hemşire") ||
          expertice.includes("paramedik") ||
          expertice.includes("ilk yardım")) &&
        (joined.includes("ilaç") ||
          joined.includes("tıbbi") ||
          joined.includes("kan") ||
          joined.includes("sağlık"))
      ) {
        return 30;
      }

      if (
        (expertice.includes("lojistik") ||
          expertice.includes("araç") ||
          expertice.includes("dağıtım") ||
          expertice.includes("depo")) &&
        (joined.includes("gıda") ||
          joined.includes("transfer") ||
          joined.includes("dağıtım") ||
          joined.includes("lojistik"))
      ) {
        return 30;
      }

      if (
        (expertice.includes("mühendis") ||
          expertice.includes("inşaat") ||
          expertice.includes("teknik")) &&
        (joined.includes("hasar") ||
          joined.includes("bina") ||
          joined.includes("enkaz") ||
          joined.includes("barınma"))
      ) {
        return 30;
      }

      return 10;
    };

    const getTrustScore = (task) => {
      if (typeof task.trustScore === "number") {
        return Math.max(0, Math.min(100, Math.round(task.trustScore)));
      }

      const confirmations = task.confirmations || 0;
      const reports = task.reports || 0;

      if (confirmations + reports > 0) {
        return Math.round((confirmations / (confirmations + reports)) * 100);
      }

      let score = 55;

      const hasLocation =
        !!task.location?.latitude && !!task.location?.longitude;
      const hasImage = !!task.imageUri;
      const hasUser = !!task.userId && task.userId !== "anonim";
      const hasDate = !!task.createdAt;
      const descriptionLength = task.description?.trim()?.length || 0;

      if (hasLocation) score += 15;
      if (hasImage) score += 10;
      if (descriptionLength >= 30) score += 10;
      if (hasUser) score += 5;
      if (hasDate) score += 5;

      return Math.max(0, Math.min(95, Math.round(score)));
    };

    return tasks
      .map((task) => {
        let rawDist = 9999;
        let displayDistance = "Konum yok";

        if (
          userLocation &&
          task.location?.latitude &&
          task.location?.longitude
        ) {
          rawDist = parseFloat(
            calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              task.location.latitude,
              task.location.longitude,
            ),
          );

          displayDistance =
            rawDist < 1
              ? `${Math.round(rawDist * 1000)} m`
              : `${rawDist.toFixed(1)} km`;
        }

        const urgency = getUrgency(task);
        const priority = getPriority(urgency, task.priority);
        const trustScore = getTrustScore(task);

        const distanceScore =
          rawDist === 9999
            ? 5
            : Math.max(5, Math.round(25 - Math.min(rawDist, 20)));

        const urgencyScore = Math.round(urgency * 30);
        const expertScore = getExpertScore(task);
        const trustPoint = Math.round(trustScore * 0.15);

        const aiScore = Math.min(
          99,
          distanceScore + urgencyScore + expertScore + trustPoint,
        );

        const neededVolunteers =
          task.neededVolunteers || task.volunteerCount || 1;
        const activeVolunteers = task.activeVolunteers || 0;
        const remainingNeeded = Math.max(
          0,
          neededVolunteers - activeVolunteers,
        );

        let timeAgo = "Az önce";

        try {
          if (task.createdAt?.toDate) {
            timeAgo = dayjs(task.createdAt.toDate()).fromNow();
          } else if (task.offlineCreatedAt) {
            timeAgo = dayjs(task.offlineCreatedAt).fromNow();
          }
        } catch {}

        return {
          ...task,
          title: task.title || `${task.category || "Afet"} Yardım Görevi`,
          urgency,
          priority,
          trustScore,
          aiScore,
          rawDist,
          displayDistance,
          neededVolunteers,
          activeVolunteers,
          remainingNeeded,
          timeAgo,
        };
      })
      .filter((task) => task.status !== "completed")
      .filter(
        (task) =>
          task.remainingNeeded > 0 ||
          task.volunteers?.includes(auth.currentUser?.uid),
      )
      .sort((a, b) => {
        if (filter === "distance") return a.rawDist - b.rawDist;
        if (filter === "urgency") return b.urgency - a.urgency;
        return b.aiScore - a.aiScore;
      });
  }, [tasks, userData, userLocation, filter]);

  const bestTask = processedTasks[0];

  const goDetail = (taskId) => {
    router.push({
      pathname: "/gonullu/ihbarAnalizi",
      params: { id: taskId },
    });
  };

  const goYoldayim = (taskId) => {
    if (isOffline) {
      Alert.alert(
        "Çevrimdışı Mod",
        "Göreve katılmak için internet bağlantısı gerekir. Şu an son kaydedilen görev listesi gösteriliyor.",
      );
      return;
    }

    router.push({
      pathname: "/gonullu/yoldayim",
      params: { id: taskId },
    });
  };

  const renderOfflineNotice = () => {
    if (!isOffline) return null;

    const cacheTime = formatCacheTime(cacheSavedAt);

    return (
      <View style={styles.offlineNotice}>
        <Ionicons name="cloud-offline-outline" size={20} color="#FCA5A5" />

        <View style={{ flex: 1 }}>
          <Text style={styles.offlineNoticeTitle}>
            Çevrimdışı Görev Listesi
          </Text>
          <Text style={styles.offlineNoticeText}>
            Görevler son kaydedilen veriden gösteriliyor.
            {cacheTime ? ` Son kayıt: ${cacheTime}` : ""}
          </Text>
        </View>
      </View>
    );
  };

  if (tasksLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Görev merkezi hazırlanıyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <View
            style={[
              styles.avatarBox,
              isOffline && {
                borderColor: "#FCA5A5",
                backgroundColor: "rgba(127,29,29,0.25)",
              },
            ]}
          >
            <Ionicons
              name={isOffline ? "cloud-offline-outline" : "person"}
              size={24}
              color={isOffline ? "#FCA5A5" : COLORS.primary}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>GÖREV MERKEZİ</Text>
            <Text style={styles.headerSub}>
              {isOffline
                ? "Çevrimdışı veri görüntüleniyor"
                : userData?.name
                  ? `Hoş geldin, ${userData.name}`
                  : locationStatus}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.signalBtn}
            onPress={() => setFilterModal(true)}
          >
            <Ionicons name="options-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {renderOfflineNotice()}

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{processedTasks.length}</Text>
              <Text style={styles.statLabel}>Aktif Görev</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {processedTasks.filter((t) => t.priority === "KRİTİK").length}
              </Text>
              <Text style={styles.statLabel}>Kritik</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>%{bestTask?.aiScore || 0}</Text>
              <Text style={styles.statLabel}>En İyi Eşleşme</Text>
            </View>
          </View>

          {bestTask && (
            <AiRecommendation
              task={bestTask}
              userExpertice={
                userData?.experticeDetail || userData?.expertice || "Genel"
              }
              onDetail={() => goDetail(bestTask.id)}
              onYoldayim={() => goYoldayim(bestTask.id)}
            />
          )}

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Akıllı Görev Akışı</Text>
              <Text style={styles.sectionSub}>
                {isOffline
                  ? "Son kaydedilen görev listesi gösteriliyor"
                  : "Aciliyet, mesafe ve yetkinliğe göre sıralandı"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.filterSmallBtn}
              onPress={() => setFilterModal(true)}
            >
              <Ionicons name="filter" size={14} color={COLORS.primary} />
              <Text style={styles.filterSmallText}>Filtrele</Text>
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: 20 }}>
            {processedTasks.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons
                  name={
                    isOffline
                      ? "cloud-offline-outline"
                      : "checkmark-done-circle-outline"
                  }
                  size={54}
                  color="#334155"
                />

                <Text style={styles.emptyTitle}>
                  {isOffline
                    ? "Kayıtlı görev bulunamadı"
                    : "Şu an aktif görev yok"}
                </Text>

                <Text style={styles.emptySub}>
                  {isOffline
                    ? "İnternet varken görev merkezi bir kez açılırsa son görevler burada kalır."
                    : "Yeni ihbarlar geldiğinde burada görünecek."}
                </Text>
              </View>
            ) : (
              processedTasks.map((task) => (
                <View key={task.id}>
                  <TaskCard
                    task={task}
                    onPress={() => goDetail(task.id)}
                    onYoldayim={() => goYoldayim(task.id)}
                  />

                  {isOffline && (
                    <View style={styles.cachedTaskBadge}>
                      <Ionicons
                        name="cloud-offline-outline"
                        size={12}
                        color="#FCA5A5"
                      />
                      <Text style={styles.cachedTaskBadgeText}>
                        Önbellekten gösteriliyor
                      </Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>

          <View style={styles.locationCard}>
            <View>
              <Text style={styles.locationTitle}>
                {isOffline ? "Bağlantı Durumu" : "Konum Durumu"}
              </Text>

              <Text style={styles.locationText}>
                {isOffline ? "Çevrimdışı mod aktif" : locationStatus}
              </Text>
            </View>

            <Ionicons
              name={
                isOffline
                  ? "cloud-offline-outline"
                  : userLocation
                    ? "location"
                    : "location-outline"
              }
              size={26}
              color={
                isOffline
                  ? "#FCA5A5"
                  : userLocation
                    ? COLORS.primary
                    : "#64748B"
              }
            />
          </View>
        </ScrollView>

        <GonulluBottomTab activeTab="TASKS" />

        <Modal visible={filterModal} transparent animationType="slide">
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalOverlay}
            onPress={() => setFilterModal(false)}
          >
            <View style={styles.modalSheet}>
              <View style={styles.handle} />
              <Text style={styles.modalTitle}>Görevleri Sırala</Text>

              {FILTERS.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.filterOption,
                    filter === item.key && styles.filterActive,
                  ]}
                  onPress={() => {
                    setFilter(item.key);
                    setFilterModal(false);
                  }}
                >
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={filter === item.key ? COLORS.primary : "#64748B"}
                  />

                  <Text style={styles.filterOptionText}>{item.label}</Text>

                  {filter === item.key && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={COLORS.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
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

  loadingText: {
    color: "#94A3B8",
    marginTop: 12,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
    gap: 14,
  },

  avatarBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "900",
  },

  headerSub: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 3,
  },

  signalBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },

  offlineNotice: {
    marginHorizontal: 20,
    backgroundColor: "rgba(127,29,29,0.55)",
    borderWidth: 1,
    borderColor: "rgba(252,165,165,0.35)",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
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

  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
  },

  statNumber: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: "900",
  },

  statLabel: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 4,
    fontWeight: "700",
  },

  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 14,
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
  },

  sectionSub: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 3,
  },

  filterSmallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  filterSmallText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
  },

  emptyCard: {
    backgroundColor: "#111827",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E293B",
  },

  emptyTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 12,
  },

  emptySub: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
    lineHeight: 18,
  },

  cachedTaskBadge: {
    alignSelf: "flex-start",
    marginTop: -6,
    marginBottom: 12,
    marginLeft: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(127,29,29,0.35)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },

  cachedTaskBadgeText: {
    color: "#FCA5A5",
    fontSize: 10,
    fontWeight: "800",
  },

  locationCard: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1E293B",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  locationTitle: {
    color: "white",
    fontWeight: "900",
    fontSize: 14,
  },

  locationText: {
    color: "#94A3B8",
    marginTop: 4,
    fontSize: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },

  modalSheet: {
    backgroundColor: "#1E293B",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 24,
    paddingBottom: 40,
  },

  handle: {
    width: 42,
    height: 4,
    backgroundColor: "#334155",
    borderRadius: 99,
    alignSelf: "center",
    marginBottom: 20,
  },

  modalTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 16,
  },

  filterOption: {
    backgroundColor: "#0F172A",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },

  filterActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(249,115,22,0.08)",
  },

  filterOptionText: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
    flex: 1,
  },
});
