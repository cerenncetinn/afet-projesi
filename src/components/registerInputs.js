import { Ionicons } from "@expo/vector-icons";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { styles } from "../styles/registerStyles";

// Ortak Input Bileşeni
export const LabeledInput = ({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  ...props
}) => (
  <View>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.inputWrapper}>
      <Ionicons
        name={icon}
        size={20}
        color="#64748B"
        style={{ marginLeft: 10 }}
      />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#64748B"
        value={value}
        onChangeText={onChangeText}
        style={styles.inputField}
        {...props}
      />
    </View>
  </View>
);

// Rol Seçici Bileşeni
export const RoleSelector = ({ activeRole, onRoleChange }) => (
  <View style={styles.roleSelector}>
    {["magdur", "gonullu", "yetkili"].map((r) => (
      <TouchableOpacity
        key={r}
        style={[styles.roleButton, activeRole === r && styles.activeButton]}
        onPress={() => onRoleChange(r)}
      >
        <Text style={styles.roleButtonText}>
          {r === "magdur"
            ? "Afetzede"
            : r === "gonullu"
              ? "Gönüllü"
              : "Yetkili"}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);
