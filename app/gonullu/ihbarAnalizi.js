import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import relativeTime from "dayjs/plugin/relativeTime";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import GonulluBottomTab from "../../src/components/gonullu/gonulluBottomTab";
import { COLORS } from "../../src/constants/theme";
import { auth, db } from "../../src/firebase/firebaseConfig";
import { useNetworkStatus } from "../../src/hooks/useNetworkStatus";
import { getCache, STORAGE_KEYS } from "../../src/utils/offlineStorage";

dayjs.extend(relativeTime);
dayjs.locale("tr");

const CATEGORY_CONFIG = {
  GIDA: {
    icon: "fast-food-outline",
    color: "#F97316",
    label: "Gıda / Temel İhtiyaç",
    skill: "Lojistik / Dağıtım",
  },
  İLAÇ: {
    icon: "medical-outline",
    color: "#06B6D4",
    label: "İlaç / Sağlık",
    skill: "Sağlık / İlk Yardım",
  },
  BARINMA: {
    icon: "home-outline",
    color: "#8B5CF6",
    label: "Barınma / Güvenli Alan",
    skill: "Saha Destek",
  },
};

export default function IhbarAnalizi() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    const fetchReport = async () => {
      try {
        if (!id) {
          setLoading(false);
          return;
        }

        const cachedReports = await getCache(STORAGE_KEYS.REPORTS_CACHE_KEY);
        const cachedTasks = await getCache(STORAGE_KEYS.TASKS_CACHE_KEY);

        const cachedReport =
          cachedReports?.data?.find((item) => item.id === id) ||
          cachedTasks?.data?.find((item) => item.id === id);

        if (cachedReport) {
          setReport(cachedReport);
        }

        if (!isOnline) {
          setLoading(false);
          return;
        }

        const ref = doc(db, "reports", id);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setReport({
            id: snap.id,
            ...snap.data(),
          });
        }
      } catch (error) {
        console.log("İhbar analiz çekme hatası:", error);

        try {
          const cachedReports = await getCache(STORAGE_KEYS.REPORTS_CACHE_KEY);
          const cachedTasks = await getCache(STORAGE_KEYS.TASKS_CACHE_KEY);

          const fallbackReport =
            cachedReports?.data?.find((item) => item.id === id) ||
            cachedTasks?.data?.find((item) => item.id === id);

          if (fallbackReport) {
            setReport(fallbackReport);
          }
        } catch (cacheError) {
          console.log("İhbar analiz cache fallback hatası:", cacheError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id, isOnline]);

  const analysis = useMemo(() => {
    if (!report) return null;

    const category = report.category || "GENEL";

    const config = CATEGORY_CONFIG[category] || {
      icon: "alert-circle-outline",
      color: COLORS.primary,
      label: "Genel Afet Yardımı",
      skill: "Genel Gönüllü Desteği",
    };

    const priority = (report.priority || "ORTA").toUpperCase();

    let urgency = report.urgency;

    if (typeof urgency !== "number") {
      if (priority === "KRİTİK") urgency = 1;
      else if (priority === "ACİL" || priority === "YÜKSEK") urgency = 0.75;
      else if (priority === "ORTA") urgency = 0.5;
      else urgency = 0.3;
    }

    const descriptionLength = report.description?.trim()?.length || 0;

    const hasLocation =
      !!report.location?.latitude && !!report.location?.longitude;

    const hasImage = !!report.imageUri;
    const hasUser = !!report.userId && report.userId !== "anonim";

    let trustScore = 55;

    if (typeof report.trustScore === "number") {
      trustScore = report.trustScore;
    } else {
      if (hasLocation) trustScore += 15;
      if (hasImage) trustScore += 10;
      if (descriptionLength >= 30) trustScore += 10;
      if (hasUser) trustScore += 5;
      if (report.createdAt) trustScore += 5;
    }

    trustScore = Math.max(0, Math.min(95, Math.round(trustScore)));

    const peopleAffected = report.peopleAffected || 1;
    const activeVolunteers = report.activeVolunteers || 0;
    const neededVolunteers =
      report.neededVolunteers || report.volunteerCount || 1;

    const remainingNeeded = Math.max(0, neededVolunteers - activeVolunteers);

    let riskScore = Math.round(urgency * 55);

    if (peopleAffected >= 10) riskScore += 18;
    else if (peopleAffected >= 5) riskScore += 12;
    else if (peopleAffected >= 2) riskScore += 6;

    if (priority === "KRİTİK") riskScore += 18;
    else if (priority === "ACİL" || priority === "YÜKSEK") riskScore += 12;
    else if (priority === "ORTA") riskScore += 6;

    if (category === "İLAÇ") riskScore += 8;
    if (remainingNeeded > 0) riskScore += 7;

    riskScore = Math.max(0, Math.min(99, riskScore));

    let riskLabel = "Düşük Risk";
    let riskColor = "#22C55E";

    if (riskScore >= 80) {
      riskLabel = "Kritik Risk";
      riskColor = "#EF4444";
    } else if (riskScore >= 60) {
      riskLabel = "Yüksek Risk";
      riskColor = "#F97316";
    } else if (riskScore >= 40) {
      riskLabel = "Orta Risk";
      riskColor = "#FBBF24";
    }

    let timeAgo = "Zaman bilgisi yok";

    try {
      if (report.createdAt?.toDate) {
        timeAgo = dayjs(report.createdAt.toDate()).fromNow();
      } else if (report.offlineCreatedAt) {
        timeAgo = dayjs(report.offlineCreatedAt).fromNow();
      }
    } catch {}

    const aiNotes = [];

    if (riskScore >= 80) {
      aiNotes.push("Bu ihbar yüksek öncelikli müdahale gerektiriyor.");
    } else if (riskScore >= 60) {
      aiNotes.push("Görev kısa sürede gönüllü desteği gerektiriyor.");
    } else {
      aiNotes.push("Görev takip edilmeli, uygun gönüllü yönlendirilmelidir.");
    }

    if (category === "İLAÇ") {
      aiNotes.push(
        "Sağlık veya ilk yardım bilgisi olan gönüllüler daha uygundur.",
      );
    }

    if (category === "GIDA") {
      aiNotes.push(
        "Gıda ve temel ihtiyaç dağıtımı için lojistik destek önerilir.",
      );
    }

    if (category === "BARINMA") {
      aiNotes.push(
        "Barınma desteği için saha güvenliği ve yönlendirme önemlidir.",
      );
    }

    if (!hasImage) {
      aiNotes.push("Fotoğraf bulunmadığı için saha teyidi önerilir.");
    }

    if (!hasLocation) {
      aiNotes.push("Konum bilgisi eksik olduğu için iletişim teyidi gerekir.");
    }

    if (report.wasOffline) {
      aiNotes.push(
        "Bu ihbar çevrimdışı oluşturulmuş olabilir; saha teyidi önerilir.",
      );
    }

    return {
      category,
      config,
      priority,
      urgency,
      trustScore,
      peopleAffected,
      activeVolunteers,
      neededVolunteers,
      remainingNeeded,
      riskScore,
      riskLabel,
      riskColor,
      timeAgo,
      aiNotes,
      hasImage,
      hasLocation,
    };
  }, [report]);

  const openMaps = () => {
    if (!report?.location?.latitude || !report?.location?.longitude) {
      Alert.alert("Hata", "Bu ihbar için konum bilgisi bulunamadı.");
      return;
    }

    const { latitude, longitude } = report.location;
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const goYoldayim = () => {
    if (!isOnline) {
      Alert.alert(
        "Çevrimdışı Mod",
        "Yoldayım işlemi için internet bağlantısı gerekir. Şu an görev detayını önbellekten görüntülüyorsunuz.",
      );
      return;
    }

    router.push({
      pathname: "/gonullu/yoldayim",
      params: { id: report.id },
    });
  };

  if (!id) {
    return <MyTasksScreen />;
  }

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>AI analiz hazırlanıyor...</Text>
      </View>
    );
  }

  if (!report || !analysis) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={26} color="white" />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>İHBAR ANALİZİ</Text>
              <Text style={styles.headerSub}>İhbar bulunamadı</Text>
            </View>
          </View>

          <View style={styles.emptyBox}>
            <Ionicons name="alert-circle-outline" size={70} color="#334155" />
            <Text style={styles.emptyTitle}>İhbar Bulunamadı</Text>
            <Text style={styles.emptyText}>
              Bu görev silinmiş, erişilemez durumda olabilir veya daha önce
              önbelleğe alınmamış olabilir.
            </Text>

            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push("/gonullu/gonulluPaneli")}
            >
              <Text style={styles.emptyBtnText}>Görev Merkezine Dön</Text>
            </TouchableOpacity>
          </View>

          <GonulluBottomTab activeTab="REPORTS" />
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
            <Text style={styles.headerTitle}>AI İHBAR ANALİZİ</Text>
            <Text style={styles.headerSub}>
              {isOnline
                ? "Saha önceliklendirme raporu"
                : "Önbellekten görüntüleniyor"}
            </Text>
          </View>

          <View
            style={[
              styles.riskMiniBadge,
              { backgroundColor: analysis.riskColor + "22" },
            ]}
          >
            <Text style={[styles.riskMiniText, { color: analysis.riskColor }]}>
              %{analysis.riskScore}
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 130 }}
        >
          {!isOnline && (
            <View style={styles.offlineNotice}>
              <Ionicons
                name="cloud-offline-outline"
                size={20}
                color="#FCA5A5"
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.offlineNoticeTitle}>Çevrimdışı Analiz</Text>
                <Text style={styles.offlineNoticeText}>
                  Bu görev detayı son kaydedilen veriden gösteriliyor. Yoldayım
                  ve görev işlemleri için internet gerekir.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: analysis.config.color + "22" },
                ]}
              >
                <Ionicons
                  name={analysis.config.icon}
                  size={28}
                  color={analysis.config.color}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.categoryLabel}>
                  {analysis.config.label}
                </Text>
                <Text style={styles.timeText}>{analysis.timeAgo}</Text>
              </View>

              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: analysis.config.color + "22" },
                ]}
              >
                <Text
                  style={[
                    styles.priorityText,
                    { color: analysis.config.color },
                  ]}
                >
                  {analysis.priority}
                </Text>
              </View>
            </View>

            <Text style={styles.title}>
              {report.title || `${report.category || "Afet"} Yardım Görevi`}
            </Text>

            <Text style={styles.description}>
              {report.description || "İhbar açıklaması bulunamadı."}
            </Text>

            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={18} color="#38BDF8" />
              <Text style={styles.addressText}>
                {report.address || "Adres bilgisi yok"}
              </Text>
            </View>
          </View>

          {report.imageUri && (
            <View style={styles.imageCard}>
              <Image
                source={{ uri: report.imageUri }}
                style={styles.reportImage}
              />
            </View>
          )}

          <View style={styles.riskCard}>
            <View style={styles.riskHeader}>
              <View>
                <Text style={styles.cardTitle}>AI Risk Skoru</Text>
                <Text style={[styles.riskLabel, { color: analysis.riskColor }]}>
                  {analysis.riskLabel}
                </Text>
              </View>

              <View
                style={[styles.riskCircle, { borderColor: analysis.riskColor }]}
              >
                <Text
                  style={[styles.riskPercent, { color: analysis.riskColor }]}
                >
                  %{analysis.riskScore}
                </Text>
              </View>
            </View>

            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressActive,
                  {
                    width: `${analysis.riskScore}%`,
                    backgroundColor: analysis.riskColor,
                  },
                ]}
              />
            </View>

            <Text style={styles.riskNote}>
              Skor; aciliyet, kategori, etkilenen kişi sayısı, gönüllü ihtiyacı
              ve ihbar kalitesi dikkate alınarak hesaplanır.
            </Text>
          </View>

          <View style={styles.grid}>
            <InfoCard
              icon="shield-checkmark-outline"
              label="Güven"
              value={`%${analysis.trustScore}`}
              color="#22C55E"
            />

            <InfoCard
              icon="people-outline"
              label="Etkilenen"
              value={`${analysis.peopleAffected} kişi`}
              color="#38BDF8"
            />

            <InfoCard
              icon="person-add-outline"
              label="Gerekli"
              value={`${analysis.remainingNeeded} kişi`}
              color={COLORS.primary}
            />

            <InfoCard
              icon="pulse-outline"
              label="Durum"
              value={report.status === "in_progress" ? "Yolda" : "Bekliyor"}
              color="#FBBF24"
            />
          </View>

          <View style={styles.aiCard}>
            <View style={styles.cardTitleRow}>
              <Ionicons
                name="sparkles-outline"
                size={20}
                color={COLORS.primary}
              />

              <Text style={styles.cardTitle}>AI Değerlendirme</Text>
            </View>

            {analysis.aiNotes.map((note, index) => (
              <View key={index} style={styles.noteRow}>
                <View style={styles.noteDot} />
                <Text style={styles.noteText}>{note}</Text>
              </View>
            ))}
          </View>

          <View style={styles.skillCard}>
            <Text style={styles.cardTitle}>Önerilen Gönüllü Profili</Text>

            <View style={styles.skillRow}>
              <Ionicons
                name="ribbon-outline"
                size={22}
                color={analysis.config.color}
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.skillTitle}>{analysis.config.skill}</Text>
                <Text style={styles.skillSub}>
                  Bu görev için en uygun destek profili.
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.mapBtn} onPress={openMaps}>
            <Ionicons name="map-outline" size={19} color="white" />
            <Text style={styles.mapBtnText}>Haritada Aç</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.joinBtn,
              !isOnline && { backgroundColor: "#334155" },
            ]}
            onPress={goYoldayim}
          >
            <Ionicons
              name={isOnline ? "navigate" : "cloud-offline-outline"}
              size={20}
              color={isOnline ? "#0F172A" : "#94A3B8"}
            />
            <Text
              style={[styles.joinBtnText, !isOnline && { color: "#94A3B8" }]}
            >
              {isOnline ? "Yoldayım" : "Çevrimdışı"}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <GonulluBottomTab activeTab="REPORTS" />
      </SafeAreaView>
    </View>
  );
}

function MyTasksScreen() {
  const router = useRouter();

  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [finishingId, setFinishingId] = useState(null);

  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    let unsubscribe = null;
    let mounted = true;

    const loadMyTasksFromCache = async () => {
      try {
        const cachedReports = await getCache(STORAGE_KEYS.REPORTS_CACHE_KEY);
        const cachedTasks = await getCache(STORAGE_KEYS.TASKS_CACHE_KEY);

        const allCached = [
          ...(cachedReports?.data || []),
          ...(cachedTasks?.data || []),
        ];

        const uniqueMap = new Map();

        allCached.forEach((item) => {
          if (item?.id) uniqueMap.set(item.id, item);
        });

        const userTasks = Array.from(uniqueMap.values()).filter((task) =>
          task.volunteers?.includes(auth.currentUser?.uid),
        );

        userTasks.sort((a, b) => {
          const aTime = a.createdAt?.toDate
            ? a.createdAt.toDate().getTime()
            : a.offlineCreatedAt
              ? new Date(a.offlineCreatedAt).getTime()
              : 0;

          const bTime = b.createdAt?.toDate
            ? b.createdAt.toDate().getTime()
            : b.offlineCreatedAt
              ? new Date(b.offlineCreatedAt).getTime()
              : 0;

          return bTime - aTime;
        });

        if (mounted) {
          setMyTasks(userTasks);
        }
      } catch (error) {
        console.log("Görevlerim cache okuma hatası:", error);
      }
    };

    const listenMyTasksOnline = () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "reports"),
        where("volunteers", "array-contains", auth.currentUser.uid),
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));

          data.sort((a, b) => {
            const aTime = a.createdAt?.toDate
              ? a.createdAt.toDate().getTime()
              : 0;

            const bTime = b.createdAt?.toDate
              ? b.createdAt.toDate().getTime()
              : 0;

            return bTime - aTime;
          });

          if (mounted) {
            setMyTasks(data);
            setLoading(false);
          }
        },
        async (error) => {
          console.log("Görevlerim çekme hatası:", error);

          await loadMyTasksFromCache();

          if (mounted) {
            setLoading(false);
          }
        },
      );
    };

    const start = async () => {
      setLoading(true);

      await loadMyTasksFromCache();

      if (mounted) setLoading(false);

      if (!isOnline) return;

      listenMyTasksOnline();
    };

    start();

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [isOnline]);

  const finishTask = (task) => {
    if (!isOnline) {
      Alert.alert(
        "Çevrimdışı Mod",
        "Görevi bitirmek için internet bağlantısı gerekir.",
      );
      return;
    }

    Alert.alert(
      "Görevi Bitir",
      "Bu görevi tamamlandı olarak işaretlemek istiyor musunuz?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Bitir",
          style: "destructive",
          onPress: async () => {
            try {
              setFinishingId(task.id);

              const ref = doc(db, "reports", task.id);

              await updateDoc(ref, {
                status: "completed",
                completedAt: serverTimestamp(),
                completedBy: auth.currentUser.uid,
                completedVolunteers: arrayUnion(auth.currentUser.uid),
                activeVolunteers: Math.max(0, (task.activeVolunteers || 0) - 1),
              });

              Alert.alert("Başarılı", "Görev tamamlandı olarak kaydedildi.");
            } catch (error) {
              console.log("Görev bitirme hatası:", error);
              Alert.alert("Hata", "Görev bitirilemedi.");
            } finally {
              setFinishingId(null);
            }
          },
        },
      ],
    );
  };

  const activeTasks = myTasks.filter((task) => task.status !== "completed");
  const completedTasks = myTasks.filter((task) => task.status === "completed");

  const renderTaskCard = (task) => {
    const isCompleted = task.status === "completed";

    const priorityColor =
      task.priority === "KRİTİK"
        ? "#EF4444"
        : task.priority === "ACİL" || task.priority === "YÜKSEK"
          ? "#F97316"
          : "#FBBF24";

    return (
      <View key={task.id} style={styles.myTaskCard}>
        <View style={styles.myTaskTop}>
          <View
            style={[
              styles.myTaskBadge,
              {
                backgroundColor: isCompleted
                  ? "rgba(34,197,94,0.15)"
                  : priorityColor + "22",
              },
            ]}
          >
            <Text
              style={[
                styles.myTaskBadgeText,
                { color: isCompleted ? "#22C55E" : priorityColor },
              ]}
            >
              {isCompleted ? "TAMAMLANDI" : task.priority || "AKTİF"}
            </Text>
          </View>

          <Text style={styles.myTaskCategory}>{task.category || "GÖREV"}</Text>
        </View>

        <Text style={styles.myTaskTitle}>
          {task.title || `${task.category || "Afet"} Yardım Görevi`}
        </Text>

        <Text style={styles.myTaskDesc} numberOfLines={2}>
          {task.description || "Görev açıklaması bulunamadı."}
        </Text>

        <View style={styles.myTaskMetaRow}>
          <View style={styles.myTaskMeta}>
            <Ionicons name="location-outline" size={15} color="#38BDF8" />
            <Text style={styles.myTaskMetaText} numberOfLines={1}>
              {task.address || "Konum yok"}
            </Text>
          </View>

          <View style={styles.myTaskMeta}>
            <Ionicons name="people-outline" size={15} color="#94A3B8" />
            <Text style={styles.myTaskMetaText}>
              {task.activeVolunteers || 0} aktif
            </Text>
          </View>
        </View>

        {!isOnline && (
          <View style={styles.cachedBadge}>
            <Ionicons name="cloud-offline-outline" size={12} color="#FCA5A5" />
            <Text style={styles.cachedBadgeText}>Önbellekten gösteriliyor</Text>
          </View>
        )}

        <View style={styles.myTaskButtonRow}>
          <TouchableOpacity
            style={styles.myTaskDetailBtn}
            onPress={() =>
              router.push({
                pathname: "/gonullu/ihbarAnalizi",
                params: { id: task.id },
              })
            }
          >
            <Text style={styles.myTaskDetailText}>Detay Gör</Text>
          </TouchableOpacity>

          {!isCompleted ? (
            <TouchableOpacity
              style={[
                styles.myTaskFinishBtn,
                finishingId === task.id && { opacity: 0.6 },
                !isOnline && { backgroundColor: "#334155" },
              ]}
              disabled={finishingId === task.id}
              onPress={() => finishTask(task)}
            >
              <Ionicons
                name={isOnline ? "checkmark-done" : "cloud-offline-outline"}
                size={17}
                color={isOnline ? "#0F172A" : "#94A3B8"}
              />

              <Text
                style={[
                  styles.myTaskFinishText,
                  !isOnline && { color: "#94A3B8" },
                ]}
              >
                {finishingId === task.id
                  ? "Bitiriliyor..."
                  : isOnline
                    ? "Görevi Bitir"
                    : "Offline"}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.myTaskCompletedBtn}>
              <Ionicons name="checkmark-circle" size={17} color="#22C55E" />
              <Text style={styles.myTaskCompletedText}>Tamamlandı</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Görevlerim hazırlanıyor...</Text>
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
            onPress={() => router.push("/gonullu/gonulluPaneli")}
          >
            <Ionicons name="chevron-back" size={26} color="white" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>GÖREVLERİM</Text>
            <Text style={styles.headerSub}>
              {isOnline
                ? "Katıldığın saha görevleri"
                : "Önbellekten gösteriliyor"}
            </Text>
          </View>

          <View style={styles.riskMiniBadge}>
            <Text style={styles.riskMiniText}>{myTasks.length}</Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 130 }}
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
                  Çevrimdışı Görevlerim
                </Text>
                <Text style={styles.offlineNoticeText}>
                  Katıldığın görevler son kaydedilen veriden gösteriliyor.
                  Görevi bitirmek için internet gerekir.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.myStatsRow}>
            <View style={styles.myStatCard}>
              <Text style={styles.myStatNumber}>{activeTasks.length}</Text>
              <Text style={styles.myStatLabel}>Aktif</Text>
            </View>

            <View style={styles.myStatCard}>
              <Text style={styles.myStatNumber}>{completedTasks.length}</Text>
              <Text style={styles.myStatLabel}>Tamamlanan</Text>
            </View>

            <View style={styles.myStatCard}>
              <Text style={styles.myStatNumber}>{myTasks.length}</Text>
              <Text style={styles.myStatLabel}>Toplam</Text>
            </View>
          </View>

          {myTasks.length === 0 ? (
            <View style={styles.emptyBoxSmall}>
              <Ionicons name="file-tray-outline" size={62} color="#334155" />
              <Text style={styles.emptyTitle}>Henüz görevin yok</Text>
              <Text style={styles.emptyText}>
                {isOnline
                  ? "Görev merkezinden bir göreve katıldığında burada görünecek."
                  : "İnternet varken görevlerine bir kez girildiğinde son kayıtlar burada görünür."}
              </Text>

              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push("/gonullu/gonulluPaneli")}
              >
                <Text style={styles.emptyBtnText}>Görev Merkezine Git</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {activeTasks.length > 0 && (
                <>
                  <Text style={styles.mySectionTitle}>Aktif Görevler</Text>
                  {activeTasks.map(renderTaskCard)}
                </>
              )}

              {completedTasks.length > 0 && (
                <>
                  <Text style={styles.mySectionTitle}>Tamamlanan Görevler</Text>
                  {completedTasks.map(renderTaskCard)}
                </>
              )}
            </>
          )}
        </ScrollView>

        <GonulluBottomTab activeTab="REPORTS" />
      </SafeAreaView>
    </View>
  );
}

function InfoCard({ icon, label, value, color }) {
  return (
    <View style={styles.infoCard}>
      <Ionicons name={icon} size={23} color={color} />
      <Text style={styles.infoValue}>{value}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
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

  headerTitle: { color: "white", fontSize: 19, fontWeight: "900" },

  headerSub: { color: "#64748B", fontSize: 12, marginTop: 3 },

  riskMiniBadge: {
    width: 52,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(249,115,22,0.12)",
  },

  riskMiniText: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.primary,
  },

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

  cachedBadge: {
    alignSelf: "flex-start",
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(127,29,29,0.35)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },

  cachedBadgeText: {
    color: "#FCA5A5",
    fontSize: 10,
    fontWeight: "800",
  },

  heroCard: {
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1E293B",
  },

  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },

  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryLabel: { color: "white", fontSize: 14, fontWeight: "900" },

  timeText: { color: "#64748B", fontSize: 12, marginTop: 3 },

  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  priorityText: { fontSize: 10, fontWeight: "900" },

  title: { color: "white", fontSize: 23, fontWeight: "900", lineHeight: 30 },

  description: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },

  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 18,
  },

  addressText: { color: "#94A3B8", fontSize: 13, flex: 1 },

  imageCard: {
    marginTop: 16,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1E293B",
    backgroundColor: "#111827",
  },

  reportImage: {
    width: "100%",
    height: 210,
  },

  riskCard: {
    backgroundColor: "#111827",
    borderRadius: 22,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
  },

  riskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cardTitle: { color: "white", fontSize: 16, fontWeight: "900" },

  riskLabel: { fontSize: 13, fontWeight: "900", marginTop: 5 },

  riskCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 7,
    alignItems: "center",
    justifyContent: "center",
  },

  riskPercent: { fontSize: 18, fontWeight: "900" },

  progressBg: {
    height: 9,
    backgroundColor: "#1E293B",
    borderRadius: 99,
    overflow: "hidden",
    marginTop: 18,
  },

  progressActive: {
    height: "100%",
    borderRadius: 99,
  },

  riskNote: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },

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

  aiCard: {
    backgroundColor: "#111827",
    borderRadius: 22,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.25)",
  },

  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },

  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 11,
  },

  noteDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: COLORS.primary,
    marginTop: 6,
  },

  noteText: { color: "#CBD5E1", flex: 1, fontSize: 13, lineHeight: 20 },

  skillCard: {
    backgroundColor: "#111827",
    borderRadius: 22,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
  },

  skillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
  },

  skillTitle: { color: "white", fontSize: 15, fontWeight: "900" },

  skillSub: { color: "#64748B", fontSize: 12, marginTop: 4 },

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

  myStatsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },

  myStatCard: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
  },

  myStatNumber: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: "900",
  },

  myStatLabel: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "700",
  },

  mySectionTitle: {
    color: "white",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 12,
    marginTop: 8,
  },

  myTaskCard: {
    backgroundColor: "#111827",
    borderRadius: 20,
    padding: 17,
    borderWidth: 1,
    borderColor: "#1E293B",
    marginBottom: 14,
  },

  myTaskTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  myTaskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  myTaskBadgeText: {
    fontSize: 10,
    fontWeight: "900",
  },

  myTaskCategory: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "900",
  },

  myTaskTitle: {
    color: "white",
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 23,
  },

  myTaskDesc: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },

  myTaskMetaRow: {
    marginTop: 14,
    gap: 8,
  },

  myTaskMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  myTaskMetaText: {
    color: "#CBD5E1",
    fontSize: 12,
    flex: 1,
  },

  myTaskButtonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  myTaskDetailBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 13,
    padding: 13,
    alignItems: "center",
  },

  myTaskDetailText: {
    color: "#CBD5E1",
    fontWeight: "800",
  },

  myTaskFinishBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 13,
    padding: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  myTaskFinishText: {
    color: "#0F172A",
    fontWeight: "900",
  },

  myTaskCompletedBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.4)",
    backgroundColor: "rgba(34,197,94,0.1)",
    borderRadius: 13,
    padding: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  myTaskCompletedText: {
    color: "#22C55E",
    fontWeight: "900",
  },

  emptyBoxSmall: {
    backgroundColor: "#111827",
    borderRadius: 22,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E293B",
    marginTop: 20,
  },
});
