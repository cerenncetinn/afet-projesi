import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
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

import { useAuth } from "../src/hooks/useAuth";
import { styles } from "../src/styles/loginStyles";

export default function Login() {
  const router = useRouter();
  const { login, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
          <View style={styles.mainContent}>
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
                <Ionicons name="location" size={45} color="#38BDF8" />
              </View>

              <Text style={styles.mainTitle}>
                Afet Yönetimi ve Koordinasyon
              </Text>

              <Text style={styles.subTitle}>
                Güvenli ve Hızlı Müdahale Platformu
              </Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.loginText}>Giriş Yap</Text>

              <Text style={styles.inputLabel}>E-posta Adresiniz</Text>

              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#64748B" />

                <TextInput
                  placeholder="eposta@adresiniz.com"
                  placeholderTextColor="#64748B"
                  style={styles.inputField}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <Text style={[styles.inputLabel, { marginTop: 20 }]}>
                Şifreniz
              </Text>

              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#64748B"
                />

                <TextInput
                  placeholder="********"
                  placeholderTextColor="#64748B"
                  secureTextEntry={!showPassword}
                  style={styles.inputField}
                  value={password}
                  onChangeText={setPassword}
                />

                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => router.push("/forgotPassword")}
              >
                <Text style={styles.forgotText}>Şifremi Unuttum?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => login(email, password)}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <View style={styles.buttonInner}>
                    <Text style={styles.loginButtonText}>Giriş Yap</Text>

                    <Ionicons
                      name="log-in-outline"
                      size={20}
                      color="white"
                      style={{ marginLeft: 10 }}
                    />
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.footerLinks}>
                <Text style={styles.noAccountText}>Hesabınız yok mu? </Text>

                <TouchableOpacity onPress={() => router.push("/register")}>
                  <Text style={styles.registerLink}>Kayıt Ol</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.bottomDecor}>
            <Text style={styles.copyrightText}>
              © 2026 Afet Yönetimi ve Koordinasyon Sistemi.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
