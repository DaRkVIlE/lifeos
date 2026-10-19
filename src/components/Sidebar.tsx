import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import { useUserStore } from '../stores/useUserStore';
import { useSubscription } from '../hooks/useSubscription';
import { useSystemBus } from '../lib/systems/context';
import { XPBar } from './gamification/XPBar';
import { useGamificationContext } from '../lib/gamification/context';
import { TutorialList } from './TutorialList';
import { SetupList } from './SetupList';
import { isTourComplete, type TourId } from './SpotlightTour';
import { getOverallPercent } from '../lib/onboarding-phases';

const ALL_TOUR_IDS: TourId[] = ['dashboard', 'goals', 'habits', 'schedule', 'finance', 'health', 'junction', 'gamification'];
import './GamificationModal.css';

const GamificationModal = lazy(() => import('./GamificationModal').then(m => ({ default: m.GamificationModal })));
import {
  Compass, Calendar, Shield, GraduationCap, Users, BookOpen,
  Landmark, Mountain, Flame, Briefcase, Heart,
  Settings, Sparkles, MessageSquarePlus, Crown, LogOut,
  ChevronLeft, ChevronRight, ChevronDown, Zap,
  type LucideIcon,
} from 'lucide-react';
import { getUnreadCount } from '../lib/social/messaging';
import './Sidebar.css';

interface NavItemDef {
  to: string;
  icon: LucideIcon;
  label: string;
  color?: string;
  hasBadge?: boolean;
}

interface NavSectionDef {
  id: string;
  label: string;
  items: NavItemDef[];
}

const TOP_NAV_ITEMS: NavItemDef[] = [
  { to: '/', icon: Compass, label: 'Today', color: '#00D4FF' },
  { to: '/schedule', icon: Calendar, label: 'Schedule', color: '#60A5FA' },
];

const COLLAPSIBLE_SECTIONS: NavSectionDef[] = [
  {
    id: 'character',
    label: 'Character',
    items: [
      { to: '/character', icon: Shield, label: 'Character', color: '#A855F7' },
      { to: '/academy', icon: GraduationCap, label: 'Academy', color: '#38BDF8' },
    ],
  },
  {
    id: 'personality',
    label: 'Personality',
    items: [
      { to: '/social', icon: Users, label: 'Social', color: '#EC4899', hasBadge: true },
      { to: '/reflect', icon: BookOpen, label: 'Reflect', color: '#8B5CF6' },
      { to: '/character?tab=realm', icon: Landmark, label: 'Commons', color: '#10B981' },
    ],
  },
  {
    id: 'values',
    label: 'Values',
    items: [
      { to: '/goals', icon: Mountain, label: 'Goals', color: '#22C55E' },
      { to: '/habits', icon: Flame, label: 'Habits', color: '#F97316' },
      { to: '/work', icon: Briefcase, label: 'Work', color: '#EAB308' },
      { to: '/health', icon: Heart, label: 'Health', color: '#F43F5E' },
    ],
  },
];

interface SidebarProps {
  expanded?: boolean;
  onToggle?: () => void;
  /** When true, always render as expanded (full labels) regardless of expanded prop */
  forceFull?: boolean;
}

export const Sidebar = React.memo(function Sidebar({ expanded = true, onToggle, forceFull = false }: SidebarProps) {
  const collapsed = forceFull ? false : !expanded;
  const [gamOpen, setGamOpen] = useState(false);
  const [socialUnread, setSocialUnread] = useState(0);
  const [tutorialListOpen, setTutorialListOpen] = useState(false);
  const [setupListOpen, setSetupListOpen] = useState(false);
  const user = useUserStore(s => s.user);
  const profile = useUserStore(s => s.profile);
  const signOut = useUserStore(s => s.signOut);
  const { systemPages } = useSystemBus();
  const gam = useGamificationContext();
  const location = useLocation();
  const navigate = useNavigate();

  // Tutorial completion progress
  const tutorialProgress = useMemo(() => {
    const done = ALL_TOUR_IDS.filter(id => isTourComplete(id)).length;
    return { done, total: ALL_TOUR_IDS.length };
  }, [tutorialListOpen]);

  // Life Setup progress
  const setupPercent = useMemo(() => {
    const prefs = (profile?.preferences || {}) as Record<string, unknown>;
    return getOverallPercent(prefs);
  }, [profile?.preferences]);

  // Load social unread count
  useEffect(() => {
    if (!user?.id) return;
    getUnreadCount(user.id).then(setSocialUnread).catch(() => null);
    const interval = setInterval(() => {
      if (user?.id) getUnreadCount(user.id).then(setSocialUnread).catch(() => null);
    }, 60_000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('lifeos_sidebar_sections_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { character: true, personality: true, values: true, systems: true };
  });

  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = { ...prev, [id]: !(prev[id] ?? true) };
      try {
        localStorage.setItem('lifeos_sidebar_sections_v2', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const displayName = profile?.name || profile?.display_name || user?.email?.split('@')[0] || 'Gabriel Lima';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} aria-label="Main navigation">
      {/* Top Logo + Collapse */}
      <div className="sb-top">
        <button
          className="sb-logo"
          onClick={() => navigate('/')}
          aria-label="Go to Today"
        >
          <Zap size={20} className="sb-logo-icon" />
          <span className="sb-brand">LifeOS</span>
        </button>
        <button
          className="sb-collapse"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* XP Bar Card — Click to open stats modal */}
      {!gam.loading && (
        <div
          className="sb-xp-wrapper"
          onClick={() => setGamOpen(true)}
          title="View Player Stats"
        >
          <XPBar
            compact
            level={gam.level}
            title={gam.title}
            xpProgress={gam.xpProgress}
            xpToNext={gam.xpToNext}
            totalXP={gam.xp}
          />
        </div>
      )}

      {/* Main Navigation Scroll Area */}
      <nav className="sb-nav" aria-label="Primary navigation">
        {/* Top Standalone Nav Items (Today, Schedule) */}
        <div className="sb-top-links">
          {TOP_NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`sb-link ${active ? 'active' : ''}`}
                title={item.label}
              >
                <div className="sb-icon-wrap" style={{ '--link-color': item.color } as React.CSSProperties}>
                  <Icon size={18} />
                </div>
                <span className="sb-label">{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Collapsible Sections (Character, Personality, Values) */}
        {COLLAPSIBLE_SECTIONS.map(section => {
          const isOpen = openSections[section.id] ?? true;

          return (
            <div key={section.id} className="sb-section">
              <button
                type="button"
                className="sb-section-header"
                onClick={() => toggleSection(section.id)}
                aria-expanded={isOpen}
              >
                <span className="sb-section-label">{section.label}</span>
                <ChevronDown size={14} className={`sb-section-toggle-icon ${isOpen ? 'open' : 'closed'}`} />
              </button>
              <div className={`sb-section-items ${!collapsed && !isOpen ? 'closed' : 'open'}`}>
                {section.items.map(item => {
                  const Icon = item.icon;
                  const isRealmTab = item.to.includes('tab=realm');
                  const active = isRealmTab
                    ? location.pathname === '/character' && location.search.includes('tab=realm')
                    : (location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to)));

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={`sb-link ${active ? 'active' : ''}`}
                      title={item.label}
                    >
                      <div className="sb-icon-wrap" style={{ '--link-color': item.color } as React.CSSProperties}>
                        <Icon size={18} />
                      </div>
                      <span className="sb-label">{item.label}</span>
                      {item.hasBadge && socialUnread > 0 && (
                        <span className="sb-badge">
                          {socialUnread}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Connected System Pages (Optional Plugins) */}
        {systemPages.length > 0 && (
          <div className="sb-section">
            <button
              type="button"
              className="sb-section-header"
              onClick={() => toggleSection('systems')}
              aria-expanded={openSections['systems'] ?? true}
            >
              <span className="sb-section-label">Systems</span>
              <ChevronDown size={14} className={`sb-section-toggle-icon ${(openSections['systems'] ?? true) ? 'open' : 'closed'}`} />
            </button>
            <div className={`sb-section-items ${!collapsed && !(openSections['systems'] ?? true) ? 'closed' : 'open'}`}>
              {systemPages
                .filter((p, i, arr) => arr.findIndex(x => x.path === p.path) === i)
                .map(page => {
                  const active = location.pathname === page.path || location.pathname.startsWith(page.path + '/');
                  return (
                    <NavLink
                      key={page.path}
                      to={page.path}
                      className={`sb-link ${active ? 'active' : ''}`}
                      title={page.label}
                    >
                      <div className="sb-icon-wrap" style={{ '--link-color': '#00D4FF' } as React.CSSProperties}>
                        <span style={{ fontSize: 16, lineHeight: 1 }}>{page.icon}</span>
                      </div>
                      <span className="sb-label">{page.label}</span>
                    </NavLink>
                  );
                })}
            </div>
          </div>
        )}
      </nav>

      {/* Footer Area */}
      <div className="sb-footer">
        {/* 2x2 Utilities Grid */}
        <div className="sb-utils-grid">
          <NavLink to="/settings" className="sb-util-btn" title="Settings">
            <Settings size={15} className="sb-util-icon" />
            <span className="sb-util-label">Settings</span>
          </NavLink>

          <button
            type="button"
            className="sb-util-btn"
            onClick={() => setTutorialListOpen(true)}
            title={`Tutorials (${tutorialProgress.done}/${tutorialProgress.total})`}
          >
            <GraduationCap size={15} className="sb-util-icon" />
            <span className="sb-util-label">Tutorials</span>
            <span className="sb-util-badge">{tutorialProgress.done}/{tutorialProgress.total}</span>
          </button>

          <button
            type="button"
            className="sb-util-btn"
            onClick={() => navigate('/setup')}
            title={`Life Setup (${setupPercent}%)`}
          >
            <Sparkles size={15} className="sb-util-icon" />
            <span className="sb-util-label">Life Setup</span>
            <span className="sb-util-badge">{setupPercent}%</span>
          </button>

          <button
            type="button"
            className="sb-util-btn"
            onClick={() => document.dispatchEvent(new CustomEvent('open-feedback'))}
            title="Send feedback"
          >
            <MessageSquarePlus size={15} className="sb-util-icon" />
            <span className="sb-util-label">Feedback</span>
          </button>
        </div>

        {/* Plan Badge (👑 Early Access — Free) */}
        <button
          type="button"
          className="sb-plan-btn"
          title="Early Access — Free"
          onClick={() => {
            alert('👑 Early Access — Free\n\nAll premium LifeOS features are fully unlocked for early adopters.\n\nEnjoy the complete experience!');
          }}
        >
          <Crown size={15} className="sb-plan-icon" />
          <span className="sb-plan-label">Early Access — Free</span>
        </button>

        {/* User Profile & Sign Out */}
        <div className="sb-user">
          <div className="sb-user-avatar">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={displayName} />
            ) : (
              <span>{initial}</span>
            )}
          </div>
          <span className="sb-user-name" title={displayName}>
            {displayName}
          </span>
          <button
            className="sb-signout"
            onClick={signOut}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Gamification Modal */}
      {gamOpen && (
        <Suspense fallback={null}>
          <GamificationModal open={gamOpen} onClose={() => setGamOpen(false)} />
        </Suspense>
      )}

      {/* Tutorial List Panel */}
      <TutorialList open={tutorialListOpen} onClose={() => setTutorialListOpen(false)} />

      {/* Setup List Panel */}
      <SetupList open={setupListOpen} onClose={() => setSetupListOpen(false)} />
    </aside>
  );
});
