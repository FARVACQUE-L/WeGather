import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { imageUrl } from "@/lib/imageUrl";

export function AppHeader() {
  const { user, logout } = useAuth();
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    api<{ user_profile_picture: string | null }>(`/api/users/${user.id}/photo`)
      .then((result) => setPhoto(imageUrl(result.user_profile_picture)))
      .catch(() => setPhoto(null));
  }, [user]);

  const openMenu = () => {
    Alert.alert(user?.username ?? "Mon compte", user?.email, [
      { text: "Annuler", style: "cancel" },
      { text: "Se déconnecter", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <Image
          source={require("@/assets/images/ui/logo.png")}
          style={styles.logo}
        />
        <Text style={styles.brandText}>
          We<Text style={styles.brandItalic}>G</Text>ather
        </Text>
      </View>

      <Pressable
        onPress={openMenu}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Mon compte"
        style={styles.avatar}
      >
        {photo ? (
          <Image source={photo} style={styles.avatarImage} contentFit="cover" />
        ) : (
          <Text style={styles.avatarInitial}>
            {user?.username.charAt(0).toUpperCase()}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  logo: {
    width: 30,
    height: 30,
  },
  brandText: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.accent,
  },
  brandItalic: {
    fontStyle: "italic",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: colors.neutral,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitial: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.accentDark,
  },
});
