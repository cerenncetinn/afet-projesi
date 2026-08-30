// src/styles/gonulluStyles.js
import { StyleSheet } from "react-native";
import { COLORS, SIZES } from "../constants/theme";

export const gonulluStyles = StyleSheet.create({
  // ─── GENEL ────────────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ─── HEADER ───────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SIZES.padding,
    paddingVertical: 15,
  },
  headerTitle: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
  },

  // ─── SCROLL ───────────────────────────────────────────────────────────────
  scrollContent: {
    padding: SIZES.padding,
    paddingBottom: SIZES.tabBarHeight + 10,
  },

  // ─── SECTION ──────────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    marginTop: 10,
  },
  sectionTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  filterText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "bold",
  },

  // ─── ANALİZ KARTI ─────────────────────────────────────────────────────────
  analysisCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.cardPadding,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  tagText: {
    color: COLORS.textDisabled,
    fontSize: 10,
    fontWeight: "bold",
  },
  mainTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 10,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 10,
    lineHeight: 20,
  },

  // ─── KOORDİNAT SATIRI ─────────────────────────────────────────────────────
  coordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  coordBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.background,
    padding: 8,
    borderRadius: SIZES.radiusSm,
  },
  coordText: { color: "white", fontSize: 12 },
  timeLabel: { color: COLORS.textDisabled, fontSize: 12 },

  // ─── RİSK BÖLÜMÜ ──────────────────────────────────────────────────────────
  riskSection: { alignItems: "center", marginVertical: 30 },
  chartCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: COLORS.danger,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  riskPercent: { color: "white", fontSize: 28, fontWeight: "bold" },
  riskLabel: { color: COLORS.danger, fontSize: 10, fontWeight: "bold" },
  riskNote: {
    color: COLORS.textDisabled,
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 40,
  },

  // ─── NLP BÖLÜMÜ ───────────────────────────────────────────────────────────
  nlpSection: { gap: 10 },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  nlpChip: {
    backgroundColor: COLORS.card,
    padding: 15,
    borderRadius: SIZES.radiusSm,
  },
  nlpLabel: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 5,
  },
  nlpValue: { color: "white", fontSize: 16, fontWeight: "500" },

  // ─── BAŞLAT BUTONU ────────────────────────────────────────────────────────
  startBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
    borderRadius: 15,
    marginTop: 30,
    gap: 10,
  },
  startBtnText: { fontWeight: "900", fontSize: 16, letterSpacing: 1 },

  // ─── HARİTA MARKERİ ───────────────────────────────────────────────────────
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radiusSm,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  markerArrow: {
    position: "absolute",
    bottom: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
});
