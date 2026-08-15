const mongoose = require('mongoose');

const recipientSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['HCP', 'Patient'],
    required: true
  },
  name: { type: String, required: true },
  email: { type: String, required: true },
  // HCP fields
  specialty: { type: String },
  hospitalClinic: { type: String },
  engagementScore: { type: Number, default: 50, min: 0, max: 100 },
  // Patient fields
  therapyArea: { type: String },
  adherenceScore: { type: Number, default: 50, min: 0, max: 100 },
  enrollmentDate: { type: Date },
  subscribed: { type: Boolean, default: true },
  // Common
  lastOpenDate: { type: Date },
  lastClickDate: { type: Date },
  interactionCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Recipient', recipientSchema);
