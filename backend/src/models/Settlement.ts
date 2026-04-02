import mongoose, { Schema, Document } from 'mongoose';

export interface ISettlement extends Document {
  tripId: mongoose.Types.ObjectId;
  fromUser: mongoose.Types.ObjectId;
  toUser: mongoose.Types.ObjectId;
  amount: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SettlementSchema = new Schema<ISettlement>({
  tripId: { type: Schema.Types.ObjectId, ref: 'Itinerary', required: true },
  fromUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  toUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0.01 },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for fast querying by trip
SettlementSchema.index({ tripId: 1, date: -1 });

export default mongoose.model<ISettlement>('Settlement', SettlementSchema);
