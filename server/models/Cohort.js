const mongoose = require('mongoose');

const cohortSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  filterCriteria: {
    type: { type: String, enum: ['HCP', 'Patient', ''] },
    specialty: { type: String },
    therapyArea: { type: String },
    minEngagement: { type: Number },
    maxEngagement: { type: Number }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cohort', cohortSchema);
