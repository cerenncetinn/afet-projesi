import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS } from "../src/constants/theme";
import { auth } from "../src/firebase/firebaseConfig";

export default function ForgotPassword() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResetPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      Alert.alert("E-posta Gerekli", "Lütfen e-posta adresinizi giriniz.");
      return;
    }

    try {
      setLoading(true);

      await sendPasswordResetEmail(auth, cleanEmail);

      setSent(true);
    } catch (error) {
      console.log("Şifre sıfırlama hatası:", error.code, error.message);

      let message = "Şifre sıfırlama bağlantısı gönderilemedi.";

      if (error.code === "auth/invalid-email") {
        message = "Lütfen geçerli bir e-posta adresi giriniz.";
      }

      if (error.code === "auth/user-not-found") {
        message = "Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.";
      }

      if (error.code === "auth/too-many-requests") {
        message =
          "Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.";
      }

      Alert.alert("Hata", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#0F172A", "#1E293B", "#082F49"]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={28} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.headerArea}>
            <View style={styles.logoCircle}>
              <Ionicons
                name={sent ? "mail-open-outline" : "lock-closed-outline"}
                size={44}
                color="#38BDF8"
              />
            </View>

            <Text style={styles.title}>
              {sent ? "Bağlantı Gönderildi" : "Şifrenizi mi unuttunuz?"}
            </Text>

            <Text style={styles.subtitle}>
              {sent
                ? "Şifre sıfırlama bağlantısını e-posta adresinize gönderdik."
                : "E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim."}
            </Text>
          </View>

          <View style={styles.card}>
            {!sent ? (
              <>
                <Text style={styles.inputLabel}>E-posta Adresiniz</Text>

                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#64748B" />

                  <TextInput
                    placeholder="eposta@adresiniz.com"
                    placeholderTextColor="#64748B"
                    style={styles.inputField}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <View style={styles.buttonInner}>
                      <Text style={styles.submitButtonText}>
                        Sıfırlama Bağlantısı Gönder
                      </Text>
                      <Ionicons
                        name="send-outline"
                        size={19}
                        color="white"
                        style={{ marginLeft: 8 }}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.successBox}>
                  <Ionicons name="checkmark-circle" size={54} color="#22C55E" />

                  <Text style={styles.successTitle}>
                    E-postanızı kontrol edin
                  </Text>

                  <Text style={styles.successText}>
                    Gelen kutunuzu ve spam klasörünüzü kontrol edin. Bağlantı
                    üzerinden yeni şifrenizi belirleyebilirsiniz.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={() => router.replace("/login")}
                >
                  <Text style={styles.submitButtonText}>
                    Giriş Ekranına Dön
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    setSent(false);
                    setEmail("");
                  }}
                >
                  <Text style={styles.secondaryButtonText}>
                    Farklı e-posta dene
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    padding: 25,
    justifyContent: "center",
  },
  topBar: {
    position: "absolute",
    top: 20,
    left: 25,
    zIndex: 10,
  },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  headerArea: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "rgba(56,189,248,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: {
    color: "white",
    fontSize: 25,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
  },
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  inputLabel: {
    color: "#94A3B8",
    fontSize: 14,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    backgroundColor: "#0F172A",
    borderRadius: 12,
    alignItems: "center",
    paddingHorizontal: 15,
    height: 55,
  },
  inputField: {
    flex: 1,
    color: "white",
    marginLeft: 10,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "900",
  },
  successBox: {
    alignItems: "center",
    paddingVertical: 8,
  },
  successTitle: {
    color: "white",
    fontSize: 19,
    fontWeight: "900",
    marginTop: 12,
  },
  successText: {
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 21,
    marginTop: 8,
    fontSize: 13,
  },
  secondaryButton: {
    padding: 14,
    alignItems: "center",
    marginTop: 10,
  },
  secondaryButtonText: {
    color: "#94A3B8",
    fontWeight: "800",
  },
});
