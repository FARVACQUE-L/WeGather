import express from "express";
import authorization from "../../middleware/auth";
import budgetActions from "./budgetActions";

const budgetRoutes = express.Router();

budgetRoutes.get("/api/budget/:eventUuid", authorization, budgetActions.browse);
budgetRoutes.get(
  "/api/budget/:eventUuid/totalUsers",
  authorization,
  budgetActions.browseTotalUser,
);

budgetRoutes.get(
  "/api/budget/user/:eventUuid/:id_user",
  authorization,
  budgetActions.browseUser,
);
budgetRoutes.get(
  "/api/budget/event/:eventUuid",
  authorization,
  budgetActions.browseEvent,
);

budgetRoutes.post("/api/budget/add", authorization, budgetActions.create);
budgetRoutes.put("/api/budget/update", authorization, budgetActions.update);
budgetRoutes.delete("/api/budget/:id", authorization, budgetActions.destroy);

export default budgetRoutes;
