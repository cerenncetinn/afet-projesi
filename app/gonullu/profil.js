import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";
import GonulluBottomTab from "../../src/components/gonullu/gonulluBottomTab";
import { auth, db } from "../../src/firebase/firebaseConfig";
const C = {
  bg: "#0F172A",
  card: "#1E293B",
  border: "#334155",
  primary: "#F97316",
  muted: "#64748B",
  text: "#F1F5F9",
  sub: "#94A3B8",
  success: "#22C55E",
  danger: "#EF4444",
  warn: "#FBBF24",
  info: "#38BDF8",
};

const EXPERTISE_OPTIONS = [
  {
    label: "Sağlık",
    icon: "medical-outline",
    placeholder: "Örn: Doktor, hemşire, paramedik, ilk yardım sertifikası",
  },
  {
    label: "Arama Kurtarma",
    icon: "shield-checkmark-outline",
    placeholder: "Örn: AFAD eğitimi, enkaz deneyimi, dağcılık",
  },
  {
    label: "Lojistik",
    icon: "cube-outline",
    placeholder: "Örn: Araç kullanımı, depo, dağıtım, koordinasyon",
  },
  {
    label: "İnşaat",
    icon: "construct-outline",
    placeholder: "Örn: İnşaat mühendisi, yapı hasar tespiti, teknik destek",
  },
  {
    label: "Psikoloji",
    icon: "heart-outline",
    placeholder: "Örn: Psikolojik ilk yardım, çocuk desteği, kriz iletişimi",
  },
  {
    label: "Genel",
    icon: "hand-left-outline",
    placeholder: "Örn: Taşıma, dağıtım, saha desteği, gönüllü destek",
  },
];

const onlyDigits = (text) => (text || "").replace(/\D/g, "");

const formatPhoneNumber = (text) => {
  const digits = onlyDigits(text).slice(0, 11);

  if (digits.length <= 4) return digits;

  if (digits.length <= 7) {
    return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }

  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(
    7,
    9,
  )} ${digits.slice(9, 11)}`;
};

function InfoRow({ icon, label, value, color, onEdit, isLast }) {
  return (
    <View style={[s.infoRow, isLast && { borderBottomWidth: 0 }]}>
      <View
        style={[s.iconCircle, { backgroundColor: (color || C.primary) + "18" }]}
      >
        <Ionicons name={icon} size={17} color={color || C.primary} />
      </View>

      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={[s.infoValue, !value && s.infoEmpty]}>
          {value || "Belirtilmemiş"}
        </Text>
      </View>

      {onEdit && (
        <TouchableOpacity
          onPress={onEdit}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="pencil" size={15} color={C.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function GonulluProfil() {
  const router = useRouter();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [expertiseModal, setExpertiseModal] = useState(false);

  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [editMultiline, setEditMultiline] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = onSnapshot(
      doc(db, "users", auth.currentUser.uid),
      (snap) => {
        if (snap.exists()) {
          setUserData(snap.data());
        }
        setLoading(false);
      },
      (error) => {
        if (error.code === "permission-denied") return;
        console.error("Gönüllü profil dinleme hatası:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const handlePhoto = () => {
    Alert.alert("Profil Fotoğrafı", "Kaynak seçin", [
      { text: "Kamera", onPress: () => pickImage(true) },
      { text: "Galeri", onPress: () => pickImage(false) },
      { text: "İptal", style: "cancel" },
    ]);
  };

  const pickImage = async (useCamera) => {
    try {
      const permission = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert("İzin Gerekli", "Fotoğraf seçmek için izin vermelisiniz.");
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.35,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.35,
            base64: true,
          });

      if (!result.canceled) {
        setUploading(true);

        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          profileImage: `data:image/jpeg;base64,${result.assets[0].base64}`,
        });
      }
    } catch (error) {
      Alert.alert("Hata", "Profil fotoğrafı güncellenemedi.");
    } finally {
      setUploading(false);
    }
  };

  const openEdit = (field, label, current, multiline = false) => {
    setEditField(field);
    setEditLabel(label);
    setEditMultiline(multiline);

    if (field === "phone") {
      setEditValue(formatPhoneNumber(current || ""));
    } else {
      setEditValue(current || "");
    }

    setEditModal(true);
  };

  const saveEdit = async () => {
    if (!editField) return;

    try {
      const userRef = doc(db, "users", auth.currentUser.uid);

      if (editField === "phone") {
        const cleanPhone = onlyDigits(editValue);

        if (cleanPhone.length !== 11 || !cleanPhone.startsWith("05")) {
          Alert.alert(
            "Geçersiz Telefon",
            "Telefon numarası 05 ile başlamalı ve 11 haneli olmalıdır.",
          );
          return;
        }

        await updateDoc(userRef, {
          phone: cleanPhone,
          phoneFormatted: formatPhoneNumber(cleanPhone),
        });
      } else {
        await updateDoc(userRef, {
          [editField]: editValue.trim(),
        });
      }

      setEditModal(false);
      setEditField(null);
      setEditValue("");
      setEditLabel("");
      setEditMultiline(false);
    } catch (error) {
      Alert.alert("Hata", "Bilgi güncellenemedi.");
    }
  };

  const saveExpertise = async (selected) => {
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        expertice: selected.label,
      });

      setExpertiseModal(false);
    } catch (error) {
      Alert.alert("Hata", "Uzmanlık alanı güncellenemedi.");
    }
  };

  const switchToMagdur = () => {
    Alert.alert(
      "Afetzede Moduna Dön",
      "Saha görevlerinden ayrılıp afetzede moduna geçmek istiyor musunuz?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Dön",
          onPress: async () => {
            await updateDoc(doc(db, "users", auth.currentUser.uid), {
              role: "magdur",
            });

            router.replace("/afetzede/afetzedePaneli");
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert("Çıkış Yap", "Hesabınızdan çıkış yapmak istiyor musunuz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Çıkış Yap",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("cached_logged_user");
            await signOut(auth);
            router.replace("/login");
          } catch (error) {
            console.log("Çıkış hatası:", error);
            Alert.alert("Hata", "Çıkış yapılırken bir sorun oluştu.");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[s.container, s.centered]}>
        <ActivityIndicator color={C.primary} size="large" />
      </View>
    );
  }

  const phoneDisplay =
    userData?.phoneFormatted || formatPhoneNumber(userData?.phone || "");

  const incomplete =
    !userData?.phone || !userData?.expertice || !userData?.experticeDetail;

  const selectedExpertise = EXPERTISE_OPTIONS.find(
    (item) => item.label === userData?.expertice,
  );

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={s.topbar}>
          <TouchableOpacity style={s.topBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={21} color={C.danger} />
          </TouchableOpacity>

          <Text style={s.topTitle}>PROFİLİM</Text>

          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={s.avatarWrap}
            onPress={handlePhoto}
            activeOpacity={0.85}
          >
            {userData?.profileImage ? (
              <Image source={{ uri: userData.profileImage }} style={s.avatar} />
            ) : (
              <View style={s.avatarPlaceholder}>
                <Ionicons name="person" size={44} color={C.muted} />
              </View>
            )}

            {uploading && (
              <View style={s.avatarOverlay}>
                <ActivityIndicator color="white" />
              </View>
            )}

            <View style={s.cameraCircle}>
              <Ionicons name="camera" size={12} color="white" />
            </View>
          </TouchableOpacity>

          <Text style={s.userName}>{userData?.name || "—"}</Text>

          <View style={s.badge}>
            <Text style={[s.badgeText, { color: C.success }]}>GÖNÜLLÜ</Text>
          </View>

          {incomplete && (
            <View style={s.warnCard}>
              <Ionicons name="alert-circle-outline" size={17} color={C.warn} />
              <Text style={s.warnText}>
                Profilinizde eksik bilgiler var. Görev eşleştirmelerinin doğru
                yapılması için uzmanlık detayınızı tamamlayın.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={s.roleCard}
            onPress={switchToMagdur}
            activeOpacity={0.8}
          >
            <View
              style={[s.roleIconWrap, { backgroundColor: C.primary + "18" }]}
            >
              <Ionicons name="person-outline" size={20} color={C.primary} />
            </View>

            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={s.roleCardTitle}>Afetzede Moduna Dön</Text>
              <Text style={s.roleCardSub}>
                Saha görevlerinden ayrılmak için
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color={C.muted} />
          </TouchableOpacity>

          <Text style={s.section}>KİŞİSEL BİLGİLER</Text>

          <View style={s.card}>
            <InfoRow
              icon="person-outline"
              label="Ad Soyad"
              value={userData?.name}
              onEdit={() => openEdit("name", "Ad Soyad", userData?.name)}
            />

            <InfoRow
              icon="call-outline"
              label="Telefon"
              value={phoneDisplay}
              onEdit={() => openEdit("phone", "Telefon", userData?.phone)}
              isLast
            />
          </View>

          <Text style={s.section}>GÖNÜLLÜ BİLGİLERİ</Text>

          <View style={s.card}>
            <InfoRow
              icon={selectedExpertise?.icon || "medkit-outline"}
              label="Uzmanlık Alanı"
              value={userData?.expertice}
              onEdit={() => setExpertiseModal(true)}
              color={C.success}
            />

            <InfoRow
              icon="ribbon-outline"
              label="Detaylı Yetkinlik"
              value={userData?.experticeDetail}
              onEdit={() =>
                openEdit(
                  "experticeDetail",
                  "Detaylı Yetkinlik",
                  userData?.experticeDetail,
                  true,
                )
              }
              color={C.info}
              isLast
            />
          </View>

          <View style={s.expertiseInfoCard}>
            <View style={s.expertiseInfoHeader}>
              <Ionicons name="sparkles-outline" size={18} color={C.primary} />
              <Text style={s.expertiseInfoTitle}>AI Görev Eşleştirme</Text>
            </View>

            <Text style={s.expertiseInfoText}>
              Uzmanlık alanınız ve detaylı yetkinliğiniz, görev merkezinde size
              daha uygun görevlerin önerilmesi için kullanılır.
            </Text>
          </View>

          <Text style={s.section}>HESAP</Text>

          <View style={s.card}>
            <InfoRow
              icon="mail-outline"
              label="E-posta"
              value={userData?.email}
              isLast
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      <GonulluBottomTab activeTab="PROFILE" />

      <Modal visible={editModal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />

            <Text style={s.sheetTitle}>{editLabel}</Text>

            <TextInput
              style={[s.sheetInput, editMultiline && s.sheetInputLarge]}
              value={editValue}
              onChangeText={(text) => {
                if (editField === "phone") {
                  setEditValue(formatPhoneNumber(text));
                } else {
                  setEditValue(text);
                }
              }}
              placeholderTextColor={C.muted}
              keyboardType={editField === "phone" ? "phone-pad" : "default"}
              maxLength={editField === "phone" ? 14 : undefined}
              multiline={editMultiline}
              autoFocus
            />

            {editField === "experticeDetail" && (
              <Text style={s.sheetHint}>
                Örnek: Doktor, hemşire, paramedik, ilk yardım sertifikası,
                lojistik koordinasyon, araç kullanımı vb.
              </Text>
            )}

            <View style={s.sheetBtns}>
              <TouchableOpacity
                style={s.sheetCancel}
                onPress={() => setEditModal(false)}
              >
                <Text style={{ color: C.muted, fontWeight: "600" }}>İptal</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.sheetSave} onPress={saveEdit}>
                <Text style={{ color: "white", fontWeight: "700" }}>
                  Kaydet
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={expertiseModal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />

            <Text style={s.sheetTitle}>Uzmanlık Alanı Seç</Text>

            <View style={s.expertiseGrid}>
              {EXPERTISE_OPTIONS.map((item) => {
                const active = userData?.expertice === item.label;

                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      s.expertiseOption,
                      active && s.expertiseOptionActive,
                    ]}
                    onPress={() => saveExpertise(item)}
                  >
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={active ? C.primary : C.sub}
                    />

                    <Text
                      style={[
                        s.expertiseOptionText,
                        active && { color: C.primary },
                      ]}
                    >
                      {item.label}
                    </Text>

                    {active && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={C.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={s.sheetCancelFull}
              onPress={() => setExpertiseModal(false)}
            >
              <Text style={{ color: C.muted, fontWeight: "700" }}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  centered: {
    justifyContent: "center",
    alignItems: "center",
  },

  topbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },

  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.card,
    justifyContent: "center",
    alignItems: "center",
  },

  topTitle: {
    color: C.primary,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    alignItems: "center",
  },

  avatarWrap: {
    width: 100,
    height: 100,
    borderRadius: 30,
    borderWidth: 2.5,
    borderColor: C.success,
    overflow: "hidden",
    marginBottom: 12,
  },

  avatar: {
    width: "100%",
    height: "100%",
  },

  avatarPlaceholder: {
    flex: 1,
    backgroundColor: C.card,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },

  cameraCircle: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: C.bg,
  },

  userName: {
    color: C.text,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 20,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    backgroundColor: C.success + "18",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  warnCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FBBF2414",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FBBF2435",
    width: "100%",
  },

  warnText: {
    color: C.warn,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },

  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: C.border,
    width: "100%",
  },

  roleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  roleCardTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: "700",
  },

  roleCardSub: {
    color: C.sub,
    fontSize: 11,
    marginTop: 2,
  },

  section: {
    alignSelf: "flex-start",
    color: C.muted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 4,
  },

  card: {
    width: "100%",
    backgroundColor: C.card,
    borderRadius: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },

  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  infoLabel: {
    color: C.sub,
    fontSize: 11,
    marginBottom: 2,
  },

  infoValue: {
    color: C.text,
    fontSize: 14,
    fontWeight: "500",
  },

  infoEmpty: {
    color: C.muted,
    fontStyle: "italic",
  },

  expertiseInfoCard: {
    width: "100%",
    backgroundColor: "rgba(249,115,22,0.08)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.25)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },

  expertiseInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  expertiseInfoTitle: {
    color: C.text,
    fontWeight: "800",
    marginLeft: 8,
    fontSize: 13,
  },

  expertiseInfoText: {
    color: C.sub,
    fontSize: 12,
    lineHeight: 18,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },

  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 28,
  },

  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },

  sheetTitle: {
    color: C.text,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 16,
  },

  sheetInput: {
    backgroundColor: C.bg,
    borderRadius: 12,
    color: C.text,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: C.border,
  },

  sheetInputLarge: {
    minHeight: 100,
    textAlignVertical: "top",
  },

  sheetHint: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
  },

  sheetBtns: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  sheetCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: C.bg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },

  sheetSave: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: "center",
  },

  sheetCancelFull: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: C.bg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 12,
  },

  expertiseGrid: {
    gap: 10,
  },

  expertiseOption: {
    backgroundColor: C.bg,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  expertiseOptionActive: {
    borderColor: C.primary,
    backgroundColor: "rgba(249,115,22,0.1)",
  },

  expertiseOptionText: {
    color: C.sub,
    flex: 1,
    fontWeight: "700",
  },
});
