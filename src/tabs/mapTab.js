import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

import IhbarModali from "../components/ihbarModali";
import { MAP_STYLE } from "../constants/theme";
import { auth, db } from "../firebase/firebaseConfig";
import { useLocation } from "../hooks/useLocation";
import { useMedia } from "../hooks/useMedia";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { addToSyncQueue } from "../utils/offlineStorage";

const CATEGORY_COLOR = {
  GIDA: "#F97316",
  İLAÇ: "#06B6D4",
  BARINMA: "#8B5CF6",
};

const CATEGORY_ICON = {
  GIDA: "fast-food",
  İLAÇ: "medical",
  BARINMA: "home",
};

const PRIORITY_COLOR = {
  KRİTİK: "#EF4444",
  ACİL: "#F97316",
  DÜŞÜK: "#64748B",
};

const PRIORITY_EMOJI = {
  KRİTİK: "🔴",
  ACİL: "🟡",
  DÜŞÜK: "⚪",
};

function formatPeopleAffected(value) {
  if (value === 1) return "1 kişi";
  if (value === 5) return "2-5 kişi";
  return "5+ kişi";
}

function calculateUrgency(priority) {
  if (priority === "KRİTİK") return 1;
  if (priority === "ACİL") return 0.7;
  return 0.3;
}

function calculateNeededVolunteers(priority, peopleAffected, category) {
  let needed = 1;

  if (peopleAffected >= 10) needed += 2;
  else if (peopleAffected >= 5) needed += 1;

  if (priority === "ACİL") needed += 1;
  if (priority === "KRİTİK") needed += 2;

  if (category === "İLAÇ") needed += 1;
  if (category === "BARINMA") needed += 1;

  return Math.min(needed, 6);
}

function isPendingLocalReport(report) {
  return report?.syncStatus === "pending" || report?.localOnly === true;
}

export default function MapTab({ onModalChange }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("DÜŞÜK");
  const [urgency, setUrgency] = useState(0.3);
  const [peopleAffected, setPeopleAffected] = useState(1);
  const [loading, setLoading] = useState(false);

  const { isOnline } = useNetworkStatus();
  const { region, address, getCurrentLocation } = useLocation();
  const { image, setImage, showImageOptions } = useMedia();

  useEffect(() => {
    onModalChange?.(modalVisible);

    return () => {
      onModalChange?.(false);
    };
  }, [modalVisible, onModalChange]);

  // CANLI SORGUNUN GÜNCELLENMESİ: Sadece tamamlanmamış aktif krizleri dinle
  useEffect(() => {
    const q = query(
      collection(db, "reports"),
      where("status", "!=", "completed"),
      orderBy("status"),
      orderBy("createdAt", "desc"),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const firestoreReports = snap.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        }));

        setReports((prev) => {
          const pendingLocalReports = prev.filter((item) =>
            isPendingLocalReport(item),
          );

          return [...pendingLocalReports, ...firestoreReports];
        });

        setSelectedReport((prevSelected) => {
          if (!prevSelected) return null;

          if (isPendingLocalReport(prevSelected)) {
            const sameReportSynced = firestoreReports.find((item) => {
              const sameUser = item.userId === prevSelected.userId;
              const sameCategory = item.category === prevSelected.category;
              const sameDesc = item.description === prevSelected.description;
              const sameLat =
                item.location?.latitude === prevSelected.location?.latitude;
              const sameLng =
                item.location?.longitude === prevSelected.location?.longitude;

              return sameUser && sameCategory && sameDesc && sameLat && sameLng;
            });

            if (sameReportSynced) return sameReportSynced;
          }

          const updatedSelected = firestoreReports.find(
            (item) => item.id === prevSelected.id,
          );

          return updatedSelected || prevSelected;
        });
      },
      (error) => {
        console.log(
          "Harita ihbarları çekme hatası:",
          error.code,
          error.message,
        );
      },
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isOnline) return;

    setReports((prev) => {
      const firestoreReports = prev.filter(
        (item) => !isPendingLocalReport(item),
      );

      const pendingLocalReports = prev.filter((item) => {
        if (!isPendingLocalReport(item)) return false;

        const syncedMatch = firestoreReports.find((realItem) => {
          const sameUser = realItem.userId === item.userId;
          const sameCategory = realItem.category === item.category;
          const sameDesc = realItem.description === item.description;
          const sameLat =
            realItem.location?.latitude === item.location?.latitude;
          const sameLng =
            realItem.location?.longitude === item.location?.longitude;

          return sameUser && sameCategory && sameDesc && sameLat && sameLng;
        });

        return !syncedMatch;
      });

      return [...pendingLocalReports, ...firestoreReports];
    });
  }, [isOnline]);

  const resetReportForm = () => {
    setModalVisible(false);
    setDescription("");
    setImage(null);
    setCategory("");
    setPriority("DÜŞÜK");
    setUrgency(0.3);
    setPeopleAffected(1);
    setSelectedReport(null);
  };

  const createLocalReportPreview = (reportPayload) => {
    const offlinePreview = {
      id: `offline-${Date.now()}`,
      ...reportPayload,
      createdAt: null,
      offlineCreatedAt: new Date().toISOString(),
      syncStatus: "pending",
      localOnly: true,
    };

    setReports((prev) => [offlinePreview, ...prev]);
    setSelectedReport(offlinePreview);
  };

  const handleSendReport = async ({
    address: reportAddress,
    region: reportRegion,
  } = {}) => {
    const finalAddress = reportAddress || address;
    const finalRegion = reportRegion || region;

    if (!category) {
      Alert.alert("Uyarı", "Lütfen bir kategori seçin.");
      return;
    }

    if (!description || description.trim().length < 10) {
      Alert.alert("Uyarı", "Lütfen durumu en az 10 karakterle açıklayın.");
      return;
    }

    if (!finalRegion?.latitude || !finalRegion?.longitude) {
      Alert.alert("Hata", "Konum bilgisi alınamadı. Lütfen bekleyin.");
      return;
    }

    const finalUrgency = calculateUrgency(priority);
    const neededVolunteers = calculateNeededVolunteers(
      priority,
      peopleAffected,
      category,
    );

    setLoading(true);

    try {
      let base64Image = null;

      if (image) {
        const base64 = await FileSystem.readAsStringAsync(image, {
          encoding: "base64",
        });

        base64Image = `data:image/jpeg;base64,${base64}`;
      }

      const reportPayload = {
        userId: auth.currentUser?.uid || "anonim",
        userEmail: auth.currentUser?.email || null,

        category,
        description: description.trim(),

        priority,
        urgency: finalUrgency,

        peopleAffected,
        neededVolunteers,
        activeVolunteers: 0,
        volunteers: [],
        isFull: false,

        location: {
          latitude: finalRegion.latitude,
          longitude: finalRegion.longitude,
        },

        address: finalAddress,
        imageUri: base64Image,

        status: "pending",
      };

      if (isOnline) {
        await addDoc(collection(db, "reports"), {
          ...reportPayload,
          createdAt: serverTimestamp(),
        });

        resetReportForm();

        Alert.alert(
          "✅ Başarılı",
          `İhbarınız sisteme iletildi. Bu görev için tahmini ${neededVolunteers} gönüllü gerekiyor.`,
        );
      } else {
        await addToSyncQueue({
          type: "CREATE_REPORT",
          payload: {
            ...reportPayload,
            offlineCreatedAt: new Date().toISOString(),
            wasOffline: true,
          },
        });

        createLocalReportPreview(reportPayload);
        resetReportForm();

        Alert.alert(
          "📴 Çevrimdışı Kaydedildi",
          `İnternet bağlantısı yok. İhbarınız cihazda saklandı. Bağlantı gelince otomatik olarak sisteme gönderilecek. Tahmini ${neededVolunteers} gönüllü gerekiyor.`,
        );
      }
    } catch (e) {
      console.error("İhbar gönderme/kuyruk hatası:", e);
      Alert.alert("Hata", "İhbar kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        region={region}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
        customMapStyle={MAP_STYLE}
        onPress={() => setSelectedReport(null)}
      >
        {reports.map((r) => {
          const pendingLocal = isPendingLocalReport(r);

          return (
            <Marker
              key={r.id}
              coordinate={{
                latitude: r.location?.latitude || 0,
                longitude: r.location?.longitude || 0,
              }}
              onPress={(e) => {
                e.stopPropagation();
                setSelectedReport(r);
              }}
            >
              <View style={styles.markerContainer}>
                <View
                  style={[
                    styles.markerBox,
                    {
                      backgroundColor: pendingLocal
                        ? "#64748B"
                        : CATEGORY_COLOR[r.category] || "#64748B",
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      pendingLocal
                        ? "cloud-offline"
                        : CATEGORY_ICON[r.category] || "alert-circle"
                    }
                    size={18}
                    color="#ffffff"
                  />
                </View>

                {r.priority === "KRİTİK" && (
                  <View
                    style={[
                      styles.markerDot,
                      {
                        backgroundColor: "#fff",
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                      },
                    ]}
                  />
                )}
              </View>
            </Marker>
          );
        })}
      </MapView>

      <SafeAreaView style={styles.topContainer} pointerEvents="none">
        <View
          style={[
            styles.statusCard,
            !isOnline && {
              borderColor: "rgba(239,68,68,0.45)",
              backgroundColor: "rgba(127,29,29,0.92)",
            },
          ]}
        >
          <Ionicons
            name={isOnline ? "radio-outline" : "cloud-offline-outline"}
            size={20}
            color={isOnline ? "#22C55E" : "#FCA5A5"}
          />

          <Text
            style={[
              styles.statusText,
              !isOnline && {
                color: "#FCA5A5",
              },
            ]}
          >
            {isOnline ? "SİSTEM AKTİF" : "ÇEVRİMDIŞI MOD"}
          </Text>
        </View>
      </SafeAreaView>

      <TouchableOpacity
        style={[styles.locateButton, selectedReport && { bottom: 330 }]}
        activeOpacity={0.85}
        onPress={async () => {
          setSelectedReport(null);
          await getCurrentLocation();
        }}
      >
        <Ionicons name="locate" size={24} color="#F97316" />
      </TouchableOpacity>

      {selectedReport && (
        <View style={styles.detailCard}>
          {(() => {
            const pendingLocal = isPendingLocalReport(selectedReport);

            return (
              <>
                <View style={styles.detailHeader}>
                  <View
                    style={[
                      styles.priorityPill,
                      {
                        backgroundColor: pendingLocal
                          ? "rgba(100,116,139,0.22)"
                          : (PRIORITY_COLOR[selectedReport.priority] ||
                              "#64748B") + "22",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityPillText,
                        {
                          color: pendingLocal
                            ? "#CBD5E1"
                            : PRIORITY_COLOR[selectedReport.priority] ||
                              "#64748B",
                        },
                      ]}
                    >
                      {pendingLocal
                        ? "📴 SENKRON BEKLİYOR"
                        : `${PRIORITY_EMOJI[selectedReport.priority] || "⚪"} ${
                            selectedReport.priority || "DÜŞÜK"
                          }`}
                    </Text>
                  </View>

                  <Text style={styles.neededText}>
                    {selectedReport.activeVolunteers || 0}/
                    {selectedReport.neededVolunteers || 1} gönüllü
                  </Text>
                </View>

                <View style={styles.detailContent}>
                  {selectedReport.imageUri ? (
                    <Image
                      source={{ uri: selectedReport.imageUri }}
                      style={styles.detailImage}
                    />
                  ) : (
                    <View
                      style={[
                        styles.detailIconBox,
                        {
                          backgroundColor:
                            (CATEGORY_COLOR[selectedReport.category] ||
                              "#64748B") + "20",
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          pendingLocal
                            ? "cloud-offline"
                            : CATEGORY_ICON[selectedReport.category] ||
                              "alert-circle"
                        }
                        size={30}
                        color={
                          pendingLocal
                            ? "#94A3B8"
                            : CATEGORY_COLOR[selectedReport.category] ||
                              "#64748B"
                        }
                      />
                    </View>
                  )}

                  <View style={styles.detailTextContent}>
                    <Text style={styles.detailDesc} numberOfLines={3}>
                      {selectedReport.description}
                    </Text>

                    {pendingLocal && (
                      <Text style={styles.offlineSmallText}>
                        Bağlantı geldiğinde sisteme gönderilecek.
                      </Text>
                    )}

                    {selectedReport.wasOffline && !pendingLocal && (
                      <Text style={styles.syncedSmallText}>
                        Çevrimdışı oluşturuldu, sisteme aktarıldı.
                      </Text>
                    )}

                    {selectedReport.peopleAffected != null && (
                      <View style={styles.peopleAffectedRow}>
                        <Ionicons name="people" size={13} color="#3B82F6" />
                        <Text style={styles.peopleAffectedText}>
                          {formatPeopleAffected(selectedReport.peopleAffected)}{" "}
                          etkilendi
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {selectedReport.address && (
                  <View style={styles.detailAddressRow}>
                    <Ionicons name="location-sharp" size={13} color="#64748B" />
                    <Text style={styles.detailAddressText} numberOfLines={1}>
                      {selectedReport.address}
                    </Text>
                  </View>
                )}
              </>
            );
          })()}
        </View>
      )}

      <View style={styles.bottomActions}>
        <View style={styles.notificationBox}>
          <Ionicons
            name={isOnline ? "notifications" : "cloud-offline-outline"}
            size={18}
            color={isOnline ? "#F97316" : "#FCA5A5"}
          />

          <Text style={styles.notificationText}>
            {isOnline ? (
              <>
                Bölgenizde{" "}
                <Text style={{ fontWeight: "bold", color: "white" }}>
                  {reports.filter((item) => !isPendingLocalReport(item)).length}
                </Text>{" "}
                aktif bildirim var
              </>
            ) : (
              "İnternet yok, ihbarlar kuyruğa alınır"
            )}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.orangeFab}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={36} color="white" />
        </TouchableOpacity>
      </View>

      <IhbarModali
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        address={address}
        region={region}
        category={category}
        setCategory={setCategory}
        description={description}
        setDescription={setDescription}
        priority={priority}
        setPriority={setPriority}
        urgency={urgency}
        setUrgency={setUrgency}
        peopleAffected={peopleAffected}
        setPeopleAffected={setPeopleAffected}
        image={image}
        setImage={setImage}
        showImageOptions={showImageOptions}
        handleSendReport={handleSendReport}
        loading={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },

  topContainer: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    zIndex: 5,
  },

  statusCard: {
    backgroundColor: "rgba(30, 41, 59, 0.92)",
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.5)",
  },

  statusText: {
    color: "#22C55E",
    fontWeight: "bold",
    marginLeft: 10,
    fontSize: 14,
    letterSpacing: 1,
  },

  locateButton: {
    position: "absolute",
    right: 20,
    bottom: 185,
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "rgba(15,23,42,0.95)",
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },

  markerContainer: { alignItems: "center" },

  markerBox: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ffffff",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },

  markerDot: {
    marginTop: 2,
    borderWidth: 1,
    borderColor: "#EF4444",
  },

  detailCard: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 185,
    backgroundColor: "rgba(15,23,42,0.96)",
    borderRadius: 22,
    padding: 15,
    borderWidth: 1,
    borderColor: "#334155",
  },

  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  priorityPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  priorityPillText: {
    fontSize: 10,
    fontWeight: "900",
  },

  neededText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "800",
  },

  detailContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  detailImage: {
    width: 62,
    height: 62,
    borderRadius: 15,
    marginRight: 12,
  },

  detailIconBox: {
    width: 62,
    height: 62,
    borderRadius: 15,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  detailTextContent: {
    flex: 1,
  },

  detailDesc: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },

  offlineSmallText: {
    color: "#FCA5A5",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 5,
  },

  syncedSmallText: {
    color: "#22C55E",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 5,
  },

  peopleAffectedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
    gap: 5,
  },

  peopleAffectedText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },

  detailAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 12,
  },

  detailAddressText: {
    color: "#64748B",
    fontSize: 12,
    flex: 1,
  },

  bottomActions: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 110,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  notificationBox: {
    flex: 1,
    height: 58,
    backgroundColor: "rgba(15,23,42,0.95)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#334155",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginRight: 14,
  },

  notificationText: {
    color: "#94A3B8",
    marginLeft: 10,
    fontSize: 13,
    flex: 1,
  },

  orangeFab: {
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
});
