import { useEffect } from 'react';
import { useGame } from './state/store';
import { Splash } from './pages/Splash';
import { NewGame } from './pages/NewGame';
import { Shell } from './components/Shell';
import { Dashboard } from './pages/Dashboard';
import { Roster } from './pages/Roster';
import { Standings } from './pages/Standings';
import { Schedule } from './pages/Schedule';
import { Finances } from './pages/Finances';
import { Trades } from './pages/Trades';
import { Playoffs } from './pages/Playoffs';
import { Stadium } from './pages/Stadium';
import { News } from './pages/News';
import { InjuredList } from './pages/InjuredList';
import { Draft } from './pages/Draft';
import { FreeAgency } from './pages/FreeAgency';
import { Staff } from './pages/Staff';
import { Awards } from './pages/Awards';
import { PlayerCareer } from './pages/PlayerCareer';
import { Settings } from './pages/Settings';
import { TeamHistory } from './pages/TeamHistory';
import { Prospects } from './pages/Prospects';
import { InternationalSignings } from './pages/InternationalSignings';
import { Rule5 } from './pages/Rule5';
import { Minors } from './pages/Minors';
import { LiveGame } from './pages/LiveGame';

export default function App() {
  const { view, page, hasSavedGame, loadFromStorage, state } = useGame();

  useEffect(() => {
    if (!state && hasSavedGame()) {
      loadFromStorage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (view === 'splash') return <Splash />;
  if (view === 'new_game') return <NewGame />;

  let pageEl: JSX.Element;
  switch (page) {
    case 'dashboard': pageEl = <Dashboard />; break;
    case 'roster': pageEl = <Roster />; break;
    case 'standings': pageEl = <Standings />; break;
    case 'schedule': pageEl = <Schedule />; break;
    case 'finances': pageEl = <Finances />; break;
    case 'trades': pageEl = <Trades />; break;
    case 'playoffs': pageEl = <Playoffs />; break;
    case 'stadium': pageEl = <Stadium />; break;
    case 'news': pageEl = <News />; break;
    case 'injured_list': pageEl = <InjuredList />; break;
    case 'draft': pageEl = <Draft />; break;
    case 'free_agency': pageEl = <FreeAgency />; break;
    case 'staff': pageEl = <Staff />; break;
    case 'awards': pageEl = <Awards />; break;
    case 'player_career': pageEl = <PlayerCareer />; break;
    case 'settings': pageEl = <Settings />; break;
    case 'history': pageEl = <TeamHistory />; break;
    case 'prospects': pageEl = <Prospects />; break;
    case 'international': pageEl = <InternationalSignings />; break;
    case 'rule5': pageEl = <Rule5 />; break;
    case 'minors': pageEl = <Minors />; break;
    case 'live_game': pageEl = <LiveGame />; break;
    default: pageEl = <Dashboard />;
  }

  return <Shell>{pageEl}</Shell>;
}
