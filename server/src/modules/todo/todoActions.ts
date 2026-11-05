import type { RequestHandler } from "express";

import { isEventMember, readMemberEventId } from "../../helper/eventMembership";
import { asText, isDate, isText, LIMITS } from "../../helper/validation";
import todoRepository from "./todoRepository";

const INVALID_TODO = `La tâche doit contenir entre 1 et ${LIMITS.todoName} caractères.`;

const isTodoName = (value: unknown) => isText(value, LIMITS.todoName);

const browse: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await readMemberEventId(req, res, req.params.eventUuid);
    if (!eventId) return;

    const todo = await todoRepository.readAll(eventId);

    res.json(todo);
  } catch (err) {
    next(err);
  }
};

const add: RequestHandler = async (req, res, next) => {
  try {
    const eventId = await readMemberEventId(req, res, req.body.event_uuid);
    if (!eventId || !req.user) return;

    const deadline = req.body.todo_deadline;
    const hasDeadline =
      deadline !== undefined && deadline !== null && deadline !== "";

    if (!isTodoName(req.body.todo_name) || (hasDeadline && !isDate(deadline))) {
      res.status(400).json({ message: INVALID_TODO });
      return;
    }

    const newTodo = {
      todo_id_event: eventId,
      todo_id_user: req.user.id,
      todo_name: asText(req.body.todo_name),
      todo_deadline: hasDeadline ? deadline : null,
      todo_is_done: Boolean(req.body.todo_is_done),
    };

    const insertId = await todoRepository.create(newTodo);

    res.status(201).json({ insertId });
  } catch (err) {
    next(err);
  }
};

const readMemberTodo = async (
  req: Parameters<RequestHandler>[0],
  res: Parameters<RequestHandler>[1],
) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return undefined;
  }

  const todo = await todoRepository.read(Number(req.params.todo_id));
  if (!todo) {
    res.sendStatus(404);
    return undefined;
  }

  if (!(await isEventMember(todo.todo_id_event, req.user.id))) {
    res
      .status(403)
      .json({ message: "Vous n'êtes pas inscrit à cet événement." });
    return undefined;
  }

  return todo;
};

const edit: RequestHandler = async (req, res, next) => {
  try {
    const todo = await readMemberTodo(req, res);
    if (!todo) return;

    if (!isTodoName(req.body.todo_name)) {
      res.status(400).json({ message: INVALID_TODO });
      return;
    }

    const resultAffectedRows = await todoRepository.update({
      todo_id: todo.todo_id,
      todo_name: asText(req.body.todo_name),
      todo_is_done: Boolean(req.body.todo_is_done),
    });

    res.status(200).json({ resultAffectedRows });
  } catch (err) {
    next(err);
  }
};

const destroy: RequestHandler = async (req, res, next) => {
  try {
    const todo = await readMemberTodo(req, res);
    if (!todo) return;

    const resultAffectedRows = await todoRepository.delete(todo.todo_id);

    res.status(200).json({ resultAffectedRows });
  } catch (err) {
    next(err);
  }
};

export default { browse, edit, add, destroy };
