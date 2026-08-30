// src/constants/theme.js
import { Dimensions } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export const COLORS = {
  // %70 - Ana Arka Plan
  background: "#0F172A",
  backgroundGradient: ["#0F172A", "#020617"],

  // %20 - Kartlar ve Yüzeyler
  card: "#1E293B",
  border: "#334155",

  // %10 - Aksan ve Durumlar
  primary: "#F97316", // Turuncu (CTA)
  success: "#22C55E", // Güven / Onay
  danger: "#EF4444", // Kritik / Acil
  info: "#38BDF8", // Bilgi / Link

  // Metinler
  textPrimary: "#E2E8F0",
  textSecondary: "#94A3B8",
  textDisabled: "#64748B",
};

export const SIZES = {
  // Ekran boyutları — Dimensions artık sadece burada import edilir
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,

  // Layout
  radius: 16, // rounded-2xl kuralımız
  radiusSm: 10, // küçük kartlar
  radiusLg: 24, // modal, büyük kartlar
  padding: 16,
  cardPadding: 20,

  // Sabit yükseklikler
  tabBarHeight: 90, // alt sekme menüsü
  headerHeight: 60, // üst başlık
  fabSize: 60, // floating action button
};

// ─── Harita için koyu tema ──────────────────────────────────────────────────
// mapTab.js ve operasyonHaritasi.js tarafından import edilir
export const MAP_STYLE = [];
