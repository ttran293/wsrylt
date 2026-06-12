import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const VisitorSessionSchema = new Schema(
  {
    visitorHash: { type: String, required: true, unique: true },
    firstSeenAt: { type: Date, required: true },
    lastSeenAt: { type: Date, required: true },
    lastPath: { type: String, required: true, default: "/" },
  },
  { timestamps: false },
);

VisitorSessionSchema.index({ lastSeenAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

export type IVisitorSession = InferSchemaType<typeof VisitorSessionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const VisitorSession: Model<IVisitorSession> =
  mongoose.models.VisitorSession ??
  mongoose.model<IVisitorSession>("VisitorSession", VisitorSessionSchema);
