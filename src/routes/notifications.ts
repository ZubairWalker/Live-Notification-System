import { Router } from "express";
import { Server } from "socket.io";
import { requireHttpAuth, AuthenticatedRequest } from "../middleware/httpAuth.js";
import { NotificationModel, notificationTypes, toNotificationPayload } from "../models/Notification.js";

export function createNotificationsRouter(io: Server): Router {
  const router = Router();
  router.use(requireHttpAuth);

  router.post("/", async (req: AuthenticatedRequest, res, next) => {
    try {
      const { type, title, body } = req.body ?? {};
      if (!notificationTypes.includes(type) || typeof title !== "string" || !title.trim() || typeof body !== "string" || !body.trim()) {
        res.status(400).json({ message: "type, title, and body are required" });
        return;
      }
      if (title.trim().length > 120 || body.trim().length > 1000) {
        res.status(400).json({ message: "title or body exceeds maximum length" });
        return;
      }

      const notification = await NotificationModel.create({ userId: req.auth!.userId, type, title, body });
      const payload = toNotificationPayload(notification);
      const unread = await NotificationModel.countDocuments({ userId: req.auth!.userId, read: false });
      io.to(`user:${req.auth!.userId}`).emit("notification:new", payload);
      io.to(`user:${req.auth!.userId}`).emit("notification:count", { unread });
      res.status(201).json(payload);
    } catch (error) { next(error); }
  });

  router.get("/", async (req: AuthenticatedRequest, res, next) => {
    try {
      const requestedLimit = Number(req.query.limit ?? 20);
      const limit = Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 20;
      const unreadOnly = req.query.unreadOnly === "true";
      const filter = { userId: req.auth!.userId, ...(unreadOnly ? { read: false } : {}) };
      const [notifications, unread] = await Promise.all([
        NotificationModel.find(filter).sort({ createdAt: -1 }).limit(limit),
        NotificationModel.countDocuments({ userId: req.auth!.userId, read: false }),
      ]);
      res.json({ notifications: notifications.map(toNotificationPayload), unread });
    } catch (error) { next(error); }
  });

  router.patch("/:id/read", async (req: AuthenticatedRequest, res, next) => {
    try {
      const notification = await NotificationModel.findOneAndUpdate(
        { _id: req.params.id, userId: req.auth!.userId },
        { $set: { read: true } },
        { new: true },
      );
      if (!notification) {
        res.status(404).json({ message: "Notification not found" });
        return;
      }
      const unread = await NotificationModel.countDocuments({ userId: req.auth!.userId, read: false });
      io.to(`user:${req.auth!.userId}`).emit("notification:count", { unread });
      res.json({ success: true });
    } catch (error) { next(error); }
  });

  return router;
}
