import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/theme";

export default function AiRecommendation({
  task,
  onDetail,
  onYoldayim,
  userExpertice,
}) {
  if (!task) return null;

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>AI ÖNERİSİ</Text>
      </View>

      <Text style={styles.title}>SİZİN İÇİN EN UYGUN GÖREV</Text>

      <View style={styles.matchInfo}>
        <Ionicons name="sparkles" size={15} color={COLORS.primary} />
        <Text style={styles.matchText}>
          {userExpertice || "Genel"} yetkinliğinize göre %{task.aiScore || 75}{" "}
          uyumlu
        </Text>
      </View>

      <View style={styles.mainCard}>
        <Text style={styles.taskTitle}>
          {task.title || `${task.category || "Afet"} Görevi`}
        </Text>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={15} color="#94A3B8" />
          <Text style={styles.taskLocation}>
            {task.address || "Konum bilgisi yok"} • {task.displayDistance}
          </Text>
        </View>

        <View style={styles.scoreRow}>
          <View>
            <Text style={styles.smallLabel}>ÖNCELİK</Text>
            <Text style={styles.priority}>{task.priority || "ORTA"}</Text>
          </View>

          <View style={styles.scoreBox}>
            <Text style={styles.scorePercent}>%{task.aiScore || 75}</Text>
            <Text style={styles.scoreLabel}>AI SKORU</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.actionBtn} onPress={onYoldayim}>
          <Ionicons name="navigate" size={18} color="#0F172A" />
          <Text style={styles.actionBtnText}>Yoldayım</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.detailBtn} onPress={onDetail}>
          <Text style={styles.detailBtnText}>Detay Gör</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 26, paddingHorizontal: 20 },
  badge: {
    backgroundColor: COLORS.primary,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10,
  },
  badgeText: { color: "#0F172A", fontSize: 10, fontWeight: "900" },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  matchInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
    gap: 6,
  },
  matchText: { color: "#CBD5E1", fontSize: 13, fontWeight: "600" },
  mainCard: {
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.45)",
  },
  taskTitle: {
    color: "white",
    fontSize: 19,
    fontWeight: "900",
    lineHeight: 25,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  taskLocation: { color: "#94A3B8", fontSize: 13, flex: 1 },
  scoreRow: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  smallLabel: { color: "#64748B", fontSize: 10, fontWeight: "900" },
  priority: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 4,
  },
  scoreBox: { alignItems: "flex-end" },
  scorePercent: { color: COLORS.primary, fontSize: 30, fontWeight: "900" },
  scoreLabel: { color: "#FDBA74", fontSize: 9, fontWeight: "900" },
  actionBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 14,
    borderRadius: 13,
    marginTop: 20,
    gap: 8,
  },
  actionBtnText: { fontWeight: "900", fontSize: 15, color: "#0F172A" },
  detailBtn: {
    marginTop: 10,
    padding: 13,
    alignItems: "center",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#334155",
  },
  detailBtnText: { color: "#CBD5E1", fontWeight: "800" },
});
