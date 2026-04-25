import { jsx as _jsx } from "react/jsx-runtime";
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
import { Leaderboards } from './pages/Leaderboards';
import { LineupBuilder } from './pages/LineupBuilder';
import { DepthChartBuilder } from './pages/DepthChartBuilder';
import { RosterManagement } from './pages/RosterManagement';
export default function App() {
    const { view, page, hasSavedGame, loadFromStorage, state } = useGame();
    useEffect(() => {
        if (!state && hasSavedGame()) {
            loadFromStorage();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    if (view === 'splash')
        return _jsx(Splash, {});
    if (view === 'new_game')
        return _jsx(NewGame, {});
    let pageEl;
    switch (page) {
        case 'dashboard':
            pageEl = _jsx(Dashboard, {});
            break;
        case 'roster':
            pageEl = _jsx(Roster, {});
            break;
        case 'standings':
            pageEl = _jsx(Standings, {});
            break;
        case 'schedule':
            pageEl = _jsx(Schedule, {});
            break;
        case 'finances':
            pageEl = _jsx(Finances, {});
            break;
        case 'trades':
            pageEl = _jsx(Trades, {});
            break;
        case 'playoffs':
            pageEl = _jsx(Playoffs, {});
            break;
        case 'stadium':
            pageEl = _jsx(Stadium, {});
            break;
        case 'news':
            pageEl = _jsx(News, {});
            break;
        case 'injured_list':
            pageEl = _jsx(InjuredList, {});
            break;
        case 'draft':
            pageEl = _jsx(Draft, {});
            break;
        case 'free_agency':
            pageEl = _jsx(FreeAgency, {});
            break;
        case 'staff':
            pageEl = _jsx(Staff, {});
            break;
        case 'awards':
            pageEl = _jsx(Awards, {});
            break;
        case 'player_career':
            pageEl = _jsx(PlayerCareer, {});
            break;
        case 'settings':
            pageEl = _jsx(Settings, {});
            break;
        case 'history':
            pageEl = _jsx(TeamHistory, {});
            break;
        case 'prospects':
            pageEl = _jsx(Prospects, {});
            break;
        case 'international':
            pageEl = _jsx(InternationalSignings, {});
            break;
        case 'rule5':
            pageEl = _jsx(Rule5, {});
            break;
        case 'minors':
            pageEl = _jsx(Minors, {});
            break;
        case 'live_game':
            pageEl = _jsx(LiveGame, {});
            break;
        case 'leaderboards':
            pageEl = _jsx(Leaderboards, {});
            break;
        case 'lineup':
            pageEl = _jsx(LineupBuilder, {});
            break;
        case 'depth_chart':
            pageEl = _jsx(DepthChartBuilder, {});
            break;
        case 'roster_management':
            pageEl = _jsx(RosterManagement, {});
            break;
        default: pageEl = _jsx(Dashboard, {});
    }
    return _jsx(Shell, { children: pageEl });
}
