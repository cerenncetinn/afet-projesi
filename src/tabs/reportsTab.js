import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS } from "../constants/theme";
import { auth, db } from "../firebase/firebaseConfig";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { getCache, saveCache, STORAGE_KEYS } from "../utils/offlineStorage";

const CATEGORY_THEME = {
  GIDA: {
    color: "#F97316",
    bg: "#431407",
    icon: "fast-food-outline",
  },
  İLAÇ: {
    color: "#06B6D4",
    bg: "#083344",
    icon: "medical-outline",
  },
  BARINMA: {
    color: "#936cee",
    bg: "#3f2969",
    icon: "home-outline",
  },
};

export default function ReportsTab() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cacheSavedAt, setCacheSavedAt] = useState(null);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [newDescription, setNewDescription] = useState("");

  const { isOnline, networkReady } = useNetworkStatus();

  useEffect(() => {
    let unsubscribe = null;
    let mounted = true;

    const loadCacheFirst = async () => {
      try {
        const cachedReports = await getCache(STORAGE_KEYS.REPORTS_CACHE_KEY);

        if (!mounted) return;

        if (cachedReports?.data && Array.isArray(cachedReports.data)) {
          setReports(cachedReports.data);
          setCacheSavedAt(cachedReports.savedAt);
        }
      } catch (error) {
        console.log("Reports cache okuma hatası:", error);
      }
    };

    const listenReportsOnline = () => {
      const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));

      unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          const data = snapshot.docs.map((docSnap) => ({
            ...docSnap.data(),
            id: docSnap.id,
          }));

          if (!mounted) return;

          setReports(data);

          await saveCache(STORAGE_KEYS.REPORTS_CACHE_KEY, data);
          setCacheSavedAt(new Date().toISOString());
        },
        async (error) => {
          console.log("Reports çekme hatası:", error);

          const fallback = await getCache(STORAGE_KEYS.REPORTS_CACHE_KEY);

          if (mounted && fallback?.data) {
            setReports(fallback.data);
            setCacheSavedAt(fallback.savedAt);
          }
        },
      );
    };

    const start = async () => {
      setLoading(true);

      // 1. Her durumda önce cihazdaki son ihbar listesini yükle.
      await loadCacheFirst();

      // 2. Cache geldikten sonra ekranı aç.
      if (mounted) setLoading(false);

      // 3. NetInfo hazır değilse ekranda cache kalsın.
      if (!networkReady) return;

      // 4. İnternet yoksa Firestore denemesi yapma.
      if (!isOnline) return;

      // 5. İnternet varsa güncel veriyi çek ve cache’i yenile.
      listenReportsOnline();
    };

    start();

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [isOnline, networkReady]);

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

  const normalizeStatus = (item) => {
    if (
      item.status === "completed" ||
      item.completedAt ||
      item.completedBy ||
      item.completedVolunteers?.length > 0
    ) {
      return "completed";
    }

    if (
      item.status === "in_progress" ||
      item.activeVolunteers > 0 ||
      item.volunteers?.length > 0
    ) {
      return "in_progress";
    }

    return "pending";
  };

  const getAssignedVolunteerCount = (item) => {
    const volunteerCount = Array.isArray(item.volunteers)
      ? item.volunteers.length
      : 0;

    const completedVolunteerCount = Array.isArray(item.completedVolunteers)
      ? item.completedVolunteers.length
      : 0;

    return Math.max(
      volunteerCount,
      completedVolunteerCount,
      item.activeVolunteers || 0,
    );
  };

  const getStatusText = (item) => {
    const status = normalizeStatus(item);

    if (status === "completed") return "TAMAMLANDI";
    if (status === "in_progress") return "YARDIM YOLDA";
    return "BEKLEMEDE";
  };

  const getStatusColor = (item) => {
    const status = normalizeStatus(item);

    if (status === "completed") return "#22C55E";
    if (status === "in_progress") return "#38BDF8";
    return "#F59E0B";
  };

  const handleDelete = (reportId) => {
    if (!isOnline) {
      Alert.alert(
        "Çevrimdışı Mod",
        "İhbar silme işlemi için internet bağlantısı gerekir.",
      );
      return;
    }

    Alert.alert("İhbarı Sil", "Bu ihbar kalıcı olarak silinecektir.", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "reports", reportId));
          } catch (e) {
            Alert.alert("Hata", "Silme işlemi başarısız oldu.");
          }
        },
      },
    ]);
  };

  const openEditModal = (report) => {
    if (!isOnline) {
      Alert.alert(
        "Çevrimdışı Mod",
        "İhbar düzenleme işlemi için internet bağlantısı gerekir.",
      );
      return;
    }

    setEditingReport(report);
    setNewDescription(report.description || "");
    setIsEditModalVisible(true);
  };

  const handleUpdate = async () => {
    if (!isOnline) {
      Alert.alert(
        "Çevrimdışı Mod",
        "İhbar güncelleme işlemi için internet bağlantısı gerekir.",
      );
      return;
    }

    if (newDescription.trim().length < 5) {
      Alert.alert("Uyarı", "Lütfen daha açıklayıcı bir metin girin.");
      return;
    }

    try {
      const reportRef = doc(db, "reports", editingReport.id);

      await updateDoc(reportRef, {
        description: newDescription.trim(),
      });

      setIsEditModalVisible(false);
      setEditingReport(null);
      setNewDescription("");

      Alert.alert("Başarılı", "İhbar güncellendi.");
    } catch (e) {
      Alert.alert("Hata", "Güncelleme sırasında bir sorun oluştu.");
    }
  };

  // ─── OPTİMİZASYON: 24 SAAT SÜRE FİLTRESİ MOTORU ───
  const filterExpiredReports = (reportList) => {
    const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
    const now = new Date().getTime();

    return reportList.filter((item) => {
      if (normalizeStatus(item) === "completed") {
        let completedTime = 0;

        if (item.completedAt?.toDate) {
          completedTime = item.completedAt.toDate().getTime();
        } else if (item.completedAt) {
          completedTime = new Date(item.completedAt).getTime();
        }

        // Çözülmesinin üzerinden 24 saat geçmiş ihbarları akıştan düşür
        if (now - completedTime > ONE_DAY_IN_MS) {
          return false;
        }
      }
      return true;
    });
  };

  // Ham veriyi önce rollere göre ayırıp, ardından zaman süzgecinden geçiriyoruz
  const myReports = filterExpiredReports(
    reports.filter((r) => r.userId === auth.currentUser?.uid),
  );

  const otherReports = filterExpiredReports(
    reports.filter((r) => r.userId !== auth.currentUser?.uid),
  );

  const renderOfflineNotice = () => {
    if (isOnline) return null;

    const cacheTime = formatCacheTime(cacheSavedAt);

    return (
      <View style={styles.offlineNotice}>
        <Ionicons name="cloud-offline-outline" size={20} color="#FCA5A5" />

        <View style={{ flex: 1 }}>
          <Text style={styles.offlineNoticeTitle}>Çevrimdışı Veri</Text>
          <Text style={styles.offlineNoticeText}>
            İhbarlar son kaydedilen veriden gösteriliyor.
            {cacheTime ? ` Son kayıt: ${cacheTime}` : ""}
          </Text>
        </View>
      </View>
    );
  };

  const renderReportCard = (item, isMyReport) => {
    const categoryTheme = CATEGORY_THEME[item.category] || {
      color: COLORS.primary,
      bg: "#431407",
      icon: "alert-circle-outline",
    };

    const themeColor = categoryTheme.color;
    const statusColor = getStatusColor(item);
    const statusText = getStatusText(item);
    const assignedVolunteerCount = getAssignedVolunteerCount(item);
    const neededVolunteerCount =
      item.neededVolunteers || item.volunteerCount || 1;
    const normalizedStatus = normalizeStatus(item);

    return (
      <View
        key={item.id}
        style={[
          styles.card,
          isMyReport && {
            borderLeftColor: themeColor,
            borderLeftWidth: 5,
          },
          normalizedStatus === "completed" && {
            borderColor: "rgba(34,197,94,0.35)",
          },
          !isOnline && {
            opacity: 0.96,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.categoryBadgeContainer,
              { backgroundColor: categoryTheme.bg },
            ]}
          >
            <Ionicons
              name={categoryTheme.icon}
              size={13}
              color={themeColor}
              style={{ marginRight: 5 }}
            />

            <Text style={[styles.categoryBadge, { color: themeColor }]}>
              {item.category || "GENEL"}
            </Text>
          </View>

          {isMyReport ? (
            <View style={styles.actionButtons}>
              <View style={styles.statusBadge}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: statusColor,
                    },
                  ]}
                />

                <Text style={styles.statusText}>{statusText}</Text>
              </View>

              {normalizedStatus !== "completed" && (
                <>
                  <TouchableOpacity
                    onPress={() => openEditModal(item)}
                    style={styles.iconButton}
                  >
                    <Ionicons
                      name="create-outline"
                      size={20}
                      color={isOnline ? COLORS.primary : "#64748B"}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={isOnline ? "#EF4444" : "#64748B"}
                    />
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : (
            <View style={styles.statusBadge}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: statusColor,
                  },
                ]}
              />

              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          )}
        </View>

        {item.imageUri && (
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: item.imageUri }}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
        )}

        <Text style={styles.description}>
          {item.description || "Açıklama bulunamadı."}
        </Text>

        <View style={styles.infoRow}>
          <View
            style={[
              styles.infoChip,
              normalizedStatus === "completed" && {
                backgroundColor: "rgba(34,197,94,0.12)",
              },
            ]}
          >
            <Ionicons
              name={
                normalizedStatus === "completed"
                  ? "checkmark-done-outline"
                  : "people-outline"
              }
              size={13}
              color={normalizedStatus === "completed" ? "#22C55E" : "#94A3B8"}
            />

            <Text
              style={[
                styles.infoChipText,
                normalizedStatus === "completed" && { color: "#22C55E" },
              ]}
            >
              {normalizedStatus === "completed"
                ? `${assignedVolunteerCount} gönüllü ile tamamlandı`
                : `${assignedVolunteerCount}/${neededVolunteerCount} gönüllü`}
            </Text>
          </View>

          <View style={styles.infoChip}>
            <Ionicons name="warning-outline" size={13} color="#94A3B8" />
            <Text style={styles.infoChipText}>{item.priority || "DÜŞÜK"}</Text>
          </View>

          {normalizedStatus === "completed" && (
            <View style={styles.infoChip}>
              <Ionicons
                name="shield-checkmark-outline"
                size={13}
                color="#22C55E"
              />
              <Text style={[styles.infoChipText, { color: "#22C55E" }]}>
                Görev kapandı
              </Text>
            </View>
          )}

          {!isOnline && (
            <View style={styles.cachedBadge}>
              <Ionicons
                name="cloud-offline-outline"
                size={12}
                color="#FCA5A5"
              />
              <Text style={styles.cachedBadgeText}>Önbellek</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Ionicons name="location-sharp" size={14} color="#64748B" />
          <Text style={styles.address} numberOfLines={1}>
            {item.address || "Konum bilgisi yok"}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.mainTitle}>İhbar Takibi</Text>

        {renderOfflineNotice()}

        {myReports.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="person-circle-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.sectionHeaderText}>TALEPLERİM</Text>
            </View>

            {myReports.map((item) => renderReportCard(item, true))}
          </>
        )}

        <View style={[styles.sectionHeader, { marginTop: 25 }]}>
          <Ionicons name="megaphone-outline" size={20} color="#94A3B8" />
          <Text style={styles.sectionHeaderText}>GÜNCEL TALEPLER</Text>
        </View>

        {otherReports.length > 0 ? (
          otherReports.map((item) => renderReportCard(item, false))
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="file-tray-outline" size={46} color="#334155" />
            <Text style={styles.emptyTitle}>Bugün temiz bir saha</Text>
            <Text style={styles.emptyText}>
              Aktif kriz ihbarı bulunmuyor veya çözülen tüm ihbarlar 24 saatlik
              süre limitini doldurarak arşivlendi.
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={isEditModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>İhbarı Düzenle</Text>

            <TextInput
              style={styles.textInput}
              multiline
              value={newDescription}
              onChangeText={setNewDescription}
              placeholder="Yeni açıklamanızı yazın..."
              placeholderTextColor="#64748B"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#334155" }]}
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.buttonText}>İptal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: COLORS.primary },
                ]}
                onPress={handleUpdate}
              >
                <Text style={styles.buttonText}>Güncelle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F172A",
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },

  mainTitle: {
    color: "white",
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 25,
  },

  offlineNotice: {
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

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 8,
  },

  sectionHeaderText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 8,
    letterSpacing: 1.5,
  },

  card: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  categoryBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },

  categoryBadge: {
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 0.5,
  },

  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  iconButton: {
    marginLeft: 2,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },

  statusText: {
    color: "white",
    fontSize: 10,
    fontWeight: "800",
  },

  imageWrapper: {
    width: "100%",
    height: 190,
    borderRadius: 15,
    overflow: "hidden",
    marginVertical: 12,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  description: {
    color: "#F1F5F9",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
  },

  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },

  infoChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 5,
  },

  infoChipText: {
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "700",
  },

  cachedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(127,29,29,0.35)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
  },

  cachedBadgeText: {
    color: "#FCA5A5",
    fontSize: 10,
    fontWeight: "800",
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },

  address: {
    color: "#94A3B8",
    fontSize: 12,
    marginLeft: 5,
    flex: 1,
  },

  emptyCard: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },

  emptyTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 12,
  },

  emptyText: {
    color: "#94A3B8",
    textAlign: "center",
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: 24,
  },

  modalContent: {
    backgroundColor: "#1E293B",
    borderRadius: 25,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  modalTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },

  textInput: {
    backgroundColor: "#0F172A",
    color: "white",
    borderRadius: 15,
    padding: 15,
    height: 140,
    textAlignVertical: "top",
    marginBottom: 25,
    fontSize: 16,
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  modalButton: {
    flex: 0.47,
    padding: 16,
    borderRadius: 15,
    alignItems: "center",
  },

  buttonText: {
    color: "white",
    fontWeight: "800",
    fontSize: 14,
  },
});
