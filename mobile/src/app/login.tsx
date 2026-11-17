import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
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

import { API_URL, SITE_URL } from "@/constants/config";
import { colors, fonts, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { ApiError, api } from "@/lib/api";

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<"email" | "password" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [unverified, setUnverified] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const formValid = isEmail(email.trim()) && password.length > 0;

  const handleSubmit = async () => {
    if (!formValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage("");
    setUnverified(false);
    setResendMessage("");

    try {
      await login(email.trim(), password);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
        setUnverified(Boolean(error.data.unverified));
      } else {
        setErrorMessage("Erreur de connexion");
      }
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResendMessage("");
    try {
      const result = await api<{ message: string }>(
        "/api/auth/resend-verification",
        { method: "POST", body: { email: email.trim() } },
      );
      setResendMessage(result.message);
    } catch (error) {
      setResendMessage(
        error instanceof ApiError ? error.message : "Erreur serveur",
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brand}>
            <Image
              source={require("@/assets/images/ui/logo.png")}
              style={styles.logo}
            />
            <Text style={styles.brandText}>
              We<Text style={styles.brandItalic}>G</Text>ather
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.hero}>
              <Image
                source={require("@/assets/images/ui/connexion.jpg")}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
              <LinearGradient
                colors={["transparent", "rgba(0, 0, 0, 0.7)"]}
                style={styles.heroOverlay}
              >
                <Text style={styles.heroTitle}>
                  Facilitez vos prochains événements.
                </Text>
                <Text style={styles.heroText}>
                  WeGather vous propose une expérience utilisateur simple et
                  efficace.
                </Text>
              </LinearGradient>
            </View>

            <View style={styles.form}>
              <Text style={styles.title}>Bienvenue</Text>
              <Text style={styles.subtitle}>
                Connectez-vous à votre tableau de bord.
              </Text>

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, focused === "email" && styles.inputFocus]}
                placeholder="Entrez votre email"
                placeholderTextColor="#aaa"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="next"
              />

              <View style={styles.labelRow}>
                <Text style={styles.label}>Mot de passe</Text>
                <Pressable
                  onPress={() =>
                    WebBrowser.openBrowserAsync(`${SITE_URL}/forgetpassword`)
                  }
                  hitSlop={8}
                >
                  <Text style={styles.link}>Mot de passe oublié ?</Text>
                </Pressable>
              </View>
              <View>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    focused === "password" && styles.inputFocus,
                  ]}
                  placeholder="Entrez votre mot de passe"
                  placeholderTextColor="#aaa"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="current-password"
                  textContentType="password"
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit}
                />
                <Pressable
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={8}
                  accessibilityLabel={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  <Image
                    source={
                      showPassword
                        ? require("@/assets/images/ui/eye.png")
                        : require("@/assets/images/ui/hide.png")
                    }
                    style={styles.eyeIcon}
                  />
                </Pressable>
              </View>

              {errorMessage !== "" && (
                <Text style={styles.error}>{errorMessage}</Text>
              )}
              {unverified && (
                <Pressable onPress={handleResend} hitSlop={8}>
                  <Text style={[styles.link, styles.resend]}>
                    Renvoyer l'e-mail de confirmation
                  </Text>
                </Pressable>
              )}
              {resendMessage !== "" && (
                <Text style={styles.resendMessage}>{resendMessage}</Text>
              )}

              <Pressable
                onPress={handleSubmit}
                disabled={!formValid || isSubmitting}
                style={({ pressed }) => [
                  styles.submit,
                  pressed && styles.submitPressed,
                ]}
              >
                {formValid ? (
                  <LinearGradient
                    colors={["#e98d66", "#b44708"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitInner}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color={colors.neutral} />
                    ) : (
                      <Text style={styles.submitText}>Connexion</Text>
                    )}
                  </LinearGradient>
                ) : (
                  <View style={[styles.submitInner, styles.submitDisabled]}>
                    <Text style={styles.submitText}>Connexion</Text>
                  </View>
                )}
              </Pressable>

              <Text style={styles.register}>
                Pas encore inscrit ?{" "}
                <Text
                  style={styles.registerLink}
                  onPress={() =>
                    WebBrowser.openBrowserAsync(`${SITE_URL}/register`)
                  }
                >
                  Rejoins-nous ici
                </Text>
              </Text>
            </View>
          </View>

          {__DEV__ && <Text style={styles.devUrl}>Serveur : {API_URL}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.md,
    gap: spacing.md,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
    fontFamily: fonts.boldItalic,
  },
  card: {
    borderRadius: 16,
    backgroundColor: colors.neutral,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  hero: {
    height: 160,
  },
  heroOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: spacing.md + 4,
  },
  heroTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.neutral,
  },
  heroText: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.neutral,
    opacity: 0.9,
  },
  form: {
    paddingHorizontal: 25,
    paddingVertical: 35,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.text,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 20,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: "#666",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    marginTop: 18,
    marginBottom: 8,
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.text,
  },
  link: {
    marginTop: 18,
    marginBottom: 8,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: "#b44708",
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
  inputFocus: {
    borderColor: colors.accent,
  },
  passwordInput: {
    paddingRight: 45,
  },
  eyeButton: {
    position: "absolute",
    right: 15,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  eyeIcon: {
    width: 20,
    height: 20,
  },
  error: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#ff3b3b",
  },
  resend: {
    marginTop: 8,
    marginBottom: 0,
  },
  resendMessage: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#666",
  },
  submit: {
    marginTop: 30,
    borderRadius: 20,
    overflow: "hidden",
  },
  submitPressed: {
    transform: [{ scale: 0.98 }],
  },
  submitInner: {
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  submitDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.5,
  },
  submitText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.neutral,
  },
  register: {
    marginTop: 20,
    textAlign: "center",
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text,
  },
  registerLink: {
    fontFamily: fonts.bold,
    color: "#b44708",
  },
  devUrl: {
    textAlign: "center",
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
});
