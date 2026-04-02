import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity {
  name: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  time: string;
  activityType: string;
}

export interface IDayPlan {
  day: number;
  title: string;
  summary: string;
  activities: IActivity[];
}

export interface ITravelCost {
  mode: 'flight' | 'train' | 'other';
  estimatedCost: string;
  costDisclaimer: string;
}

export interface IDestinationQuote {
  quote: string;
  author: string;
  translation: string;
}

export interface ILocalization {
  targetLanguage: string;
  translatedStrings: {
    aboutUs: string;
  };
}

export interface IItinerary extends Document {
  userId: mongoose.Types.ObjectId;
  destination: string;
  duration: number;
  tripTitle: string;
  tripSummary: string;
  dailyPlans: IDayPlan[];
  packingList: string[];
  travelCost: ITravelCost;
  destinationQuote: IDestinationQuote;
  localization: ILocalization;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  time: { type: String, required: true },
  activityType: { type: String, required: true },
});

const DayPlanSchema = new Schema<IDayPlan>({
  day: { type: Number, required: true },
  title: { type: String, required: true },
  summary: { type: String, required: true },
  activities: [ActivitySchema],
});

const ItinerarySchema = new Schema<IItinerary>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    destination: { type: String, required: true },
    duration: { type: Number, required: true },
    tripTitle: { type: String, required: true },
    tripSummary: { type: String, required: true },
    dailyPlans: [DayPlanSchema],
    packingList: [{ type: String }],
    travelCost: {
      mode: { type: String, enum: ['flight', 'train', 'bus', 'car', 'other'], default: 'other' },
      estimatedCost: String,
      costDisclaimer: String,
    },
    destinationQuote: {
      quote: String,
      author: String,
      translation: String,
    },
    localization: {
      targetLanguage: String,
      translatedStrings: {
        aboutUs: String,
      },
    },
    isComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IItinerary>('Itinerary', ItinerarySchema);
