import { useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

// Bileşen İthalatları
import BottomTab from "../../src/components/bottomTab";
import MapTab from "../../src/tabs/mapTab";
import ProfileTab from "../../src/tabs/profileTab";
import ReportsTab from "../../src/tabs/reportsTab";
import TasksTab from "../../src/tabs/tasksTab";

export default function AfetzedePaneli() {
  // Varsayılan olarak Harita (MAPS) ekranı açılır
  const [activeTab, setActiveTab] = useState("MAPS");
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    if (activeTab !== "MAPS") {
      setIsMapModalVisible(false);
    }
  }, [activeTab]);

  // Ekran içeriğini seçilen sekmeye göre değiştiren fonksiyon
  const renderContent = () => {
    switch (activeTab) {
      case "MAPS":
        return <MapTab onModalChange={setIsMapModalVisible} />;

      case "REPORTS":
        return <ReportsTab />;

      case "PROFILE":
        return <ProfileTab navigation={navigation} />;

      case "TASKS":
        return <TasksTab />;

      default:
        return <MapTab onModalChange={setIsMapModalVisible} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Üst Kısım: İçerik Alanı */}
      <View style={{ flex: 1 }}>{renderContent()}</View>

      {/* Alt Kısım: Menü Çubuğu */}
      {/* İhbar modalı açıkken bottom tab gizlenir */}
      {!isMapModalVisible && (
        <BottomTab activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  placeholder: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
  },
});
