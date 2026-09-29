import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import Swal from "sweetalert2";
import useCanHover from "../../helper/useCanHover";
import "./Budget.css";

import {
  ArrowDown,
  ArrowUp,
  FilePlusCorner,
  HandCoins,
  History,
  Pen,
  Plus,
  Trash,
} from "lucide-react";
import BudgetFormModal from "./BudgetFormModal";

const apiUrl = import.meta.env.VITE_API_URL;

type Budget = {
  budget_id: number;
  budget_id_event: number;
  budget_id_user: number;
  budget_name: string;
  user_username: string;
  user_name: string;
  budget_price: number;
  budget_creation_date: string;
};

type BudgetByUser = {
  user_id: number;
  user_username: string;
  user_name: string;
  total_price: number;
};

type BudgetTotalEvent = {
  event_id: number;
  event_name: string;
  total_price: number;
};

function getBalancePrice(array: BudgetByUser[]) {
  const result: BudgetByUser[] = [];

  if (array.length === 1) {
    return [
      {
        ...array[0],
        total_price: 0,
      },
    ];
  }

  for (let i = 0; i < array.length; i++) {
    let result_line = array[i].total_price;

    for (let j = 0; j < array.length; j++) {
      // if (j !== i) {
      result_line -= array[j].total_price / array.length;
      // }
    }

    const test = {
      user_id: array[i].user_id,
      user_username: array[i].user_username,
      user_name: array[i].user_name,
      total_price: Math.round(result_line * 100) / 100,
    };
    result.push(test);
  }

  return result;
}

type Settlement = {
  from: BudgetByUser;
  to: BudgetByUser;
  amount: number;
};

// On rembourse le plus gros débiteur au plus gros créancier, puis on recommence
// avec ce qu'il reste : ça équilibre tout le monde en un minimum de virements.
function getSettlements(balances: BudgetByUser[]) {
  const debtors = balances
    .filter((user) => user.total_price < 0)
    .map((user) => ({ ...user }))
    .sort((a, b) => a.total_price - b.total_price);

  const creditors = balances
    .filter((user) => user.total_price > 0)
    .map((user) => ({ ...user }))
    .sort((a, b) => b.total_price - a.total_price);

  const settlements: Settlement[] = [];

  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];

    const amount = Math.min(-debtor.total_price, creditor.total_price);
    const rounded = Math.round(amount * 100) / 100;

    if (rounded > 0) {
      settlements.push({ from: debtor, to: creditor, amount: rounded });
    }

    debtor.total_price += amount;
    creditor.total_price -= amount;

    // Les soldes sont arrondis au centime, donc on ignore les restes plus petits.
    if (Math.abs(debtor.total_price) < 0.01) debtorIndex++;
    if (Math.abs(creditor.total_price) < 0.01) creditorIndex++;
  }

  return settlements;
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"]/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char] ?? char,
  );
}

function getUserBudget(array: BudgetByUser[], id_user: number) {
  return array.find((user) => user.user_id === id_user);
}

function returnDateString(dateString: string) {
  if (dateString === undefined) {
    return "";
  }

  const date = new Date(dateString);
  const targetDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffDays = Math.round(
    (today.getTime() - targetDay.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays <= 0) return "aujourd’hui";
  if (diffDays === 1) return "hier";
  if (diffDays === 2) return "avant-hier";
  if (diffDays <= 7) return `il y a ${diffDays} jours`;

  return date.toLocaleDateString("fr-FR");
}

// Notification en haut de l'écran après l'ajout ou la modification d'une
// dépense.
const budgetToast = Swal.mixin({
  toast: true,
  position: "top",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,

  customClass: {
    popup: "toast",
  },
});

function Budget() {
  const canHover = useCanHover();
  const { eventUuid } = useParams();
  const [userID, setUserID] = useState<number | null>(null);
  useEffect(() => {
    fetch(`${apiUrl}/api/auth/authVerif`, {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          setUserID(null);
          return;
        }

        const data = await res.json();
        setUserID(data.id);
      })
      .catch(() => setUserID(null));
  }, []);

  const [budgetEvent, setBudgetEvent] = useState<BudgetTotalEvent>();
  const [listUserBudget, setListUserBudget] = useState<BudgetByUser[]>([]);
  const [listBudget, setListBudget] = useState<Budget[]>([]);
  // Modale ouverte : ajout, ou modification de la dépense indiquée.
  const [budgetForm, setBudgetForm] = useState<
    { mode: "add" } | { mode: "edit"; budget: Budget } | null
  >(null);
  const [userInEvent, setUserInEvent] = useState<boolean | null>(null);

  const fetchBudgetLists = useCallback(() => {
    if (!eventUuid) return;
    fetch(`${apiUrl}/api/budget/event/${eventUuid}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data: BudgetTotalEvent[]) => setBudgetEvent(data[0]));

    fetch(`${apiUrl}/api/budget/${eventUuid}/totalUsers`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data: BudgetByUser[]) => setListUserBudget(data));

    fetch(`${apiUrl}/api/budget/${eventUuid}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data: Budget[]) => setListBudget(data));
  }, [eventUuid]);

  const fetchUserInEvent = useCallback(async () => {
    if (!eventUuid || userID === null) return;

    try {
      const response = await fetch(
        `${apiUrl}/api/user-in-event/${eventUuid}/${userID}`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Erreur vérification inscription");
      }

      const data = await response.json();

      setUserInEvent(data.joined);
    } catch (error) {
      console.error(error);
      setUserInEvent(false);
    }
  }, [eventUuid, userID]);

  useEffect(() => {
    if (!eventUuid || userID === null) return;

    fetchUserInEvent();
    fetchBudgetLists();
  }, [eventUuid, userID, fetchUserInEvent, fetchBudgetLists]);
  async function addBudget(name: string, price: number) {
    if (!eventUuid) return;

    const answer = await fetch(`${apiUrl}/api/budget/add`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_uuid: eventUuid,
        id_user: userID,
        name,
        price,
      }),
    });

    await fetchBudgetLists();

    setBudgetForm(null);

    const data = await answer.json();

    answer.ok
      ? budgetToast.fire({
          icon: "success",
          title: "Dépense ajoutée",

          customClass: {
            popup: "toast-success-popup",
          },
        })
      : budgetToast.fire({
          icon: "error",
          title: answer.status,
          text: JSON.stringify(data),

          customClass: {
            popup: "toast-error-popup",
          },
        });
  }

  // Remplace l'ancienne modale SweetAlert, qui insérait le nom de la dépense
  // tel quel dans son HTML.
  async function updateBudget(budget: Budget, name: string, price: number) {
    const answer = await fetch(`${apiUrl}/api/budget/update`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id_budget: budget.budget_id,
        name,
        price,
      }),
    });

    if (answer.ok) {
      setBudgetForm(null);
      await fetchBudgetLists();

      budgetToast.fire({
        icon: "success",
        title: "Dépense modifiée",

        customClass: {
          popup: "toast-success-popup",
        },
      });
    } else {
      budgetToast.fire({
        icon: "error",
        title: "Erreur",
        text: "Impossible de modifier la dépense",

        customClass: {
          popup: "toast-error-popup",
        },
      });
    }
  }

  async function confirmDelete(e: React.FormEvent, id: number) {
    e.preventDefault();

    const deleteAlert = Swal.mixin({
      toast: true,
      position: "top",
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
    });

    const result = await Swal.fire({
      title: "Supprimer cette dépense ?",
      text: "Cette action est irréversible",
      icon: "error",

      showCancelButton: true,
      confirmButtonText: "Supprimer",
      cancelButtonText: "Annuler",

      customClass: {
        container: "budget-backdrop",
        popup: "budget-delete-popup",
        confirmButton: "budget-delete-confirm",
        cancelButton: "budget-delete-cancel",
      },
    });

    if (result.isConfirmed) {
      await deleteBudget(e, id);

      deleteAlert.fire({
        icon: "success",
        title: "Dépense supprimée",

        customClass: {
          popup: "toast-success-popup",
        },
      });
    }
  }

  async function deleteBudget(e: React.FormEvent, id: number) {
    e.preventDefault();

    await fetch(`${apiUrl}/api/budget/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    await fetchBudgetLists();
  }

  if (userID === null) {
    return <p>Chargement utilisateur...</p>;
  }

  const userBudget = getUserBudget(listUserBudget, userID)?.total_price ?? 0;
  const listBalance = getBalancePrice(listUserBudget);
  const userBalance = getUserBudget(listBalance, userID)?.total_price ?? 0;

  function openSettlementModal() {
    const settlements = getSettlements(listBalance);
    const myRefunds = settlements.filter((row) => row.from.user_id === userID);
    const myIncomes = settlements.filter((row) => row.to.user_id === userID);

    const listHtml = (rows: Settlement[], toMe: boolean) =>
      rows
        .map(
          (row) => `
          <li>
            <span>${escapeHtml(toMe ? row.from.user_name : row.to.user_name)}</span>
            <strong class="${toMe ? "positif" : "negatif"}">${row.amount.toFixed(2)} €</strong>
          </li>`,
        )
        .join("");

    let html = "";

    if (myRefunds.length > 0) {
      html += `
        <p class="settlementLabel">Tu rembourses</p>
        <ul class="settlementList">${listHtml(myRefunds, false)}</ul>`;
    }

    if (myIncomes.length > 0) {
      html += `
        <p class="settlementLabel">On te rembourse</p>
        <ul class="settlementList">${listHtml(myIncomes, true)}</ul>`;
    }

    if (html === "") {
      html = `<p class="settlementLabel">Tes comptes sont déjà équilibrés.</p>`;
    }

    Swal.fire({
      title: "Équilibrer les comptes",
      html,

      confirmButtonText: "Fermer",

      customClass: {
        container: "budget-backdrop",
        popup: "toast-edit-popup settlement-popup",
        confirmButton: "budget-confirm",
      },
    });
  }

  if (userInEvent === null) {
    return <p>Chargement...</p>;
  }

  if (userInEvent === false) {
    return <p>Vous n'êtes pas inscrit à cet événement.</p>;
  }

  return (
    <div className="budget">
      <div className="budgetHeader">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1>{budgetEvent?.event_name}</h1>
          <motion.button
            type="button"
            className="button-header"
            onClick={() => setBudgetForm({ mode: "add" })}
            // Même survol que Créer / Rejoindre un événement.
            whileHover={
              canHover
                ? { scale: 0.95, transition: { duration: 0.2 } }
                : undefined
            }
            whileTap={{ scale: 0.95 }}
          >
            <FilePlusCorner size={20} />
            <span> Ajouter une dépense</span>
          </motion.button>
        </motion.header>
      </div>
      <div className="budgetBody">
        {budgetForm?.mode === "add" && (
          <BudgetFormModal
            title="Ajouter une dépense"
            submitLabel="Ajouter"
            onCancel={() => setBudgetForm(null)}
            onSubmit={addBudget}
          />
        )}

        {budgetForm?.mode === "edit" && (
          <BudgetFormModal
            title="Modifier la dépense"
            submitLabel="Enregistrer"
            initialName={budgetForm.budget.budget_name}
            initialPrice={Number(budgetForm.budget.budget_price)}
            onCancel={() => setBudgetForm(null)}
            onSubmit={(name, price) =>
              updateBudget(budgetForm.budget, name, price)
            }
          />
        )}

        <motion.section
          className="myBalance"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <article className="myBalanceBox">
            {userBalance > 0 && <span>on te doit</span>}
            {userBalance < 0 && <span>tu dois</span>}
            {userBalance === 0 && <span>comptes équilibrés</span>}
            <h2>{userBalance}€</h2>
            <small>
              <History /> last update :{" "}
              {returnDateString(
                listBudget[listBudget.length - 1]?.budget_creation_date,
              )}
            </small>

            <motion.button
              type="button"
              className="settlementButton"
              onClick={openSettlementModal}
              whileHover={canHover ? { scale: 1.05 } : undefined}
              whileTap={{ scale: 0.95 }}
            >
              <HandCoins size={20} />
              <span>Équilibrer les comptes</span>
            </motion.button>
          </article>

          <article className="total">
            <div className="positif">
              <p className="total-label">
                <ArrowDown size={20} className="lucid" />
                <span>dépense globales</span>
              </p>
              <h3> {budgetEvent?.total_price} € </h3>
            </div>

            <div className="negatif">
              <p className="total-label">
                <ArrowUp size={20} className="lucid" />
                <span>mes dépenses</span>
              </p>
              <h3>{userBudget} €</h3>
            </div>
          </article>
        </motion.section>

        <motion.section
          className="expensesAndBalance"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="expenses">
            <div className="mobileExpenses">
              <h5 className="titleExpenses">Dépenses</h5>
              <button
                type="button"
                className="addButton"
                onClick={() => setBudgetForm({ mode: "add" })}
              >
                <Plus size={20} />
              </button>
            </div>
            <section>
              {listBudget.map((row) => {
                return (
                  <article key={row.budget_id}>
                    <span>{row.budget_name}</span>
                    <span
                      className={
                        row.budget_id_user !== userID
                          ? "price positif"
                          : "price negatif"
                      }
                    >
                      {row.budget_id_user !== userID
                        ? `+${row.budget_price}`
                        : `-${row.budget_price}`}
                      €
                      <div
                        className={
                          row.budget_id_user === userID ? "icons" : "Noicons"
                        }
                      >
                        <Pen
                          onClick={() =>
                            setBudgetForm({ mode: "edit", budget: row })
                          }
                        />
                        <Trash
                          onClick={(e) => confirmDelete(e, row.budget_id)}
                        />
                      </div>
                    </span>
                  </article>
                );
              })}
            </section>
          </div>

          <div className="balance">
            <h5>Equilibres</h5>
            <section>
              {listBalance.map((row) => {
                return (
                  <article key={row.user_id}>
                    <span>{row.user_name}</span>
                    <span
                      className={row.total_price >= 0 ? "positif" : "negatif"}
                    >
                      {row.total_price >= 0
                        ? `+${row.total_price}`
                        : `${row.total_price}`}
                      €
                    </span>
                  </article>
                );
              })}
            </section>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

export default Budget;
