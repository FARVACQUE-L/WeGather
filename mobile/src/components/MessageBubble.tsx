import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, spacing } from "@/constants/theme";
import { formatHour } from "@/lib/chat";
import { imageUrl } from "@/lib/imageUrl";
import type { Message } from "@/types/message";

type Props = {
  message: Message;
  isMine: boolean;
  isFirstOfGroup: boolean;
  isLastOfGroup: boolean;
  currentUserId: number | undefined;
};

const AVATAR_SIZE = 30;

export function MessageBubble({
  message,
  isMine,
  isFirstOfGroup,
  isLastOfGroup,
  currentUserId,
}: Props) {
  const image = imageUrl(message.message_image);
  const avatar = imageUrl(message.user_profile_picture);
  const replyImage = imageUrl(message.reply_image);
  const linkImage = imageUrl(message.message_link_image);
  const hasLinkPreview = Boolean(
    message.message_link_url && message.message_link_title,
  );

  return (
    <View
      style={[
        styles.row,
        isMine ? styles.rowMine : styles.rowOther,
        isLastOfGroup && styles.rowLast,
      ]}
    >
      {!isMine &&
        (isLastOfGroup ? (
          <View style={styles.avatar}>
            {avatar ? (
              <Image
                source={avatar}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.avatarInitial}>
                {message.user_username.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.avatarSpacer} />
        ))}

      <View style={[styles.column, isMine && styles.columnMine]}>
        <View
          style={[
            styles.bubble,
            isMine ? styles.bubbleMine : styles.bubbleOther,
            isLastOfGroup &&
              (isMine ? styles.bubbleMineTail : styles.bubbleOtherTail),
          ]}
        >
          {!isMine && isFirstOfGroup && (
            <Text style={styles.author}>{message.user_username}</Text>
          )}

          {message.message_reply_to !== null && message.reply_username && (
            <View style={[styles.reply, isMine && styles.replyMine]}>
              <View style={styles.replyBody}>
                <Text
                  style={[styles.replyAuthor, isMine && styles.textMine]}
                  numberOfLines={1}
                >
                  {message.reply_username}
                </Text>
                <Text
                  style={[styles.replyText, isMine && styles.textMine]}
                  numberOfLines={1}
                >
                  {message.reply_text || "Photo"}
                </Text>
              </View>
              {replyImage && (
                <Image
                  source={replyImage}
                  style={styles.replyThumb}
                  contentFit="cover"
                />
              )}
            </View>
          )}

          {image && (
            <Image
              source={image}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
          )}

          {message.message_text !== "" && (
            <Text style={[styles.text, isMine && styles.textMine]}>
              {message.message_text}
            </Text>
          )}

          {hasLinkPreview && (
            <Pressable
              onPress={() =>
                message.message_link_url &&
                WebBrowser.openBrowserAsync(message.message_link_url)
              }
              style={[styles.link, isMine && styles.linkMine]}
            >
              {linkImage && (
                <Image
                  source={linkImage}
                  style={styles.linkImage}
                  contentFit="cover"
                />
              )}
              <View style={styles.linkBody}>
                {message.message_link_site && (
                  <Text
                    style={[styles.linkSite, isMine && styles.textMine]}
                    numberOfLines={1}
                  >
                    {message.message_link_site}
                  </Text>
                )}
                <Text
                  style={[styles.linkTitle, isMine && styles.textMine]}
                  numberOfLines={2}
                >
                  {message.message_link_title}
                </Text>
              </View>
            </Pressable>
          )}

          <Text style={[styles.hour, isMine && styles.hourMine]}>
            {message.message_edited_at && "modifié · "}
            {formatHour(message.message_date)}
          </Text>
        </View>

        {message.reactions.length > 0 && (
          <View style={[styles.reactions, isMine && styles.reactionsMine]}>
            {message.reactions.map((reaction) => {
              const reactedByMe = reaction.users.some(
                (user) => user.user_id === currentUserId,
              );
              return (
                <View
                  key={reaction.emoji}
                  style={[
                    styles.reactionChip,
                    isMine && styles.reactionChipMine,
                  ]}
                >
                  <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                  <Text
                    style={[
                      styles.reactionCount,
                      isMine && styles.textMine,
                      reactedByMe && styles.reactionCountMine,
                    ]}
                  >
                    {reaction.users.length}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    marginTop: 2,
  },
  rowMine: {
    justifyContent: "flex-end",
  },
  rowOther: {
    justifyContent: "flex-start",
  },
  rowLast: {
    marginBottom: spacing.sm,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#fbf2ed",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitial: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.accentDark,
  },
  avatarSpacer: {
    width: AVATAR_SIZE,
  },
  column: {
    maxWidth: "78%",
    alignItems: "flex-start",
  },
  columnMine: {
    alignItems: "flex-end",
  },
  bubble: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleMine: {
    backgroundColor: colors.accent,
  },
  bubbleOther: {
    backgroundColor: colors.background,
  },
  bubbleMineTail: {
    borderBottomRightRadius: 2,
  },
  bubbleOtherTail: {
    borderBottomLeftRadius: 2,
  },
  author: {
    marginBottom: 2,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.title,
  },
  reply: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderLeftWidth: 3,
    borderLeftColor: colors.title,
    borderRadius: 6,
    backgroundColor: "rgba(0, 0, 0, 0.06)",
  },
  replyMine: {
    borderLeftColor: colors.neutral,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  replyBody: {
    flexShrink: 1,
  },
  replyAuthor: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.text,
  },
  replyText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.text,
    opacity: 0.85,
  },
  replyThumb: {
    width: 36,
    height: 36,
    borderRadius: 4,
  },
  image: {
    width: 220,
    height: 220,
    marginBottom: 4,
    borderRadius: 10,
    backgroundColor: "#fbf2ed",
  },
  text: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
  },
  textMine: {
    color: colors.neutral,
  },
  link: {
    marginTop: 6,
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.06)",
  },
  linkMine: {
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  linkImage: {
    width: "100%",
    height: 120,
  },
  linkBody: {
    padding: 8,
    gap: 2,
  },
  linkSite: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  linkTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.text,
  },
  hour: {
    alignSelf: "flex-end",
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textMuted,
  },
  hourMine: {
    color: "rgba(255, 255, 255, 0.85)",
  },
  reactions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: -6,
    paddingHorizontal: 8,
  },
  reactionsMine: {
    justifyContent: "flex-end",
  },
  reactionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  reactionChipMine: {
    backgroundColor: colors.accent,
  },
  reactionEmoji: {
    fontSize: 13,
  },
  reactionCount: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.text,
  },
  reactionCountMine: {
    fontFamily: fonts.bold,
  },
});
