import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { ImagePlus, Trash2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DateTimeField } from "@/components/DateTimeField";
import { ScreenHeader } from "@/components/ScreenHeader";
import { colors, fonts, spacing } from "@/constants/theme";
import { useEvent } from "@/context/EventContext";
import { ApiError, api } from "@/lib/api";
import { imageUrl } from "@/lib/imageUrl";
import { photoFile, pickPhoto } from "@/lib/photos";
import {
  RESERVATION_TYPE_INFO,
  RESERVATION_TYPES,
  type ReservationType,
  shortTime,
} from "@/lib/reservations";
import type { Reservation } from "@/types/reservation";

// Mêmes limites que le serveur (reservationActions.ts).
const TEXT_MAX_LENGTH = 255;

type Form = {
  name: string;
  type: ReservationType;
  dateStart: string;
  timeStart: string;
  dateEnd: string;
  timeEnd: string;
  location: string;
  description: string;
  link: string;
};

const EMPTY_FORM: Form = {
  name: "",
  type: "autre",
  dateStart: "",
  timeStart: "",
  dateEnd: "",
  timeEnd: "",
  location: "",
  description: "",
  link: "",
};

const toForm = (reservation: Reservation): Form => ({
  name: reservation.reservation_name,
  type: (RESERVATION_TYPES as readonly string[]).includes(
    reservation.reservation_type,
  )
    ? (reservation.reservation_type as ReservationType)
    : "autre",
  dateStart: reservation.reservation_date_start.slice(0, 10),
  timeStart: shortTime(reservation.reservation_time_start) ?? "",
  dateEnd: reservation.reservation_date_end?.slice(0, 10) ?? "",
  timeEnd: shortTime(reservation.reservation_time_end) ?? "",
  location: reservation.reservation_location,
  description: reservation.reservation_description,
  link: reservation.reservation_link ?? "",
});

// Photo : celle déjà enregistrée, une nouvelle choisie, ou retirée.
type Photo =
  | { kind: "saved"; url: string }
  | { kind: "new"; uri: string }
  | { kind: "none" };

export default function ReservationFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { uuid, event } = useEvent();
  const isEditing = id !== undefined;

  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [photo, setPhoto] = useState<Photo>({ kind: "none" });
  const [isLoading, setIsLoading] = useState(isEditing);
  const [loadError, setLoadError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPreparingPhoto, setIsPreparingPhoto] = useState(false);

  // En modification, on repart de la version à jour de la réservation.
  useEffect(() => {
    if (!isEditing) return;

    api<Reservation[]>(`/api/reservations/all/${uuid}`)
      .then((reservations) => {
        const reservation = reservations.find(
          (item) => String(item.reservation_id) === id,
        );
        if (!reservation) {
          setLoadError("Cette réservation n'existe plus.");
          return;
        }
        setForm(toForm(reservation));
        const saved = imageUrl(reservation.reservation_picture);
        setPhoto(saved ? { kind: "saved", url: saved } : { kind: "none" });
      })
      .catch((error) =>
        setLoadError(
          error instanceof ApiError ? error.message : "Erreur serveur",
        ),
      )
      .finally(() => setIsLoading(false));
  }, [isEditing, id, uuid]);

  if (!event) return null;

  const update = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errorMessage) setErrorMessage("");
  };

  const choosePhoto = async () => {
    setIsPreparingPhoto(true);
    try {
      const uri = await pickPhoto();
      if (uri) setPhoto({ kind: "new", uri });
    } catch {
      setErrorMessage("Impossible de préparer cette photo.");
    } finally {
      setIsPreparingPhoto(false);
    }
  };

  // Mêmes contrôles que le site, avant l'envoi.
  const validate = () => {
    const missing = [
      !form.name.trim() && "le titre",
      !form.dateStart && "la date",
      !form.location.trim() && "la localisation",
      !form.description.trim() && "une description",
    ].filter(Boolean);
    if (missing.length > 0) return `Il vous manque : ${missing.join(", ")}`;

    const isInEvent = (day: string) =>
      day >= event.event_date_start && day <= event.event_date_end;
    if (
      !isInEvent(form.dateStart) ||
      (form.dateEnd && !isInEvent(form.dateEnd))
    ) {
      return "Les dates doivent être comprises dans les dates de l'événement";
    }

    const endDay = form.dateEnd || form.dateStart;
    if (
      endDay < form.dateStart ||
      (endDay === form.dateStart &&
        form.timeStart &&
        form.timeEnd &&
        form.timeEnd <= form.timeStart)
    ) {
      return "La fin doit être après le début.";
    }

    const link = form.link.trim();
    if (link && !/^https?:\/\//i.test(link)) {
      return "Le lien doit commencer par https://";
    }

    return null;
  };

  const save = async () => {
    if (isSaving) return;

    const error = validate();
    if (error) {
      setErrorMessage(error);
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    const body = new FormData();
    body.append("event_uuid", uuid);
    body.append("reservation_name", form.name.trim());
    body.append("reservation_type", form.type);
    body.append("reservation_date_start", form.dateStart);
    body.append("reservation_time_start", form.timeStart);
    body.append("reservation_date_end", form.dateEnd);
    body.append("reservation_time_end", form.timeEnd);
    body.append("reservation_location", form.location.trim());
    body.append("reservation_description", form.description.trim());
    body.append("reservation_link", form.link.trim());
    if (photo.kind === "new") {
      body.append(
        "reservation_picture",
        photoFile(photo.uri, "reservation.jpg"),
      );
    } else if (isEditing && photo.kind === "none") {
      body.append("remove_picture", "true");
    }

    try {
      await api(
        isEditing ? `/api/reservations/update/${id}` : "/api/reservations",
        { method: isEditing ? "PUT" : "POST", body },
      );
      router.back();
    } catch (saveError) {
      setErrorMessage(
        saveError instanceof ApiError
          ? saveError.message
          : "Une erreur est survenue, veuillez réessayer.",
      );
      setIsSaving(false);
    }
  };

  const title = isEditing ? "Modifier la réservation" : "Nouvelle réservation";
  const header = (
    <ScreenHeader
      title={title}
      subtitle={event.event_name}
      backLabel="Retour aux réservations"
    />
  );

  if (isLoading || loadError) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        {header}
        <View style={styles.centered}>
          {loadError ? (
            <Text style={styles.stateText}>{loadError}</Text>
          ) : (
            <ActivityIndicator color={colors.accentDark} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  const previewUri =
    photo.kind === "saved"
      ? photo.url
      : photo.kind === "new"
        ? photo.uri
        : null;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {header}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <Label text="Nom de la réservation" />
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(value) => update("name", value)}
            placeholder="Ex : Hôtel du Parc"
            placeholderTextColor="#aaa"
            maxLength={TEXT_MAX_LENGTH}
            autoCapitalize="sentences"
          />

          <Label text="Type" />
          <View style={styles.types}>
            {RESERVATION_TYPES.map((type) => {
              const { label, Icon } = RESERVATION_TYPE_INFO[type];
              const isActive = form.type === type;
              const color = isActive ? colors.neutral : colors.title;
              return (
                <Pressable
                  key={type}
                  onPress={() => update("type", type)}
                  style={[styles.typeChip, isActive && styles.typeChipActive]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isActive }}
                >
                  <Icon size={14} color={color} />
                  <Text style={[styles.typeText, { color }]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Label text="Début" />
          <View style={styles.row}>
            <DateTimeField
              mode="date"
              label="Date de début"
              placeholder="Date"
              value={form.dateStart}
              onChange={(value) => update("dateStart", value)}
              minimumDate={event.event_date_start}
              maximumDate={event.event_date_end}
            />
            <DateTimeField
              mode="time"
              label="Heure de début"
              placeholder="Heure"
              value={form.timeStart}
              onChange={(value) => update("timeStart", value)}
              clearable
            />
          </View>

          <Label text="Fin (facultatif)" />
          <View style={styles.row}>
            <DateTimeField
              mode="date"
              label="Date de fin"
              placeholder="Date"
              value={form.dateEnd}
              onChange={(value) => update("dateEnd", value)}
              minimumDate={form.dateStart || event.event_date_start}
              maximumDate={event.event_date_end}
              clearable
            />
            <DateTimeField
              mode="time"
              label="Heure de fin"
              placeholder="Heure"
              value={form.timeEnd}
              onChange={(value) => update("timeEnd", value)}
              clearable
            />
          </View>

          <Label text="Lieu" />
          <TextInput
            style={styles.input}
            value={form.location}
            onChangeText={(value) => update("location", value)}
            placeholder="Ex : Paris"
            placeholderTextColor="#aaa"
            maxLength={TEXT_MAX_LENGTH}
            autoCapitalize="sentences"
          />

          <Label text="Description" />
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.description}
            onChangeText={(value) => update("description", value)}
            placeholder="Décrivez votre réservation..."
            placeholderTextColor="#aaa"
            maxLength={TEXT_MAX_LENGTH}
            autoCapitalize="sentences"
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.counter}>
            {form.description.length}/{TEXT_MAX_LENGTH}
          </Text>

          <Label text="Lien vers la réservation (facultatif)" />
          <TextInput
            style={styles.input}
            value={form.link}
            onChangeText={(value) => update("link", value)}
            placeholder="https://..."
            placeholderTextColor="#aaa"
            maxLength={TEXT_MAX_LENGTH}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <Label text="Image (facultative)" />
          {previewUri ? (
            <Image
              source={previewUri}
              style={styles.preview}
              contentFit="cover"
              accessibilityLabel="Aperçu de la réservation"
            />
          ) : (
            <Text style={styles.hint}>
              Sans image, la carte affiche l'icône du type de réservation.
            </Text>
          )}
          <View style={styles.photoButtons}>
            <Pressable
              onPress={choosePhoto}
              disabled={isPreparingPhoto}
              style={({ pressed }) => [
                styles.photoButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
            >
              {isPreparingPhoto ? (
                <ActivityIndicator color={colors.title} size="small" />
              ) : (
                <ImagePlus size={16} color={colors.title} />
              )}
              <Text style={styles.photoButtonText}>
                {previewUri ? "Changer l'image" : "Choisir une image"}
              </Text>
            </Pressable>
            {previewUri && (
              <Pressable
                onPress={() => setPhoto({ kind: "none" })}
                style={({ pressed }) => [
                  styles.photoButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <Trash2 size={16} color={colors.negative} />
                <Text style={[styles.photoButtonText, styles.removeText]}>
                  Retirer l'image
                </Text>
              </Pressable>
            )}
          </View>

          {errorMessage !== "" && (
            <Text style={styles.error}>{errorMessage}</Text>
          )}

          <Pressable
            onPress={save}
            disabled={isSaving}
            style={({ pressed }) => [styles.submit, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <LinearGradient
              colors={["#e98d66", "#b44708"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitInner}
            >
              {isSaving ? (
                <ActivityIndicator color={colors.neutral} />
              ) : (
                <Text style={styles.submitText}>Enregistrer</Text>
              )}
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  stateText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.text,
    textAlign: "center",
  },
  body: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  label: {
    marginTop: 18,
    marginBottom: 8,
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.text,
  },
  input: {
    height: 45,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(194, 118, 118, 0.2)",
    backgroundColor: "rgba(226, 154, 154, 0.06)",
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  counter: {
    alignSelf: "flex-end",
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  types: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.neutral,
  },
  typeChipActive: {
    borderColor: colors.accentDark,
    backgroundColor: colors.accentDark,
  },
  typeText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  preview: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 12,
    backgroundColor: "#fbf2ed",
  },
  photoButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.neutral,
  },
  photoButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.title,
  },
  removeText: {
    color: colors.negative,
  },
  error: {
    marginTop: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.negative,
  },
  submit: {
    marginTop: spacing.lg,
    borderRadius: 20,
    overflow: "hidden",
  },
  submitInner: {
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.neutral,
  },
  pressed: {
    opacity: 0.7,
  },
});
