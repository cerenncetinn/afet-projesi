import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

// ─── Nominatim Arama ─────────────────────────────────────────────────────────
async function nominatimSearch(text) {
  if (!text || text.trim().length < 2) return [];
  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?q=${encodeURIComponent(text + " Türkiye")}` +
    `&format=json&addressdetails=1&limit=7&accept-language=tr&countrycodes=tr`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "AfetApp/1.0" } });
    const data = await res.json();
    return data.map((item) => {
      const a = item.address || {};
      const road = a.road || a.street || a.pedestrian || "";
      const houseNum = a.house_number ? ` No:${a.house_number}` : "";
      const neighbourhood = a.neighbourhood || a.suburb || "";
      const district = a.county || a.district || "";
      const city = a.province || a.state || a.city || "";
      const label = road
        ? `${road}${houseNum}`
        : item.display_name.split(",")[0].trim();
      const sub = [neighbourhood, district, city].filter(Boolean).join(", ");
      return {
        label,
        sub,
        display: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      };
    });
  } catch {
    return [];
  }
}

// ─── Ters Geocode ─────────────────────────────────────────────────────────────
// poiName: onPoiClick'ten gelen yer adı (okul, hastane vb.) — varsa öne alınır
async function reverseGeocode(lat, lon, poiName = "") {
  const url =
    `https://nominatim.openstreetmap.org/reverse` +
    `?lat=${lat}&lon=${lon}&format=json&accept-language=tr&zoom=19&addressdetails=1&namedetails=1`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "AfetApp/1.0" } });
    const data = await res.json();
    const a = data.address || {};

    // POI / yer adı: önce event'ten gelen poiName, yoksa Nominatim'den al
    const placeName =
      poiName ||
      data.namedetails?.name ||
      data.name ||
      a.amenity ||
      a.tourism ||
      a.shop ||
      a.office ||
      a.building ||
      "";

    // Sokak + bina no
    const road = a.road || a.street || a.pedestrian || a.path || "";
    const houseNo = a.house_number ? `No:${a.house_number}` : "";
    const streetFull = [road, houseNo].filter(Boolean).join(" ");

    // Mahalle / semt
    const neighbourhood =
      a.neighbourhood || a.suburb || a.quarter || a.hamlet || "";

    // İlçe
    const district = a.county || a.district || a.city_district || "";

    // Şehir
    const city = a.city || a.province || a.state || a.town || "";

    // Öncelik sırası: POI adı → sokak → mahalle → ilçe → şehir
    const parts = [placeName, streetFull, neighbourhood, district, city]
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i); // tekrar edenleri çıkar

    return parts.slice(0, 4).join(", ") || "Adres alınamadı";
  } catch {
    return "Adres alınamadı";
  }
}

// ─── Debounce yardımcısı ──────────────────────────────────────────────────────
let debounceTimer = null;
function debounce(fn, delay) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(fn, delay);
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
export default function KonumSecModal({ visible, onClose, onSelect }) {
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [pinCoord, setPinCoord] = useState(null);
  const [pinAddress, setPinAddress] = useState("");
  const [reverseLoading, setReverseLoading] = useState(false);
  const [openAddress, setOpenAddress] = useState("");

  const mapRef = useRef(null);

  // ── Yazarken debounce ile otomatik arama ─────────────────────────────────
  const handleQueryChange = (text) => {
    setQuery(text);
    if (text.trim().length >= 2) {
      setSearching(true);
      debounce(async () => {
        const res = await nominatimSearch(text);
        setSuggestions(res);
        setSearching(false);
      }, 450);
    } else {
      setSuggestions([]);
      setSearching(false);
    }
  };

  // ── Ara butonuna bas ─────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (query.trim().length < 2) return;
    Keyboard.dismiss();
    setSearching(true);
    const res = await nominatimSearch(query);
    setSuggestions(res);
    setSearching(false);
  };

  // ── Öneri seçildi → haritaya at ──────────────────────────────────────────
  const jumpToMap = (lat, lon, address) => {
    const coord = { latitude: lat, longitude: lon };
    setPinCoord(coord);
    setPinAddress(address);
    setStep(2);
    setSuggestions([]);
    Keyboard.dismiss();
    setTimeout(() => {
      mapRef.current?.animateToRegion(
        { ...coord, latitudeDelta: 0.004, longitudeDelta: 0.004 },
        600,
      );
    }, 400);
  };

  // ── Tüm konum güncelleme olaylarının ortak fonksiyonu ───────────────────
  // poiName: onPoiClick'ten gelen yer adı — reverseGeocode'a aktarılır
  const updatePin = (latitude, longitude, poiName = "") => {
    setPinCoord({ latitude, longitude });
    setReverseLoading(true);
    reverseGeocode(latitude, longitude, poiName).then((addr) => {
      setPinAddress(addr);
      setReverseLoading(false);
    });
  };

  // Boş haritaya dokunma
  const handleMapPress = (e) =>
    updatePin(
      e.nativeEvent.coordinate.latitude,
      e.nativeEvent.coordinate.longitude,
    );

  // Pin sürükleme
  const handleDragEnd = (e) =>
    updatePin(
      e.nativeEvent.coordinate.latitude,
      e.nativeEvent.coordinate.longitude,
    );

  // ── Kapat & sıfırla ───────────────────────────────────────────────────────
  const handleClose = () => {
    setStep(1);
    setQuery("");
    setSuggestions([]);
    setSearching(false);
    setPinCoord(null);
    setPinAddress("");
    setOpenAddress("");
    onClose();
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity
              style={s.iconBtn}
              onPress={() => (step > 1 ? setStep(step - 1) : handleClose())}
            >
              <Ionicons
                name={step > 1 ? "arrow-back" : "close"}
                size={20}
                color="#94A3B8"
              />
            </TouchableOpacity>
            <Text style={s.title}>
              {step === 1
                ? "Konum Ara"
                : step === 2
                  ? "Pini Doğrula"
                  : "Adres Detayı"}
            </Text>
            <TouchableOpacity style={s.iconBtn} onPress={handleClose}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Adım göstergesi */}
          <View style={s.stepRow}>
            {[1, 2, 3].map((num) => (
              <View
                key={num}
                style={{ flexDirection: "row", alignItems: "center" }}
              >
                <View style={[s.stepDot, step >= num && s.stepDotActive]}>
                  {step > num ? (
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  ) : (
                    <Text
                      style={[s.stepNumText, step === num && { color: "#fff" }]}
                    >
                      {num}
                    </Text>
                  )}
                </View>
                {num < 3 && (
                  <View style={[s.stepLine, step > num && s.stepLineActive]} />
                )}
              </View>
            ))}
          </View>

          {/* ══ ADIM 1: ARAMA ══ */}
          {step === 1 && (
            <View style={{ flex: 1 }}>
              <View style={s.searchRow}>
                <View style={s.searchBox}>
                  <Ionicons name="search" size={18} color="#64748B" />
                  <TextInput
                    style={s.input}
                    placeholder="Mahalle, sokak, AVM..."
                    placeholderTextColor="#475569"
                    value={query}
                    onChangeText={handleQueryChange}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                    autoFocus
                  />
                  {/* FIX: !! ile boolean'a çevrildi — Android'de "0" basma riski yok */}
                  {searching ? (
                    <ActivityIndicator size="small" color="#F97316" />
                  ) : !!query.length ? (
                    <TouchableOpacity
                      onPress={() => {
                        setQuery("");
                        setSuggestions([]);
                      }}
                    >
                      <Ionicons name="close-circle" size={18} color="#475569" />
                    </TouchableOpacity>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={[
                    s.searchBtn,
                    query.trim().length < 2 && { opacity: 0.5 },
                  ]}
                  onPress={handleSearch}
                  disabled={query.trim().length < 2}
                >
                  <Text style={s.searchBtnText}>Ara</Text>
                </TouchableOpacity>
              </View>

              {/* Boş durum */}
              {suggestions.length === 0 &&
                !searching &&
                query.trim().length < 2 && (
                  <View style={s.emptyBox}>
                    <View style={s.emptyIcon}>
                      <Ionicons name="map-outline" size={34} color="#334155" />
                    </View>
                    <Text style={s.emptyTitle}>Konum arayın</Text>
                    <Text style={s.emptyDesc}>
                      {"Yazarken otomatik öneri gelir\nveya Ara butonuna basın"}
                    </Text>
                  </View>
                )}

              {/* Sonuç yok */}
              {suggestions.length === 0 &&
                !searching &&
                query.trim().length >= 2 && (
                  <View style={s.emptyBox}>
                    <Ionicons name="search-outline" size={32} color="#334155" />
                    <Text style={s.emptyTitle}>Sonuç bulunamadı</Text>
                    <Text style={s.emptyDesc}>
                      Farklı kelime veya mahalle adı deneyin
                    </Text>
                  </View>
                )}

              <FlatList
                data={suggestions}
                keyExtractor={(_, i) => String(i)}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 30 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.suggestionItem}
                    onPress={() =>
                      jumpToMap(
                        item.lat,
                        item.lon,
                        item.sub ? `${item.label}, ${item.sub}` : item.label,
                      )
                    }
                  >
                    <View style={s.suggestionIcon}>
                      <Ionicons
                        name="location-sharp"
                        size={16}
                        color="#F97316"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.suggestionLabel} numberOfLines={1}>
                        {item.label}
                      </Text>
                      <Text style={s.suggestionSub} numberOfLines={1}>
                        {item.sub || item.display}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#334155"
                    />
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* ══ ADIM 2: HARİTA ══ */}
          {step === 2 && (
            <View style={{ flex: 1 }}>
              <View style={s.addressBanner}>
                <View style={s.addressDot} />
                <Text style={s.addressText} numberOfLines={2}>
                  {reverseLoading
                    ? "Adres alınıyor..."
                    : pinAddress || "Haritaya dokun, adres otomatik gelir"}
                </Text>
                {reverseLoading && (
                  <ActivityIndicator
                    size="small"
                    color="#F97316"
                    style={{ marginLeft: 8 }}
                  />
                )}
              </View>

              <View style={s.hintBox}>
                <Ionicons
                  name="information-circle-outline"
                  size={13}
                  color="#64748B"
                />
                <Text style={s.hintText}>
                  Haritaya dokun veya pini sürükle — AVM/bina üzerine gelirse o
                  yerin adı çıkar
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <MapView
                  ref={mapRef}
                  style={StyleSheet.absoluteFillObject}
                  onPress={handleMapPress}
                  // POI tıklama: okul, hastane, restoran, AVM gibi
                  // harita ikonlarına onPress çalışmaz — onPoiClick gerekir
                  onPoiClick={(e) => {
                    // e.nativeEvent.name: Google Maps'in POI etiketi (okul adı, hastane adı vb.)
                    // Bu sayede Nominatim'den bağımsız olarak yer adını doğrudan alıyoruz
                    updatePin(
                      e.nativeEvent.coordinate.latitude,
                      e.nativeEvent.coordinate.longitude,
                      e.nativeEvent.name || "",
                    );
                  }}
                  initialRegion={
                    pinCoord
                      ? {
                          ...pinCoord,
                          latitudeDelta: 0.004,
                          longitudeDelta: 0.004,
                        }
                      : {
                          latitude: 39.0,
                          longitude: 35.0,
                          latitudeDelta: 8,
                          longitudeDelta: 8,
                        }
                  }
                  showsUserLocation
                  showsPointsOfInterest
                  scrollEnabled
                  zoomEnabled
                >
                  {pinCoord != null && (
                    <Marker
                      coordinate={pinCoord}
                      pinColor="#F97316"
                      draggable
                      onDragEnd={handleDragEnd}
                      tracksViewChanges={reverseLoading}
                    />
                  )}
                </MapView>

                {/* Pin henüz yok — kullanıcıya dokun ipucu */}
                {!pinCoord && (
                  <View style={s.mapEmptyOverlay} pointerEvents="none">
                    <Ionicons
                      name="locate-outline"
                      size={44}
                      color="rgba(249,115,22,0.8)"
                    />
                    <Text style={s.mapEmptyText}>
                      Konumunu seçmek için haritaya dokun
                    </Text>
                  </View>
                )}
              </View>

              <View style={s.footer}>
                <TouchableOpacity
                  style={[
                    s.confirmBtn,
                    (!pinCoord || reverseLoading) && { opacity: 0.5 },
                  ]}
                  onPress={() => pinCoord && !reverseLoading && setStep(3)}
                  disabled={!pinCoord || reverseLoading}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={s.confirmBtnText}>BU NOKTAYI SEÇ</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ══ ADIM 3: DETAY ══ */}
          {step === 3 && (
            <View style={{ flex: 1, padding: 20 }}>
              <View style={s.finalCard}>
                <Text style={s.finalCardLabel}>SEÇİLEN KONUM</Text>
                <Text style={s.finalCardAddress}>{pinAddress}</Text>
                <TouchableOpacity
                  style={s.changeBtn}
                  onPress={() => setStep(2)}
                >
                  <Ionicons name="pencil" size={13} color="#F97316" />
                  <Text style={s.changeBtnText}>Konumu Değiştir</Text>
                </TouchableOpacity>
              </View>

              <Text style={s.label}>Bina / Kat / Daire Bilgisi</Text>
              <Text style={s.labelSub}>isteğe bağlı</Text>
              <TextInput
                style={s.textArea}
                placeholder="Örn: Mavi bina, Kat 2, Daire 4..."
                placeholderTextColor="#475569"
                multiline
                value={openAddress}
                onChangeText={setOpenAddress}
                textAlignVertical="top"
                autoFocus
              />

              {/* Önizleme */}
              {openAddress.trim().length > 0 && (
                <View style={s.previewBox}>
                  <Text style={s.previewLabel}>Kaydedilecek adres:</Text>
                  <Text style={s.previewText}>
                    {pinAddress} — {openAddress.trim()}
                  </Text>
                </View>
              )}

              <View style={s.footer}>
                <TouchableOpacity
                  style={s.confirmBtn}
                  onPress={() => {
                    if (!pinCoord) return;
                    onSelect({
                      address: openAddress.trim()
                        ? `${pinAddress} — ${openAddress.trim()}`
                        : pinAddress,
                      // FIX: latitudeDelta ve longitudeDelta eklendi
                      region: {
                        latitude: pinCoord.latitude,
                        longitude: pinCoord.longitude,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005,
                      },
                    });
                    handleClose();
                  }}
                >
                  <Ionicons
                    name="location"
                    size={20}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={s.confirmBtnText}>ADRESİ KAYDET VE BİTİR</Text>
                </TouchableOpacity>
              </View>

              <Text style={s.skipHint}>
                Açık adres girmeden de devam edebilirsiniz.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Stiller ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: "93%",
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#334155",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#F1F5F9", fontSize: 17, fontWeight: "700" },

  // Adım göstergesi
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#334155",
  },
  stepDotActive: { backgroundColor: "#F97316", borderColor: "#F97316" },
  stepNumText: { color: "#64748B", fontSize: 12, fontWeight: "700" },
  stepLine: {
    width: 44,
    height: 2,
    backgroundColor: "#1E293B",
    marginHorizontal: 4,
  },
  stepLineActive: { backgroundColor: "#F97316" },

  // Arama
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 50,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 8,
  },
  input: { flex: 1, color: "#F1F5F9", fontSize: 14 },
  searchBtn: {
    backgroundColor: "#F97316",
    borderRadius: 14,
    paddingHorizontal: 18,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // Boş durum
  emptyBox: { alignItems: "center", paddingTop: 48, gap: 10 },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { color: "#94A3B8", fontSize: 15, fontWeight: "700" },
  emptyDesc: {
    color: "#475569",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },

  // Öneri listesi
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
    gap: 12,
  },
  suggestionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(249,115,22,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionLabel: { color: "#F1F5F9", fontWeight: "700", fontSize: 14 },
  suggestionSub: { color: "#64748B", fontSize: 11, marginTop: 2 },

  // Harita - adres banner
  addressBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    margin: 12,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 8,
  },
  addressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F97316",
  },
  addressText: { color: "#F1F5F9", fontWeight: "600", fontSize: 13, flex: 1 },

  // İpucu
  hintBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: "rgba(100,116,139,0.08)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  hintText: { color: "#64748B", fontSize: 11, flex: 1, lineHeight: 15 },

  // Harita boş overlay
  mapEmptyOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  mapEmptyText: {
    color: "rgba(249,115,22,0.9)",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 40,
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
    backgroundColor: "#0F172A",
  },
  confirmBtn: {
    backgroundColor: "#F97316",
    borderRadius: 16,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },

  // Detay adımı
  finalCard: {
    backgroundColor: "#1E293B",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F97316",
    marginBottom: 20,
  },
  finalCardLabel: {
    color: "#F97316",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  finalCardAddress: {
    color: "#F1F5F9",
    fontWeight: "600",
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  changeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  changeBtnText: { color: "#F97316", fontSize: 12, fontWeight: "700" },

  label: { color: "#F1F5F9", fontSize: 15, fontWeight: "700" },
  labelSub: { color: "#64748B", fontSize: 11, marginTop: 2, marginBottom: 10 },
  textArea: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    color: "#F1F5F9",
    padding: 14,
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#334155",
    fontSize: 14,
    lineHeight: 20,
  },

  previewBox: {
    marginTop: 12,
    backgroundColor: "rgba(249,115,22,0.08)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.25)",
  },
  previewLabel: {
    color: "#F97316",
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 4,
  },
  previewText: { color: "#F1F5F9", fontSize: 12, lineHeight: 18 },

  skipHint: {
    color: "#334155",
    fontSize: 11,
    textAlign: "center",
    marginTop: 12,
  },
});
