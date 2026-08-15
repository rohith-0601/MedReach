const mongoose = require('mongoose');

const outreachProgramSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  body: { type: String },
  programType: {
    type: String,
    enum: ['Medication Reminder', 'New Program Awareness', 'Clinical Content Digest', 'Enrollment Follow-up', 'Wellness Check-in'],
    default: 'New Program Awareness'
  },
  cohortId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cohort' },
  status: {
    type: String,
    enum: ['Draft', 'Scheduled', 'Sent'],
    default: 'Draft'
  },
  scheduledAt: { type: Date },
  sentAt: { type: Date },
  recipientCount: { type: Number, default: 0 },
  opens: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

outreachProgramSchema.index({ status: 1 });
outreachProgramSchema.index({ sentAt: -1 });

module.exports = mongoose.model('OutreachProgram', outreachProgramSchema);
