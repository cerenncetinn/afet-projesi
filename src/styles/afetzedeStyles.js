// afetzedeStyles.js
import { StyleSheet } from "react-native";
import { COLORS, SIZES } from "../../src/constants/theme";

export const styles = StyleSheet.create({
  // ─── GENEL ────────────────────────────────────────────────────────────────
  container: { flex: 1, backgroundColor: COLORS.background },

  // ─── HARİTA ───────────────────────────────────────────────────────────────
  map: {
    width: SIZES.width,
    height: SIZES.height,
  },

  // ─── ÜST DURUM KARTI ──────────────────────────────────────────────────────
  headerContainer: { position: "absolute", top: 10, left: 20, right: 20 },
  statusCard: {
    backgroundColor: "rgba(30, 41, 59, 0.9)",
    padding: 15,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    flexDirection: "row",
    alignItems: "center",
  },
  statusTitle: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "bold",
  },
  statusValue: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 4,
  },

  // ─── HARİTA MARKERLERİ ────────────────────────────────────────────────────
  customMarkerContainer: { alignItems: "center", justifyContent: "center" },
  markerBubble: {
    backgroundColor: COLORS.card,
    padding: 8,
    borderRadius: 12,
    borderWidth: 2,
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderStyle: "solid",
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -1,
  },

  // ─── ALT AKSİYON ALANI ────────────────────────────────────────────────────
  actionRow: {
    position: "absolute",
    bottom: 110,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoCard: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.95)",
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    marginRight: 15,
    height: 60,
  },
  infoCardText: { color: COLORS.textPrimary, fontSize: 11 },
  fabButtonSmall: {
    backgroundColor: COLORS.primary,
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  // ─── MODAL — GENEL ────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: "92%",
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  modalTitle: { color: "white", fontSize: 18, fontWeight: "700" },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#334155",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // ─── MODAL — BÖLÜM ETİKETİ ───────────────────────────────────────────────
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 10,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  stepBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  sectionLabelText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },

  // Geriye dönük uyumluluk için (eski inputLabel kullanan yerler)
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 20,
    marginBottom: 10,
  },

  // ─── MODAL — KATEGORİ ────────────────────────────────────────────────────
  categoryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  // ihbarModali.js'in yeni stiliyle uyumlu
  categoryRow: {
    flexDirection: "row",
    gap: 10,
  },
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
  categoryLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
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
  // Eski stiller (geriye dönük uyumluluk)
  categoryBox: {
    backgroundColor: COLORS.background,
    width: "31%",
    height: 90,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  activeCategoryBox: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(249, 115, 22, 0.05)",
  },
  categoryBoxText: {
    color: COLORS.textDisabled,
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 8,
  },
  activeCategoryBoxText: { color: COLORS.primary },

  // ─── MODAL — ACİLİYET ────────────────────────────────────────────────────
  priorityGrid: {
    flexDirection: "row",
    gap: 8,
  },
  priorityRow: {
    flexDirection: "row",
    gap: 8,
  },
  priorityCard: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#334155",
    gap: 4,
  },
  // Geriye dönük uyumluluk
  priorityBox: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#334155",
  },
  priorityBoxText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  priorityBoxSub: {
    fontSize: 8,
    color: "#475569",
    textAlign: "center",
    marginTop: 2,
  },
  priorityLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  priorityDesc: {
    fontSize: 8,
    color: "#475569",
    textAlign: "center",
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
  priorityBannerText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // ─── MODAL — KİŞİ SAYISI ────────────────────────────────────────────────
  peopleRow: {
    flexDirection: "row",
    gap: 8,
  },
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
    borderColor: COLORS.primary,
    backgroundColor: "rgba(249,115,22,0.1)",
  },
  peopleChipText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // ─── MODAL — KONUM KARTI ──────────────────────────────────────────────────
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
    marginBottom: 6,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginTop: 4,
  },
  locationText: {
    color: "#F1F5F9",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  coordText: {
    color: "#475569",
    fontSize: 11,
    marginBottom: 8,
    paddingLeft: 16,
  },
  locationNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  locationNoticeText: {
    color: "#475569",
    fontSize: 10,
    flex: 1,
  },
  // Eski stiller
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  locationHeaderText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 6,
  },
  addressMainText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  addressInput: {
    color: "white",
    fontSize: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    paddingVertical: 4,
    marginTop: 4,
  },

  // ─── MODAL — AÇIKLAMA ─────────────────────────────────────────────────────
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
    textAlignVertical: "top",
  },
  charCount: {
    color: "#334155",
    fontSize: 10,
    textAlign: "right",
    marginTop: 4,
  },

  // ─── MODAL — FOTOĞRAF ─────────────────────────────────────────────────────
  photoUploadContainer: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#334155",
    borderStyle: "dashed",
    overflow: "hidden",
    minHeight: 120,
    marginTop: 4,
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
  photoTitle: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
  photoSub: {
    color: "#334155",
    fontSize: 10,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  photoArea: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#334155",
    borderStyle: "dashed",
    overflow: "hidden",
    minHeight: 120,
  },
  photoPreview: {
    position: "relative",
  },
  photoImage: {
    width: "100%",
    height: 160,
  },
  photoRemove: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(239,68,68,0.85)",
    borderRadius: 10,
    padding: 6,
  },
  photoBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  photoBadgeText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: "600",
  },
  // Eski stiller
  photoPlaceholderText: {
    color: COLORS.textDisabled,
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 10,
  },
  selectedImage: { width: "100%", height: "100%", borderRadius: 20 },
  removeBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(239, 68, 68, 0.8)",
    padding: 8,
    borderRadius: 12,
  },

  // ─── MODAL — GÖNDER BUTONU ────────────────────────────────────────────────
  submitButton: {
    backgroundColor: COLORS.primary,
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    flexDirection: "row",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "white",
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  disclaimer: {
    color: "#334155",
    fontSize: 10,
    textAlign: "center",
    marginTop: 12,
  },

  // ─── ALT SEKME MENÜSÜ ─────────────────────────────────────────────────────
  bottomTabContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: "#111827",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 20,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  tabItem: { alignItems: "center", flex: 1 },
  activeTabIndicator: {
    alignItems: "center",
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 4,
    fontWeight: "bold",
  },
  activeTabText: {
    color: COLORS.primary,
    fontSize: 10,
    marginTop: 4,
    fontWeight: "bold",
  },
});
