import type {
  ShipHull,
  ShipCannon,
  ShipSail,
  ShipArmor,
  ShipStats,
  Weather,
  MarketItemType,
} from '../types';
import { HISTORICAL_TRADES } from '../data/mockData';

export function calculateShipStats(
  hull: ShipHull,
  cannons: ShipCannon[],
  sail: ShipSail,
  armor: ShipArmor,
): ShipStats {
  const avgCannonDamage = cannons.length > 0
    ? cannons.reduce((sum, c) => sum + c.damage, 0) / cannons.length
    : 0;

  const avgCannonFireRate = cannons.length > 0
    ? cannons.reduce((sum, c) => sum + (1 / c.fireRate), 0) / cannons.length
    : 0;

  const speed = Math.max(
    1,
    Math.min(100,
      hull.baseSpeed + sail.speedBonus - armor.speedPenalty
    ),
  );

  const firepower = Math.min(
    100,
    cannons.length * avgCannonDamage * (1 + avgCannonFireRate * 0.1),
  );

  const defense = Math.min(
    100,
    hull.baseDefense + armor.defenseBonus,
  );

  const maxHp = Math.round(
    (hull.baseDefense * 10) + (armor.defenseBonus * 8) + (hull.maxCrew * 2),
  );

  return {
    speed: Math.round(speed),
    firepower: Math.round(firepower),
    defense: Math.round(defense),
    maxHp,
    maxCrew: hull.maxCrew,
    maxCannons: hull.maxCannons,
  };
}

export function getWeatherEffects(weather: Weather) {
  const speedMod = 1 - (weather.windSpeed - 10) * 0.01;
  const accuracyMod = weather.visibility / 100;
  return {
    speedMod: Math.max(0.3, Math.min(1.3, speedMod)),
    accuracyMod: Math.max(0.2, Math.min(1.2, accuracyMod)),
  };
}

export function getPriceSuggestion(itemType: MarketItemType, tier: number) {
  const filtered = HISTORICAL_TRADES.filter((t) => {
    if (itemType === 'blueprint') {
      return t.itemName.includes('图纸');
    }
    return t.itemName.includes('合同');
  });

  const tierMultiplier = tier * 0.4 + 0.6;
  const avgPrice = filtered.length > 0
    ? filtered.reduce((sum, t) => sum + t.price, 0) / filtered.length
    : 500;

  const basePrice = avgPrice * tierMultiplier;
  return {
    min: Math.round(basePrice * 0.8),
    max: Math.round(basePrice * 1.2),
    avg: Math.round(basePrice),
  };
}

export function calculateDamage(
  baseDamage: number,
  attackerFirepower: number,
  defenderDefense: number,
  accuracyMod: number,
): number {
  if (Math.random() > accuracyMod) return 0;
  const effectiveDamage = baseDamage * (1 + attackerFirepower * 0.005);
  const mitigation = defenderDefense * 0.008;
  return Math.max(1, Math.round(effectiveDamage * (1 - mitigation)));
}

export function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function uid(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

export function getCrewRoleLabel(role: 'captain' | 'gunner' | 'sailor'): string {
  return { captain: '船长', gunner: '炮手', sailor: '水手' }[role];
}

export function getWeatherEmoji(type: string): string {
  return {
    clear: '☀️',
    cloudy: '⛅',
    rain: '🌧️',
    storm: '⛈️',
    fog: '🌫️',
  }[type] || '🌤️';
}

export function getEventEmoji(type: string): string {
  return {
    treasure: '💎',
    enemy: '⚔️',
    storm: '🌊',
    kraken: '🐙',
    island: '🏝️',
    merchant: '🚢',
  }[type] || '❓';
}
