/**
 * Setup Hub — Authentic LifeOS Crew Onboarding Journey
 * Matches the original runlifeos.com experience:
 * Selam (Host) -> Tena (Health) -> Menged (Life Foundations) -> Bereket (Finances)
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/useUserStore';
import { getPhasePercents, type PhaseId } from '../lib/onboarding-phases';
import {
  ArrowLeft, ChevronRight, ChevronDown, Check,
  Clock, Lock, FastForward, Sparkles,
} from 'lucide-react';
import './SetupHub.css';

interface KeeperDef {
  id: PhaseId;
  keeperName: string;
  role: string;
  title: string;
  description: string;
  color: string;
  route: string;
}

const KEEPERS: KeeperDef[] = [
  {
    id: 'health',
    keeperName: 'TENA',
    role: 'KEEPER OF THE BODY',
    title: 'Health & Body',
    description: "Selam's first handoff: Tena maps sleep, movement, food, energy, and stress.",
    color: '#4ADE80',
    route: '/setup/health',
  },
  {
    id: 'life',
    keeperName: 'MENGED',
    role: 'KEEPER OF YOUR COMPASS',
    title: 'Life Foundations',
    description: 'Then Menged names your values, goals, habits, and what matters most.',
    color: '#38BDF8',
    route: '/setup/life',
  },
  {
    id: 'finance',
    keeperName: 'BEREKET',
    role: 'KEEPER OF YOUR MEANS',
    title: 'Money & Finances',
    description: 'Finally Bereket maps work, obligations, savings, and the money side.',
    color: '#FBBF24',
    route: '/setup/finance',
  },
];

export function SetupHub() {
  const navigate = useNavigate();
  const profile = useUserStore(s => s.profile);
  const prefs = (profile?.preferences || {}) as Record<string, unknown>;
  const percents = getPhasePercents(prefs);
  const [faqOpen, setFaqOpen] = useState(false);

  // Find first non-completed keeper for primary CTA
  const nextKeeper = KEEPERS.find(k => (percents[k.id] || 0) < 100) || KEEPERS[0];

  return (
    <div className="setup-hub-page">
      {/* Top Header */}
      <header className="setup-hub-header">
        <button
          className="setup-hub-back-btn"
          onClick={() => navigate('/')}
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={18} />
          <span>Back to Today</span>
        </button>
        <h1 className="setup-hub-header-title">Life Setup</h1>
        <div style={{ width: 80 }} /> {/* Spacer for balance */}
      </header>

      {/* Main Content Area */}
      <main className="setup-hub-content">
        {/* Hero Card */}
        <section className="setup-hero-card">
          <div className="setup-badge-crew">
            <Sparkles size={13} />
            <span>SELAM, THE FIRST FRIEND</span>
          </div>

          <h2 className="setup-hero-title">
            Let's make LifeOS yours.
          </h2>

          <p className="setup-hero-subtitle">
            One short journey with your Crew — your body first, then your path, then the means that carry it.
          </p>

          <div className="setup-pill-group">
            <span className="setup-pill">
              <Clock size={13} style={{ color: '#4ADE80' }} />
              About 5 minutes
            </span>
            <span className="setup-pill">
              <Lock size={13} style={{ color: '#38BDF8' }} />
              Private to you
            </span>
            <span className="setup-pill">
              <FastForward size={13} style={{ color: '#FBBF24' }} />
              Skip anytime
            </span>
          </div>

          <div className="setup-hero-actions">
            <button
              className="setup-primary-btn"
              onClick={() => navigate(nextKeeper.route)}
            >
              <span>Begin with {nextKeeper.keeperName.charAt(0) + nextKeeper.keeperName.slice(1).toLowerCase()} ~5 min</span>
              <ChevronRight size={16} />
            </button>

            <button
              className="setup-secondary-link"
              onClick={() => navigate('/')}
            >
              Skip for now — take me to Today
            </button>
          </div>
        </section>

        {/* The 3 Keepers Cards */}
        <section className="setup-keepers-grid">
          {KEEPERS.map(keeper => {
            const pct = percents[keeper.id] || 0;
            const isCompleted = pct >= 100;

            return (
              <div
                key={keeper.id}
                className={`setup-keeper-card ${isCompleted ? 'completed' : ''}`}
                style={{ '--keeper-color': keeper.color } as React.CSSProperties}
                onClick={() => navigate(keeper.route)}
              >
                <div className="setup-keeper-left">
                  <span className="setup-keeper-badge">
                    {keeper.keeperName}, {keeper.role}
                  </span>
                  <h3 className="setup-keeper-title">
                    {keeper.title}
                  </h3>
                  <p className="setup-keeper-desc">
                    {keeper.description}
                  </p>
                </div>

                <div className="setup-keeper-right">
                  {isCompleted ? (
                    <span className="setup-keeper-status-done">
                      <Check size={16} /> Completed
                    </span>
                  ) : (
                    <span className="setup-keeper-btn">
                      <span>{pct > 0 ? `${pct}% Continue` : 'Start'}</span>
                      <ChevronRight size={14} />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {/* What is this? Accordion */}
        <section className="setup-faq-accordion">
          <button
            type="button"
            className="setup-faq-trigger"
            onClick={() => setFaqOpen(prev => !prev)}
            aria-expanded={faqOpen}
          >
            <span>What is this?</span>
            <ChevronDown
              size={16}
              style={{
                transform: faqOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease',
              }}
            />
          </button>

          {faqOpen && (
            <div className="setup-faq-content">
              <p>
                <strong>The Crew</strong> is your personal AI council inside LifeOS. Instead of filling out hundreds of tedious settings forms, you have brief, focused conversations with three specialized Keepers:
              </p>
              <p>
                • <strong>Tena (Health & Body):</strong> Establishes your sleep schedule, nutrition preferences, workout routine, and stress levels.
              </p>
              <p>
                • <strong>Menged (Life Foundations):</strong> Helps clarify your core values, identity, quarterly goals, and daily habits.
              </p>
              <p>
                • <strong>Bereket (Money & Finances):</strong> Organizes your income streams, budget targets, fixed bills, and financial security goals.
              </p>
              <p>
                Everything learned is saved directly to your local database to personalize your Dashboard, schedule, recommendations, and progression trackers.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
export default SetupHub;
