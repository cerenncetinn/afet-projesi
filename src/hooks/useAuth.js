import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useState } from "react";
import { Alert } from "react-native";

import { auth, db } from "../firebase/firebaseConfig";

const USER_CACHE_KEY = "cached_logged_user";

export const useAuth = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    if (!email || !password) {
      Alert.alert("Hata", "Lütfen email ve şifrenizi giriniz.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );

      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        Alert.alert("Hata", "Kullanıcı verisi bulunamadı.");
        return;
      }

      const userData = userDoc.data();
      const userRole = userData.role;

      await AsyncStorage.setItem(
        USER_CACHE_KEY,
        JSON.stringify({
          uid: user.uid,
          email: user.email,
          ...userData,
        }),
      );

      Alert.alert("Giriş Başarılı", `Hoş geldiniz, ${userData.name}!`);

      if (userRole === "gonullu") {
        router.replace("/gonullu/operasyonHaritasi");
      } else {
        router.replace("/afetzede/afetzedePaneli");
      }
    } catch (error) {
      console.log("Login hatası:", error);

      let msg = "E-posta veya şifre hatalı.";

      if (error.code === "auth/network-request-failed") {
        msg =
          "İnternet bağlantısı yok. Daha önce giriş yaptıysanız uygulamayı kapatıp tekrar açarak offline moda geçebilirsiniz.";
      }

      Alert.alert("Hata", msg);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, userData) => {
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );

      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        ...userData,
        createdAt: new Date(),
      });

      Alert.alert("Başarılı", "Kaydınız tamamlandı!");
      router.replace("/login");
    } catch (error) {
      console.log("Kayıt hatası:", error);

      let msg = "Bir hata oluştu.";

      if (error.code === "auth/email-already-in-use") {
        msg = "Bu e-posta zaten kayıtlı.";
      }

      if (error.code === "auth/weak-password") {
        msg = "Şifre en az 6 karakter olmalı.";
      }

      if (error.code === "auth/network-request-failed") {
        msg = "Kayıt olmak için internet bağlantısı gerekir.";
      }

      Alert.alert("Kayıt Hatası", msg);
    } finally {
      setLoading(false);
    }
  };

  return { login, register, loading };
};
