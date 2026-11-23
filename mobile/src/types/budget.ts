// GET /api/budget/:eventUuid : dépenses de l'événement, les plus anciennes
// en premier. Les montants DECIMAL arrivent parfois en texte depuis MySQL.
export type Expense = {
  budget_id: number;
  budget_id_event: number;
  budget_id_user: number;
  budget_name: string;
  user_username: string;
  budget_price: number | string;
  budget_creation_date: string;
};
