import mongoose, { Schema, Document } from 'mongoose';

export interface ITripMember extends Document {
  tripId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: 'owner' | 'member';
  addedAt: Date;
}

const TripMemberSchema = new Schema<ITripMember>(
  {
    tripId: { type: Schema.Types.ObjectId, ref: 'Itinerary', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'member'], required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Prevent duplicate members per trip
TripMemberSchema.index({ tripId: 1, userId: 1 }, { unique: true });

export default mongoose.model<ITripMember>('TripMember', TripMemberSchema);
