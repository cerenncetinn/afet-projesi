// src/styles/ihbarStyles.js
import { StyleSheet } from "react-native";

export const ihbarStyles = StyleSheet.create({
  // ── Modal ─────────────────────────────────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.82)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: "92%",
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#334155",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  headerTitle: { color: "#F1F5F9", fontSize: 18, fontWeight: "700" },
  headerSub: { color: "#64748B", fontSize: 12, marginTop: 2 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  // ── Adım etiketi ──────────────────────────────────────────────────────────
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 10,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  stepNum: { color: "#fff", fontSize: 11, fontWeight: "800" },
  sectionTitle: { color: "#94A3B8", fontSize: 13, fontWeight: "600" },

  // ── Kategori ──────────────────────────────────────────────────────────────
  categoryRow: { flexDirection: "row", gap: 10 },
  categoryCard: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#334155",
    position: "relative",
  },
  categoryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  categoryLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  categoryCheck: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Aciliyet ──────────────────────────────────────────────────────────────
  priorityRow: { flexDirection: "row", gap: 8 },
  priorityCard: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    // Varsayılan border: görünür ama renksiz
    borderWidth: 1.5,
    borderColor: "#334155",
    gap: 4,
  },
  priorityLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  priorityDesc: { fontSize: 8, color: "#475569", textAlign: "center" },

  // DÜŞÜK (NORMAL) seçilince — gri arka planla kontrast sağlanır
  // Renk dinamik olarak inline verilir, burada fallback stil:
  priorityCardSelected: {
    // inline override: borderColor + backgroundColor verilir
  },

  priorityBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1E293B",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 8,
    borderWidth: 1,
  },
  priorityBannerText: { fontSize: 11, fontWeight: "700" },

  // ── Kişi sayısı ───────────────────────────────────────────────────────────
  peopleRow: { flexDirection: "row", gap: 8 },
  peopleChip: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#334155",
  },
  peopleChipActive: {
    borderColor: "#F97316",
    backgroundColor: "rgba(249,115,22,0.1)",
  },
  peopleChipText: { fontSize: 11, fontWeight: "700" },

  // ── Konum kartı ───────────────────────────────────────────────────────────
  locationCard: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 4,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
    marginTop: 5,
  },
  locationText: { color: "#F1F5F9", fontSize: 14, fontWeight: "600", flex: 1 },
  coordText: {
    color: "#475569",
    fontSize: 11,
    marginBottom: 2,
    paddingLeft: 16,
  },

  locationBtnRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  locationBtnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(249,115,22,0.1)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.3)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
  },
  locationBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  locationBtnText: { color: "#F97316", fontSize: 12, fontWeight: "700" },
  locationBtnTextSecondary: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },

  // ── Metin alanı ───────────────────────────────────────────────────────────
  textArea: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    color: "#F1F5F9",
    padding: 14,
    minHeight: 100,
    fontSize: 14,
    lineHeight: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  charCount: {
    color: "#334155",
    fontSize: 10,
    textAlign: "right",
    marginTop: 4,
  },

  // ── Fotoğraf ──────────────────────────────────────────────────────────────
  photoArea: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#334155",
    borderStyle: "dashed",
    overflow: "hidden",
    minHeight: 120,
  },
  photoPlaceholder: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 6,
  },
  photoIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  photoTitle: { color: "#64748B", fontSize: 13, fontWeight: "600" },
  photoPreview: { position: "relative" },
  photoImage: { width: "100%", height: 160 },
  photoRemove: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(239,68,68,0.85)",
    borderRadius: 10,
    padding: 6,
  },

  // ── Gönder butonu ─────────────────────────────────────────────────────────
  submitBtn: {
    backgroundColor: "#F97316",
    borderRadius: 16,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  submitText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
