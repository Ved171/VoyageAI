import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export interface IFavorite {
  name: string;
  description: string;
  image: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  refreshToken: string | null;
  favorites: IFavorite[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    refreshToken: {
      type: String,
      default: null,
    },
    favorites: [
      {
        name: String,
        description: String,
        image: String,
      },
    ],
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password and refreshToken from JSON output
UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { password, refreshToken, ...rest } = ret;
    return rest;
  },
});

export default mongoose.model<IUser>('User', UserSchema);
