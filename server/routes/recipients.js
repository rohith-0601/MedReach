const express = require('express');
const router = express.Router();
const Recipient = require('../models/Recipient');
const multer = require('multer');
const csv = require('csv-parser');
const { Readable } = require('stream');

const upload = multer({ storage: multer.memoryStorage() });

// GET all recipients
router.get('/', async (req, res) => {
  try {
    const { type, specialty, therapyArea, search } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (specialty) filter.specialty = specialty;
    if (therapyArea) filter.therapyArea = therapyArea;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    const recipients = await Recipient.find(filter).sort({ createdAt: -1 });
    res.json(recipients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single recipient
router.get('/:id', async (req, res) => {
  try {
    const recipient = await Recipient.findById(req.params.id);
    if (!recipient) return res.status(404).json({ error: 'Not found' });
    res.json(recipient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create recipient
router.post('/', async (req, res) => {
  try {
    const recipient = new Recipient(req.body);
    await recipient.save();
    res.status(201).json(recipient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update recipient
router.put('/:id', async (req, res) => {
  try {
    const recipient = await Recipient.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!recipient) return res.status(404).json({ error: 'Not found' });
    res.json(recipient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE recipient
router.delete('/:id', async (req, res) => {
  try {
    const recipient = await Recipient.findByIdAndDelete(req.params.id);
    if (!recipient) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST bulk import via CSV
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const results = [];
    const stream = Readable.from(req.file.buffer.toString());
    
    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data) => {
          const recipient = {
            type: data.type || 'Patient',
            name: data.name,
            email: data.email,
            specialty: data.specialty || undefined,
            therapyArea: data.therapyArea || data.therapy_area || undefined,
            hospitalClinic: data.hospitalClinic || data.hospital || undefined,
            engagementScore: data.engagementScore ? Number(data.engagementScore) : 50,
            adherenceScore: data.adherenceScore ? Number(data.adherenceScore) : 50,
            subscribed: data.subscribed !== 'false',
            enrollmentDate: data.enrollmentDate ? new Date(data.enrollmentDate) : new Date()
          };
          results.push(recipient);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    const inserted = await Recipient.insertMany(results);
    res.status(201).json({ imported: inserted.length, recipients: inserted });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
