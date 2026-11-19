import { Check, ListChecks, Pencil, Plus, Trash2 } from "lucide-react-native";
import { type Dispatch, type SetStateAction, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors, fonts, spacing } from "@/constants/theme";
import { ApiError, api } from "@/lib/api";
import { TODO_MAX_LENGTH, type Todo } from "@/types/dashboard";

const errorText = (error: unknown) =>
  error instanceof ApiError ? error.message : "Erreur serveur";

// To-do list partagée du groupe, comme sur le tableau de bord du site.
export function TodoList({
  uuid,
  todos,
  setTodos,
}: {
  uuid: string;
  todos: Todo[];
  setTodos: Dispatch<SetStateAction<Todo[]>>;
}) {
  const [draft, setDraft] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const sorted = [...todos].sort(
    (a, b) => Number(Boolean(a.todo_is_done)) - Number(Boolean(b.todo_is_done)),
  );

  const add = async () => {
    const name = draft.trim();
    if (!name || isAdding) return;

    setIsAdding(true);
    setErrorMessage("");
    try {
      const { insertId } = await api<{ insertId: number }>("/api/todo", {
        method: "POST",
        body: {
          event_uuid: uuid,
          todo_name: name,
          todo_deadline: null,
          todo_is_done: false,
        },
      });
      setTodos((current) => [
        ...current,
        { todo_id: insertId, todo_name: name, todo_is_done: false },
      ]);
      setDraft("");
    } catch (error) {
      setErrorMessage(errorText(error));
    } finally {
      setIsAdding(false);
    }
  };

  const save = async (todo: Todo, changes: Partial<Todo>) => {
    const next = { ...todo, ...changes };
    setErrorMessage("");
    try {
      await api(`/api/todo/${todo.todo_id}`, {
        method: "PUT",
        body: {
          todo_name: next.todo_name,
          todo_is_done: Boolean(next.todo_is_done),
        },
      });
      setTodos((current) =>
        current.map((item) => (item.todo_id === todo.todo_id ? next : item)),
      );
      return true;
    } catch (error) {
      setErrorMessage(errorText(error));
      return false;
    }
  };

  const saveEdit = async (todo: Todo) => {
    const name = editText.trim();
    if (!name) return;
    if (name === todo.todo_name || (await save(todo, { todo_name: name }))) {
      setEditId(null);
    }
  };

  const remove = async (todo: Todo) => {
    setErrorMessage("");
    try {
      await api(`/api/todo/${todo.todo_id}`, { method: "DELETE" });
      setTodos((current) =>
        current.filter((item) => item.todo_id !== todo.todo_id),
      );
    } catch (error) {
      setErrorMessage(errorText(error));
    }
  };

  const confirmRemove = (todo: Todo) => {
    Alert.alert("Supprimer la tâche ?", `« ${todo.todo_name} »`, [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => remove(todo) },
    ]);
  };

  const canAdd = draft.trim().length > 0 && !isAdding;

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <ListChecks size={20} color={colors.title} />
        <Text style={styles.title}>To-do list</Text>
      </View>

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Ajouter une tâche…"
          placeholderTextColor={colors.textMuted}
          maxLength={TODO_MAX_LENGTH}
          returnKeyType="done"
          onSubmitEditing={add}
          submitBehavior="submit"
        />
        <Pressable
          onPress={add}
          disabled={!canAdd}
          style={({ pressed }) => [
            styles.addButton,
            !canAdd && styles.disabled,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Ajouter la tâche"
        >
          {isAdding ? (
            <ActivityIndicator color={colors.neutral} size="small" />
          ) : (
            <Plus size={20} color={colors.neutral} />
          )}
        </Pressable>
      </View>

      {errorMessage !== "" && <Text style={styles.error}>{errorMessage}</Text>}

      {sorted.length === 0 ? (
        <Text style={styles.empty}>Aucune tâche pour le moment.</Text>
      ) : (
        sorted.map((todo) => {
          const isDone = Boolean(todo.todo_is_done);
          const isEditing = editId === todo.todo_id;

          return (
            <View key={todo.todo_id} style={styles.item}>
              <Pressable
                onPress={() => save(todo, { todo_is_done: !isDone })}
                hitSlop={8}
                style={[styles.checkbox, isDone && styles.checkboxDone]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isDone }}
                accessibilityLabel={todo.todo_name}
              >
                {isDone && <Check size={14} color={colors.neutral} />}
              </Pressable>

              {isEditing ? (
                <TextInput
                  style={[styles.input, styles.editInput]}
                  value={editText}
                  onChangeText={setEditText}
                  maxLength={TODO_MAX_LENGTH}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={() => saveEdit(todo)}
                  submitBehavior="blurAndSubmit"
                />
              ) : (
                <Text style={[styles.name, isDone && styles.nameDone]}>
                  {todo.todo_name}
                </Text>
              )}

              <Pressable
                onPress={() => {
                  if (isEditing) {
                    saveEdit(todo);
                  } else {
                    setEditId(todo.todo_id);
                    setEditText(todo.todo_name);
                  }
                }}
                hitSlop={6}
                style={styles.iconButton}
                accessibilityRole="button"
                accessibilityLabel={
                  isEditing ? "Enregistrer la tâche" : "Modifier la tâche"
                }
              >
                {isEditing ? (
                  <Check size={18} color={colors.positive} />
                ) : (
                  <Pencil size={16} color={colors.textMuted} />
                )}
              </Pressable>
              <Pressable
                onPress={() => confirmRemove(todo)}
                hitSlop={6}
                style={styles.iconButton}
                accessibilityRole="button"
                accessibilityLabel="Supprimer la tâche"
              >
                <Trash2 size={16} color={colors.negative} />
              </Pressable>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm + 4,
    padding: spacing.md + 4,
    borderRadius: 16,
    backgroundColor: colors.neutral,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.title,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  editInput: {
    height: 36,
    paddingHorizontal: 10,
  },
  addButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: colors.accentDark,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.7,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.negative,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 4,
    minHeight: 36,
  },
  checkbox: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
  },
  checkboxDone: {
    borderColor: colors.accentDark,
    backgroundColor: colors.accentDark,
  },
  name: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  nameDone: {
    color: colors.textMuted,
    textDecorationLine: "line-through",
  },
  iconButton: {
    padding: 4,
  },
});
