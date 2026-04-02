import mongoose, { Schema, Document } from 'mongoose';

export interface IExpenseParticipant {
  userId: mongoose.Types.ObjectId;
  shareAmount: number;
}

export interface IExpense extends Document {
  tripId: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  paidBy: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  date: Date;
  notes?: string;
  participants: IExpenseParticipant[];
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseParticipantSchema = new Schema<IExpenseParticipant>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  shareAmount: { type: Number, required: true, min: 0 }
}, { _id: false });

const ExpenseSchema = new Schema<IExpense>({
  tripId: { type: Schema.Types.ObjectId, ref: 'Itinerary', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true, min: 0.01 },
  paidBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  notes: { type: String, trim: true },
  participants: { 
    type: [ExpenseParticipantSchema], 
    required: true, 
    validate: [(val: any[]) => val.length > 0, 'Must have at least one participant'] 
  }
}, { timestamps: true });

// Index for fast querying by trip
ExpenseSchema.index({ tripId: 1, date: -1 });

export default mongoose.model<IExpense>('Expense', ExpenseSchema);
