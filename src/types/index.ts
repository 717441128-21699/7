export interface ShipHull {
  id: string;
  name: string;
  tier: number;
  baseSpeed: number;
  baseDefense: number;
  maxCrew: number;
  maxCannons: number;
  cost: number;
  description: string;
}

export interface ShipCannon {
  id: string;
  name: string;
  tier: number;
  damage: number;
  fireRate: number;
  range: number;
  cost: number;
  description: string;
}

export interface ShipSail {
  id: string;
  name: string;
  tier: number;
  speedBonus: number;
  maneuverBonus: number;
  cost: number;
  description: string;
}

export interface ShipArmor {
  id: string;
  name: string;
  tier: number;
  defenseBonus: number;
  speedPenalty: number;
  cost: number;
  description: string;
}

export interface ShipStats {
  speed: number;
  firepower: number;
  defense: number;
  maxHp: number;
  maxCrew: number;
  maxCannons: number;
}

export interface Ship {
  id: string;
  name: string;
  hull: ShipHull;
  cannons: ShipCannon[];
  sail: ShipSail;
  armor: ShipArmor;
  speed: number;
  firepower: number;
  defense: number;
  maxHp: number;
  currentHp: number;
}

export type CrewRole = 'captain' | 'gunner' | 'sailor';

export interface CrewSkills {
  navigation?: number;
  gunnery?: number;
  sailing?: number;
  combat?: number;
  leadership?: number;
}

export interface CrewMember {
  id: string;
  name: string;
  role: CrewRole;
  avatar: string;
  loyalty: number;
  skills: CrewSkills;
  level: number;
  exp: number;
  contractPrice?: number;
  description: string;
}

export type WeatherType = 'clear' | 'cloudy' | 'rain' | 'storm' | 'fog';

export interface Weather {
  type: WeatherType;
  windSpeed: number;
  windDirection: number;
  visibility: number;
}

export type EventType = 'treasure' | 'enemy' | 'storm' | 'kraken' | 'island' | 'merchant';

export interface VoyageEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  timestamp: number;
  resolved: boolean;
  reward?: {
    gold?: number;
    resources?: Record<string, number>;
    blueprints?: string[];
  };
  penalty?: {
    hpLoss?: number;
    crewLoss?: number;
    goldLoss?: number;
  };
}

export interface EnemyShip {
  id: string;
  name: string;
  maxHp: number;
  firepower: number;
  defense: number;
  speed: number;
  crewCount: number;
  loot: {
    gold: number;
    blueprints?: string[];
  };
}

export interface BattleState {
  id: string;
  playerShip: Ship;
  enemyShip: EnemyShip & { hp: number };
  playerCrew: CrewMember[];
  cannonCooldowns: number[];
  playerHeading: number;
  enemyHeading: number;
  distance: number;
  timeElapsed: number;
  status: 'fighting' | 'won' | 'lost' | 'boarding';
  casualties: {
    player: number;
    enemy: number;
  };
  damageLog: { side: 'player' | 'enemy'; damage: number; timestamp: number }[];
}

export type MarketItemType = 'blueprint' | 'crewContract';

export interface MarketListing {
  id: string;
  sellerId: string;
  sellerName: string;
  type: MarketItemType;
  item: {
    blueprintId?: string;
    blueprintName?: string;
    blueprintTier?: number;
    crew?: CrewMember;
  };
  price: number;
  suggestedPriceMin: number;
  suggestedPriceMax: number;
  listedAt: number;
}

export interface TradeRecord {
  id: string;
  listingId: string;
  buyerName: string;
  sellerName: string;
  itemName: string;
  price: number;
  timestamp: number;
  triggeredBounty: boolean;
}

export interface WeeklyLog {
  weekStart: string;
  weekEnd: string;
  voyageCount: number;
  battleWins: number;
  battleLosses: number;
  totalGoldEarned: number;
  totalGoldSpent: number;
  routes: { location: string; visits: number; x: number; y: number }[];
  crewMoraleHistory: { date: string; morale: number }[];
  battleStats: {
    shipsSunk: number;
    cannonsFired: number;
    damageDealt: number;
    damageTaken: number;
    crewLost: number;
    crewRecruited: number;
  };
  events: VoyageEvent[];
}

export interface PlayerRank {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  value: number;
  level: number;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  gold: number;
  level: number;
  reputation: number;
  ships: Ship[];
  activeShipId: string;
  crew: CrewMember[];
  inventory: {
    blueprints: { id: string; name: string; tier: number }[];
    resources: Record<string, number>;
  };
  stats: {
    totalWealth: number;
    totalBattles: number;
    shipsSunk: number;
    plunderCount: number;
  };
}
