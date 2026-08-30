import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function TaskCard({ task, onPress, onYoldayim }) {
  const priorityColor =
    task.priority === "KRİTİK"
      ? "#EF4444"
      : task.priority === "YÜKSEK" || task.priority === "ACİL"
        ? "#F97316"
        : task.priority === "ORTA"
          ? "#F59E0B"
          : "#38BDF8";

  return (
    <TouchableOpacity
      style={[styles.container, { borderLeftColor: priorityColor }]}
      onPress={onPress}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.priorityBadge,
            { backgroundColor: priorityColor + "22" },
          ]}
        >
          <Text style={[styles.priorityText, { color: priorityColor }]}>
            {task.priority || "ORTA"}
          </Text>
        </View>

        <Text style={styles.timeText}>{task.timeAgo || "Az önce"}</Text>

        <View style={styles.aiBox}>
          <Text style={styles.aiText}>%{task.aiScore || 70}</Text>
          <Text style={styles.aiLabel}>AI</Text>
        </View>
      </View>

      <Text style={styles.title}>
        {task.title || `${task.category || "Afet"} Görevi`}
      </Text>

      <Text style={styles.desc} numberOfLines={2}>
        {task.description || "Görev açıklaması bulunamadı."}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="navigate-outline" size={14} color="#38BDF8" />
          <Text style={styles.metaText}>
            {task.displayDistance || "Konum yok"}
          </Text>
        </View>

        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={14} color="#94A3B8" />
          <Text style={styles.metaText}>
            {task.remainingNeeded ?? task.neededVolunteers ?? 1} kişi gerekli
          </Text>
        </View>

        <View style={styles.metaItem}>
          <Ionicons name="shield-checkmark-outline" size={14} color="#22C55E" />
          <Text style={styles.metaText}>%{task.trustScore || 70}</Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.detailBtn} onPress={onPress}>
          <Text style={styles.detailText}>Detay</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.goBtn} onPress={onYoldayim}>
          <Ionicons name="navigate" size={15} color="#0F172A" />
          <Text style={styles.goText}>Yoldayım</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  topRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  priorityBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  priorityText: { fontSize: 10, fontWeight: "900" },
  timeText: { color: "#94A3B8", fontSize: 11, marginLeft: 8, flex: 1 },
  aiBox: {
    backgroundColor: "#0F172A",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: "center",
  },
  aiText: { color: "#FDBA74", fontSize: 13, fontWeight: "900" },
  aiLabel: { color: "#64748B", fontSize: 8, fontWeight: "900" },
  title: { color: "white", fontSize: 16, fontWeight: "900", lineHeight: 22 },
  desc: { color: "#94A3B8", fontSize: 12, marginTop: 6, lineHeight: 18 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: "#CBD5E1", fontSize: 11, fontWeight: "600" },
  buttonRow: { flexDirection: "row", gap: 10, marginTop: 15 },
  detailBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
  },
  detailText: { color: "#CBD5E1", fontWeight: "800" },
  goBtn: {
    flex: 1,
    backgroundColor: "#F97316",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  goText: { color: "#0F172A", fontWeight: "900" },
});
