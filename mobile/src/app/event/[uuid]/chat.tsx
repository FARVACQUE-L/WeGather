import { SendHorizontal } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  FlatList,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { MessageBubble } from "@/components/MessageBubble";
import { ScreenHeader } from "@/components/ScreenHeader";
import { colors, fonts, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useEvent } from "@/context/EventContext";
import { ApiError, api } from "@/lib/api";
import { buildChatItems } from "@/lib/chat";
import { getSocket } from "@/lib/socket";
import {
  MESSAGE_MAX_LENGTH,
  type Message,
  type Reaction,
} from "@/types/message";

// Ajoute un message s'il n'est pas déjà là : l'expéditeur le reçoit
// à la fois dans la réponse du POST et par Socket.io.
const addMessage = (messages: Message[], message: Message) =>
  messages.some((current) => current.message_id === message.message_id)
    ? messages
    : [...messages, message];

export default function ChatScreen() {
  const { uuid, event } = useEvent();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");

  // Vrai si des messages sont arrivés pendant que l'app était en
  // arrière-plan : on les marquera comme lus au retour.
  const hasPendingReadRef = useRef(false);

  // Le statut « lu » est partagé avec le site : on ne marque comme lu
  // que si l'app est au premier plan, sinon le site n'afficherait plus
  // la ligne « Messages non lus » pour des messages jamais vus.
  const markAsRead = useCallback(() => {
    if (AppState.currentState !== "active") {
      hasPendingReadRef.current = true;
      return;
    }
    hasPendingReadRef.current = false;
    api(`/api/messages/notification/${uuid}`, { method: "POST" }).catch(
      () => {},
    );
  }, [uuid]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && hasPendingReadRef.current) markAsRead();
    });
    return () => subscription.remove();
  }, [markAsRead]);

  const loadMessages = useCallback(async () => {
    try {
      setMessages(await api<Message[]>(`/api/messages/${uuid}`));
      setErrorMessage("");
      markAsRead();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "Erreur serveur",
      );
    }
  }, [uuid, markAsRead]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Temps réel : mêmes événements que la messagerie du site.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Après une coupure (téléphone en veille, réseau perdu), on recharge
    // les messages arrivés entre-temps. Le salon est rejoint par
    // EventProvider, qui le garde pour tout l'événement.
    const handleReconnect = () => {
      loadMessages();
    };

    const handleNewMessage = (message: Message) => {
      setMessages((current) => current && addMessage(current, message));
      if (message.user_id !== user?.id) markAsRead();
    };

    const handleUpdated = (updated: Message) => {
      setMessages(
        (current) =>
          current?.map((message) => {
            if (message.message_id === updated.message_id) return updated;
            if (message.message_reply_to === updated.message_id) {
              return { ...message, reply_text: updated.message_text };
            }
            return message;
          }) ?? null,
      );
    };

    const handleDeleted = ({ message_id }: { message_id: number }) => {
      setMessages(
        (current) =>
          current
            ?.filter((message) => message.message_id !== message_id)
            .map((message) =>
              message.message_reply_to === message_id
                ? {
                    ...message,
                    message_reply_to: null,
                    reply_text: null,
                    reply_image: null,
                    reply_username: null,
                  }
                : message,
            ) ?? null,
      );
    };

    const handleReactions = ({
      message_id,
      reactions,
    }: {
      message_id: number;
      reactions: Reaction[];
    }) => {
      setMessages(
        (current) =>
          current?.map((message) =>
            message.message_id === message_id
              ? { ...message, reactions }
              : message,
          ) ?? null,
      );
    };

    socket.on("connect", handleReconnect);
    socket.on("new-message", handleNewMessage);
    socket.on("message-updated", handleUpdated);
    socket.on("message-deleted", handleDeleted);
    socket.on("message-reactions", handleReactions);

    return () => {
      socket.off("connect", handleReconnect);
      socket.off("new-message", handleNewMessage);
      socket.off("message-updated", handleUpdated);
      socket.off("message-deleted", handleDeleted);
      socket.off("message-reactions", handleReactions);
    };
  }, [user?.id, loadMessages, markAsRead]);

  const items = useMemo(
    () => (messages ? buildChatItems(messages) : []),
    [messages],
  );

  const text = draft.trim();
  const canSend = text.length > 0 && !isSending;

  const send = async () => {
    if (!canSend) return;

    setIsSending(true);
    setSendError("");
    try {
      const message = await api<Message>(`/api/messages/${uuid}`, {
        method: "POST",
        body: { messagesUser: text },
      });
      setMessages((current) => current && addMessage(current, message));
      setDraft("");
    } catch (error) {
      setSendError(
        error instanceof ApiError
          ? error.message
          : "Le message n'a pas pu être envoyé.",
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScreenHeader
        title={event?.event_name ?? "Messagerie"}
        subtitle="Messagerie"
        backLabel="Retour à l'événement"
      />

      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        {messages === null ? (
          <View style={styles.centered}>
            {errorMessage ? (
              <>
                <Text style={styles.stateText}>{errorMessage}</Text>
                <Pressable onPress={loadMessages} hitSlop={8}>
                  <Text style={styles.link}>Réessayer</Text>
                </Pressable>
              </>
            ) : (
              <ActivityIndicator color={colors.accentDark} />
            )}
          </View>
        ) : (
          <FlatList
            inverted
            data={items}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={[styles.stateText, styles.emptyText]}>
                Aucun message pour le moment. Lancez la conversation !
              </Text>
            }
            renderItem={({ item }) =>
              item.type === "day" ? (
                <Text style={styles.day}>{item.label}</Text>
              ) : (
                <MessageBubble
                  message={item.message}
                  isMine={item.message.user_id === user?.id}
                  isFirstOfGroup={item.isFirstOfGroup}
                  isLastOfGroup={item.isLastOfGroup}
                  currentUserId={user?.id}
                />
              )
            }
          />
        )}

        <View
          style={[
            styles.composer,
            { paddingBottom: Math.max(insets.bottom, spacing.sm) },
          ]}
        >
          {sendError !== "" && (
            <Text style={styles.sendError}>{sendError}</Text>
          )}
          <View style={styles.composerRow}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={(value) => {
                setDraft(value);
                if (sendError) setSendError("");
              }}
              placeholder="Écrire un message…"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={MESSAGE_MAX_LENGTH}
              editable={messages !== null}
            />
            <Pressable
              onPress={send}
              disabled={!canSend}
              style={({ pressed }) => [
                styles.sendButton,
                !canSend && styles.sendButtonDisabled,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Envoyer le message"
            >
              {isSending ? (
                <ActivityIndicator color={colors.neutral} size="small" />
              ) : (
                <SendHorizontal size={20} color={colors.neutral} />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral,
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  stateText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.text,
    textAlign: "center",
  },
  emptyText: {
    marginVertical: spacing.xl,
    transform: [{ scaleY: -1 }],
  },
  link: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.title,
  },
  list: {
    flexGrow: 1,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm,
  },
  day: {
    alignSelf: "center",
    marginVertical: spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#fbf2ed",
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.text,
  },
  composer: {
    gap: 4,
    paddingHorizontal: spacing.sm + 4,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.neutral,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
  sendButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: colors.accentDark,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.7,
  },
  sendError: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.negative,
  },
});
