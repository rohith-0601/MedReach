const express = require('express');
const router = express.Router();
const Recipient = require('../models/Recipient');
const OutreachProgram = require('../models/OutreachProgram');

// GET dashboard summary
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalRecipients,
      hcpCount,
      patientCount,
      totalPrograms,
      sentPrograms,
      draftPrograms,
      scheduledPrograms,
      patientEngagement,
      hcpEngagement,
      programStats,
      programPerformance,
      avgEngagement,
      avgAdherence,
      recentPrograms
    ] = await Promise.all([
      Recipient.countDocuments(),
      Recipient.countDocuments({ type: 'HCP' }),
      Recipient.countDocuments({ type: 'Patient' }),
      OutreachProgram.countDocuments(),
      OutreachProgram.countDocuments({ status: 'Sent' }),
      OutreachProgram.countDocuments({ status: 'Draft' }),
      OutreachProgram.countDocuments({ status: 'Scheduled' }),
      Recipient.aggregate([
        { $match: { type: 'Patient' } },
        { $group: { _id: '$therapyArea', avgAdherence: { $avg: '$adherenceScore' }, count: { $sum: 1 } } }
      ]),
      Recipient.aggregate([
        { $match: { type: 'HCP' } },
        { $group: { _id: '$specialty', avgEngagement: { $avg: '$engagementScore' }, count: { $sum: 1 } } }
      ]),
      OutreachProgram.aggregate([
        { $match: { status: 'Sent' } },
        { $group: {
          _id: null,
          totalSent: { $sum: '$recipientCount' },
          totalOpens: { $sum: '$opens' },
          totalClicks: { $sum: '$clicks' },
          avgOpenRate: { $avg: { $cond: [{ $gt: ['$recipientCount', 0] }, { $divide: ['$opens', '$recipientCount'] }, 0] } },
          avgClickRate: { $avg: { $cond: [{ $gt: ['$recipientCount', 0] }, { $divide: ['$clicks', '$recipientCount'] }, 0] } }
        }}
      ]),
      OutreachProgram.find({ status: 'Sent' }).select('subject programType recipientCount opens clicks sentAt').sort({ sentAt: -1 }).limit(10),
      Recipient.aggregate([
        { $match: { type: 'HCP' } },
        { $group: { _id: null, avg: { $avg: '$engagementScore' } } }
      ]),
      Recipient.aggregate([
        { $match: { type: 'Patient' } },
        { $group: { _id: null, avg: { $avg: '$adherenceScore' } } }
      ]),
      OutreachProgram.find().populate('cohortId').sort({ createdAt: -1 }).limit(5)
    ]);

    res.json({
      recipients: { total: totalRecipients, hcp: hcpCount, patient: patientCount },
      programs: { total: totalPrograms, sent: sentPrograms, draft: draftPrograms, scheduled: scheduledPrograms },
      patientEngagement,
      hcpEngagement,
      programStats: programStats[0] || { totalSent: 0, totalOpens: 0, totalClicks: 0, avgOpenRate: 0, avgClickRate: 0 },
      programPerformance,
      averages: {
        engagement: avgEngagement[0]?.avg || 0,
        adherence: avgAdherence[0]?.avg || 0
      },
      recentPrograms
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET per-program analytics
router.get('/programs/:id', async (req, res) => {
  try {
    const program = await OutreachProgram.findById(req.params.id).populate('cohortId');
    if (!program) return res.status(404).json({ error: 'Not found' });
    
    const openRate = program.recipientCount > 0 ? (program.opens / program.recipientCount) : 0;
    const clickRate = program.recipientCount > 0 ? (program.clicks / program.recipientCount) : 0;
    const clickToOpenRate = program.opens > 0 ? (program.clicks / program.opens) : 0;

    res.json({
      program,
      metrics: {
        recipientCount: program.recipientCount,
        opens: program.opens,
        clicks: program.clicks,
        openRate: Math.round(openRate * 100),
        clickRate: Math.round(clickRate * 100),
        clickToOpenRate: Math.round(clickToOpenRate * 100)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
