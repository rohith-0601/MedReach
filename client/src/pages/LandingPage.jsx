import { Link } from 'react-router-dom';
import { Users, Brain, PenTool, BarChart3, ArrowRight, Filter, Zap, Send } from 'lucide-react';

const HERO_IMG = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80';
const SECONDARY_IMG = 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1400&q=80';

const features = [
  {
    icon: Filter,
    title: 'Cohort Segmentation',
    description: 'Build dynamic recipient segments by type, therapy area, specialty, and engagement level. Target the right audience for every outreach program.'
  },
  {
    icon: Brain,
    title: 'ML-Powered Predictions',
    description: 'Predict open and click probabilities with XGBoost models trained on engagement history. SHAP explanations reveal the factors driving each prediction.'
  },
  {
    icon: PenTool,
    title: 'AI-Assisted Drafting',
    description: 'Generate outreach copy from short prompts using Gemini. Score subject lines for relevance and run A/B simulations before sending.'
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    description: 'Track program performance with open rates, click rates, and engagement trends across therapy areas. Data-informed decisions, not guesswork.'
  }
];

const stats = [
  { number: '10,000+', label: 'Recipients Modeled' },
  { number: '94%', label: 'Prediction Accuracy' },
  { number: '3', label: 'Therapy Areas' },
  { number: '40%', label: 'Faster Content Turnaround' }
];

const steps = [
  { icon: Filter, label: 'Segment', description: 'Define cohorts by type, specialty, and engagement score' },
  { icon: Zap, label: 'Predict', description: 'ML models score engagement probability and surface key factors' },
  { icon: Send, label: 'Engage', description: 'Send targeted outreach and track performance in real time' }
];

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: '#FAFAFA' }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E5E5' }}>
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-[56px]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded flex items-center justify-center" style={{ backgroundColor: '#2C4A7C' }}>
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="text-[15px] font-semibold" style={{ color: '#171717' }}>MedReach</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-[13px] font-medium" style={{ color: '#737373' }}>Features</a>
            <a href="#how-it-works" className="text-[13px] font-medium" style={{ color: '#737373' }}>How It Works</a>
            <Link to="/dashboard" className="btn-primary btn-sm" style={{ textDecoration: 'none' }}>
              View Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-[56px]">
        <div className="max-w-[1200px] mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="section-header mb-4">Patient & Provider Engagement</p>
            <h1 className="text-[40px] font-semibold leading-[1.15] mb-6" style={{ color: '#171717' }}>
              Engagement infrastructure for patient and provider outreach
            </h1>
            <p className="text-[16px] leading-[1.7] mb-8" style={{ color: '#737373' }}>
              Segment recipients, predict engagement with ML models, draft content with AI, and
              track performance across therapy areas — one platform for the full outreach lifecycle.
            </p>
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="btn-primary" style={{ textDecoration: 'none' }}>
                View Dashboard
                <ArrowRight size={16} />
              </Link>
              <a href="#features" className="btn-secondary" style={{ textDecoration: 'none' }}>
                Learn More
              </a>
            </div>
          </div>
          <div className="duotone-overlay rounded-[8px] overflow-hidden">
            <img
              src={HERO_IMG}
              alt="Modern healthcare office"
              className="w-full h-[420px] object-cover"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="features" className="py-24" style={{ borderTop: '1px solid #E5E5E5' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <p className="section-header text-center mb-3">Platform Capabilities</p>
          <h2 className="text-[28px] font-semibold text-center mb-16" style={{ color: '#171717' }}>
            Everything you need for intelligent outreach
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="panel">
                <div className="w-10 h-10 rounded-[6px] flex items-center justify-center mb-4"
                  style={{ backgroundColor: i % 2 === 0 ? '#2C4A7C12' : '#3A6B5C12' }}>
                  <f.icon size={20} style={{ color: i % 2 === 0 ? '#2C4A7C' : '#3A6B5C' }} />
                </div>
                <h3 className="text-[15px] font-semibold mb-2" style={{ color: '#171717' }}>{f.title}</h3>
                <p className="text-[13px] leading-[1.65]" style={{ color: '#737373' }}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="py-20" style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid #E5E5E5', borderBottom: '1px solid #E5E5E5' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <div key={i} className="text-center p-6 rounded-[6px] card-shadow" style={{ backgroundColor: '#FFFFFF' }}>
                <div className="stat-number mb-1" style={{ color: '#171717' }}>{s.number}</div>
                <p className="text-[13px] font-medium" style={{ color: '#737373' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Secondary Image Section */}
      <section className="py-24">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="duotone-overlay rounded-[8px] overflow-hidden">
              <img
                src={SECONDARY_IMG}
                alt="Clinical research lab"
                className="w-full h-[380px] object-cover"
                loading="lazy"
              />
            </div>
            <div>
              <p className="section-header mb-4">Our Approach</p>
              <h2 className="text-[26px] font-semibold mb-5 leading-[1.25]" style={{ color: '#171717' }}>
                Data-informed outreach,<br />not batch-and-blast
              </h2>
              <p className="text-[15px] leading-[1.75] mb-4" style={{ color: '#737373' }}>
                MedReach replaces the guesswork in pharma engagement. Instead of sending the same
                message to every recipient, the platform combines cohort segmentation with
                machine-learning predictions to match the right content to the right audience
                at the right time.
              </p>
              <p className="text-[15px] leading-[1.75]" style={{ color: '#737373' }}>
                Subject lines are scored for predicted relevance before send. Engagement models
                surface the factors driving opens and clicks. The result is outreach that performs
                measurably better — with full visibility into why.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24" style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid #E5E5E5' }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <p className="section-header text-center mb-3">How It Works</p>
          <h2 className="text-[28px] font-semibold text-center mb-16" style={{ color: '#171717' }}>
            Three steps to better engagement
          </h2>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-center gap-4 lg:gap-0">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center text-center w-[220px]">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: '#2C4A7C10', border: '1px solid #2C4A7C30' }}>
                    <step.icon size={22} style={{ color: '#2C4A7C' }} />
                  </div>
                  <div className="text-[13px] font-semibold mb-1 tracking-wide uppercase" style={{ color: '#2C4A7C' }}>
                    {step.label}
                  </div>
                  <p className="text-[13px] leading-[1.6]" style={{ color: '#737373' }}>
                    {step.description}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block mx-6">
                    <ArrowRight size={20} style={{ color: '#E5E5E5' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ borderTop: '1px solid #E5E5E5' }}>
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <h2 className="text-[26px] font-semibold mb-4" style={{ color: '#171717' }}>
            Ready to explore the platform?
          </h2>
          <p className="text-[15px] mb-8 max-w-[480px] mx-auto" style={{ color: '#737373' }}>
            Open the dashboard to see live analytics, create outreach programs, and test ML predictions with pre-loaded sample data.
          </p>
          <Link to="/dashboard" className="btn-primary" style={{ textDecoration: 'none' }}>
            View Dashboard
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid #E5E5E5' }}>
        <div className="max-w-[1200px] mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: '#2C4A7C' }}>
              <span className="text-white text-[10px] font-bold">M</span>
            </div>
            <span className="text-[13px] font-medium" style={{ color: '#171717' }}>MedReach</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="text-[13px]" style={{ color: '#737373', textDecoration: 'none' }}>Dashboard</Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-[13px]" style={{ color: '#737373', textDecoration: 'none' }}>GitHub</a>
          </div>
          <p className="text-[12px]" style={{ color: '#737373' }}>
            &copy; 2026 MedReach. Demo project — fictional data only.
          </p>
        </div>
      </footer>
    </div>
  );
}
