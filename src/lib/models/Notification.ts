import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const NOTIFICATION_TYPES = ["like", "comment"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

const NotificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: NOTIFICATION_TYPES,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "MusicPost",
      required: true,
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

NotificationSchema.path("comment").validate(function (value) {
  if (this.type === "comment") {
    return value != null;
  }
  return value == null;
}, "Comment notifications must include a comment reference.");

NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export type INotification = InferSchemaType<typeof NotificationSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
};

export const Notification: Model<INotification> =
  mongoose.models.Notification ??
  mongoose.model<INotification>("Notification", NotificationSchema);
