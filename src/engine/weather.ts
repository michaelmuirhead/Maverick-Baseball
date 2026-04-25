// Weather generator per game. Cold/hot, wind direction, etc. Affects HR rate
// and BABIP slightly. Applied as a per-game modifier.

import type { GameState, Game } from './types';
import type { RNG } from './rng';

export interface Weather {
  temp: number;
  wind: number;        // 0-25 mph
  conditions: 'clear' | 'cloudy' | 'rain' | 'wind';
}

export function generateWeather(rng: RNG, day: number): Weather {
  // Approximate season arc: April cold, July/Aug hot, Sept cooling
  const seasonProgress = day / 183;
  const tempMid = 55 + Math.sin(seasonProgress * Math.PI) * 30;     // 55-85 range
  const temp = Math.round(tempMid + rng.normal(0, 8));
  const wind = Math.max(0, Math.round(rng.normal(8, 5)));
  const r = rng.next();
  let conditions: Weather['conditions'];
  if (r < 0.05) conditions = 'rain';
  else if (wind >= 18) conditions = 'wind';
  else if (r < 0.4) conditions = 'cloudy';
  else conditions = 'clear';
  return { temp, wind, conditions };
}

/** Multiplier on HR-rate (1.0 = neutral). Wind out + heat = +HR. Cold = -HR. */
export function weatherHRMultiplier(w: Weather): number {
  let mult = 1.0;
  if (w.temp >= 80) mult += 0.06;
  if (w.temp <= 50) mult -= 0.06;
  if (w.conditions === 'wind') mult += 0.08;
  if (w.conditions === 'rain') mult -= 0.10;
  return mult;
}

export function ensureGameWeather(state: GameState, rng: RNG, game: Game): Weather {
  state.gameWeather = state.gameWeather || {};
  if (!state.gameWeather[game.id]) {
    state.gameWeather[game.id] = generateWeather(rng, game.day);
  }
  return state.gameWeather[game.id];
}

export function describeWeather(w: Weather): string {
  const tempLabel = w.temp >= 85 ? 'hot' : w.temp >= 70 ? 'warm' : w.temp >= 55 ? 'mild' : 'cold';
  const condLabel = w.conditions === 'rain' ? ', rain'
                  : w.conditions === 'wind' ? `, wind ${w.wind} mph`
                  : w.conditions === 'cloudy' ? ', cloudy' : ', clear';
  return `${w.temp}°F ${tempLabel}${condLabel}`;
}
