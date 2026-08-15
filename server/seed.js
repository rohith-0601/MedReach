require('dotenv').config();
const mongoose = require('mongoose');
const Recipient = require('./models/Recipient');
const Cohort = require('./models/Cohort');
const OutreachProgram = require('./models/OutreachProgram');

// Bell-curve distribution helper
function normalRandom(mean, stdDev) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return Math.min(100, Math.max(0, Math.round(mean + num * stdDev)));
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen', 'Charles', 'Lisa', 'Daniel', 'Nancy', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle', 'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Dorothy', 'George', 'Melissa', 'Timothy', 'Deborah', 'Ronald', 'Stephanie', 'Edward', 'Rebecca', 'Jason', 'Sharon', 'Jeffrey', 'Laura', 'Ryan', 'Cynthia', 'Arun', 'Priya', 'Wei', 'Yuki', 'Fatima', 'Omar', 'Sofia', 'Lucas', 'Elena', 'Hans', 'Amara', 'Raj', 'Mei', 'Ali', 'Ingrid', 'Carlos'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts', 'Patel', 'Kumar', 'Chen', 'Kim', 'Singh', 'Nakamura', 'Muller', 'Okafor', 'Johansson', 'Morales'];

const specialties = ['Cardiology', 'Oncology', 'Endocrinology', 'General Practice'];
const therapyAreas = ['Cardiac Wellness Program', 'Metabolic Health Program', 'Respiratory Care Program'];
const hospitals = [
  'Greenfield Medical Center', 'Lakewood Health System', 'Riverdale Community Hospital',
  'Summit Medical Associates', 'Westbrook Clinical Partners', 'Elmwood Health Network',
  'Northshore Regional Medical', 'Pinecrest Health Group', 'Bayview Medical Partners',
  'Cedarwood Health Alliance'
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medreach');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Recipient.deleteMany({});
    await Cohort.deleteMany({});
    await OutreachProgram.deleteMany({});
    console.log('Cleared existing data');

    // Generate 2000 recipients: ~1200 patients (60%), ~800 HCPs (40%)
    const recipients = [];
    const usedEmails = new Set();

    for (let i = 0; i < 2000; i++) {
      const isPatient = i < 1200;
      const first = pick(firstNames);
      const last = pick(lastNames);
      let email = `${first.toLowerCase()}.${last.toLowerCase()}${Math.floor(Math.random() * 99)}@example.com`;
      while (usedEmails.has(email)) {
        email = `${first.toLowerCase()}.${last.toLowerCase()}${Math.floor(Math.random() * 999)}@example.com`;
      }
      usedEmails.add(email);

      if (isPatient) {
        recipients.push({
          type: 'Patient',
          name: `${first} ${last}`,
          email,
          therapyArea: pick(therapyAreas),
          adherenceScore: normalRandom(62, 18),
          engagementScore: normalRandom(55, 20),
          enrollmentDate: randomDate(new Date('2024-06-01'), new Date('2026-07-01')),
          subscribed: Math.random() > 0.08,
          lastOpenDate: Math.random() > 0.3 ? randomDate(new Date('2026-05-01'), new Date('2026-08-15')) : null,
          lastClickDate: Math.random() > 0.5 ? randomDate(new Date('2026-05-01'), new Date('2026-08-15')) : null,
          interactionCount: Math.floor(Math.random() * 25)
        });
      } else {
        recipients.push({
          type: 'HCP',
          name: `Dr. ${first} ${last}`,
          email,
          specialty: pick(specialties),
          hospitalClinic: pick(hospitals),
          engagementScore: normalRandom(68, 15),
          adherenceScore: normalRandom(70, 12),
          subscribed: Math.random() > 0.03,
          lastOpenDate: Math.random() > 0.2 ? randomDate(new Date('2026-05-01'), new Date('2026-08-15')) : null,
          lastClickDate: Math.random() > 0.4 ? randomDate(new Date('2026-05-01'), new Date('2026-08-15')) : null,
          interactionCount: Math.floor(Math.random() * 40)
        });
      }
    }

    const insertedRecipients = await Recipient.insertMany(recipients);
    console.log(`Inserted ${insertedRecipients.length} recipients`);

    // Create cohorts
    const cohorts = await Cohort.insertMany([
      {
        name: 'All Cardiac Patients',
        description: 'Patients enrolled in the Cardiac Wellness Program',
        filterCriteria: { type: 'Patient', therapyArea: 'Cardiac Wellness Program' }
      },
      {
        name: 'Low-Adherence Patients',
        description: 'Patients with adherence score below 45',
        filterCriteria: { type: 'Patient', maxEngagement: 45 }
      },
      {
        name: 'Cardiology HCPs',
        description: 'Healthcare providers specializing in Cardiology',
        filterCriteria: { type: 'HCP', specialty: 'Cardiology' }
      },
      {
        name: 'All HCPs',
        description: 'All healthcare providers across specialties',
        filterCriteria: { type: 'HCP' }
      },
      {
        name: 'Metabolic Health Patients',
        description: 'Patients in the Metabolic Health Program',
        filterCriteria: { type: 'Patient', therapyArea: 'Metabolic Health Program' }
      },
      {
        name: 'Respiratory Care Patients',
        description: 'Patients in the Respiratory Care Program',
        filterCriteria: { type: 'Patient', therapyArea: 'Respiratory Care Program' }
      },
      {
        name: 'High-Engagement HCPs',
        description: 'HCPs with engagement score above 80',
        filterCriteria: { type: 'HCP', minEngagement: 80 }
      }
    ]);
    console.log(`Inserted ${cohorts.length} cohorts`);

    // Create outreach programs
    const programs = await OutreachProgram.insertMany([
      {
        subject: 'Weekly Wellness Check-in: Cardiac Wellness Program',
        body: '# Your Weekly Check-in\n\nDear participant,\n\nThis is your weekly wellness check-in for the Cardiac Wellness Program. We want to ensure you are staying on track with your health goals.\n\n## Quick Reminders\n- Log your daily activities in the wellness tracker\n- Review your progress dashboard\n- Reach out if you have questions about your program\n\nStay well,\nThe MedReach Team',
        programType: 'Wellness Check-in',
        cohortId: cohorts[0]._id,
        status: 'Sent',
        scheduledAt: new Date('2026-08-01T09:00:00'),
        sentAt: new Date('2026-08-01T09:01:00'),
        recipientCount: 38,
        opens: 26,
        clicks: 12
      },
      {
        subject: 'Important: Metabolic Health Program Update',
        body: '# Program Update\n\nDear participant,\n\nWe have exciting updates to the Metabolic Health Program that we want to share with you.\n\n## What\'s New\n- Enhanced tracking features for daily metrics\n- New educational resources in your portal\n- Updated communication preferences available\n\nBest regards,\nMedReach Engagement Team',
        programType: 'New Program Awareness',
        cohortId: cohorts[4]._id,
        status: 'Sent',
        scheduledAt: new Date('2026-07-28T10:00:00'),
        sentAt: new Date('2026-07-28T10:00:00'),
        recipientCount: 35,
        opens: 22,
        clicks: 9
      },
      {
        subject: 'Clinical Content Digest — Q3 Cardiology Updates',
        body: '# Q3 Clinical Content Digest\n\nDear Dr. {{name}},\n\nHere are the latest updates and educational resources curated for cardiology professionals.\n\n## Featured Content\n- Program enrollment trends in cardiac wellness\n- New engagement tools for patient communication\n- Best practices for digital health outreach\n\nReview the full digest in your MedReach portal.',
        programType: 'Clinical Content Digest',
        cohortId: cohorts[2]._id,
        status: 'Sent',
        scheduledAt: new Date('2026-07-20T08:00:00'),
        sentAt: new Date('2026-07-20T08:01:00'),
        recipientCount: 18,
        opens: 14,
        clicks: 8
      },
      {
        subject: 'Reminder: Complete Your Respiratory Care Assessment',
        body: '# Program Reminder\n\nDear participant,\n\nThis is a friendly reminder to complete your monthly assessment for the Respiratory Care Program.\n\nYour input helps us improve the program and better support your health journey.\n\n[Complete Assessment →]',
        programType: 'Medication Reminder',
        cohortId: cohorts[5]._id,
        status: 'Sent',
        scheduledAt: new Date('2026-08-05T11:00:00'),
        sentAt: new Date('2026-08-05T11:00:00'),
        recipientCount: 33,
        opens: 19,
        clicks: 7
      },
      {
        subject: 'Enrollment Follow-up: Welcome to Your Program',
        body: '# Welcome!\n\nDear participant,\n\nThank you for enrolling in your health program. We are excited to support your wellness journey.\n\n## Getting Started\n- Set up your communication preferences\n- Explore the patient portal\n- Read through our program guide\n\nWe are here to help!',
        programType: 'Enrollment Follow-up',
        cohortId: cohorts[0]._id,
        status: 'Sent',
        scheduledAt: new Date('2026-08-10T09:00:00'),
        sentAt: new Date('2026-08-10T09:01:00'),
        recipientCount: 38,
        opens: 30,
        clicks: 15
      },
      {
        subject: 'HCP Engagement Digest — August 2026',
        body: '# Monthly HCP Engagement Digest\n\nDear colleagues,\n\nHere is your monthly engagement summary with key metrics and insights from the MedReach platform.\n\n## Highlights\n- Patient enrollment up 12% across all programs\n- New content resources available\n- Engagement optimization recommendations\n\nBest,\nMedReach Analytics Team',
        programType: 'Clinical Content Digest',
        cohortId: cohorts[3]._id,
        status: 'Scheduled',
        scheduledAt: new Date('2026-08-20T10:00:00'),
        recipientCount: 0,
        opens: 0,
        clicks: 0
      },
      {
        subject: 'Low-Adherence Outreach: We Miss You',
        body: '# Stay Connected\n\nDear participant,\n\nWe noticed you haven\'t engaged with your program recently. We are here to help and want to make sure you have everything you need.\n\n## How Can We Help?\n- Update your preferences anytime\n- Access support resources\n- Connect with your care team\n\nYour health journey matters to us.',
        programType: 'Wellness Check-in',
        cohortId: cohorts[1]._id,
        status: 'Draft',
        scheduledAt: new Date('2026-08-12T08:00:00'),
        recipientCount: 0,
        opens: 0,
        clicks: 0
      },
      {
        subject: 'New Digital Tools for Patient Engagement',
        body: '# New Platform Features\n\nDear Dr. {{name}},\n\nWe are excited to announce new digital engagement tools available on the MedReach platform.\n\n## New Features\n- AI-powered content suggestions\n- Advanced cohort segmentation\n- Real-time engagement analytics\n\nLog in to explore these new capabilities.',
        programType: 'New Program Awareness',
        cohortId: cohorts[3]._id,
        status: 'Scheduled',
        scheduledAt: new Date('2026-08-25T14:00:00'),
        recipientCount: 0,
        opens: 0,
        clicks: 0
      },
      {
        subject: 'Cardiac Wellness Program: Monthly Progress Report',
        body: '# Your Monthly Progress\n\nDear participant,\n\nHere is your monthly progress summary for the Cardiac Wellness Program.\n\nContinue tracking your health metrics in the portal for the most accurate insights.\n\nKeep up the great work!',
        programType: 'Wellness Check-in',
        cohortId: cohorts[0]._id,
        status: 'Sent',
        scheduledAt: new Date('2026-07-15T09:00:00'),
        sentAt: new Date('2026-07-15T09:00:00'),
        recipientCount: 38,
        opens: 24,
        clicks: 10
      },
      {
        subject: 'Q4 Planning: Engagement Strategy Preview',
        body: '# Q4 Engagement Planning\n\nDear team,\n\nAs we approach Q4, here is a preview of our planned engagement strategies and upcoming programs.\n\n## Planned Initiatives\n- Expanded respiratory care outreach\n- Enhanced metabolic health tracking\n- Cross-program engagement optimization',
        programType: 'New Program Awareness',
        cohortId: cohorts[3]._id,
        status: 'Draft',
        scheduledAt: null,
        recipientCount: 0,
        opens: 0,
        clicks: 0
      }
    ]);
    console.log(`Inserted ${programs.length} outreach programs`);

    console.log('\nSeed completed successfully!');
    console.log(`- ${insertedRecipients.length} recipients (${insertedRecipients.filter(r => r.type === 'Patient').length} patients, ${insertedRecipients.filter(r => r.type === 'HCP').length} HCPs)`);
    console.log(`- ${cohorts.length} cohorts`);
    console.log(`- ${programs.length} outreach programs`);

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
