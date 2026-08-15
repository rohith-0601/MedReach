const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const Recipient = require('../models/Recipient');
const OutreachProgram = require('../models/OutreachProgram');

router.post('/', async (req, res) => {
  try {
    const { message, mode, history } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured. Set it in server/.env' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    let systemPrompt = '';
    let dbContext = '';

    if (mode === 'recipient') {
      // Recipient-facing FAQ assistant
      const programCount = await OutreachProgram.countDocuments({ status: 'Sent' });
      const therapyAreas = await Recipient.distinct('therapyArea');
      
      dbContext = `Available therapy programs: ${therapyAreas.filter(Boolean).join(', ')}. Total active outreach programs: ${programCount}.`;
      
      systemPrompt = `You are MedReach Assistant, a helpful FAQ chatbot for patients and healthcare providers enrolled in outreach programs. You can answer questions about:
- How the engagement programs work (medication reminders, wellness check-ins, etc.)
- How to update preferences or subscription status
- General information about available therapy areas: ${dbContext}

IMPORTANT RULES:
- Do NOT answer any medical, clinical, dosage, or treatment questions. If asked, politely redirect the user to consult their healthcare provider.
- Do NOT provide drug names, side effects, or treatment recommendations.
- Keep responses concise, friendly, and professional.
- If you don't know something, say so and suggest contacting program support.`;

    } else if (mode === 'internal') {
      // Internal marketing assistant
      const overduePrograms = await OutreachProgram.find({
        status: 'Draft',
        scheduledAt: { $lt: new Date() }
      }).select('subject programType scheduledAt');

      const recentSent = await OutreachProgram.find({ status: 'Sent' })
        .sort({ sentAt: -1 })
        .limit(5)
        .select('subject programType opens clicks recipientCount sentAt');

      const recipientStats = await Recipient.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 }, avgScore: { $avg: { $cond: [{ $eq: ['$type', 'HCP'] }, '$engagementScore', '$adherenceScore'] } } } }
      ]);

      dbContext = `
OVERDUE PROGRAMS (Draft past scheduled date): ${overduePrograms.length > 0 ? JSON.stringify(overduePrograms) : 'None'}

RECENT SENT PROGRAMS: ${JSON.stringify(recentSent)}

RECIPIENT STATS: ${JSON.stringify(recipientStats)}`;

      systemPrompt = `You are MedReach Internal Marketing Assistant. You help the marketing team with:
1. Drafting outreach program copy (subject lines and email body content) — given a short prompt, generate professional healthcare marketing content. Use fictional therapy program names only (Cardiac Wellness Program, Metabolic Health Program, Respiratory Care Program). Never use real drug names or clinical claims.
2. Generating status digests — summarize overdue programs, recent performance, and recipient engagement trends.
3. Answering questions about the platform's data and suggesting outreach strategies.

CURRENT PLATFORM DATA:
${dbContext}

Keep responses professional, actionable, and data-informed. Format responses in markdown when helpful.`;
    } else {
      return res.status(400).json({ error: 'Invalid mode. Use "recipient" or "internal".' });
    }

    const chatHistory = (history || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContent({
      model: mode === 'internal' ? 'gemini-2.5-flash' : 'gemini-2.5-flash',
      contents: [
        ...chatHistory,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        temperature: mode === 'internal' ? 0.7 : 0.5,
        maxOutputTokens: 1024
      }
    });

    const reply = response.text || 'I apologize, I was unable to generate a response. Please try again.';
    
    res.json({ reply, mode });
  } catch (err) {
    console.error('Chatbot error:', err);
    res.status(500).json({ error: 'Failed to get AI response: ' + err.message });
  }
});

module.exports = router;
