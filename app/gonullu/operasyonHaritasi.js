import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import GonulluBottomTab from "../../src/components/gonullu/gonulluBottomTab";
import { useFetchTasks } from "../../src/hooks/gonullu/useFetchTasks";

export default function operasyonHaritasi() {
  const router = useRouter();
  const mapRef = useRef(null);
  const { tasks, loading } = useFetchTasks();
  const [userLocation, setUserLocation] = useState(null);
  const [activeFilter, setActiveFilter] = useState("HEPSİ");
  const [selectedTask, setSelectedTask] = useState(null);

  // Firestore'daki tam karşılıkları (BÜYÜK HARF)
  const filters = ["HEPSİ", "İLAÇ", "GIDA", "BARINMA"];

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
    })();
  }, []);

  // FİLTRELEME: Firestore'daki BÜYÜK HARF yapısına göre eşleme
  const filteredTasks = tasks?.filter((task) => {
    if (activeFilter === "HEPSİ") return true;
    // Firestore'dan gelen veriyi de büyük harfe zorlayıp karşılaştırıyoruz
    return task.category?.toUpperCase().trim() === activeFilter.toUpperCase();
  });

  const goToMyLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000,
      );
    }
  };

  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );

  return (
    <View style={styles.container}>
      {/* KARANLIK ÜST PANEL */}
      <View style={styles.darkHeader}>
        <View style={styles.headerRow}>
          <View style={styles.avatarPlaceholder} />
          <Text style={styles.darkHeaderTitle}>OPERASYON MERKEZİ</Text>
          <Ionicons name="radio-outline" size={22} color="#F97316" />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {filters.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => {
                setActiveFilter(item);
                setSelectedTask(null);
              }}
              style={[
                styles.filterBtn,
                activeFilter === item && styles.activeFilterBtn,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === item && styles.activeFilterText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={{
          latitude: userLocation?.latitude || 41.0082,
          longitude: userLocation?.longitude || 28.9784,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onPress={() => setSelectedTask(null)}
      >
        {filteredTasks?.map(
          (task) =>
            task.location && (
              <Marker
                key={task.id}
                coordinate={{
                  latitude: task.location.latitude,
                  longitude: task.location.longitude,
                }}
                onPress={() => setSelectedTask(task)}
              >
                <View
                  style={[
                    styles.customMarker,
                    {
                      backgroundColor:
                        task.priority === "KRİTİK" ? "#EF4444" : "#F97316",
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      task.category === "GIDA"
                        ? "fast-food"
                        : task.category === "İLAÇ"
                          ? "medkit"
                          : "home"
                    }
                    size={16}
                    color="white"
                  />
                </View>
              </Marker>
            ),
        )}

        {userLocation && (
          <Marker coordinate={userLocation}>
            <View style={styles.userMarkerPulse}>
              <View style={styles.userMarkerInner} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* KONUM BUTONU: Kart açılınca yukarı kayar */}
      <TouchableOpacity
        style={[styles.locationFocusBtn, { bottom: selectedTask ? 260 : 110 }]}
        onPress={goToMyLocation}
      >
        <Ionicons name="navigate" size={24} color="white" />
      </TouchableOpacity>

      {/* KARANLIK DETAY KARTI: Tam Bottom Bar Üstü */}
      {selectedTask && (
        <View style={styles.darkDetailCard}>
          <View style={styles.cardHeader}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{selectedTask.category}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedTask(null)}>
              <Ionicons name="close-circle" size={26} color="#475569" />
            </TouchableOpacity>
          </View>

          <Text style={styles.darkCardTitle}>{selectedTask.description}</Text>

          <TouchableOpacity
            style={styles.darkActionBtn}
            onPress={() =>
              router.push({
                pathname: "/gonullu/ihbarAnalizi",
                params: { id: selectedTask.id },
              })
            }
          >
            <Text style={styles.actionBtnText}>Analizi Görüntüle</Text>
            <Ionicons name="chevron-forward" size={16} color="white" />
          </TouchableOpacity>
        </View>
      )}

      <GonulluBottomTab activeTab="MAPS" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
  },
  map: { flex: 1 },
  darkHeader: {
    position: "absolute",
    top: 0,
    width: "100%",
    zIndex: 10,
    backgroundColor: "#0F172A",
    paddingBottom: 15,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  avatarPlaceholder: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    marginRight: 10,
  },
  darkHeaderTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  filterScroll: { paddingHorizontal: 15 },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#1E293B",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  activeFilterBtn: { backgroundColor: "#F97316", borderColor: "#F97316" },
  filterText: { color: "#94A3B8", fontWeight: "600", fontSize: 12 },
  activeFilterText: { color: "white" },

  customMarker: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  userMarkerPulse: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(56, 189, 248, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  userMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#38BDF8",
    borderWidth: 2,
    borderColor: "white",
  },

  locationFocusBtn: {
    position: "absolute",
    right: 20,
    backgroundColor: "#F97316",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },

  darkDetailCard: {
    position: "absolute",
    bottom: 90,
    left: 0,
    right: 0,
    backgroundColor: "#1E293B",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    paddingBottom: 35,
    borderTopWidth: 1,
    borderTopColor: "#334155",
    elevation: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(249, 115, 22, 0.1)",
  },
  badgeText: { color: "#F97316", fontSize: 11, fontWeight: "bold" },
  darkCardTitle: {
    fontSize: 15,
    color: "#F1F5F9",
    fontWeight: "500",
    marginBottom: 20,
  },
  darkActionBtn: {
    backgroundColor: "#F97316",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 15,
    gap: 8,
  },
  actionBtnText: { color: "white", fontWeight: "bold" },
});
