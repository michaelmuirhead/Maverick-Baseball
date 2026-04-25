import type { Page } from '../state/store';

export interface NavSub { id: Page; label: string }
export interface NavGroup { id: string; label: string; subs: NavSub[] }

export const NAV: NavGroup[] = [
  { id: 'team', label: 'Team', subs: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'roster', label: 'Roster' },
    { id: 'lineup', label: 'Lineup' },
    { id: 'depth_chart', label: 'Depth' },
    { id: 'roster_management', label: 'Manage' },
    { id: 'minors', label: 'Minors' },
    { id: 'staff', label: 'Staff' },
    { id: 'injured_list', label: 'IL' },
  ] },
  { id: 'players', label: 'Players', subs: [
    { id: 'trades', label: 'Trades' },
    { id: 'free_agency', label: 'Free Agency' },
    { id: 'draft', label: 'Draft' },
    { id: 'international', label: 'Intl' },
    { id: 'rule5', label: 'Rule 5' },
    { id: 'prospects', label: 'Prospects' },
  ] },
  { id: 'games', label: 'Games', subs: [
    { id: 'schedule', label: 'Schedule' },
    { id: 'standings', label: 'Standings' },
    { id: 'live_game', label: 'Live' },
    { id: 'playoffs', label: 'Playoffs' },
  ] },
  { id: 'office', label: 'Office', subs: [
    { id: 'finances', label: 'Finances' },
    { id: 'stadium', label: 'Stadium' },
    { id: 'awards', label: 'Awards' },
    { id: 'leaderboards', label: 'Leaders' },
    { id: 'history', label: 'History' },
  ] },
  { id: 'misc', label: 'News & Settings', subs: [
    { id: 'news', label: 'News' },
    { id: 'settings', label: 'Settings' },
  ] },
];

export function findGroupForPage(pageId: Page): string {
  for (const g of NAV) {
    if (g.subs.find(s => s.id === pageId)) return g.id;
  }
  return 'team';
}

export function firstSubOfGroup(groupId: string): Page {
  const g = NAV.find(x => x.id === groupId);
  return (g?.subs[0]?.id || 'dashboard') as Page;
}
