import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS } from "../src/constants/theme";
import { auth, db } from "../src/firebase/firebaseConfig";

const { width } = Dimensions.get("window");

const USER_CACHE_KEY = "cached_logged_user";

export default function CustomSplash() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Splash biraz görünsün diye küçük gecikme
      setTimeout(async () => {
        try {
          if (!user) {
            router.replace("/login");
            return;
          }

          let userData = null;

          try {
            const userDoc = await getDoc(doc(db, "users", user.uid));

            if (userDoc.exists()) {
              userData = {
                uid: user.uid,
                email: user.email,
                ...userDoc.data(),
              };

              await AsyncStorage.setItem(
                USER_CACHE_KEY,
                JSON.stringify(userData),
              );
            }
          } catch (firestoreError) {
            console.log("Kullanıcı verisi online alınamadı:", firestoreError);

            const cachedUser = await AsyncStorage.getItem(USER_CACHE_KEY);

            if (cachedUser) {
              userData = JSON.parse(cachedUser);
            }
          }

          if (!userData) {
            router.replace("/login");
            return;
          }

          const role = userData.role;

          if (role === "gonullu") {
            router.replace("/gonullu/operasyonHaritasi");
          } else {
            router.replace("/afetzede/afetzedePaneli");
          }
        } catch (error) {
          console.log("Oturum kontrol hatası:", error);
          router.replace("/login");
        }
      }, 1500);
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0F172A", "#1E293B", "#082F49"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.content}>
        <View style={styles.logoOuterContainer}>
          <View style={styles.logoFrame}>
            <Image
              source={require("../assets/afet_yonetimi_logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title}>AFET YÖNETİMİ</Text>
            <View style={styles.divider} />
            <Text style={styles.subtitle}>Akıllı Kaynak Yönetimi</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Oturum Kontrol Ediliyor...</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 50,
  },

  logoOuterContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  logoFrame: {
    width: width * 0.6,
    height: width * 0.6,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },

  logo: {
    width: "100%",
    height: "100%",
  },

  textContainer: {
    alignItems: "center",
    marginTop: 30,
  },

  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 2,
    textAlign: "center",
  },

  divider: {
    height: 3,
    width: 50,
    backgroundColor: "#38BDF8",
    marginVertical: 10,
    borderRadius: 2,
  },

  subtitle: {
    fontSize: 14,
    color: "#94A3B8",
    letterSpacing: 3,
    textTransform: "uppercase",
    fontWeight: "600",
  },

  footer: {
    alignItems: "center",
    marginBottom: 20,
  },

  loadingText: {
    color: "#64748B",
    marginTop: 15,
    fontSize: 12,
    letterSpacing: 1,
  },
});
