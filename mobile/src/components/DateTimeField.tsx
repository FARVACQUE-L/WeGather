import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { CalendarDays, Clock, X } from "lucide-react-native";
import { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors, fonts, spacing } from "@/constants/theme";
import { parseDay } from "@/lib/dates";

const pad = (value: number) => String(value).padStart(2, "0");

const toDayString = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const toTimeString = (date: Date) =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}`;

const toDate = (mode: "date" | "time", value: string, fallback?: string) => {
  if (mode === "date") {
    const day = value || fallback;
    return day ? parseDay(day) : new Date();
  }
  const date = new Date();
  const [hours, minutes] = (value || "12:00").split(":").map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const formatValue = (mode: "date" | "time", value: string) =>
  mode === "date"
    ? parseDay(value).toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : value.replace(":", " h ");

// Champ date ("AAAA-MM-JJ") ou heure ("HH:MM") avec le sélecteur natif.
export function DateTimeField({
  mode,
  value,
  onChange,
  placeholder,
  label,
  minimumDate,
  maximumDate,
  clearable = false,
}: {
  mode: "date" | "time";
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  // Jours "AAAA-MM-JJ" : le premier sert aussi de jour proposé par défaut.
  minimumDate?: string;
  maximumDate?: string;
  clearable?: boolean;
}) {
  const [iosValue, setIosValue] = useState<Date | null>(null);
  const Icon = mode === "date" ? CalendarDays : Clock;

  const apply = (date: Date) =>
    onChange(mode === "date" ? toDayString(date) : toTimeString(date));

  const pickerProps = {
    value: toDate(mode, value, minimumDate),
    mode,
    minimumDate: minimumDate ? parseDay(minimumDate) : undefined,
    maximumDate: maximumDate ? parseDay(maximumDate) : undefined,
  };

  const open = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        ...pickerProps,
        is24Hour: true,
        onValueChange: (_event, date) => apply(date),
      });
    } else {
      setIosValue(pickerProps.value);
    }
  };

  return (
    <View style={styles.field}>
      <Pressable
        onPress={open}
        style={({ pressed }) => [styles.input, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={
          value ? `${label} : ${formatValue(mode, value)}` : label
        }
      >
        <Icon size={16} color={colors.title} />
        <Text
          style={[styles.text, !value && styles.placeholder]}
          numberOfLines={1}
        >
          {value ? formatValue(mode, value) : placeholder}
        </Text>
      </Pressable>
      {clearable && value !== "" && (
        <Pressable
          onPress={() => onChange("")}
          hitSlop={8}
          style={styles.clear}
          accessibilityRole="button"
          accessibilityLabel={`Effacer : ${label}`}
        >
          <X size={16} color={colors.textMuted} />
        </Pressable>
      )}

      {Platform.OS === "ios" && (
        <Modal
          visible={iosValue !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setIosValue(null)}
        >
          <View style={styles.sheetOverlay}>
            <View style={styles.sheet}>
              {iosValue && (
                <DateTimePicker
                  {...pickerProps}
                  value={iosValue}
                  display="spinner"
                  locale="fr-FR"
                  onValueChange={(_event, date) => setIosValue(date)}
                />
              )}
              <Pressable
                onPress={() => {
                  if (iosValue) apply(iosValue);
                  setIosValue(null);
                }}
                style={styles.sheetButton}
                accessibilityRole="button"
              >
                <Text style={styles.sheetButtonText}>OK</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flex: 1,
    justifyContent: "center",
  },
  input: {
    height: 45,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingLeft: 12,
    paddingRight: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(194, 118, 118, 0.2)",
    backgroundColor: "rgba(226, 154, 154, 0.06)",
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text,
  },
  placeholder: {
    color: "#aaa",
  },
  clear: {
    position: "absolute",
    right: 10,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  sheet: {
    paddingBottom: spacing.xl,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: colors.neutral,
  },
  sheetButton: {
    alignSelf: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderRadius: 20,
    backgroundColor: colors.accentDark,
  },
  sheetButtonText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.neutral,
  },
});
