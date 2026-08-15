require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medreach')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// API Routes
app.use('/api/recipients', require('./routes/recipients'));
app.use('/api/cohorts', require('./routes/cohorts'));
app.use('/api/programs', require('./routes/programs'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/chatbot', require('./routes/chatbot'));

// ML Service Proxy
app.use('/api/ml', createProxyMiddleware({
  target: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  changeOrigin: true,
  pathRewrite: { '^/api/ml': '' }
}));

// Email scheduler - check for scheduled programs every minute
const OutreachProgram = require('./models/OutreachProgram');
const Recipient = require('./models/Recipient');

cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const duePrograms = await OutreachProgram.find({
      status: 'Scheduled',
      scheduledAt: { $lte: now }
    }).populate('cohortId');

    for (const program of duePrograms) {
      let recipientCount = 0;
      if (program.cohortId && program.cohortId.filterCriteria) {
        const filter = {};
        const criteria = program.cohortId.filterCriteria;
        if (criteria.type) filter.type = criteria.type;
        if (criteria.specialty) filter.specialty = criteria.specialty;
        if (criteria.therapyArea) filter.therapyArea = criteria.therapyArea;
        recipientCount = await Recipient.countDocuments(filter);
      } else {
        recipientCount = await Recipient.countDocuments();
      }

      // Simulate realistic engagement
      const openRate = 0.25 + Math.random() * 0.45;
      const clickRate = openRate * (0.15 + Math.random() * 0.35);

      program.status = 'Sent';
      program.sentAt = now;
      program.recipientCount = recipientCount;
      program.opens = Math.round(recipientCount * openRate);
      program.clicks = Math.round(recipientCount * clickRate);
      await program.save();
      
      console.log(`Auto-sent program: "${program.subject}" to ${recipientCount} recipients`);
    }
  } catch (err) {
    console.error('Cron job error:', err);
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`MedReach server running on port ${PORT}`);
});
