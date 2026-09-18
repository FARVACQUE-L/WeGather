import express from "express";
import authorization from "../../middleware/auth";
import adminActions from "./adminActions";

const adminRoutes = express.Router();

adminRoutes.get(
  "/api/admin/reportUser",
  authorization,
  adminActions.readReportUser,
);
adminRoutes.get(
  "/api/admin/reportBug",
  authorization,
  adminActions.readReportBug,
);
adminRoutes.get(
  "/api/admin/reportEvent",
  authorization,
  adminActions.readReportEvent,
);
adminRoutes.get(
  "/api/admin/dashboard-chart",
  authorization,
  adminActions.readDashboardChart,
);
adminRoutes.get(
  "/api/admin/dashboard-years",
  authorization,
  adminActions.readAvailableYears,
);
adminRoutes.get(
  "/api/admin/arrayUser",
  authorization,
  adminActions.readArrayUsers,
);
adminRoutes.get(
  "/api/admin/arrayReport",
  authorization,
  adminActions.readArrayReport,
);
adminRoutes.get("/api/admin/events", authorization, adminActions.readAllEvents);
adminRoutes.get("/api/admin/users", authorization, adminActions.readAllUsers);

adminRoutes.get(
  "/api/admin/reportBug/:id",
  authorization,
  adminActions.readReportBugById,
);
adminRoutes.get(
  "/api/admin/reportEvent/:id",
  authorization,
  adminActions.readReportEventById,
);
adminRoutes.get(
  "/api/admin/reportUser/:id",
  authorization,
  adminActions.readReportUserById,
);

adminRoutes.patch(
  "/api/admin/reportBug/:id/done",
  authorization,
  adminActions.markBugAsDone,
);
adminRoutes.patch(
  "/api/admin/reportEvent/:id/done",
  authorization,
  adminActions.markEventAsDone,
);
adminRoutes.patch(
  "/api/admin/reportUser/:id/done",
  authorization,
  adminActions.markUserAsDone,
);

adminRoutes.patch(
  "/api/admin/ban-user/:id",
  authorization,
  adminActions.banUser,
);
adminRoutes.patch(
  "/api/admin/ban-event/:id",
  authorization,
  adminActions.banEvent,
);
adminRoutes.patch(
  "/api/admin/event-ban/:eventId/:userId",
  authorization,
  adminActions.banUserFromEvent,
);

export default adminRoutes;
