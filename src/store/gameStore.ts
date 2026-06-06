import { create } from 'zustand';
import type {
  Player,
  Ship,
  ShipHull,
  ShipCannon,
  ShipSail,
  ShipArmor,
  CrewMember,
  Weather,
  VoyageEvent,
  BattleState,
  MarketListing,
  TradeRecord,
  WeeklyLog,
  PlayerRank,
} from '../types';

const BASE = '/api';

interface GameStore {
  player: Player;
  setPlayer: (p: Player) => void;
  updateGold: (delta: number) => Promise<void>;
  loadPlayer: () => Promise<void>;

  ships: Ship[];
  currentShip: Ship | null;
  selectShip: (id: string) => void;
  buildShip: (
    name: string,
    hull: ShipHull,
    cannons: ShipCannon[],
    sail: ShipSail,
    armor: ShipArmor,
  ) => Promise<boolean>;

  crew: CrewMember[];
  availableCrew: CrewMember[];
  recruitCrew: (member: CrewMember) => Promise<boolean>;
  dismissCrew: (id: string) => Promise<void>;
  updateLoyalty: (id: string, delta: number) => void;

  currentWeather: Weather;
  currentLocation: { x: number; y: number };
  voyageEvents: VoyageEvent[];
  updateWeather: () => Promise<void>;
  startVoyage: () => Promise<VoyageEvent>;
  resolveEvent: (eventId: string) => Promise<void>;

  activeBattle: BattleState | null;
  startBattle: (enemyId?: string) => Promise<void>;
  fireCannon: (index: number) => Promise<void>;
  changeHeading: (degrees: number) => void;
  initiateBoarding: () => Promise<void>;
  tickBattle: () => Promise<void>;
  endBattle: (victory: boolean) => Promise<{ gold: number; blueprints: string[] }>;

  marketListings: MarketListing[];
  tradeHistory: TradeRecord[];
  announcements: { id: string; text: string; timestamp: number }[];
  loadMarketListings: () => Promise<void>;
  createListing: (
    type: 'blueprint' | 'crewContract',
    itemData: { blueprintId?: string; blueprintName?: string; blueprintTier?: number; crew?: CrewMember },
    price: number,
  ) => Promise<void>;
  buyListing: (listingId: string) => Promise<boolean>;
  getPriceSuggestion: (type: 'blueprint' | 'crewContract', tier: number) => Promise<{ min: number; max: number; avg: number }>;

  weeklyLog: WeeklyLog | null;
  generateWeeklyLog: () => Promise<void>;
  loadWeeklyLog: () => Promise<void>;

  leaderboard: {
    wealth: PlayerRank[];
    power: PlayerRank[];
    plunder: PlayerRank[];
  };
  loadLeaderboard: () => Promise<void>;
}

const INITIAL_PLAYER: Player = {
  id: '',
  name: '',
  avatar: '🏴‍☠️',
  gold: 0,
  level: 1,
  reputation: 0,
  ships: [],
  activeShipId: '',
  crew: [],
  inventory: {
    blueprints: [],
    resources: {},
  },
  stats: {
    totalWealth: 0,
    totalBattles: 0,
    shipsSunk: 0,
    plunderCount: 0,
  },
};

const INITIAL_WEATHER: Weather = {
  type: 'clear',
  windSpeed: 10,
  windDirection: 0,
  visibility: 100,
};

export const useGameStore = create<GameStore>((set, get) => ({
  player: INITIAL_PLAYER,
  setPlayer: (p) => set({ player: p }),
  updateGold: async (delta) => {
    try {
      const res = await fetch(`${BASE}/player/gold`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta }),
      });
      if (res.ok) {
        const player = await res.json();
        set({ player });
      }
    } catch (e) {
      set((s) => ({
        player: {
          ...s.player,
          gold: Math.max(0, s.player.gold + delta),
          stats: {
            ...s.player.stats,
            totalWealth: s.player.stats.totalWealth + Math.max(0, delta),
          },
        },
      }));
    }
  },
  loadPlayer: async () => {
    try {
      const res = await fetch(`${BASE}/player`);
      if (res.ok) {
        const player: Player = await res.json();
        set({
          player,
          ships: player.ships,
          crew: player.crew,
          currentShip: player.ships.find((s) => s.id === player.activeShipId) || player.ships[0] || null,
        });
      }
    } catch (e) {
      console.error('Failed to load player', e);
    }
  },

  ships: [],
  currentShip: null,
  selectShip: (id) =>
    set((s) => ({
      currentShip: s.ships.find((sh) => sh.id === id) || null,
      player: { ...s.player, activeShipId: id },
    })),
  buildShip: async (name, hull, cannons, sail, armor) => {
    try {
      const res = await fetch(`${BASE}/ships/build`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, hull, cannons, sail, armor }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      set({
        ships: data.ships || get().ships,
        currentShip: data.currentShip || get().currentShip,
        player: data.player || get().player,
      });
      return true;
    } catch (e) {
      console.error('Failed to build ship', e);
      return false;
    }
  },

  crew: [],
  availableCrew: [],
  recruitCrew: async (member) => {
    try {
      const res = await fetch(`${BASE}/crew/recruit/${member.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.success) {
        set({
          crew: data.crew || get().crew,
          player: data.player || get().player,
        });
      }
      return data.success || false;
    } catch (e) {
      console.error('Failed to recruit crew', e);
      return false;
    }
  },
  dismissCrew: async (id) => {
    try {
      const res = await fetch(`${BASE}/crew/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          set({
            crew: data.crew || get().crew.filter((c) => c.id !== id),
            player: data.player || { ...get().player, crew: get().player.crew.filter((c) => c.id !== id) },
          });
        }
      }
    } catch (e) {
      console.error('Failed to dismiss crew', e);
      set((s) => ({
        crew: s.crew.filter((c) => c.id !== id),
        player: { ...s.player, crew: s.player.crew.filter((c) => c.id !== id) },
      }));
    }
  },
  updateLoyalty: (id, delta) =>
    set((s) => ({
      crew: s.crew.map((c) =>
        c.id === id
          ? { ...c, loyalty: Math.max(0, Math.min(100, c.loyalty + delta)) }
          : c,
      ),
    })),

  currentWeather: INITIAL_WEATHER,
  currentLocation: { x: 500, y: 350 },
  voyageEvents: [],
  loadWeather: async () => {
    try {
      const res = await fetch(`${BASE}/weather`);
      if (res.ok) {
        const weather: Weather = await res.json();
        set({ currentWeather: weather });
      }
    } catch (e) {
      console.error('Failed to load weather', e);
    }
  },
  updateWeather: async () => {
    try {
      const res = await fetch(`${BASE}/weather`);
      if (res.ok) {
        const weather: Weather = await res.json();
        set({ currentWeather: weather });
      }
    } catch (e) {
      console.error('Failed to update weather', e);
    }
  },
  startVoyage: async () => {
    try {
      const res = await fetch(`${BASE}/voyage/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to start voyage');
      const event: VoyageEvent = await res.json();
      set((s) => ({ voyageEvents: [...s.voyageEvents, event] }));
      await get().updateWeather();
      return event;
    } catch (e) {
      console.error('Failed to start voyage', e);
      const fallbackEvent: VoyageEvent = {
        id: 'fallback-' + Date.now(),
        type: 'island',
        title: '平静的海面',
        description: '今天海面风平浪静。',
        timestamp: Date.now(),
        resolved: false,
      };
      set((s) => ({ voyageEvents: [...s.voyageEvents, fallbackEvent] }));
      return fallbackEvent;
    }
  },
  resolveEvent: async (eventId) => {
    try {
      const res = await fetch(`${BASE}/voyage/resolve/${eventId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        set({
          voyageEvents: data.voyageEvents || get().voyageEvents.map((e) =>
            e.id === eventId ? { ...e, resolved: true } : e,
          ),
          player: data.player || get().player,
          crew: data.crew || get().crew,
        });
        if (data.shouldBattle) {
          await get().startBattle();
        }
      }
    } catch (e) {
      console.error('Failed to resolve event', e);
      set((s) => ({
        voyageEvents: s.voyageEvents.map((e) =>
          e.id === eventId ? { ...e, resolved: true } : e,
        ),
      }));
    }
  },

  activeBattle: null,
  startBattle: async (enemyId) => {
    try {
      const res = await fetch(`${BASE}/battle/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enemyId }),
      });
      if (res.ok) {
        const battle: BattleState = await res.json();
        set({ activeBattle: battle });
      }
    } catch (e) {
      console.error('Failed to start battle', e);
    }
  },
  fireCannon: async (index) => {
    try {
      const res = await fetch(`${BASE}/battle/fire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index }),
      });
      if (res.ok) {
        const battle: BattleState = await res.json();
        set({ activeBattle: battle });
      }
    } catch (e) {
      console.error('Failed to fire cannon', e);
    }
  },
  changeHeading: (degrees) =>
    set((s) =>
      s.activeBattle
        ? { activeBattle: { ...s.activeBattle, playerHeading: (s.activeBattle.playerHeading + degrees + 360) % 360 } }
        : {},
    ),
  initiateBoarding: async () => {
    try {
      const res = await fetch(`${BASE}/battle/boarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        set({
          activeBattle: data.battle,
          crew: data.crew || get().crew,
          player: data.player || get().player,
        });
      }
    } catch (e) {
      console.error('Failed to initiate boarding', e);
    }
  },
  tickBattle: async () => {
    try {
      const res = await fetch(`${BASE}/battle/tick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        set({
          activeBattle: data.battle,
          ships: data.ships || get().ships,
          currentShip: data.currentShip || get().currentShip,
        });
      }
    } catch (e) {
      console.error('Failed to tick battle', e);
    }
  },
  endBattle: async (victory) => {
    try {
      const res = await fetch(`${BASE}/battle/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ victory }),
      });
      if (res.ok) {
        const data = await res.json();
        set({
          activeBattle: null,
          player: data.player || get().player,
        });
        return data.result || { gold: 0, blueprints: [] };
      }
      return { gold: 0, blueprints: [] };
    } catch (e) {
      console.error('Failed to end battle', e);
      set({ activeBattle: null });
      return { gold: 0, blueprints: [] };
    }
  },

  marketListings: [],
  tradeHistory: [],
  announcements: [],
  loadMarketListings: async () => {
    try {
      const res = await fetch(`${BASE}/market/listings`);
      if (res.ok) {
        const listings: MarketListing[] = await res.json();
        set({ marketListings: listings });
      }
    } catch (e) {
      console.error('Failed to load market listings', e);
    }
  },
  createListing: async (type, itemData, price) => {
    try {
      const res = await fetch(`${BASE}/market/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, item: itemData, price }),
      });
      if (res.ok) {
        const listings: MarketListing[] = await res.json();
        set({ marketListings: listings });
      }
    } catch (e) {
      console.error('Failed to create listing', e);
    }
  },
  buyListing: async (listingId) => {
    try {
      const res = await fetch(`${BASE}/market/listings/${listingId}/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.success) {
        set({
          marketListings: data.marketListings || get().marketListings.filter((l) => l.id !== listingId),
          tradeHistory: data.tradeRecord ? [...get().tradeHistory, data.tradeRecord] : get().tradeHistory,
          announcements: data.announcements || get().announcements,
        });
      }
      return data.success || false;
    } catch (e) {
      console.error('Failed to buy listing', e);
      return false;
    }
  },
  getPriceSuggestion: async (type, tier) => {
    try {
      const res = await fetch(`${BASE}/market/price-suggestion?type=${type}&tier=${tier}`);
      if (res.ok) {
        const data = await res.json();
        return {
          min: data.min,
          max: data.max,
          avg: data.avg,
        };
      }
    } catch (e) {
      console.error('Failed to get price suggestion', e);
    }
    const base = tier * 500;
    return { min: Math.round(base * 0.7), max: Math.round(base * 1.3), avg: base };
  },

  weeklyLog: null,
  generateWeeklyLog: async () => {
    await get().loadWeeklyLog();
  },
  loadWeeklyLog: async () => {
    try {
      const res = await fetch(`${BASE}/logbook`);
      if (res.ok) {
        const weeklyLog: WeeklyLog = await res.json();
        set({ weeklyLog });
      }
    } catch (e) {
      console.error('Failed to load weekly log', e);
    }
  },

  leaderboard: {
    wealth: [],
    power: [],
    plunder: [],
  },
  loadLeaderboard: async () => {
    try {
      const res = await fetch(`${BASE}/leaderboard`);
      if (res.ok) {
        const leaderboard = await res.json();
        set({ leaderboard });
      }
    } catch (e) {
      console.error('Failed to load leaderboard', e);
    }
  },
}));
