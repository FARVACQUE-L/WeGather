import express from "express";
import adminRoutes from "./modules/admin/adminRoutes";
import budgetRoutes from "./modules/budget/budgetRoutes";
import eventRoutes from "./modules/event/eventRoutes";
import eventUserJoiningRoutes from "./modules/event_user_joining/eventUserJoiningRoutes";
import galleryRoutes from "./modules/gallery/galleryRoutes";
import messageRoutes from "./modules/message/messageRoutes";
import reportBugRoutes from "./modules/report_bug/reportBugRoutes";
import reportEventRoutes from "./modules/report_event/reportEventRoutes";
import reportUserRoutes from "./modules/report_user/reportUserRoutes";
import reservationRoutes from "./modules/reservation/reservationRoutes";
import todoRoutes from "./modules/todo/todoRoutes";
import userRoutes from "./modules/user/userRoutes";

const router = express.Router();

router.use(userRoutes);
router.use(messageRoutes);
router.use(reservationRoutes);
router.use(eventRoutes);
router.use(todoRoutes);
router.use(galleryRoutes);
router.use(reportUserRoutes);
router.use(reportBugRoutes);
router.use(reportEventRoutes);
router.use(eventUserJoiningRoutes);
router.use(adminRoutes);
router.use(budgetRoutes);

export default router;
