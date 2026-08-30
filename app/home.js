import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");

export default function Welcome() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#0F172A", "#1E293B", "#082F49"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Ana İçerik Alanı */}
      <View style={styles.mainContent}>
        {/* Üst Bar */}
        <View style={styles.topBar}>
          <View style={styles.logoSection}>
            <View style={styles.logoSquare}>
              <Ionicons name="medical" size={20} color="white" />
            </View>
            <Text style={styles.logoText}>AF Yardım</Text>
          </View>
          <View style={styles.topIcons}>
            <Ionicons
              name="globe-outline"
              size={24}
              color="#94A3B8"
              style={{ marginRight: 15 }}
            />
            <Ionicons name="notifications-outline" size={24} color="#94A3B8" />
          </View>
        </View>

        {/* Rozetler Bölümü */}
        <View style={styles.badgeSection}>
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>⚕️ İLK YARDIM</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🏠 BARINMA</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🍴 GIDA</Text>
            </View>
          </View>
        </View>

        {/* Başlık ve Açıklama */}
        <View style={styles.textContent}>
          <Text style={styles.mainTitle}>
            Saniyelerin Kritik Olduğu Anlarda Güçlü Koordinasyon
          </Text>
          <Text style={styles.description}>
            Afetzedeler, gönüllüler ve kurumlar arasında yapay zeka destekli,
            hızlı ve güvenli iletişim ağı.
          </Text>
        </View>

        {/* Esnek Boşluk (İçeriği yukarıda, butonları aşağıda tutar) */}
        <View style={{ flex: 1 }} />

        {/* Butonlar Grubu (Aşağıya Çekildi) */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => router.push("/register")}
          >
            <Ionicons
              name="person-add-outline"
              size={20}
              color="white"
              style={{ marginRight: 10 }}
            />
            <Text style={styles.buttonText}>Hemen Başla / Kayıt Ol</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/login")}
          >
            <Ionicons
              name="log-in-outline"
              size={22}
              color="white"
              style={{ marginRight: 10 }}
            />
            <Text style={styles.buttonText}>Giriş Yap</Text>
          </TouchableOpacity>

          {/* Alt Simgeler (En Alta Alındı) */}
          <View style={styles.footerFeatures}>
            <View style={styles.featureItem}>
              <Ionicons name="flash-outline" size={22} color="#38BDF8" />
              <Text style={styles.featureText}>HIZLI İHBAR</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="git-network-outline" size={22} color="#38BDF8" />
              <Text style={styles.featureText}>AKILLI EŞLEŞTİRME</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="shield-check-outline" size={22} color="#38BDF8" />
              <Text style={styles.featureText}>GÜVENLİ VERİ</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainContent: { flex: 1, paddingHorizontal: 25, paddingVertical: 10 },

  // Üst Bar
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  logoSection: { flexDirection: "row", alignItems: "center" },
  logoSquare: {
    backgroundColor: "#0369A1",
    padding: 8,
    borderRadius: 10,
    marginRight: 10,
  },
  logoText: { color: "white", fontSize: 18, fontWeight: "bold" },
  topIcons: { flexDirection: "row" },

  // Orta Bölüm
  badgeSection: { marginTop: height * 0.08, marginBottom: 20 },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  badge: {
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 5,
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.5)",
  },
  badgeText: { color: "#38BDF8", fontSize: 11, fontWeight: "700" },

  // Yazı Alanı
  textContent: { marginTop: 10 },
  mainTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 36,
  },
  description: {
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 15,
    fontSize: 15,
    lineHeight: 22,
  },

  // Alt Bölüm (Butonlar ve Özellikler)
  bottomSection: { marginBottom: 20 },
  registerButton: {
    backgroundColor: "#0369A1",
    flexDirection: "row",
    height: 60,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    elevation: 4,
  },
  loginButton: {
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    flexDirection: "row",
    height: 60,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 1)",
    marginBottom: 30,
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },

  // Footer Simgeleri
  footerFeatures: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
  },
  featureItem: { alignItems: "center", flex: 1 },
  featureText: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "bold",
    marginTop: 8,
    textAlign: "center",
  },
});
