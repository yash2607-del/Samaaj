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
const User = mongoose.model('User', userSchema, 'users');


const citizenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Citizen'], required: true },
  location: { type: String, required: true },
  issueCategory: { type: String }
}, {
  timestamps: true,
  versionKey: false
});
const Citizen = mongoose.model('Citizen', citizenSchema, 'citizen');


const moderatorSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Moderator'], required: true },
  department: { type: String, required: true },
  assignedArea: { type: String, required: true }
}, {
  timestamps: true,
  versionKey: false
});
const Moderator = mongoose.model('Moderator', moderatorSchema, 'moderator');

export { User, Citizen, Moderator };