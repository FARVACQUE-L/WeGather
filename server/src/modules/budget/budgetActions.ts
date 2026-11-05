import type { RequestHandler } from "express";
import eventRepository from "../event/eventRepository";
import budgetRepository from "./budgetRepository";

const browse: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await eventRepository.readIdByUuid(req.params.eventUuid);
    if (!eventId) {
      res.sendStatus(404);
      return;
    }
    const budget = await budgetRepository.readByEvent(eventId);

    res.json(budget);
  } catch (err) {
    next(err);
  }
};

const browseTotalUser: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await eventRepository.readIdByUuid(req.params.eventUuid);
    if (!eventId) {
      res.sendStatus(404);
      return;
    }
    const budget = await budgetRepository.readAllTotalBudgetByEvent(eventId);

    res.json(budget);
  } catch (err) {
    next(err);
  }
};

const browseEvent: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await eventRepository.readIdByUuid(req.params.eventUuid);
    if (!eventId) {
      res.sendStatus(404);
      return;
    }
    const budget = await budgetRepository.readBudgetInfoEvent(eventId);

    res.json(budget);
  } catch (err) {
    next(err);
  }
};

const create: RequestHandler = async (req, res, next) => {
  try {
    const event = await eventRepository.readIdByUuid(req.body.event_uuid);
    const user = Number(req.body.id_user);
    const name = String(req.body.name);
    const price = Number(req.body.price);

    if (!event) {
      res.sendStatus(404);
      return;
    }

    const budget = await budgetRepository.create(event, user, name, price);

    res.json(budget);
  } catch (err) {
    next(err);
  }
};

const update: RequestHandler = async (req, res, next) => {
  try {
    const id_budget = Number(req.body.id_budget);
    const name = String(req.body.name);
    const price = Number(req.body.price);

    const budget = await budgetRepository.update(id_budget, name, price);

    res.json(budget);
  } catch (err) {
    next(err);
  }
};

const destroy: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const budget = await budgetRepository.delete(id);

    res.json(budget);
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
