import type { RequestHandler } from "express";
import { readMemberEventId } from "../../helper/eventMembership";
import eventRepository from "../event/eventRepository";
import budgetRepository from "./budgetRepository";

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

    const name = String(req.body.name);
    const price = Number(req.body.price);

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

  const isAuthor = budget.budget_id_user === req.user.id;
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

    const name = String(req.body.name);
    const price = Number(req.body.price);

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
