import { InferSchemaType, model, Schema, Types } from "mongoose";

export const notificationTypes = ["INFO", "WARNING", "ORDER", "SYSTEM"] as const;
export type NotificationType = (typeof notificationTypes)[number];

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: notificationTypes, required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    body: { type: String, required: true, trim: true, maxlength: 1000 },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export type Notification = InferSchemaType<typeof notificationSchema>;
export interface NotificationPayload {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
}

export function toNotificationPayload(notification: Notification & { _id: Types.ObjectId }): NotificationPayload {
  return {
    id: notification._id.toString(),
    userId: notification.userId.toString(),
    type: notification.type as NotificationType,
    title: notification.title,
    body: notification.body,
    read: notification.read,
    createdAt: notification.createdAt,
  };
}

export const NotificationModel = model("Notification", notificationSchema);
