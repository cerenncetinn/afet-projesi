import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Firebase
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../src/firebase/firebaseConfig";

// Styles
import { styles } from "../src/styles/registerStyles";

const BLOOD_TYPES = [
  "A Rh+",
  "A Rh-",
  "B Rh+",
  "B Rh-",
  "AB Rh+",
  "AB Rh-",
  "0 Rh+",
  "0 Rh-",
];

const EXPERTISE_OPTIONS = [
  {
    label: "Sağlık",
    icon: "medical-outline",
    placeholder: "Örn: Hemşire, doktor, paramedik, ilk yardım sertifikası",
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

const unformatPhoneNumber = (text) => onlyDigits(text || "");

const validateTcNo = (value) => {
  const tc = onlyDigits(value || "");

  if (tc.length !== 11) {
    return {
      valid: false,
      message: "T.C. kimlik numarası 11 haneli olmalıdır.",
    };
  }

  if (tc[0] === "0") {
    return {
      valid: false,
      message: "T.C. kimlik numarası 0 ile başlayamaz.",
    };
  }

  const lastDigit = Number(tc[10]);

  if (lastDigit % 2 !== 0) {
    return {
      valid: false,
      message: "T.C. kimlik numarasının son hanesi çift olmalıdır.",
    };
  }

  return {
    valid: true,
    message: "",
  };
};

const RenderInput = ({
  label,
  icon,
  placeholder,
  value,
  onChangeText,
  secure = false,
  keyboard = "default",
  maxLength,
  showPassword,
  setShowPassword,
  multiline = false,
}) => (
  <View style={{ marginBottom: 15 }}>
    {label ? <Text style={styles.inputLabel}>{label}</Text> : null}

    <View
      style={[
        styles.inputWrapper,
        multiline && {
          height: 95,
          alignItems: "flex-start",
          paddingTop: 14,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color="#64748B"
        style={{ marginLeft: 15, marginTop: multiline ? 2 : 0 }}
      />

      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#64748B"
        style={[
          styles.inputField,
          multiline && {
            height: 75,
            textAlignVertical: "top",
            paddingTop: 0,
          },
        ]}
        value={value}
        onChangeText={(text) => {
          if (keyboard === "phone-pad") {
            onChangeText(formatPhoneNumber(text));
            return;
          }

          const filtered =
            keyboard === "number-pad" ? text.replace(/[^0-9]/g, "") : text;

          onChangeText(filtered);
        }}
        secureTextEntry={secure && !showPassword}
        keyboardType={keyboard}
        maxLength={maxLength}
        autoCapitalize="none"
        multiline={multiline}
      />

      {secure && (
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={{ marginRight: 15 }}
        >
          <Ionicons
            name={showPassword ? "eye" : "eye-off"}
            size={20}
            color="#64748B"
          />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

export default function Register() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("magdur");
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [phone, setPhone] = useState("");
  const [tcNo, setTcNo] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  const [expertice, setExpertice] = useState("");
  const [experticeDetail, setExperticeDetail] = useState("");

  const [address, setAddress] = useState("Konum alınıyor...");
  const [locationCoords, setLocationCoords] = useState(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [isBloodModalVisible, setIsBloodModalVisible] = useState(false);

  const changeRole = (newRole) => {
    setRole(newRole);

    setName("");
    setEmail("");
    setPassword("");
    setPhone("");

    setTcNo("");
    setBloodType("");
    setEmergencyPhone("");

    setExpertice("");
    setExperticeDetail("");
  };

  const handleGetLocation = async () => {
    setIsLocationLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setAddress("Konum izni reddedildi");
        setIsLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocationCoords(location.coords);

      const reverse = await Location.reverseGeocodeAsync(location.coords);

      if (reverse.length > 0) {
        const district = reverse[0].district || reverse[0].subregion || "";
        const city = reverse[0].city || reverse[0].region || "";
        setAddress(`${district}, ${city}`);
      }
    } catch (e) {
      setAddress("Konum alınamadı");
    } finally {
      setIsLocationLoading(false);
    }
  };

  useEffect(() => {
    handleGetLocation();
  }, []);

  const getPasswordStrength = () => {
    if (password.length === 0) return { color: "transparent", label: "" };
    if (password.length < 6) return { color: "#EF4444", label: "Zayıf Şifre" };
    if (password.length < 10) return { color: "#F97316", label: "Orta Seviye" };
    return { color: "#22C55E", label: "Güçlü Şifre" };
  };

  const strength = getPasswordStrength();

  const handleRegister = async () => {
    const cleanPhone = unformatPhoneNumber(phone);
    const cleanEmergencyPhone = unformatPhoneNumber(emergencyPhone);
    const cleanTcNo = onlyDigits(tcNo);

    if (!email || !password || !name) {
      Alert.alert(
        "Eksik Bilgi",
        "Lütfen ad soyad, e-posta ve şifre alanlarını doldurunuz.",
      );
      return;
    }

    if (!cleanPhone) {
      Alert.alert("Eksik Bilgi", "Lütfen iletişim numaranızı giriniz.");
      return;
    }

    if (cleanPhone.length !== 11) {
      Alert.alert("Geçersiz Telefon", "Telefon numarası 11 haneli olmalıdır.");
      return;
    }

    if (!cleanPhone.startsWith("05")) {
      Alert.alert("Geçersiz Telefon", "Telefon numarası 05 ile başlamalıdır.");
      return;
    }

    if (cleanEmergencyPhone && cleanEmergencyPhone.length !== 11) {
      Alert.alert(
        "Geçersiz Telefon",
        "Acil durum yakını numarası 11 haneli olmalıdır.",
      );
      return;
    }

    if (cleanEmergencyPhone && !cleanEmergencyPhone.startsWith("05")) {
      Alert.alert(
        "Geçersiz Telefon",
        "Acil durum yakını numarası 05 ile başlamalıdır.",
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert("Zayıf Şifre", "Şifre en az 6 karakter olmalıdır.");
      return;
    }

    if (role === "magdur") {
      const tcValidation = validateTcNo(cleanTcNo);

      if (!tcValidation.valid) {
        Alert.alert("Geçersiz T.C. Kimlik Numarası", tcValidation.message);
        return;
      }
    }

    if (role === "gonullu" && !expertice) {
      Alert.alert("Eksik Bilgi", "Lütfen uzmanlık alanınızı seçiniz.");
      return;
    }

    setLoading(true);

    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );

      const userData = {
        uid: user.uid,
        name: name.trim(),
        email: email.toLowerCase().trim(),

        phone: cleanPhone,
        phoneFormatted: phone,

        role,
        createdAt: new Date(),

        ...(role === "magdur" && {
          tcNo: cleanTcNo,
          bloodType,
          emergencyPhone: cleanEmergencyPhone,
          emergencyPhoneFormatted: emergencyPhone,
          address,
          location: locationCoords,
        }),

        ...(role === "gonullu" && {
          expertice,
          experticeDetail: experticeDetail.trim(),
          completedTaskCount: 0,
          activeTaskCount: 0,
          volunteerScore: 0,
        }),
      };

      await setDoc(doc(db, "users", user.uid), userData);

      Alert.alert("Başarılı", "Kaydınız oluşturuldu.");
      router.replace("/login");
    } catch (error) {
      let message = "Kayıt işlemi başarısız.";

      if (error.code === "auth/email-already-in-use") {
        message = "Bu e-posta adresi zaten kullanılıyor.";
      }

      if (error.code === "auth/invalid-email") {
        message = "Geçerli bir e-posta adresi giriniz.";
      }

      if (error.code === "auth/weak-password") {
        message = "Şifre en az 6 karakter olmalıdır.";
      }

      if (error.code === "auth/network-request-failed") {
        message = "Kayıt olmak için internet bağlantısı gerekir.";
      }

      Alert.alert("Hata", message);
    } finally {
      setLoading(false);
    }
  };

  const selectedExpertise = EXPERTISE_OPTIONS.find(
    (item) => item.label === expertice,
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={26} color="white" />
            </TouchableOpacity>

            <Text style={styles.headerText}>
              Kayıt ol - {role === "magdur" ? "Afetzede" : "Gönüllü"}
            </Text>
          </View>

          <View style={styles.roleSelector}>
            {["magdur", "gonullu"].map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => changeRole(r)}
                style={[styles.roleButton, role === r && styles.activeButton]}
              >
                <Text style={styles.roleButtonText}>
                  {r === "magdur" ? "Afetzede" : "Gönüllü"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {role === "magdur" && (
            <View key="m-form">
              <RenderInput
                label="Ad Soyad"
                icon="person-outline"
                placeholder="Adınızı ve soyadınızı giriniz"
                value={name}
                onChangeText={setName}
              />

              <RenderInput
                label="T.C. Kimlik No"
                icon="card-outline"
                placeholder="11 haneli T.C. kimlik numaranız"
                value={tcNo}
                onChangeText={setTcNo}
                keyboard="number-pad"
                maxLength={11}
              />

              <Text style={styles.inputLabel}>Mevcut Konum</Text>

              <TouchableOpacity
                style={styles.inputWrapper}
                onPress={handleGetLocation}
              >
                <Ionicons
                  name="map-outline"
                  size={20}
                  color="#64748B"
                  style={{ marginLeft: 15 }}
                />

                <View style={{ flex: 1, paddingLeft: 10 }}>
                  <Text
                    style={{
                      color: locationCoords ? "#38BDF8" : "#EF4444",
                      fontWeight: "600",
                    }}
                  >
                    {isLocationLoading ? "Konum belirleniyor..." : address}
                  </Text>
                </View>

                <Ionicons
                  name="locate"
                  size={20}
                  color={locationCoords ? "#38BDF8" : "#64748B"}
                  style={{ marginRight: 15 }}
                />
              </TouchableOpacity>

              <RenderInput
                label="İletişim Numaranız"
                icon="call-outline"
                placeholder="05XX XXX XX XX"
                value={phone}
                onChangeText={setPhone}
                keyboard="phone-pad"
                maxLength={14}
              />

              <RenderInput
                label="Acil Durum Yakını Numarası (Opsiyonel)"
                icon="people-outline"
                placeholder="05XX XXX XX XX"
                value={emergencyPhone}
                onChangeText={setEmergencyPhone}
                keyboard="phone-pad"
                maxLength={14}
              />

              <Text style={styles.inputLabel}>Kan Grubu</Text>

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.inputWrapper}
                onPress={() => setIsBloodModalVisible(true)}
              >
                <Ionicons
                  name="water-outline"
                  size={20}
                  color="#64748B"
                  style={{ marginLeft: 15 }}
                />

                <Text
                  style={{
                    flex: 1,
                    color: bloodType ? "white" : "#64748B",
                    paddingLeft: 10,
                  }}
                >
                  {bloodType || "Kan grubunuzu seçiniz"}
                </Text>

                <Ionicons
                  name="chevron-down"
                  size={18}
                  color="#64748B"
                  style={{ marginRight: 15 }}
                />
              </TouchableOpacity>
            </View>
          )}

          {role === "gonullu" && (
            <View key="g-form">
              <RenderInput
                label="Ad Soyad"
                icon="person-outline"
                placeholder="Adınızı ve soyadınızı giriniz"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.inputLabel}>Uzmanlık Alanı</Text>

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 10,
                  marginBottom: 15,
                }}
              >
                {EXPERTISE_OPTIONS.map((item) => {
                  const active = expertice === item.label;

                  return (
                    <TouchableOpacity
                      key={item.label}
                      onPress={() => {
                        setExpertice(item.label);
                        setExperticeDetail("");
                      }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: active ? "#F97316" : "#334155",
                        backgroundColor: active
                          ? "rgba(249,115,22,0.15)"
                          : "#1E293B",
                      }}
                    >
                      <Ionicons
                        name={item.icon}
                        size={16}
                        color={active ? "#F97316" : "#94A3B8"}
                      />

                      <Text
                        style={{
                          color: active ? "#F97316" : "#94A3B8",
                          fontWeight: active ? "800" : "500",
                          fontSize: 13,
                        }}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedExpertise && (
                <View
                  style={{
                    backgroundColor: "rgba(56,189,248,0.08)",
                    borderWidth: 1,
                    borderColor: "rgba(56,189,248,0.25)",
                    borderRadius: 16,
                    padding: 14,
                    marginBottom: 15,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <Ionicons
                      name="chatbubble-ellipses-outline"
                      size={18}
                      color="#38BDF8"
                    />

                    <Text
                      style={{
                        color: "#E2E8F0",
                        fontWeight: "800",
                        marginLeft: 8,
                      }}
                    >
                      Uzmanlığınızı biraz açın
                    </Text>
                  </View>

                  <RenderInput
                    label=""
                    icon="create-outline"
                    placeholder={selectedExpertise.placeholder}
                    value={experticeDetail}
                    onChangeText={setExperticeDetail}
                    multiline
                  />

                  <Text
                    style={{
                      color: "#64748B",
                      fontSize: 11,
                      lineHeight: 16,
                      marginTop: -6,
                    }}
                  >
                    Bu bilgi, görevlerin size daha doğru önerilmesi için
                    kullanılacak.
                  </Text>
                </View>
              )}

              <RenderInput
                label="İletişim Numaranız"
                icon="call-outline"
                placeholder="05XX XXX XX XX"
                value={phone}
                onChangeText={setPhone}
                keyboard="phone-pad"
                maxLength={14}
              />
            </View>
          )}

          <RenderInput
            label="E-posta Adresi"
            icon="mail-outline"
            placeholder="ornek@email.com"
            value={email}
            onChangeText={setEmail}
            keyboard="email-address"
          />

          <View>
            <RenderInput
              label="Şifre Belirleyin"
              icon="lock-closed-outline"
              placeholder="En az 6 karakterli bir şifre"
              value={password}
              onChangeText={setPassword}
              secure
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />

            {password.length > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: -10,
                  marginBottom: 20,
                  paddingHorizontal: 5,
                }}
              >
                <View
                  style={{
                    height: 4,
                    flex: 1,
                    backgroundColor: "#334155",
                    borderRadius: 2,
                    marginRight: 10,
                  }}
                >
                  <View
                    style={{
                      height: 4,
                      width:
                        password.length > 10
                          ? "100%"
                          : password.length > 5
                            ? "60%"
                            : "30%",
                      backgroundColor: strength.color,
                      borderRadius: 2,
                    }}
                  />
                </View>

                <Text
                  style={{
                    color: strength.color,
                    fontSize: 10,
                    fontWeight: "bold",
                  }}
                >
                  {strength.label}
                </Text>
              </View>
            )}
          </View>

          <View
            style={{ marginTop: 10, marginBottom: 20, paddingHorizontal: 10 }}
          >
            <Text
              style={{
                color: "#94A3B8",
                fontSize: 11,
                textAlign: "center",
                lineHeight: 18,
              }}
            >
              Kayıt işlemini tamamlayarak{" "}
              <Text style={{ color: "#38BDF8", fontWeight: "bold" }}>
                Kullanım Koşulları
              </Text>{" "}
              ve{" "}
              <Text style={{ color: "#38BDF8", fontWeight: "bold" }}>
                KVKK Aydınlatma Metni
              </Text>
              'ni okuduğunuzu beyan etmiş olursunuz.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Kayıt Olmayı Tamamla</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={isBloodModalVisible} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.8)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#1E293B",
              borderTopLeftRadius: 25,
              borderTopRightRadius: 25,
              padding: 20,
              maxHeight: "50%",
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: 15,
                textAlign: "center",
              }}
            >
              Kan Grubu Seçiniz
            </Text>

            <FlatList
              data={BLOOD_TYPES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    padding: 15,
                    borderBottomWidth: 1,
                    borderBottomColor: "#334155",
                  }}
                  onPress={() => {
                    setBloodType(item);
                    setIsBloodModalVisible(false);
                  }}
                >
                  <Text style={{ color: "white", fontSize: 16 }}>{item}</Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              onPress={() => setIsBloodModalVisible(false)}
              style={{ marginTop: 10, padding: 15, alignItems: "center" }}
            >
              <Text style={{ color: "#EF4444", fontWeight: "bold" }}>
                İptal
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
