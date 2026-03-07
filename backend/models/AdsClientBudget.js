import mongoose from "mongoose";

const adsClientBudgetSchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true, trim: true, unique: true },
    totalBudget: { type: Number, default: 0, min: 0 }, // USD
    notes: { type: String, trim: true, default: "" },
    resetDate: { type: Date, default: null }, // transactions on/after this date count toward spent
  },
  { timestamps: true },
);

export default mongoose.model("AdsClientBudget", adsClientBudgetSchema);
