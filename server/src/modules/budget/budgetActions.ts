import type { RequestHandler } from "express";
import { isEventMember, readMemberEventId } from "../../helper/eventMembership";
import {
  asPrice,
  asText,
  isText,
  LIMITS,
  MAX_PRICE,
} from "../../helper/validation";
import eventRepository from "../event/eventRepository";
import budgetRepository from "./budgetRepository";

const readExpense = (
  body: Record<string, unknown>,
): { message: string } | { name: string; price: number } => {
  if (!isText(body.name, LIMITS.budgetName)) {
    return {
      message: `Le nom de la dépense doit contenir entre 1 et ${LIMITS.budgetName} caractères.`,
    };
  }

  const price = asPrice(body.price);
  if (price === null) {
    return {
      message: `Le montant doit être un nombre entre 0 et ${MAX_PRICE.toLocaleString("fr-FR")} €.`,
    };
  }

  return { name: asText(body.name), price };
};

const browse: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await readMemberEventId(req, res, req.params.eventUuid);
    if (!eventId) return;

    const budget = await budgetRepository.readByEvent(eventId);

    res.json(budget);
  } catch (err) {
    next(err);
  }
};

const browseTotalUser: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await readMemberEventId(req, res, req.params.eventUuid);
    if (!eventId) return;

    const budget = await budgetRepository.readAllTotalBudgetByEvent(eventId);

    res.json(budget);
  } catch (err) {
    next(err);
  }
};

const browseEvent: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await readMemberEventId(req, res, req.params.eventUuid);
    if (!eventId) return;

    const budget = await budgetRepository.readBudgetInfoEvent(eventId);

    res.json(budget);
  } catch (err) {
    next(err);
  }
};

const create: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await readMemberEventId(req, res, req.body.event_uuid);
    if (!eventId || !req.user) return;

    const expense = readExpense(req.body);
    if ("message" in expense) {
      res.status(400).json({ message: expense.message });
      return;
    }
    const { name, price } = expense;

    const budget = await budgetRepository.create(
      eventId,
      req.user.id,
      name,
      price,
    );

    res.json(budget);
  } catch (err) {
    next(err);
  }
};

const readManagedBudget = async (
  req: Parameters<RequestHandler>[0],
  res: Parameters<RequestHandler>[1],
  budgetId: number,
) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return undefined;
  }

  const budget = await budgetRepository.read(budgetId);
  if (!budget) {
    res.sendStatus(404);
    return undefined;
  }

  const isAuthor =
    budget.budget_id_user === req.user.id &&
    (await isEventMember(budget.budget_id_event, req.user.id));
  const [event] = await eventRepository.readEventHostId(budget.budget_id_event);
  const isHost = event?.event_id_host === req.user.id;

  if (!isAuthor && !isHost) {
    res
      .status(403)
      .json({ message: "Vous ne pouvez pas gérer cette dépense." });
    return undefined;
  }

  return budget;
};

const update: RequestHandler = async (req, res, next) => {
  try {
    const budget = await readManagedBudget(
      req,
      res,
      Number(req.body.id_budget),
    );
    if (!budget) return;

    const expense = readExpense(req.body);
    if ("message" in expense) {
      res.status(400).json({ message: expense.message });
      return;
    }
    const { name, price } = expense;

    const result = await budgetRepository.update(budget.budget_id, name, price);

    res.json(result);
  } catch (err) {
    next(err);
  }
};

const destroy: RequestHandler = async (req, res, next) => {
  try {
    const budget = await readManagedBudget(req, res, Number(req.params.id));
    if (!budget) return;

    const result = await budgetRepository.delete(budget.budget_id);

    res.json(result);
  } catch (err) {
    next(err);
  }
};

export default {
  browse,
  browseTotalUser,
  browseEvent,
  create,
  update,
  destroy,
};
