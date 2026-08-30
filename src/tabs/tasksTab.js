import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS } from "../constants/theme";
import assemblyAreas from "../data/istanbulAssemblyAreas.json";
import { db } from "../firebase/firebaseConfig";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { calculateDistance } from "../utils/geoUtils";
import { getCache, saveCache, STORAGE_KEYS } from "../utils/offlineStorage";

export default function TasksTab() {
  const [importantInfo, setImportantInfo] = useState([]);
  const [earthquakes, setEarthquakes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [importantInfoCachedAt, setImportantInfoCachedAt] = useState(null);
  const [earthquakesCachedAt, setEarthquakesCachedAt] = useState(null);

  const [showAssemblyAreas, setShowAssemblyAreas] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const [userLocation, setUserLocation] = useState(null);
  const [address, setAddress] = useState("Konum alınmadı");
  const [searchAddress, setSearchAddress] = useState("");
  const [visibleCount, setVisibleCount] = useState(5);

  const { isOnline, networkReady } = useNetworkStatus();

  useEffect(() => {
    let unsubscribeInfo = null;
    let mounted = true;

    const loadFromCacheFirst = async () => {
      try {
        const cachedInfo = await getCache(
          STORAGE_KEYS.IMPORTANT_INFO_CACHE_KEY,
        );
        const cachedEarthquakes = await getCache(
          STORAGE_KEYS.EARTHQUAKES_CACHE_KEY,
        );

        if (!mounted) return;

        if (cachedInfo?.data && Array.isArray(cachedInfo.data)) {
          setImportantInfo(cachedInfo.data);
          setImportantInfoCachedAt(cachedInfo.savedAt);
        }

        if (
          cachedEarthquakes?.data &&
          Array.isArray(cachedEarthquakes.data) &&
          cachedEarthquakes.data.length > 0
        ) {
          setEarthquakes(cachedEarthquakes.data);
          setEarthquakesCachedAt(cachedEarthquakes.savedAt);
        }
      } catch (error) {
        console.log("Cache ilk yükleme hatası:", error);
      }
    };

    const listenImportantInfo = () => {
      unsubscribeInfo = onSnapshot(
        collection(db, "important_info"),
        async (snapshot) => {
          const infoData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          if (!mounted) return;

          setImportantInfo(infoData);
          await saveCache(STORAGE_KEYS.IMPORTANT_INFO_CACHE_KEY, infoData);
          setImportantInfoCachedAt(new Date().toISOString());
        },
        async (error) => {
          console.log("Önemli bilgiler çekme hatası:", error);

          const fallback = await getCache(
            STORAGE_KEYS.IMPORTANT_INFO_CACHE_KEY,
          );

          if (mounted && fallback?.data) {
            setImportantInfo(fallback.data);
            setImportantInfoCachedAt(fallback.savedAt);
          }
        },
      );
    };

    const fetchEarthquakesOnline = async () => {
      try {
        const res = await fetch(
          "https://api.orhanaydogdu.com.tr/deprem/kandilli/live",
        );

        const data = await res.json();
        const latestEarthquakes = data?.result?.slice(0, 5) || [];

        if (!mounted) return;

        if (latestEarthquakes.length > 0) {
          setEarthquakes(latestEarthquakes);

          await saveCache(
            STORAGE_KEYS.EARTHQUAKES_CACHE_KEY,
            latestEarthquakes,
          );

          setEarthquakesCachedAt(new Date().toISOString());
        }
      } catch (error) {
        console.log("Deprem API hatası:", error);

        const fallback = await getCache(STORAGE_KEYS.EARTHQUAKES_CACHE_KEY);

        if (mounted && fallback?.data?.length > 0) {
          setEarthquakes(fallback.data);
          setEarthquakesCachedAt(fallback.savedAt);
        }
      }
    };

    const start = async () => {
      setLoading(true);

      // 1. Her durumda önce cihazdaki eski veriyi yükle.
      await loadFromCacheFirst();

      // 2. Cache yüklendikten sonra ekranı aç.
      if (mounted) setLoading(false);

      // 3. NetInfo hazır değilse bekleme, ekranda cache kalsın.
      if (!networkReady) return;

      // 4. İnternet yoksa hiçbir şeyi sıfırlama, cache ekranda kalsın.
      if (!isOnline) return;

      // 5. İnternet varsa güncel verileri çek ve cache'i yenile.
      listenImportantInfo();
      await fetchEarthquakesOnline();
    };

    start();

    return () => {
      mounted = false;
      if (unsubscribeInfo) unsubscribeInfo();
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

  const reverseAddress = async (coords) => {
    try {
      const reverse = await Location.reverseGeocodeAsync(coords);

      if (reverse.length > 0) {
        const item = reverse[0];
        const district = item.district || item.subregion || item.name || "";
        const city = item.city || item.region || "";
        const street = item.street || "";

        const formatted = [street, district, city].filter(Boolean).join(", ");
        setAddress(formatted || "Konum bulundu");
      } else {
        setAddress("Konum bulundu");
      }
    } catch {
      setAddress("Konum bulundu");
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setAddress("Konum izni verilmedi");
        Alert.alert(
          "Konum İzni Gerekli",
          "Size en yakın toplanma alanlarını gösterebilmemiz için konum izni vermelisiniz.",
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(coords);
      setVisibleCount(5);
      await reverseAddress(coords);
    } catch (error) {
      console.log("Toplanma alanı konum hatası:", error);
      setAddress("Konum alınamadı");
    } finally {
      setLocationLoading(false);
    }
  };

  const searchLocationByText = async () => {
    const cleanText = searchAddress.trim();

    if (!cleanText) {
      Alert.alert("Adres Gerekli", "Lütfen mahalle, ilçe veya adres yazınız.");
      return;
    }

    if (!isOnline) {
      Alert.alert(
        "İnternet Gerekli",
        "Adres yazarak konum aramak için internet bağlantısı gerekir. Mevcut konum veya önceden hesaplanan konum kullanılabilir.",
      );
      return;
    }

    try {
      setSearchLoading(true);

      const queryText = cleanText.toLowerCase().includes("istanbul")
        ? cleanText
        : `${cleanText}, İstanbul`;

      const results = await Location.geocodeAsync(queryText);

      if (!results || results.length === 0) {
        Alert.alert(
          "Konum Bulunamadı",
          "Yazdığınız adres bulunamadı. Mahalle veya ilçe adını daha açık yazmayı deneyin.",
        );
        return;
      }

      const coords = {
        latitude: results[0].latitude,
        longitude: results[0].longitude,
      };

      setUserLocation(coords);
      setAddress(queryText);
      setVisibleCount(5);
    } catch (error) {
      console.log("Adres arama hatası:", error);
      Alert.alert("Hata", "Adres aranırken bir sorun oluştu.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAssemblyPress = async () => {
    setShowAssemblyAreas((prev) => !prev);

    if (!userLocation) {
      await getCurrentLocation();
    }
  };

  const nearestAreas = useMemo(() => {
    if (!userLocation) return [];

    return assemblyAreas
      .filter((area) => area.latitude && area.longitude)
      .map((area) => {
        const distanceKm = parseFloat(
          calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            area.latitude,
            area.longitude,
          ),
        );

        return {
          ...area,
          distanceKm,
          displayDistance:
            distanceKm < 1
              ? `${Math.round(distanceKm * 1000)} m`
              : `${distanceKm.toFixed(1)} km`,
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, visibleCount);
  }, [userLocation, visibleCount]);

  const openMaps = (area) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${area.latitude},${area.longitude}`;
    Linking.openURL(url);
  };

  const isAssemblyInfo = (info) => {
    const text = `${info.title || ""} ${info.description || ""}`.toLowerCase();
    return (
      text.includes("toplanma") ||
      text.includes("toplanma alan") ||
      text.includes("güvenli alan")
    );
  };

  const renderOfflineCacheNotice = () => {
    if (isOnline) return null;

    const infoTime = formatCacheTime(importantInfoCachedAt);
    const eqTime = formatCacheTime(earthquakesCachedAt);

    return (
      <View style={styles.offlineNotice}>
        <Ionicons name="cloud-offline-outline" size={20} color="#FCA5A5" />

        <View style={{ flex: 1 }}>
          <Text style={styles.offlineNoticeTitle}>Çevrimdışı Veri</Text>

          <Text style={styles.offlineNoticeText}>
            Önemli bilgiler ve son depremler son kaydedilen veriden
            gösteriliyor.
            {infoTime || eqTime ? ` Son kayıt: ${infoTime || eqTime}` : ""}
          </Text>
        </View>
      </View>
    );
  };

  const renderAssemblyPanel = () => {
    if (!showAssemblyAreas) return null;

    return (
      <View style={styles.assemblyPanel}>
        <View style={styles.searchCard}>
          <Text style={styles.searchLabel}>Adres veya İlçe ile Ara</Text>

          <View style={styles.searchRow}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search-outline" size={18} color="#64748B" />

              <TextInput
                style={styles.searchInput}
                placeholder="Örn: Kadıköy, Bakırköy, Üsküdar..."
                placeholderTextColor="#64748B"
                value={searchAddress}
                onChangeText={setSearchAddress}
                returnKeyType="search"
                onSubmitEditing={searchLocationByText}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.searchBtn,
                !isOnline && { backgroundColor: "#334155" },
              ]}
              onPress={searchLocationByText}
              disabled={searchLoading}
            >
              {searchLoading ? (
                <ActivityIndicator size="small" color="#0F172A" />
              ) : (
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={isOnline ? "#0F172A" : "#94A3B8"}
                />
              )}
            </TouchableOpacity>
          </View>

          {!isOnline && (
            <Text style={styles.searchOfflineHint}>
              Adres arama internet ister. Toplanma alanları listesi cihazda
              kayıtlıdır; konum varsa offline çalışır.
            </Text>
          )}

          <TouchableOpacity
            style={styles.currentLocationBtn}
            onPress={getCurrentLocation}
            disabled={locationLoading}
          >
            {locationLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Ionicons
                name="locate-outline"
                size={17}
                color={COLORS.primary}
              />
            )}

            <Text style={styles.currentLocationText}>
              Mevcut konumuma göre göster
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.locationCard}>
          <View style={styles.locationIcon}>
            <Ionicons name="location-outline" size={20} color="#38BDF8" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.locationLabel}>Hesaplanan Konum</Text>
            <Text style={styles.locationText}>{address}</Text>
          </View>
        </View>

        <View style={styles.assemblyInfoBox}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#38BDF8"
          />

          <Text style={styles.assemblyInfoText}>
            Toplanma alanları cihazdaki veri dosyasından çalışır. Yazdığınız ya
            da mevcut konumunuza göre mesafe sıralamasıyla listelenir.
          </Text>
        </View>

        {!userLocation ? (
          <View style={styles.emptyBox}>
            <Ionicons name="location-outline" size={46} color="#334155" />
            <Text style={styles.emptyTitle}>Konum Gerekli</Text>
            <Text style={styles.emptyText}>
              En yakın alanları hesaplamak için adres yazın veya mevcut konumu
              kullanın.
            </Text>
          </View>
        ) : (
          <>
            {nearestAreas.map((area, index) => (
              <View key={`${area.id}-${index}`} style={styles.areaCard}>
                <View style={styles.areaTop}>
                  <View style={styles.rankBox}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.areaName}>
                      {area.name || "Toplanma Alanı"}
                    </Text>

                    <Text style={styles.areaCategory}>
                      {area.category || "Acil Durum Toplanma Alanı"}
                    </Text>
                  </View>

                  <View style={styles.distanceBadge}>
                    <Ionicons
                      name="navigate-outline"
                      size={13}
                      color={COLORS.primary}
                    />

                    <Text style={styles.distanceText}>
                      {area.displayDistance}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="business-outline"
                      size={14}
                      color="#94A3B8"
                    />

                    <Text style={styles.metaText}>
                      {area.neighborhood || "Mahalle bilgisi yok"}
                    </Text>
                  </View>

                  <View style={styles.metaItem}>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={14}
                      color="#22C55E"
                    />

                    <Text style={styles.metaText}>
                      İstanbul deprem toplanma alanı verisi
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.mapBtn}
                  onPress={() => openMaps(area)}
                >
                  <Ionicons name="map-outline" size={17} color="#0F172A" />
                  <Text style={styles.mapBtnText}>Haritada Aç</Text>
                </TouchableOpacity>
              </View>
            ))}

            {visibleCount < 20 && (
              <TouchableOpacity
                style={styles.moreBtn}
                onPress={() => setVisibleCount((prev) => prev + 5)}
              >
                <Text style={styles.moreBtnText}>Daha Fazla Göster</Text>
                <Ionicons
                  name="chevron-down"
                  size={18}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Acil Durum Merkezi</Text>

        {renderOfflineCacheNotice()}

        <Text style={styles.sectionTitle}>ACİL DURUM HAZIRLIK LİSTESİ</Text>

        <View style={styles.card}>
          {[
            { text: "Afet çantasında su ve gıdayı kontrol et", icon: "water" },
            { text: "Yedek pilleri ve feneri test et", icon: "flashlight" },
            { text: "Düdük ve ilk yardım kitini çantaya ekle", icon: "medkit" },
            { text: "Evdeki ağır mobilyaları sabitle", icon: "construct" },
            { text: "Aile içi buluşma noktasını kararlaştır", icon: "people" },
            { text: "Yangın tüpünün tarihini kontrol et", icon: "flame" },
            {
              text: "Dış kapı anahtarını kolay erişilir yere koy",
              icon: "key",
            },
            { text: "Yatağının yanına sağlam ayakkabı bırak", icon: "walk" },
            {
              text: "Doğalgaz ve su vanalarının yerini öğren",
              icon: "settings",
            },
          ].map((item, index) => (
            <View key={index} style={styles.checkRow}>
              <View style={{ width: 30, alignItems: "center" }}>
                <Ionicons name={item.icon} size={18} color={COLORS.primary} />
              </View>

              <Text style={styles.checkText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>
          SON DEPREMLER
        </Text>

        {earthquakes.length === 0 ? (
          <View style={styles.emptyMiniCard}>
            <Ionicons name="pulse-outline" size={30} color="#334155" />
            <Text style={styles.emptyMiniText}>
              Deprem verisi bulunamadı. İnternet geldiğinde güncellenecek.
            </Text>
          </View>
        ) : (
          earthquakes.map((eq, index) => (
            <View
              key={index}
              style={[
                styles.eqCard,
                { borderLeftColor: eq.mag >= 4 ? "#EF4444" : "#10B981" },
              ]}
            >
              <View style={styles.magCircle}>
                <Text style={styles.magText}>{eq.mag}</Text>
              </View>

              <View style={{ marginLeft: 15, flex: 1 }}>
                <Text style={styles.eqLocation}>{eq.title}</Text>
                <Text style={styles.eqDetail}>
                  {eq.date} • Derinlik: {eq.depth}km
                </Text>
              </View>

              {!isOnline && (
                <Ionicons
                  name="cloud-offline-outline"
                  size={16}
                  color="#64748B"
                />
              )}
            </View>
          ))
        )}

        {!isOnline && earthquakesCachedAt && (
          <Text style={styles.cacheTimeText}>
            Son deprem verisi: {formatCacheTime(earthquakesCachedAt)}
          </Text>
        )}

        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>
          ÖNEMLİ BİLGİLER
        </Text>

        {importantInfo.length === 0 ? (
          <View style={styles.emptyMiniCard}>
            <Ionicons
              name="information-circle-outline"
              size={30}
              color="#334155"
            />
            <Text style={styles.emptyMiniText}>
              Önemli bilgi verisi bulunamadı. İnternet geldiğinde güncellenecek.
            </Text>
          </View>
        ) : (
          importantInfo.map((info) => {
            const isAssembly = isAssemblyInfo(info);

            return (
              <View key={info.id}>
                <TouchableOpacity
                  activeOpacity={isAssembly ? 0.85 : 1}
                  onPress={isAssembly ? handleAssemblyPress : undefined}
                  style={[
                    styles.infoCard,
                    { borderLeftColor: info.color || COLORS.primary },
                    isAssembly && styles.infoCardTouchable,
                  ]}
                >
                  <View style={styles.infoTitleRow}>
                    <Ionicons
                      name={info.icon || "information-circle"}
                      size={22}
                      color={info.color || COLORS.primary}
                    />

                    <Text style={styles.infoTitleText}>{info.title}</Text>

                    {isAssembly && (
                      <View style={styles.expandIcon}>
                        {locationLoading ? (
                          <ActivityIndicator
                            size="small"
                            color={COLORS.primary}
                          />
                        ) : (
                          <Ionicons
                            name={
                              showAssemblyAreas ? "chevron-up" : "chevron-down"
                            }
                            size={20}
                            color="#94A3B8"
                          />
                        )}
                      </View>
                    )}
                  </View>

                  <Text style={styles.infoDescText}>{info.description}</Text>

                  {isAssembly && (
                    <Text style={styles.tapHint}>
                      {showAssemblyAreas
                        ? "Toplanma alanlarını gizlemek için dokun"
                        : "En yakın toplanma alanlarını görmek için dokun"}
                    </Text>
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
                </TouchableOpacity>

                {isAssembly && renderAssemblyPanel()}
              </View>
            );
          })
        )}

        {!isOnline && importantInfoCachedAt && (
          <Text style={styles.cacheTimeText}>
            Son önemli bilgiler: {formatCacheTime(importantInfoCachedAt)}
          </Text>
        )}
      </ScrollView>
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

  container: {
    flex: 1,
    paddingHorizontal: 20,
  },

  headerTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 15,
    marginBottom: 20,
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

  sectionTitle: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 1.5,
    marginBottom: 15,
    textTransform: "uppercase",
  },

  card: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 18,
    marginBottom: 10,
  },

  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  checkText: {
    color: "#E2E8F0",
    marginLeft: 12,
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },

  eqCard: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 15,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 5,
  },

  magCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  magText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },

  eqLocation: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  },

  eqDetail: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 4,
  },

  infoCard: {
    backgroundColor: "#1E293B",
    borderRadius: 22,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 5,
  },

  infoCardTouchable: {
    borderWidth: 1,
    borderColor: "#334155",
  },

  infoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  infoTitleText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 17,
    marginLeft: 10,
    flex: 1,
  },

  infoDescText: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 20,
  },

  expandIcon: {
    marginLeft: 8,
  },

  tapHint: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 10,
  },

  cachedBadge: {
    alignSelf: "flex-start",
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(127,29,29,0.35)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },

  cachedBadgeText: {
    color: "#FCA5A5",
    fontSize: 10,
    fontWeight: "800",
  },

  cacheTimeText: {
    color: "#64748B",
    fontSize: 11,
    marginTop: -4,
    marginBottom: 8,
    fontWeight: "700",
  },

  emptyMiniCard: {
    backgroundColor: "#1E293B",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },

  emptyMiniText: {
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
  },

  assemblyPanel: {
    backgroundColor: "#0B1120",
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
    marginTop: -5,
    marginBottom: 18,
  },

  searchCard: {
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
    marginBottom: 12,
  },

  searchLabel: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 9,
  },

  searchRow: {
    flexDirection: "row",
    gap: 8,
  },

  searchInputWrapper: {
    flex: 1,
    height: 48,
    backgroundColor: "#0F172A",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  searchInput: {
    flex: 1,
    color: "white",
    marginLeft: 8,
    fontSize: 13,
  },

  searchBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  searchOfflineHint: {
    color: "#FCA5A5",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 10,
  },

  currentLocationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 12,
    alignSelf: "flex-start",
  },

  currentLocationText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
  },

  locationCard: {
    flexDirection: "row",
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
    alignItems: "center",
    marginBottom: 12,
  },

  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "rgba(56,189,248,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  locationLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 3,
  },

  locationText: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "700",
  },

  assemblyInfoBox: {
    flexDirection: "row",
    backgroundColor: "rgba(56,189,248,0.08)",
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.25)",
    borderRadius: 15,
    padding: 12,
    marginBottom: 14,
    gap: 9,
  },

  assemblyInfoText: {
    color: "#CBD5E1",
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },

  emptyBox: {
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E293B",
  },

  emptyTitle: {
    color: "white",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 10,
  },

  emptyText: {
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 6,
  },

  areaCard: {
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: "#1E293B",
    marginBottom: 12,
  },

  areaTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  rankBox: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: "rgba(249,115,22,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },

  rankText: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 14,
  },

  areaName: {
    color: "white",
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 21,
  },

  areaCategory: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "700",
  },

  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(249,115,22,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 4,
  },

  distanceText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "900",
  },

  metaRow: {
    marginTop: 13,
    gap: 7,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  metaText: {
    color: "#CBD5E1",
    fontSize: 12,
    flex: 1,
  },

  mapBtn: {
    marginTop: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 13,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },

  mapBtnText: {
    color: "#0F172A",
    fontWeight: "900",
  },

  moreBtn: {
    marginTop: 4,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  moreBtnText: {
    color: COLORS.primary,
    fontWeight: "900",
  },
});
