import express from "express";
import authorization from "../../middleware/auth";
import todoActions from "./todoActions";

const todoRoutes = express.Router();

todoRoutes.get("/api/todo/:eventUuid", authorization, todoActions.browse);
todoRoutes.post("/api/todo", authorization, todoActions.add);
todoRoutes.put("/api/todo/:todo_id", authorization, todoActions.edit);
todoRoutes.delete("/api/todo/:todo_id", authorization, todoActions.destroy);

export default todoRoutes;
