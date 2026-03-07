import mongoose from "mongoose";

const adsSettingsSchema = new mongoose.Schema(
  {
    reservedTND: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

export default mongoose.model("AdsSettings", adsSettingsSchema);
