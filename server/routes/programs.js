const express = require('express');
const router = express.Router();
const OutreachProgram = require('../models/OutreachProgram');
const Cohort = require('../models/Cohort');
const Recipient = require('../models/Recipient');

// GET all programs
router.get('/', async (req, res) => {
  try {
    const { status, programType } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (programType) filter.programType = programType;
    const programs = await OutreachProgram.find(filter).populate('cohortId').sort({ createdAt: -1 });
    res.json(programs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single program
router.get('/:id', async (req, res) => {
  try {
    const program = await OutreachProgram.findById(req.params.id).populate('cohortId');
    if (!program) return res.status(404).json({ error: 'Not found' });
    res.json(program);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create program
router.post('/', async (req, res) => {
  try {
    const program = new OutreachProgram(req.body);
    await program.save();
    const populated = await program.populate('cohortId');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update program
router.put('/:id', async (req, res) => {
  try {
    const program = await OutreachProgram.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('cohortId');
    if (!program) return res.status(404).json({ error: 'Not found' });
    res.json(program);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE program
router.delete('/:id', async (req, res) => {
  try {
    const program = await OutreachProgram.findByIdAndDelete(req.params.id);
    if (!program) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST send/simulate program
router.post('/:id/send', async (req, res) => {
  try {
    const program = await OutreachProgram.findById(req.params.id).populate('cohortId');
    if (!program) return res.status(404).json({ error: 'Not found' });

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

    // Simulate engagement metrics
    const openRate = 0.25 + Math.random() * 0.45; // 25-70% open rate
    const clickRate = openRate * (0.15 + Math.random() * 0.35); // 15-50% of opens click

    program.status = 'Sent';
    program.sentAt = new Date();
    program.recipientCount = recipientCount;
    program.opens = Math.round(recipientCount * openRate);
    program.clicks = Math.round(recipientCount * clickRate);
    await program.save();

    res.json(program);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST simulate open/click tracking
router.post('/:id/track', async (req, res) => {
  try {
    const { event } = req.body; // 'open' or 'click'
    const program = await OutreachProgram.findById(req.params.id);
    if (!program) return res.status(404).json({ error: 'Not found' });
    
    if (event === 'open') {
      program.opens = (program.opens || 0) + 1;
    } else if (event === 'click') {
      program.clicks = (program.clicks || 0) + 1;
    }
    await program.save();
    res.json(program);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
