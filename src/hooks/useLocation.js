import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

export const useLocation = () => {
  const [address, setAddress] = useState("Konum belirleniyor...");
  const [region, setRegion] = useState({
    latitude: 41.0082,
    longitude: 28.9784,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  const fetchAddress = async (lat, lon) => {
    try {
      let response = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lon,
      });
      if (response.length > 0) {
        let item = response[0];
        // 🚩 TAM FORMAT: Seyitnizam, İstanbul
        const formatted = `${item.district || item.name || ""}, ${item.city || item.region || ""}`;
        setAddress(formatted);
      }
    } catch (e) {
      setAddress("Konum bilinmiyor");
    }
  };

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "İzin Gerekli",
          "Sizi haritada bulabilmemiz için konum izni şart.",
        );
        return;
      }
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      const userRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setRegion(userRegion);
      fetchAddress(userRegion.latitude, userRegion.longitude);
    } catch (error) {
      console.log("Konum hatası:", error);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  return { region, address, getCurrentLocation, setRegion, setAddress };
};
