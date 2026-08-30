import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Bileşen ismi React kuralı gereği büyük harf: GonulluBottomTab
const GonulluBottomTab = ({ activeTab }) => {
  const router = useRouter();

  const tabs = [
    {
      id: "MAPS",
      icon: "map",
      label: "MAPS",
      path: "/gonullu/operasyonHaritasi",
    },

    {
      id: "TASKS",
      icon: "list",
      label: "TASKS",
      path: "/gonullu/gonulluPaneli",
    },

    {
      id: "REPORTS",
      icon: "checkmark-done",
      label: "REPORTS",
      path: "/gonullu/ihbarAnalizi",
    },
    {
      id: "PROFILE",
      icon: "person",
      label: "PROFILE",
      path: "/gonullu/profil",
    },
  ];

  return (
    <View style={styles.tabContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={styles.tabItem}
          onPress={() => router.push(tab.path)}
        >
          <View
            style={[
              styles.iconBox,
              activeTab === tab.id && styles.activeIconBox,
            ]}
          >
            <Ionicons
              name={activeTab === tab.id ? tab.icon : `${tab.icon}-outline`}
              size={22}
              color={activeTab === tab.id ? "#F97316" : "#64748B"}
            />
          </View>
          <Text
            style={[
              styles.tabLabel,
              activeTab === tab.id && styles.activeLabel,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#1E293B",
    paddingBottom: 25,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#334155",
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  tabItem: { flex: 1, alignItems: "center" },
  iconBox: { padding: 6, borderRadius: 10 },
  activeIconBox: { backgroundColor: "rgba(249, 115, 22, 0.1)" },
  tabLabel: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 4,
    fontWeight: "bold",
  },
  activeLabel: { color: "#F97316" },
});

export default GonulluBottomTab;
