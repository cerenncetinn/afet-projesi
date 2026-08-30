import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../constants/theme";
import { styles } from "../styles/afetzedeStyles";

// setActiveTab props olarak eklendi!
export default function BottomTab({ activeTab = "MAPS", setActiveTab }) {
  // Kod tekrarını önlemek için yardımcı bir fonksiyon
  const renderTab = (tabName, iconName, activeIconName) => {
    const isActive = activeTab === tabName;

    return (
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => setActiveTab(tabName)} // Tıklayınca ana paneli haberdar eder
      >
        {isActive ? (
          <View style={styles.activeTabIndicator}>
            <Ionicons name={activeIconName} size={24} color={COLORS.primary} />
            <Text style={styles.activeTabText}>{tabName}</Text>
          </View>
        ) : (
          <>
            <Ionicons name={iconName} size={24} color={COLORS.textSecondary} />
            <Text style={styles.tabText}>{tabName}</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.bottomTabContainer}>
      {renderTab("MAPS", "map-outline", "map")}
      {renderTab("REPORTS", "megaphone-outline", "megaphone")}
      {renderTab("TASKS", "checkbox-outline", "checkbox")}
      {renderTab("PROFILE", "person-outline", "person")}
    </View>
  );
}
