import express from "express";
import authorization from "../../middleware/auth";
import isAdmin from "../../middleware/isAdmin";
import isSuperAdmin from "../../middleware/isSuperAdmin";
import adminActions from "./adminActions";

const adminRoutes = express.Router();

adminRoutes.get(
  "/api/admin/reportUser",
  authorization,
  isAdmin,
  adminActions.readReportUser,
);
adminRoutes.get(
  "/api/admin/reportBug",
  authorization,
  isAdmin,
  adminActions.readReportBug,
);
adminRoutes.get(
  "/api/admin/reportEvent",
  authorization,
  isAdmin,
  adminActions.readReportEvent,
);
adminRoutes.get(
  "/api/admin/dashboard-chart",
  authorization,
  isAdmin,
  adminActions.readDashboardChart,
);
adminRoutes.get(
  "/api/admin/dashboard-years",
  authorization,
  isAdmin,
  adminActions.readAvailableYears,
);
adminRoutes.get(
  "/api/admin/arrayUser",
  authorization,
  isAdmin,
  adminActions.readArrayUsers,
);
adminRoutes.get(
  "/api/admin/arrayReport",
  authorization,
  isAdmin,
  adminActions.readArrayReport,
);
adminRoutes.get(
  "/api/admin/events",
  authorization,
  isAdmin,
  adminActions.readAllEvents,
);
adminRoutes.get(
  "/api/admin/users",
  authorization,
  isAdmin,
  adminActions.readAllUsers,
);

// Gestion des rôles : la liste des admins est visible par tous les admins,
// la recherche, l'ajout et le retrait sont réservés aux superadmins.
adminRoutes.get(
  "/api/admin/users/search",
  authorization,
  isAdmin,
  isSuperAdmin,
  adminActions.searchUsers,
);
adminRoutes.get(
  "/api/admin/admins",
  authorization,
  isAdmin,
  adminActions.readAdmins,
);
adminRoutes.patch(
  "/api/admin/users/:id/admin",
  authorization,
  isAdmin,
  isSuperAdmin,
  adminActions.grantAdmin,
);
adminRoutes.delete(
  "/api/admin/users/:id/admin",
  authorization,
  isAdmin,
  isSuperAdmin,
  adminActions.revokeAdmin,
);
adminRoutes.patch(
  "/api/admin/users/:id/superadmin",
  authorization,
  isAdmin,
  isSuperAdmin,
  adminActions.promoteSuperAdmin,
);
adminRoutes.delete(
  "/api/admin/users/:id/superadmin",
  authorization,
  isAdmin,
  isSuperAdmin,
  adminActions.demoteSuperAdmin,
);

adminRoutes.get(
  "/api/admin/reportBug/:id",
  authorization,
  isAdmin,
  adminActions.readReportBugById,
);
adminRoutes.get(
  "/api/admin/reportEvent/:id",
  authorization,
  isAdmin,
  adminActions.readReportEventById,
);
adminRoutes.get(
  "/api/admin/reportUser/:id",
  authorization,
  isAdmin,
  adminActions.readReportUserById,
);

adminRoutes.get(
  "/api/admin/report-image/:filename",
  authorization,
  isAdmin,
  adminActions.readReportImage,
);

adminRoutes.patch(
  "/api/admin/reportBug/:id/done",
  authorization,
  isAdmin,
  adminActions.markBugAsDone,
);
adminRoutes.patch(
  "/api/admin/reportEvent/:id/done",
  authorization,
  isAdmin,
  adminActions.markEventAsDone,
);
adminRoutes.patch(
  "/api/admin/reportUser/:id/done",
  authorization,
  isAdmin,
  adminActions.markUserAsDone,
);

adminRoutes.patch(
  "/api/admin/ban-user/:id",
  authorization,
  isAdmin,
  adminActions.banUser,
);
adminRoutes.patch(
  "/api/admin/ban-event/:id",
  authorization,
  isAdmin,
  adminActions.banEvent,
);
adminRoutes.patch(
  "/api/admin/event-ban/:eventId/:userId",
  authorization,
  isAdmin,
  adminActions.banUserFromEvent,
);

export default adminRoutes;
