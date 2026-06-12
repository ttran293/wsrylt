import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const VisitEventSchema = new Schema(
  {
    visitorHash: { type: String, required: true, index: true },
    path: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  { timestamps: false },
);

VisitEventSchema.index({ createdAt: -1 });
VisitEventSchema.index({ visitorHash: 1, createdAt: -1 });

export type IVisitEvent = InferSchemaType<typeof VisitEventSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const VisitEvent: Model<IVisitEvent> =
  mongoose.models.VisitEvent ??
  mongoose.model<IVisitEvent>("VisitEvent", VisitEventSchema);
