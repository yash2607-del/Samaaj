import mongoose from 'mongoose';

const { Schema } = mongoose;


const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },  
  password: { type: String, required: true },
  role: { type: String, enum: ['Citizen', 'Moderator'], required: true }
}, {
  timestamps: true,
  versionKey: false
});
const User = mongoose.models.User || mongoose.model('User', userSchema, 'users');


const citizenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Citizen'], required: true },
  location: { type: String, required: true }
}, {
  timestamps: true,
  versionKey: false
});
const Citizen = mongoose.models.Citizen || mongoose.model('Citizen', citizenSchema, 'citizen');


const moderatorSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Moderator'], required: true },
  // store as ObjectId referencing Department; keep not-required during migration
  department: { type: Schema.Types.ObjectId, ref: 'Department', required: false },
  assignedArea: { type: String, required: false }
}, {
  timestamps: true,
  versionKey: false
});
const Moderator = mongoose.models.Moderator || mongoose.model('Moderator', moderatorSchema, 'moderator');

export { User, Citizen, Moderator };