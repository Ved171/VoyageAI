export type ActivityType =
  | 'Food & Drink'
  | 'Museum & Art'
  | 'Outdoor & Nature'
  | 'Shopping'
  | 'Entertainment'
  | 'Landmark'
  | 'Other';

export interface Activity {
  name: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  time: string;
  activityType: ActivityType;
}

export interface DayPlan {
  day: number;
  title: string;
  summary: string;
  activities: Activity[];
}

export interface TravelCost {
    mode: 'flight' | 'train' | 'bus' | 'car' | 'other';
    estimatedCost: string;
    costDisclaimer: string;
}

export interface DestinationQuote {
  quote: string;
  author: string;
  translation: string;
}

export interface Itinerary {
  _id?: string;
  memberRole?: 'owner' | 'member';
  destination: string;
  duration: number;
  tripTitle: string;
  tripSummary: string;
  latitude: number;
  longitude: number;
  dailyPlans: DayPlan[];
  packingList: string[];
  travelCost: TravelCost;
  destinationQuote: DestinationQuote;
  localization: Localization;
  isComplete?: boolean;
}

export interface UserPreferences {
  origin: string;
  destination: string;
  duration: number;
  interests: string[];
  budget: 'budget' | 'moderate' | 'luxury';
  preferredTransport?: string;
}

export interface TranslatedStrings {
    aboutUs: string;
}

export interface Localization {
    targetLanguage: string;
    translatedStrings: TranslatedStrings;
}

export interface UserSearchInfo {
  _id: string;
  name: string;
  email: string;
}

export interface TripMemberInfo {
  _id: string;
  tripId: string;
  userId: UserSearchInfo; // Populated by Mongoose
  role: 'owner' | 'member';
  addedAt: string;
}

export interface ExpenseParticipant {
  userId: UserSearchInfo;
  shareAmount: number;
}

export interface Expense {
  _id: string;
  tripId: string;
  title: string;
  amount: number;
  paidBy: UserSearchInfo;
  createdBy: UserSearchInfo;
  date: string;
  notes?: string;
  participants: ExpenseParticipant[];
  createdAt: string;
  updatedAt: string;
}

export interface Settlement {
  _id: string;
  tripId: string;
  fromUser: UserSearchInfo;
  toUser: UserSearchInfo;
  amount: number;
  date: string;
  createdAt: string;
}

export interface BalanceSummary {
  totalTripExpenses: number;
  balances: Record<string, number>; // userId -> net balance
}

export interface Message {
  _id: string;
  tripId: string;
  userId: UserSearchInfo;
  messageText?: string;
  messageType: 'text' | 'image';
  fileUrl?: string; // Legacy
  fileData?: string; // Base64
  createdAt: string;
}