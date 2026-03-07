import mongoose from "mongoose";

const adsTransactionSchema = new mongoose.Schema(
  {
    entryType: {
      type: String,
      required: true,
      enum: ["fund", "spend"],
    },
    spendType: {
      type: String,
      enum: ["campaign", "subscription", "purchase", "other"],
    },
    campaignName: { type: String, trim: true },
    clientName: { type: String, trim: true },
    description: { type: String, required: true, trim: true },
    amountUSD: { type: Number, required: true, min: 0 },
    amountTND: { type: Number, default: null },
    date: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

export default mongoose.model("AdsTransaction", adsTransactionSchema);
