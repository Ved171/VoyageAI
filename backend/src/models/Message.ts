import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  tripId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  messageText?: string;
  messageType: 'text' | 'image';
  fileUrl?: string; // Legacy
  fileData?: string; // Base64 Data
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  tripId: { type: Schema.Types.ObjectId, ref: 'Itinerary', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  messageText: { type: String, trim: true },
  messageType: { type: String, enum: ['text', 'image'], default: 'text' },
  fileUrl: { type: String, trim: true },
  fileData: { type: String }
}, { timestamps: true });

// Index for fast querying by trip (paginated)
MessageSchema.index({ tripId: 1, createdAt: -1 });

export default mongoose.model<IMessage>('Message', MessageSchema);
