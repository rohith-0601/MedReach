const express = require('express');
const router = express.Router();
const Cohort = require('../models/Cohort');
const Recipient = require('../models/Recipient');

// GET all cohorts
router.get('/', async (req, res) => {
  try {
    const cohorts = await Cohort.find().sort({ createdAt: -1 });
    // Add member count for each cohort
    const cohortsWithCounts = await Promise.all(cohorts.map(async (cohort) => {
      const count = await getFilteredCount(cohort.filterCriteria);
      return { ...cohort.toObject(), memberCount: count };
    }));
    res.json(cohortsWithCounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single cohort
router.get('/:id', async (req, res) => {
  try {
    const cohort = await Cohort.findById(req.params.id);
    if (!cohort) return res.status(404).json({ error: 'Not found' });
    const count = await getFilteredCount(cohort.filterCriteria);
    res.json({ ...cohort.toObject(), memberCount: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET cohort members
router.get('/:id/members', async (req, res) => {
  try {
    const cohort = await Cohort.findById(req.params.id);
    if (!cohort) return res.status(404).json({ error: 'Not found' });
    const members = await getFilteredRecipients(cohort.filterCriteria);
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create cohort
router.post('/', async (req, res) => {
  try {
    const cohort = new Cohort(req.body);
    await cohort.save();
    const count = await getFilteredCount(cohort.filterCriteria);
    res.status(201).json({ ...cohort.toObject(), memberCount: count });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update cohort
router.put('/:id', async (req, res) => {
  try {
    const cohort = await Cohort.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!cohort) return res.status(404).json({ error: 'Not found' });
    const count = await getFilteredCount(cohort.filterCriteria);
    res.json({ ...cohort.toObject(), memberCount: count });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE cohort
router.delete('/:id', async (req, res) => {
  try {
    const cohort = await Cohort.findByIdAndDelete(req.params.id);
    if (!cohort) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function buildFilter(criteria) {
  const filter = {};
  if (!criteria) return filter;
  if (criteria.type) filter.type = criteria.type;
  if (criteria.specialty) filter.specialty = criteria.specialty;
  if (criteria.therapyArea) filter.therapyArea = criteria.therapyArea;
  if (criteria.minEngagement !== undefined || criteria.maxEngagement !== undefined) {
    filter.$or = [];
    const engFilter = {};
    const adhFilter = {};
    if (criteria.minEngagement !== undefined) {
      engFilter.engagementScore = { ...engFilter.engagementScore, $gte: criteria.minEngagement };
      adhFilter.adherenceScore = { ...adhFilter.adherenceScore, $gte: criteria.minEngagement };
    }
    if (criteria.maxEngagement !== undefined) {
      engFilter.engagementScore = { ...engFilter.engagementScore, $lte: criteria.maxEngagement };
      adhFilter.adherenceScore = { ...adhFilter.adherenceScore, $lte: criteria.maxEngagement };
    }
    filter.$or = [engFilter, adhFilter];
  }
  return filter;
}

async function getFilteredRecipients(criteria) {
  return Recipient.find(buildFilter(criteria)).sort({ createdAt: -1 });
}

async function getFilteredCount(criteria) {
  return Recipient.countDocuments(buildFilter(criteria));
}

module.exports = router;
