import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import {
  ArrowDown,
  ArrowUp,
  HandCoins,
  History,
  PencilLine,
  Plus,
  ReceiptEuro,
  Scale,
  Trash2,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ExpenseFormModal } from "@/components/ExpenseFormModal";
import { ScreenHeader } from "@/components/ScreenHeader";
import { colors, fonts, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useEvent } from "@/context/EventContext";
import { ApiError, api } from "@/lib/api";
import {
  formatBalance,
  formatPrice,
  getBalances,
  getSettlements,
  type Settlement,
} from "@/lib/budget";
import { formatRelativeDay } from "@/lib/dates";
import type { Expense } from "@/types/budget";
import type { MemberSpending } from "@/types/dashboard";

const balanceColor = (value: number) =>
  value > 0 ? colors.positive : value < 0 ? colors.negative : colors.textMuted;

export default function BudgetScreen() {
  const { user } = useAuth();
  const { uuid, event, group } = useEvent();
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [spendings, setSpendings] = useState<MemberSpending[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSettlements, setShowSettlements] = useState(false);
  // Formulaire ouvert : ajout (null) ou modification d'une dépense.
  const [form, setForm] = useState<{ expense: Expense | null } | null>(null);

  const load = useCallback(async () => {
    try {
      const [expenseList, spendingList] = await Promise.all([
        api<Expense[]>(`/api/budget/${uuid}`),
        api<MemberSpending[]>(`/api/budget/${uuid}/totalUsers`),
      ]);
      setExpenses(expenseList);
      setSpendings(spendingList);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "Erreur serveur",
      );
    }
  }, [uuid]);

  // Rechargé à chaque retour sur l'onglet : les autres membres peuvent
  // avoir ajouté des dépenses sur le site.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const refresh = async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  };

  // Le layout n'affiche les onglets qu'une fois l'événement chargé.
  if (!event || !group || !user) return null;

  // Comme le serveur : l'auteur de la dépense ou l'hôte de l'événement.
  const canManage = (expense: Expense) =>
    expense.budget_id_user === user.id || group.host_id === user.id;

  // Renvoie le message d'erreur à afficher dans le formulaire.
  const saveExpense = async (name: string, price: number) => {
    const expense = form?.expense;
    try {
      if (expense) {
        await api("/api/budget/update", {
          method: "PUT",
          body: { id_budget: expense.budget_id, name, price },
        });
      } else {
        await api("/api/budget/add", {
          method: "POST",
          body: { event_uuid: uuid, name, price },
        });
      }
    } catch (error) {
      return error instanceof ApiError
        ? error.message
        : "L'enregistrement a échoué.";
    }
    setForm(null);
    await load();
    return undefined;
  };

  const confirmDelete = (expense: Expense) => {
    Alert.alert(
      "Supprimer la dépense ?",
      `« ${expense.budget_name} » (${formatPrice(expense.budget_price)}) sera supprimée.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await api(`/api/budget/${expense.budget_id}`, {
                method: "DELETE",
              });
              await load();
            } catch (error) {
              Alert.alert(
                "Suppression impossible",
                error instanceof ApiError
                  ? error.message
                  : "La suppression a échoué.",
              );
            }
          },
        },
      ],
    );
  };

  const header = (
    <ScreenHeader
      title="Budget"
      subtitle={event.event_name}
      action={
        <Pressable
          onPress={() => setForm({ expense: null })}
          disabled={expenses === null}
          hitSlop={6}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Ajouter une dépense"
        >
          <Plus size={22} color={colors.neutral} />
        </Pressable>
      }
    />
  );

  if (expenses === null) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        {header}
        <View style={styles.centered}>
          {errorMessage ? (
            <>
              <Text style={styles.stateText}>{errorMessage}</Text>
              <Pressable onPress={load} hitSlop={8}>
                <Text style={styles.link}>Réessayer</Text>
              </Pressable>
            </>
          ) : (
            <ActivityIndicator color={colors.accentDark} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  const balances = getBalances(spendings);
  const myBalance =
    balances.find((row) => row.user_id === user.id)?.balance ?? 0;
  const mySpending = Number(
    spendings.find((row) => row.user_id === user.id)?.total_price ?? 0,
  );
  const total = expenses.reduce(
    (sum, row) => sum + Number(row.budget_price),
    0,
  );
  const lastExpense = expenses.at(-1);
  // Les plus récentes en premier sur le téléphone.
  const recentFirst = [...expenses].reverse();

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {header}
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            colors={[colors.accentDark]}
            tintColor={colors.accentDark}
          />
        }
      >
        {errorMessage !== "" && (
          <Text style={styles.error}>{errorMessage}</Text>
        )}

        <LinearGradient
          colors={["#ff8a65", "#b2553d"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.balanceBox}
        >
          <Text style={styles.balanceLabel}>
            {myBalance > 0
              ? "On te doit"
              : myBalance < 0
                ? "Tu dois"
                : "Comptes équilibrés"}
          </Text>
          <Text style={styles.balanceValue} adjustsFontSizeToFit>
            {formatPrice(myBalance)}
          </Text>
          {lastExpense && (
            <View style={styles.balanceUpdate}>
              <History size={14} color={colors.neutral} />
              <Text style={styles.balanceUpdateText}>
                Dernière mise à jour :{" "}
                {formatRelativeDay(lastExpense.budget_creation_date)}
              </Text>
            </View>
          )}
          <Pressable
            onPress={() => setShowSettlements(true)}
            style={({ pressed }) => [
              styles.settleButton,
              pressed && styles.settleButtonPressed,
            ]}
            accessibilityRole="button"
          >
            <HandCoins size={18} color={colors.neutral} />
            <Text style={styles.settleText}>Équilibrer les comptes</Text>
          </Pressable>
        </LinearGradient>

        <View style={styles.totals}>
          <View style={styles.total}>
            <View style={styles.totalLabel}>
              <ArrowDown size={16} color={colors.positive} />
              <Text style={styles.totalLabelText}>Dépenses globales</Text>
            </View>
            <Text
              style={[styles.totalValue, { color: colors.positive }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatPrice(total)}
            </Text>
          </View>
          <View style={styles.total}>
            <View style={styles.totalLabel}>
              <ArrowUp size={16} color={colors.negative} />
              <Text style={styles.totalLabelText}>Mes dépenses</Text>
            </View>
            <Text
              style={[styles.totalValue, { color: colors.negative }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatPrice(mySpending)}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <ReceiptEuro size={18} color={colors.title} />
            <Text style={styles.cardTitle}>Dépenses</Text>
          </View>
          {recentFirst.length === 0 ? (
            <Text style={styles.empty}>
              Aucune dépense pour l'instant. Ajoute la première avec le bouton
              +.
            </Text>
          ) : (
            recentFirst.map((expense) => {
              const isMine = expense.budget_id_user === user.id;
              return (
                <View key={expense.budget_id} style={styles.row}>
                  <View style={styles.rowText}>
                    <Text style={styles.rowName}>{expense.budget_name}</Text>
                    <Text style={styles.rowDetails} numberOfLines={1}>
                      {isMine ? "Toi" : expense.user_username} ·{" "}
                      {formatRelativeDay(expense.budget_creation_date)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.rowAmount,
                      { color: isMine ? colors.negative : colors.positive },
                    ]}
                  >
                    {isMine ? "-" : "+"}
                    {formatPrice(expense.budget_price)}
                  </Text>
                  {canManage(expense) && (
                    <View style={styles.manage}>
                      <Pressable
                        onPress={() => setForm({ expense })}
                        hitSlop={4}
                        style={({ pressed }) => [
                          styles.iconButton,
                          pressed && styles.pressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Modifier ${expense.budget_name}`}
                      >
                        <PencilLine size={17} color={colors.textMuted} />
                      </Pressable>
                      <Pressable
                        onPress={() => confirmDelete(expense)}
                        hitSlop={4}
                        style={({ pressed }) => [
                          styles.iconButton,
                          pressed && styles.pressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Supprimer ${expense.budget_name}`}
                      >
                        <Trash2 size={17} color={colors.negative} />
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Scale size={18} color={colors.title} />
            <Text style={styles.cardTitle}>Équilibres</Text>
          </View>
          {balances.map((row) => (
            <View key={row.user_id} style={styles.row}>
              <Text style={[styles.rowName, styles.rowText]} numberOfLines={1}>
                {row.user_username}
                {row.user_id === user.id && (
                  <Text style={styles.rowDetails}> (toi)</Text>
                )}
              </Text>
              <Text
                style={[styles.rowAmount, { color: balanceColor(row.balance) }]}
              >
                {formatBalance(row.balance)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <SettlementsModal
        visible={showSettlements}
        settlements={getSettlements(balances)}
        userId={user.id}
        onClose={() => setShowSettlements(false)}
      />

      <ExpenseFormModal
        visible={form !== null}
        expense={form?.expense ?? undefined}
        onCancel={() => setForm(null)}
        onSubmit={saveExpense}
      />
    </SafeAreaView>
  );
}

// Ce que l'utilisateur doit rembourser et ce qu'on lui doit.
function SettlementsModal({
  visible,
  settlements,
  userId,
  onClose,
}: {
  visible: boolean;
  settlements: Settlement[];
  userId: number;
  onClose: () => void;
}) {
  const myRefunds = settlements.filter((row) => row.from.user_id === userId);
  const myIncomes = settlements.filter((row) => row.to.user_id === userId);

  const renderList = (rows: Settlement[], toMe: boolean) =>
    rows.map((row) => {
      const other = toMe ? row.from : row.to;
      return (
        <View key={other.user_id} style={styles.settlementRow}>
          <Text style={styles.settlementName} numberOfLines={1}>
            {other.user_username}
          </Text>
          <Text
            style={[
              styles.rowAmount,
              { color: toMe ? colors.positive : colors.negative },
            ]}
          >
            {formatPrice(row.amount)}
          </Text>
        </View>
      );
    });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel="Fermer"
      >
        {/* Un appui dans la fenêtre ne la ferme pas. */}
        <Pressable style={styles.modal} onPress={() => {}}>
          <Text style={styles.modalTitle}>Équilibrer les comptes</Text>

          {myRefunds.length === 0 && myIncomes.length === 0 && (
            <Text style={styles.modalText}>
              Tes comptes sont déjà équilibrés.
            </Text>
          )}
          {myRefunds.length > 0 && (
            <View style={styles.settlementGroup}>
              <Text style={styles.modalLabel}>Tu rembourses</Text>
              {renderList(myRefunds, false)}
            </View>
          )}
          {myIncomes.length > 0 && (
            <View style={styles.settlementGroup}>
              <Text style={styles.modalLabel}>On te rembourse</Text>
              {renderList(myIncomes, true)}
            </View>
          )}

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.closeText}>Fermer</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    gap: spacing.md,
    padding: spacing.md,
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
  link: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.title,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.negative,
  },
  balanceBox: {
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: 20,
  },
  balanceLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.neutral,
  },
  balanceValue: {
    fontFamily: fonts.bold,
    fontSize: 40,
    color: colors.neutral,
  },
  balanceUpdate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  balanceUpdateText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.neutral,
  },
  settleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  settleButtonPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.35)",
  },
  settleText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.neutral,
  },
  totals: {
    flexDirection: "row",
    gap: spacing.md,
  },
  total: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.neutral,
  },
  totalLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  totalLabelText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textMuted,
  },
  totalValue: {
    fontFamily: fonts.bold,
    fontSize: 20,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.neutral,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.title,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  rowText: {
    flex: 1,
  },
  rowName: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.text,
  },
  rowDetails: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  rowAmount: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
  },
  modal: {
    width: "100%",
    maxWidth: 400,
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.title,
    textAlign: "center",
  },
  modalText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    textAlign: "center",
  },
  modalLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.textMuted,
  },
  settlementGroup: {
    gap: spacing.xs,
  },
  settlementRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.neutral,
  },
  settlementName: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.text,
  },
  closeButton: {
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: colors.accentDark,
  },
  closeText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.neutral,
  },
  manage: {
    flexDirection: "row",
  },
  iconButton: {
    padding: 6,
  },
  addButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: colors.accentDark,
  },
  pressed: {
    opacity: 0.7,
  },
});
