// src/components/ihbarModali.js

import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  CATEGORIES,
  PEOPLE_OPTIONS,
  PRIORITIES,
} from "../constants/ihbarConstants";
import { ihbarStyles as S } from "../styles/ihbarStyles";
import KonumSecModal from "./konumSecModal";

const LOW_PRIORITY_COLOR = "#3B82F6";

const isLowPriority = (value) => value === "NORMAL" || value === "DÜŞÜK";

export default function IhbarModali({
  visible,
  onClose,
  category,
  setCategory,
  description,
  setDescription,
  address: gpsAddress,
  region: gpsRegion,
  image,
  setImage,
  showImageOptions,
  priority,
  setPriority,
  urgency,
  setUrgency,
  peopleAffected,
  setPeopleAffected,
  handleSendReport,
  loading,
}) {
  const [konumModalVisible, setKonumModalVisible] = useState(false);
  const [customLocation, setCustomLocation] = useState(null);

  const activeAddress = customLocation?.address || gpsAddress;
  const activeRegion = customLocation?.region || gpsRegion;
  const isCustom = !!customLocation;

  const activePriority =
    PRIORITIES.find((p) => p.value === priority) || PRIORITIES[0];

  // Kapat ve sıfırla
  const handleClose = () => {
    setCustomLocation(null);
    onClose();
  };

  // Gönder validasyonu
  const onSubmit = () => {
    if (!category) {
      Alert.alert("Uyarı", "Lütfen kategori seçin.");
      return;
    }
    if (!description || description.trim().length < 10) {
      Alert.alert("Uyarı", "Açıklama en az 10 karakter olmalı.");
      return;
    }
    handleSendReport({ address: activeAddress, region: activeRegion });
  };

  // Öncelik kartı için stil hesapla
  // DÜŞÜK/NORMAL: gönüllü ekranıyla uyumlu olması için mavi kullanıyoruz
  const getPriorityStyle = (item) => {
    const active = priority === item.value;

    if (!active) return [S.priorityCard];

    if (isLowPriority(item.value)) {
      return [
        S.priorityCard,
        {
          borderColor: LOW_PRIORITY_COLOR,
          backgroundColor: "rgba(59,130,246,0.12)",
        },
      ];
    }

    return [
      S.priorityCard,
      {
        borderColor: item.color,
        backgroundColor: item.color + "12",
      },
    ];
  };

  return (
    <>
      <Modal animationType="slide" transparent visible={visible}>
        <View style={S.overlay}>
          <View style={S.sheet}>
            <View style={S.handle} />

            {/* Header */}
            <View style={S.header}>
              <View>
                <Text style={S.headerTitle}>Acil Yardım Talebi</Text>
                <Text style={S.headerSub}>
                  Bilgilerinizi doldurun, yardım gelsin
                </Text>
              </View>
              <TouchableOpacity style={S.closeBtn} onPress={handleClose}>
                <Ionicons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={S.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* ── 1: Kategori ── */}
              <SectionLabel step="1" title="Ne tür yardıma ihtiyacınız var?" />
              <View style={S.categoryRow}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      S.categoryCard,
                      category === cat.id && {
                        borderColor: cat.color,
                        backgroundColor: cat.bg,
                      },
                    ]}
                    onPress={() => setCategory(cat.id)}
                  >
                    <View
                      style={[
                        S.categoryIconWrap,
                        {
                          backgroundColor:
                            category === cat.id ? cat.color + "22" : "#1E293B",
                        },
                      ]}
                    >
                      <Ionicons
                        name={cat.icon}
                        size={24}
                        color={category === cat.id ? cat.color : "#475569"}
                      />
                    </View>
                    <Text
                      style={[
                        S.categoryLabel,
                        { color: category === cat.id ? cat.color : "#64748B" },
                      ]}
                    >
                      {cat.id}
                    </Text>
                    {category === cat.id && (
                      <View
                        style={[
                          S.categoryCheck,
                          { backgroundColor: cat.color },
                        ]}
                      >
                        <Ionicons name="checkmark" size={10} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* ── 2: Aciliyet ── */}
              <SectionLabel step="2" title="Aciliyet durumu nedir?" />
              <View style={S.priorityRow}>
                {PRIORITIES.map((item) => {
                  const active = priority === item.value;
                  const activeColor = isLowPriority(item.value)
                    ? LOW_PRIORITY_COLOR
                    : item.color;

                  return (
                    <TouchableOpacity
                      key={item.value}
                      style={getPriorityStyle(item)}
                      onPress={() => {
                        setPriority(item.value);
                        setUrgency(item.urgency);
                      }}
                    >
                      <Ionicons
                        name={item.icon}
                        size={20}
                        color={active ? activeColor : "#475569"}
                      />
                      <Text
                        style={[
                          S.priorityLabel,
                          { color: active ? activeColor : "#64748B" },
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text style={S.priorityDesc}>{item.desc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Seçili öncelik banner */}
              {priority && (
                <View
                  style={[
                    S.priorityBanner,
                    {
                      borderColor: isLowPriority(activePriority.value)
                        ? LOW_PRIORITY_COLOR + "40"
                        : activePriority.color + "40",
                    },
                  ]}
                >
                  <Ionicons
                    name={activePriority.icon}
                    size={16}
                    color={
                      isLowPriority(activePriority.value)
                        ? LOW_PRIORITY_COLOR
                        : activePriority.color
                    }
                  />
                  <Text
                    style={[
                      S.priorityBannerText,
                      {
                        color: isLowPriority(activePriority.value)
                          ? LOW_PRIORITY_COLOR
                          : activePriority.color,
                      },
                    ]}
                  >
                    {activePriority.label} — {activePriority.desc}
                  </Text>
                </View>
              )}

              {/* ── 3: Kişi sayısı ── */}
              <SectionLabel step="3" title="Kaç kişi etkilendi?" />
              <View style={S.peopleRow}>
                {PEOPLE_OPTIONS.map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      S.peopleChip,
                      peopleAffected === item.value && S.peopleChipActive,
                    ]}
                    onPress={() => setPeopleAffected(item.value)}
                  >
                    <Text
                      style={[
                        S.peopleChipText,
                        {
                          color:
                            peopleAffected === item.value
                              ? "#F97316"
                              : "#64748B",
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* ── 4: Konum ── */}
              <SectionLabel step="4" title="Konumunuz" />
              <View style={S.locationCard}>
                <View style={S.locationRow}>
                  <View
                    style={[
                      S.locationDot,
                      isCustom && { backgroundColor: "#F97316" },
                    ]}
                  />
                  <Text style={S.locationText}>
                    {activeAddress || "Konum alınıyor..."}
                  </Text>
                </View>

                {activeRegion?.latitude && (
                  <Text style={S.coordText}>
                    {activeRegion.latitude.toFixed(5)}° K —{" "}
                    {activeRegion.longitude.toFixed(5)}° D
                  </Text>
                )}

                <View style={S.locationBtnRow}>
                  {isCustom && (
                    <TouchableOpacity
                      style={S.locationBtnSecondary}
                      onPress={() => setCustomLocation(null)}
                    >
                      <Ionicons
                        name="locate-outline"
                        size={14}
                        color="#64748B"
                      />
                      <Text style={S.locationBtnTextSecondary}>GPS'e Dön</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={S.locationBtnPrimary}
                    onPress={() => setKonumModalVisible(true)}
                  >
                    <Ionicons name="map-outline" size={14} color="#F97316" />
                    <Text style={S.locationBtnText}>
                      {isCustom ? "Konumu Değiştir" : "Farklı Konum Seç"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {isCustom && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      marginTop: 6,
                    }}
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={12}
                      color="#F97316"
                    />
                    <Text
                      style={{
                        color: "#F97316",
                        fontSize: 10,
                        fontWeight: "600",
                      }}
                    >
                      Manuel konum seçildi
                    </Text>
                  </View>
                )}
              </View>

              {/* ── 5: Açıklama ── */}
              <SectionLabel step="5" title="Detaylı açıklama" />
              <TextInput
                style={S.textArea}
                placeholder="Durumu açıklayın..."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
                textAlignVertical="top"
              />
              <Text style={S.charCount}>
                {description?.length || 0} / min. 10 karakter
              </Text>

              {/* ── 6: Fotoğraf ── */}
              <SectionLabel step="6" title="Fotoğraf ekle (isteğe bağlı)" />
              <TouchableOpacity
                style={S.photoArea}
                activeOpacity={0.8}
                onPress={() => {
                  if (typeof showImageOptions === "function")
                    showImageOptions();
                  else
                    Alert.alert(
                      "Bilgi",
                      "Fotoğraf seçimi şu an kullanılamıyor.",
                    );
                }}
              >
                {image ? (
                  <View style={S.photoPreview}>
                    <Image source={{ uri: image }} style={S.photoImage} />
                    <TouchableOpacity
                      style={S.photoRemove}
                      onPress={() => setImage(null)}
                    >
                      <Ionicons name="trash" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={S.photoPlaceholder}>
                    <View style={S.photoIconWrap}>
                      <Ionicons
                        name="camera-outline"
                        size={28}
                        color="#475569"
                      />
                    </View>
                    <Text style={S.photoTitle}>Fotoğraf Ekle</Text>
                    <Text
                      style={{
                        color: "#334155",
                        fontSize: 11,
                        textAlign: "center",
                        paddingHorizontal: 20,
                      }}
                    >
                      Galeriden seçin veya fotoğraf çekin
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Gönder */}
              <TouchableOpacity
                style={[S.submitBtn, loading && { opacity: 0.6 }]}
                onPress={onSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name="send"
                      size={18}
                      color="#fff"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={S.submitText}>YARDIM TALEBİNİ GÖNDER</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Konum seçici modal */}
      <KonumSecModal
        visible={konumModalVisible}
        onClose={() => setKonumModalVisible(false)}
        onSelect={(item) => {
          setCustomLocation({ address: item.address, region: item.region });
          setKonumModalVisible(false);
        }}
      />
    </>
  );
}

function SectionLabel({ step, title }) {
  return (
    <View style={S.sectionLabel}>
      <View style={S.stepBadge}>
        <Text style={S.stepNum}>{step}</Text>
      </View>
      <Text style={S.sectionTitle}>{title}</Text>
    </View>
  );
}
