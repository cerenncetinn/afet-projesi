import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
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

const BLOOD_GROUPS = [
  { type: "A", rh: "+", label: "A Rh+", color: "#EF4444" },
  { type: "A", rh: "-", label: "A Rh-", color: "#EF4444" },
  { type: "B", rh: "+", label: "B Rh+", color: "#3B82F6" },
  { type: "B", rh: "-", label: "B Rh-", color: "#3B82F6" },
  { type: "AB", rh: "+", label: "AB Rh+", color: "#8B5CF6" },
  { type: "AB", rh: "-", label: "AB Rh-", color: "#8B5CF6" },
  { type: "0", rh: "+", label: "0 Rh+", color: "#22C55E" },
  { type: "0", rh: "-", label: "0 Rh-", color: "#22C55E" },
];

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

const SCREEN_H = Dimensions.get("window").height;

const onlyDigits = (text) => (text || "").replace(/\D/g, "");

const formatPhoneNumber = (text) => {
  const digits = onlyDigits(text).slice(0, 11);

  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  if (digits.length <= 9) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }

  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(
    7,
    9,
  )} ${digits.slice(9, 11)}`;
};

function DraggableSheet({ visible, onClose, children }) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const [mounted, setMounted] = useState(false);
  const closing = useRef(false);

  useEffect(() => {
    if (visible) {
      closing.current = false;
      setMounted(true);

      requestAnimationFrame(() => {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 3,
          speed: 16,
        }).start();
      });

      return;
    }

    if (!visible && mounted && !closing.current) {
      closing.current = true;

      Animated.timing(translateY, {
        toValue: SCREEN_H,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        setMounted(false);
        translateY.setValue(SCREEN_H);
        closing.current = false;
      });
    }
  }, [visible, mounted, translateY]);

  const doClose = () => {
    if (closing.current) return;

    closing.current = true;

    Animated.timing(translateY, {
      toValue: SCREEN_H,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setMounted(false);
      translateY.setValue(SCREEN_H);
      closing.current = false;
      onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 90 || g.vy > 0.4) {
          doClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 5,
          }).start();
        }
      },
    }),
  ).current;

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={doClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "transparent",
        }}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={doClose} />

        <Animated.View
          style={[
            s.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 16) + 8,
              transform: [{ translateY }],
              backgroundColor: C.card,
            },
          ]}
        >
          <View {...panResponder.panHandlers} style={s.dragArea}>
            <View style={s.handle} />
          </View>

          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function BloodTypePicker({ current, onSelect, onSave, onCancel, saving }) {
  const selected = BLOOD_GROUPS.find((b) => b.label === current) || null;

  return (
    <>
      <View style={s.sheetHeader}>
        <View>
          <Text style={s.sheetTitle}>Kan Grubu Seçin</Text>
          <Text style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>
            {selected
              ? `Seçili: ${selected.label} • Kaydet'e basınca güncellenir`
              : "Lütfen kan grubunuzu seçiniz"}
          </Text>
        </View>
      </View>

      {selected && (
        <View
          style={[
            s.bloodPreview,
            {
              borderColor: selected.color + "60",
              backgroundColor: selected.color + "12",
            },
          ]}
        >
          <View
            style={[s.bloodPreviewDot, { backgroundColor: selected.color }]}
          />
          <View style={{ flex: 1 }}>
            <Text style={[s.bloodPreviewType, { color: selected.color }]}>
              {selected.label}
            </Text>
            <Text style={s.bloodPreviewSub}>
              {selected.rh === "+"
                ? "Rh Pozitif — Evrensel alıcı uyumlu"
                : "Rh Negatif — Nadir kan grubu"}
            </Text>
          </View>
          <Ionicons name="checkmark-circle" size={22} color={selected.color} />
        </View>
      )}

      <View style={s.bloodGridNew}>
        {BLOOD_GROUPS.map((b) => {
          const active = current === b.label;

          return (
            <TouchableOpacity
              key={b.label}
              style={[
                s.bloodCardNew,
                active && {
                  borderColor: b.color,
                  backgroundColor: b.color + "18",
                },
              ]}
              onPress={() => onSelect(b.label)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  s.bloodTypeCircle,
                  { backgroundColor: active ? b.color : C.border + "60" },
                ]}
              >
                <Text
                  style={[
                    s.bloodTypeText,
                    { color: active ? "#fff" : C.muted },
                  ]}
                >
                  {b.type}
                </Text>
              </View>

              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text
                  style={[
                    s.bloodCardLabel,
                    { color: active ? b.color : C.text },
                  ]}
                >
                  {b.label}
                </Text>
                <Text style={s.bloodCardRh}>
                  {b.rh === "+" ? "Rh Pozitif" : "Rh Negatif"}
                </Text>
              </View>

              {active ? (
                <Ionicons name="checkmark-circle" size={20} color={b.color} />
              ) : (
                <View style={s.bloodEmptyCircle} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={s.sheetBtns}>
        <TouchableOpacity style={s.sheetCancel} onPress={onCancel}>
          <Text style={{ color: C.muted, fontWeight: "600" }}>İptal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.sheetSave, (!current || saving) && { opacity: 0.6 }]}
          onPress={onSave}
          disabled={!current || saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: "white", fontWeight: "700" }}>Kaydet</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
}

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

export default function ProfileTab() {
  const router = useRouter();
  const navigation = useNavigation();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [bloodModal, setBloodModal] = useState(false);
  const [tempBloodType, setTempBloodType] = useState("");
  const [bloodSaving, setBloodSaving] = useState(false);

  const [volunteerModal, setVolunteerModal] = useState(false);
  const [selectedExpertice, setSelectedExpertice] = useState("");
  const [experticeDetail, setExperticeDetail] = useState("");

  useEffect(() => {
    const parent = navigation.getParent();

    if (editModal || bloodModal || volunteerModal) {
      parent?.setOptions({ tabBarStyle: { display: "none" } });
    } else {
      parent?.setOptions({ tabBarStyle: undefined });
    }

    return () => {
      parent?.setOptions({ tabBarStyle: undefined });
    };
  }, [editModal, bloodModal, volunteerModal, navigation]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsub = onSnapshot(
      doc(db, "users", auth.currentUser.uid),
      (snap) => {
        if (snap.exists()) setUserData(snap.data());
        setLoading(false);
      },
      (error) => {
        if (error.code === "permission-denied") return;
        console.error("Profil dinleme hatası:", error);
        setLoading(false);
      },
    );

    return () => unsub();
  }, []);

  const handleRefreshLocation = async () => {
    setLocLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("İzin", "Konum izni gerekli.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const rev = await Location.reverseGeocodeAsync(loc.coords);

      if (rev.length > 0) {
        const district = rev[0].district || rev[0].subregion || "";
        const city = rev[0].city || rev[0].region || "";
        const addr = [district, city].filter(Boolean).join(", ");

        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          address: addr,
          location: {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          },
        });
      }
    } catch {
      Alert.alert("Hata", "Konum alınamadı.");
    } finally {
      setLocLoading(false);
    }
  };

  const handlePhoto = () => {
    Alert.alert("Profil Fotoğrafı", "Kaynak seçin", [
      { text: "Kamera", onPress: () => pickImage(true) },
      { text: "Galeri", onPress: () => pickImage(false) },
      { text: "İptal", style: "cancel" },
    ]);
  };

  const pickImage = async (cam) => {
    const perm = cam
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (perm.status !== "granted") return;

    const res = cam
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

    if (!res.canceled) {
      setUploading(true);

      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        profileImage: `data:image/jpeg;base64,${res.assets[0].base64}`,
      });

      setUploading(false);
    }
  };

  const openEdit = (field, label, current) => {
    if (field === "bloodType") {
      setTempBloodType(userData?.bloodType || "");
      setBloodModal(true);
      return;
    }

    setEditField(field);
    setEditLabel(label);

    if (field === "phone" || field === "emergencyPhone") {
      setEditValue(formatPhoneNumber(current || ""));
    } else {
      setEditValue(current || "");
    }

    setEditModal(true);
  };

  const saveEdit = async () => {
    if (!editField) return;

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
    } else if (editField === "emergencyPhone") {
      const cleanPhone = onlyDigits(editValue);

      if (
        cleanPhone &&
        (cleanPhone.length !== 11 || !cleanPhone.startsWith("05"))
      ) {
        Alert.alert(
          "Geçersiz Telefon",
          "Acil durum yakını numarası 05 ile başlamalı ve 11 haneli olmalıdır.",
        );
        return;
      }

      await updateDoc(userRef, {
        emergencyPhone: cleanPhone,
        emergencyPhoneFormatted: formatPhoneNumber(cleanPhone),
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
  };

  const saveBlood = async () => {
    if (!tempBloodType) {
      Alert.alert("Eksik Bilgi", "Lütfen bir kan grubu seçiniz.");
      return;
    }

    setBloodSaving(true);

    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        bloodType: tempBloodType,
      });

      setBloodModal(false);
    } catch (error) {
      Alert.alert("Hata", "Kan grubu güncellenemedi. Lütfen tekrar deneyin.");
    } finally {
      setBloodSaving(false);
    }
  };

  const switchToGonullu = () => {
    const hasExpertise = userData?.expertice && userData?.experticeDetail;

    if (hasExpertise) {
      Alert.alert(
        "Gönüllü Moduna Geç",
        `${userData.expertice} / ${userData.experticeDetail} bilgileriyle gönüllü moduna geçmek istiyor musunuz?`,
        [
          { text: "Vazgeç", style: "cancel" },
          {
            text: "Geç",
            onPress: async () => {
              try {
                await updateDoc(doc(db, "users", auth.currentUser.uid), {
                  role: "gonullu",
                });

                router.replace("/gonullu/operasyonHaritasi");
              } catch (error) {
                Alert.alert("Hata", "Gönüllü moduna geçiş yapılamadı.");
              }
            },
          },
        ],
      );

      return;
    }

    setSelectedExpertice(userData?.expertice || "");
    setExperticeDetail(userData?.experticeDetail || "");
    setVolunteerModal(true);
  };

  const completeVolunteerSwitch = async () => {
    if (!selectedExpertice) {
      Alert.alert("Eksik Bilgi", "Lütfen uzmanlık alanınızı seçiniz.");
      return;
    }

    if (!experticeDetail.trim()) {
      Alert.alert(
        "Eksik Bilgi",
        "Lütfen detaylı yetkinliğinizi yazınız. Örn: Doktor, hemşire, araç kullanımı.",
      );
      return;
    }

    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        role: "gonullu",
        expertice: selectedExpertice,
        experticeDetail: experticeDetail.trim(),
        completedTaskCount: userData?.completedTaskCount || 0,
        activeTaskCount: userData?.activeTaskCount || 0,
        volunteerScore: userData?.volunteerScore || 0,
      });

      setVolunteerModal(false);
      router.replace("/gonullu/operasyonHaritasi");
    } catch (error) {
      Alert.alert("Hata", "Gönüllü moduna geçiş yapılamadı.");
    }
  };

  const handleLogout = () => {
    Alert.alert("Çıkış Yap", "Emin misiniz?", [
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

  const emergencyPhoneDisplay =
    userData?.emergencyPhoneFormatted ||
    formatPhoneNumber(userData?.emergencyPhone || "");

  const incomplete =
    !userData?.phone ||
    !userData?.bloodType ||
    !userData?.address ||
    !userData?.emergencyPhone ||
    !userData?.tcNo;

  const selectedExpertiseOption = EXPERTISE_OPTIONS.find(
    (item) => item.label === selectedExpertice,
  );

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

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
            <Text style={[s.badgeText, { color: C.primary }]}>AFETZEDE</Text>
          </View>

          {incomplete && (
            <View style={s.warnCard}>
              <Ionicons name="alert-circle-outline" size={17} color={C.warn} />
              <Text style={s.warnText}>
                Kimlik doğrulama ve acil durum koordinasyonu için lütfen eksik
                profil bilgilerinizi tamamlayın.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={s.roleCard}
            onPress={switchToGonullu}
            activeOpacity={0.8}
          >
            <View
              style={[s.roleIconWrap, { backgroundColor: C.success + "18" }]}
            >
              <Ionicons name="heart-outline" size={20} color={C.success} />
            </View>

            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={s.roleCardTitle}>Gönüllü Moduna Geç</Text>
              <Text style={s.roleCardSub}>
                Uzmanlık bilgilerinizi girerek yardım ekiplerine katılın
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
              icon="card-outline"
              label="T.C. Kimlik Numarası"
              value={
                userData?.tcNo ? `••••••• ${userData.tcNo.slice(-4)}` : null
              }
              onEdit={() =>
                openEdit("tcNo", "T.C. Kimlik Numarası", userData?.tcNo)
              }
            />

            <InfoRow
              icon="call-outline"
              label="Telefon"
              value={phoneDisplay}
              onEdit={() => openEdit("phone", "Telefon", userData?.phone)}
            />

            <InfoRow
              icon="water-outline"
              label="Kan Grubu"
              value={userData?.bloodType}
              onEdit={() =>
                openEdit("bloodType", "Kan Grubu", userData?.bloodType)
              }
              color={C.danger}
            />

            <InfoRow
              icon="people-outline"
              label="Acil Durum Yakını"
              value={emergencyPhoneDisplay}
              onEdit={() =>
                openEdit(
                  "emergencyPhone",
                  "Acil Durum Yakını",
                  userData?.emergencyPhone,
                )
              }
              isLast
            />
          </View>

          <Text style={s.section}>KONUM</Text>

          <View style={s.card}>
            <View style={[s.infoRow, { borderBottomWidth: 0 }]}>
              <View
                style={[s.iconCircle, { backgroundColor: C.primary + "18" }]}
              >
                <Ionicons name="location-outline" size={17} color={C.primary} />
              </View>

              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={s.infoLabel}>Son Bildirilen Adres</Text>
                <Text style={[s.infoValue, !userData?.address && s.infoEmpty]}>
                  {userData?.address || "Belirtilmemiş"}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleRefreshLocation}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                disabled={locLoading}
              >
                {locLoading ? (
                  <ActivityIndicator size="small" color={C.primary} />
                ) : (
                  <Ionicons name="locate" size={17} color={C.primary} />
                )}
              </TouchableOpacity>
            </View>
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

      <DraggableSheet visible={editModal} onClose={() => setEditModal(false)}>
        <View style={s.sheetHeader}>
          <Text style={s.sheetTitle}>{editLabel}</Text>
        </View>

        <TextInput
          style={s.sheetInput}
          value={editValue}
          onChangeText={(text) => {
            if (editField === "phone" || editField === "emergencyPhone") {
              setEditValue(formatPhoneNumber(text));
            } else if (editField === "tcNo") {
              setEditValue(onlyDigits(text).slice(0, 11));
            } else {
              setEditValue(text);
            }
          }}
          placeholderTextColor={C.muted}
          keyboardType={
            editField === "phone" ||
            editField === "emergencyPhone" ||
            editField === "tcNo"
              ? "number-pad"
              : "default"
          }
          maxLength={
            editField === "phone" || editField === "emergencyPhone"
              ? 14
              : editField === "tcNo"
                ? 11
                : undefined
          }
          autoFocus
        />

        <View style={s.sheetBtns}>
          <TouchableOpacity
            style={s.sheetCancel}
            onPress={() => setEditModal(false)}
          >
            <Text style={{ color: C.muted, fontWeight: "600" }}>İptal</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.sheetSave} onPress={saveEdit}>
            <Text style={{ color: "white", fontWeight: "700" }}>Kaydet</Text>
          </TouchableOpacity>
        </View>
      </DraggableSheet>

      <DraggableSheet
        visible={bloodModal}
        onClose={() => {
          setBloodModal(false);
          setTempBloodType(userData?.bloodType || "");
        }}
      >
        <BloodTypePicker
          current={tempBloodType}
          onSelect={setTempBloodType}
          onSave={saveBlood}
          onCancel={() => {
            setBloodModal(false);
            setTempBloodType(userData?.bloodType || "");
          }}
          saving={bloodSaving}
        />
      </DraggableSheet>

      <DraggableSheet
        visible={volunteerModal}
        onClose={() => setVolunteerModal(false)}
      >
        <View style={s.sheetHeader}>
          <View>
            <Text style={s.sheetTitle}>Gönüllü Bilgileri</Text>
            <Text style={s.sheetSubtitle}>
              Size uygun görevlerin önerilmesi için uzmanlık alanınızı seçin.
            </Text>
          </View>
        </View>

        <View style={s.expertiseGrid}>
          {EXPERTISE_OPTIONS.map((item) => {
            const active = selectedExpertice === item.label;

            return (
              <TouchableOpacity
                key={item.label}
                style={[s.expertiseOption, active && s.expertiseOptionActive]}
                onPress={() => {
                  setSelectedExpertice(item.label);
                  setExperticeDetail("");
                }}
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

        {selectedExpertice ? (
          <View style={s.volunteerDetailBox}>
            <Text style={s.volunteerDetailLabel}>Detaylı Yetkinlik</Text>

            <TextInput
              style={s.volunteerDetailInput}
              value={experticeDetail}
              onChangeText={setExperticeDetail}
              placeholder={
                selectedExpertiseOption?.placeholder ||
                "Örn: saha desteği, ilk yardım, araç kullanımı"
              }
              placeholderTextColor={C.muted}
              multiline
            />

            <Text style={s.volunteerHint}>
              Örnek: Doktor, hemşire, paramedik, araç kullanımı, lojistik
              koordinasyon.
            </Text>
          </View>
        ) : null}

        <View style={s.sheetBtns}>
          <TouchableOpacity
            style={s.sheetCancel}
            onPress={() => setVolunteerModal(false)}
          >
            <Text style={{ color: C.muted, fontWeight: "600" }}>Vazgeç</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.sheetSave}
            onPress={completeVolunteerSwitch}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>
              Gönüllü Moduna Geç
            </Text>
          </TouchableOpacity>
        </View>
      </DraggableSheet>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  centered: { justifyContent: "center", alignItems: "center" },

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
    borderColor: C.primary,
    overflow: "hidden",
    marginBottom: 12,
  },

  avatar: { width: "100%", height: "100%" },

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
    backgroundColor: C.primary + "18",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 20,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
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

  warnText: { color: C.warn, fontSize: 12, lineHeight: 18, flex: 1 },

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

  roleCardTitle: { color: C.text, fontSize: 14, fontWeight: "700" },
  roleCardSub: { color: C.sub, fontSize: 11, marginTop: 2 },

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

  infoLabel: { color: C.sub, fontSize: 11, marginBottom: 2 },
  infoValue: { color: C.text, fontSize: 14, fontWeight: "500" },
  infoEmpty: { color: C.muted, fontStyle: "italic" },

  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },

  dragArea: {
    paddingTop: 12,
    paddingBottom: 14,
    marginTop: -12,
    alignItems: "center",
  },

  handle: {
    width: 40,
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    marginBottom: 8,
  },

  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  sheetTitle: { color: C.text, fontSize: 17, fontWeight: "700" },

  sheetSubtitle: {
    color: C.muted,
    fontSize: 11,
    marginTop: 3,
    lineHeight: 16,
  },

  sheetInput: {
    backgroundColor: C.bg,
    borderRadius: 12,
    color: C.text,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },

  sheetBtns: { flexDirection: "row", gap: 10 },

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

  bloodGridNew: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },

  bloodCardNew: {
    width: "47.5%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.bg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: C.border,
  },

  bloodTypeCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  bloodTypeText: { fontSize: 13, fontWeight: "800" },
  bloodCardLabel: { fontSize: 13, fontWeight: "700" },
  bloodCardRh: { color: C.muted, fontSize: 10, marginTop: 1 },

  bloodEmptyCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.border,
  },

  bloodPreview: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 14,
    gap: 10,
  },

  bloodPreviewDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  bloodPreviewType: { fontSize: 16, fontWeight: "800" },
  bloodPreviewSub: { color: C.muted, fontSize: 11, marginTop: 2 },

  expertiseGrid: {
    gap: 10,
    marginBottom: 14,
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

  volunteerDetailBox: {
    backgroundColor: "rgba(56,189,248,0.08)",
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.25)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },

  volunteerDetailLabel: {
    color: C.text,
    fontWeight: "800",
    fontSize: 13,
    marginBottom: 8,
  },

  volunteerDetailInput: {
    minHeight: 90,
    backgroundColor: C.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    color: C.text,
    textAlignVertical: "top",
  },

  volunteerHint: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
  },
});
