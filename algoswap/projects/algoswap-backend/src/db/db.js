import mongoose from "mongoose";

const PoolSchema = new mongoose.Schema({
  name: String,
  feeTier: { type: Number, default: 0.003 },
  tvl: Number,
  liquidity: String,
});

const TransactionSchema = new mongoose.Schema({
  poolId: { type: mongoose.Schema.Types.ObjectId, ref: "Pool", required: true },
  amountA: { type: Number, required: true },
  amountB: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

export const Pool = mongoose.model("Pool", PoolSchema);
export const Transaction = mongoose.model("Transaction", TransactionSchema);
