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
  EnemyShip,
} from '../types';
import {
  INITIAL_PLAYER,
  INITIAL_WEEKLY_LOG,
  WEATHER_TYPES,
  RANDOM_EVENTS,
  ENEMY_SHIPS,
  MARKET_LISTINGS,
  HISTORICAL_TRADES,
  LEADERBOARD_DATA,
} from '../data/mockData';
import {
  calculateShipStats,
  calculateDamage,
  randomChoice,
  uid,
  getPriceSuggestion,
  getWeatherEffects,
} from '../utils/gameUtils';

interface GameStore {
  player: Player;
  setPlayer: (p: Player) => void;
  updateGold: (delta: number) => void;

  ships: Ship[];
  currentShip: Ship | null;
  selectShip: (id: string) => void;
  buildShip: (
    name: string,
    hull: ShipHull,
    cannons: ShipCannon[],
    sail: ShipSail,
    armor: ShipArmor,
  ) => boolean;

  crew: CrewMember[];
  availableCrew: CrewMember[];
  recruitCrew: (member: CrewMember) => boolean;
  dismissCrew: (id: string) => void;
  updateLoyalty: (id: string, delta: number) => void;

  currentWeather: Weather;
  currentLocation: { x: number; y: number };
  voyageEvents: VoyageEvent[];
  updateWeather: () => void;
  startVoyage: () => VoyageEvent;
  resolveEvent: (eventId: string) => void;

  activeBattle: BattleState | null;
  startBattle: (enemyId?: string) => void;
  fireCannon: (index: number) => void;
  changeHeading: (degrees: number) => void;
  initiateBoarding: () => void;
  tickBattle: () => void;
  endBattle: (victory: boolean) => { gold: number; blueprints: string[] };

  marketListings: MarketListing[];
  tradeHistory: TradeRecord[];
  announcements: { id: string; text: string; timestamp: number }[];
  createListing: (
    type: 'blueprint' | 'crewContract',
    itemData: { blueprintId?: string; blueprintName?: string; blueprintTier?: number; crew?: CrewMember },
    price: number,
  ) => void;
  buyListing: (listingId: string) => boolean;

  weeklyLog: WeeklyLog;
  generateWeeklyLog: () => void;

  leaderboard: {
    wealth: PlayerRank[];
    power: PlayerRank[];
    plunder: PlayerRank[];
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  player: INITIAL_PLAYER,
  setPlayer: (p) => set({ player: p }),
  updateGold: (delta) =>
    set((s) => ({
      player: {
        ...s.player,
        gold: Math.max(0, s.player.gold + delta),
        stats: {
          ...s.player.stats,
          totalWealth: s.player.stats.totalWealth + Math.max(0, delta),
        },
      },
    })),

  ships: [],
  currentShip: null,
  selectShip: (id) =>
    set((s) => ({
      currentShip: s.ships.find((sh) => sh.id === id) || null,
      player: { ...s.player, activeShipId: id },
    })),
  buildShip: (name, hull, cannons, sail, armor) => {
    const state = get();
    const totalCost =
      hull.cost +
      cannons.reduce((s, c) => s + c.cost, 0) +
      sail.cost +
      armor.cost;
    if (state.player.gold < totalCost) return false;
    if (cannons.length > hull.maxCannons) return false;

    const stats = calculateShipStats(hull, cannons, sail, armor);
    const newShip: Ship = {
      id: uid(),
      name,
      hull,
      cannons,
      sail,
      armor,
      speed: stats.speed,
      firepower: stats.firepower,
      defense: stats.defense,
      maxHp: stats.maxHp,
      currentHp: stats.maxHp,
    };

    set((s) => ({
      ships: [...s.ships, newShip],
      currentShip: s.ships.length === 0 ? newShip : s.currentShip,
      player: {
        ...s.player,
        gold: s.player.gold - totalCost,
        ships: [...s.player.ships, newShip],
        activeShipId: s.player.activeShipId || newShip.id,
      },
    }));
    return true;
  },

  crew: [],
  availableCrew: [],
  recruitCrew: (member) => {
    const state = get();
    const price = member.contractPrice || 100;
    if (state.player.gold < price) return false;
    if (state.crew.find((c) => c.id === member.id)) return false;
    set((s) => ({
      crew: [...s.crew, member],
      player: {
        ...s.player,
        gold: s.player.gold - price,
        crew: [...s.player.crew, member],
      },
    }));
    return true;
  },
  dismissCrew: (id) =>
    set((s) => ({
      crew: s.crew.filter((c) => c.id !== id),
      player: { ...s.player, crew: s.player.crew.filter((c) => c.id !== id) },
    })),
  updateLoyalty: (id, delta) =>
    set((s) => ({
      crew: s.crew.map((c) =>
        c.id === id
          ? { ...c, loyalty: Math.max(0, Math.min(100, c.loyalty + delta)) }
          : c,
      ),
    })),

  currentWeather: WEATHER_TYPES[0],
  currentLocation: { x: 500, y: 350 },
  voyageEvents: [],
  updateWeather: () => {
    set({ currentWeather: randomChoice(WEATHER_TYPES) });
  },
  startVoyage: () => {
    const tmpl = randomChoice(RANDOM_EVENTS);
    const event: VoyageEvent = {
      ...tmpl,
      id: uid(),
      timestamp: Date.now(),
      resolved: false,
    };
    set((s) => ({ voyageEvents: [...s.voyageEvents, event] }));
    get().updateWeather();
    return event;
  },
  resolveEvent: (eventId) => {
    const state = get();
    const ev = state.voyageEvents.find((e) => e.id === eventId);
    if (!ev || ev.resolved) return;

    if (ev.reward) {
      if (ev.reward.gold) get().updateGold(ev.reward.gold);
      if (ev.reward.blueprints) {
        set((s) => ({
          player: {
            ...s.player,
            inventory: {
              ...s.player.inventory,
              blueprints: [
                ...s.player.inventory.blueprints,
                ...ev.reward!.blueprints!.map((bp, i) => ({
                  id: bp,
                  name: `图纸#${bp}`,
                  tier: 2 + (i % 3),
                })),
              ],
            },
          },
        }));
      }
    }
    if (ev.penalty) {
      if (ev.penalty.goldLoss) get().updateGold(-ev.penalty.goldLoss);
      if (ev.penalty.crewLoss) {
        set((s) => ({
          crew: s.crew.slice(0, Math.max(0, s.crew.length - ev.penalty!.crewLoss!)),
        }));
      }
    }

    if (ev.type === 'enemy' || ev.type === 'merchant') {
      get().startBattle();
    }

    set((s) => ({
      voyageEvents: s.voyageEvents.map((e) =>
        e.id === eventId ? { ...e, resolved: true } : e,
      ),
    }));
  },

  activeBattle: null,
  startBattle: (enemyId) => {
    const state = get();
    if (!state.currentShip) return;

    const enemyTemplate = enemyId
      ? ENEMY_SHIPS.find((e) => e.id === enemyId)
      : randomChoice(ENEMY_SHIPS.slice(0, 3));
    if (!enemyTemplate) return;

    const enemyWithHp: EnemyShip & { hp: number } = {
      ...enemyTemplate,
      hp: enemyTemplate.maxHp,
    };

    const playerShip = {
      ...state.currentShip,
      currentHp: state.currentShip.maxHp,
    };

    const battle: BattleState = {
      id: uid(),
      playerShip,
      enemyShip: enemyWithHp,
      playerCrew: [...state.crew],
      cannonCooldowns: playerShip.cannons.map(() => 0),
      playerHeading: 0,
      enemyHeading: 180,
      distance: 100,
      timeElapsed: 0,
      status: 'fighting',
      casualties: { player: 0, enemy: 0 },
      damageLog: [],
    };

    set({ activeBattle: battle });
  },
  fireCannon: (index) => {
    const state = get();
    if (!state.activeBattle || state.activeBattle.status !== 'fighting') return;
    if (state.activeBattle.cannonCooldowns[index] > 0) return;

    const cannon = state.activeBattle.playerShip.cannons[index];
    if (!cannon) return;

    const weatherEffects = getWeatherEffects(state.currentWeather);
    const damage = calculateDamage(
      cannon.damage,
      state.activeBattle.playerShip.firepower,
      state.activeBattle.enemyShip.defense,
      weatherEffects.accuracyMod,
    );

    const gunners = state.activeBattle.playerCrew.filter((c) => c.role === 'gunner');
    const avgGunnery =
      gunners.length > 0
        ? gunners.reduce((s, c) => s + (c.skills.gunnery || 0), 0) / gunners.length
        : 50;
    const bonusDamage = Math.round(damage * (avgGunnery - 50) * 0.005);
    const totalDamage = Math.max(1, damage + bonusDamage);

    set((s) => {
      if (!s.activeBattle) return {};
      const newEnemyHp = Math.max(0, s.activeBattle.enemyShip.hp - totalDamage);
      const newLog = [
        ...s.activeBattle.damageLog,
        { side: 'enemy' as const, damage: totalDamage, timestamp: Date.now() },
      ];
      const newCooldowns = [...s.activeBattle.cannonCooldowns];
      newCooldowns[index] = cannon.fireRate;

      const won = newEnemyHp <= 0;
      return {
        activeBattle: {
          ...s.activeBattle,
          enemyShip: { ...s.activeBattle.enemyShip, hp: newEnemyHp },
          cannonCooldowns: newCooldowns,
          damageLog: newLog,
          status: won ? 'won' : s.activeBattle.status,
        },
      };
    });
  },
  changeHeading: (degrees) =>
    set((s) =>
      s.activeBattle
        ? { activeBattle: { ...s.activeBattle, playerHeading: (s.activeBattle.playerHeading + degrees + 360) % 360 } }
        : {},
    ),
  initiateBoarding: () => {
    const state = get();
    if (!state.activeBattle || state.activeBattle.distance > 30) return;

    const playerCombat = state.activeBattle.playerCrew.reduce(
      (s, c) => s + (c.skills.combat || 0) + c.level * 2,
      0,
    );
    const enemyCombat = state.activeBattle.enemyShip.crewCount * 15;
    const playerWins = playerCombat + Math.random() * 100 > enemyCombat + Math.random() * 50;

    set((s) => {
      if (!s.activeBattle) return {};
      const crewLost = Math.min(
        s.activeBattle.playerCrew.length,
        Math.max(0, Math.round(Math.random() * 3)),
      );
      const remainingCrew = s.activeBattle.playerCrew.slice(crewLost);
      return {
        activeBattle: {
          ...s.activeBattle,
          status: playerWins ? 'won' : 'lost',
          playerCrew: remainingCrew,
          casualties: {
            ...s.activeBattle.casualties,
            player: s.activeBattle.casualties.player + crewLost,
          },
        },
        crew: remainingCrew,
        player: { ...s.player, crew: remainingCrew },
      };
    });
  },
  tickBattle: () => {
    const state = get();
    if (!state.activeBattle || state.activeBattle.status !== 'fighting') return;

    const weatherEffects = getWeatherEffects(state.currentWeather);
    const enemyDamage = calculateDamage(
      state.activeBattle.enemyShip.firepower * 0.3,
      state.activeBattle.enemyShip.firepower,
      state.activeBattle.playerShip.defense,
      weatherEffects.accuracyMod,
    );

    set((s) => {
      if (!s.activeBattle) return {};
      const newPlayerHp = Math.max(0, s.activeBattle.playerShip.currentHp - enemyDamage);
      const newCooldowns = s.activeBattle.cannonCooldowns.map((cd) => Math.max(0, cd - 0.1));
      const newDistance = Math.max(
        10,
        s.activeBattle.distance +
          (Math.random() - 0.5) * s.activeBattle.enemyShip.speed * 0.05,
      );
      const lost = newPlayerHp <= 0;

      const updatedShip = s.ships.find(
        (sh) => sh.id === s.activeBattle!.playerShip.id,
      );
      const newShips = updatedShip
        ? s.ships.map((sh) =>
            sh.id === updatedShip.id
              ? { ...sh, currentHp: newPlayerHp }
              : sh,
          )
        : s.ships;

      return {
        ships: newShips,
        currentShip: updatedShip
          ? { ...updatedShip, currentHp: newPlayerHp }
          : s.currentShip,
        activeBattle: {
          ...s.activeBattle,
          playerShip: { ...s.activeBattle.playerShip, currentHp: newPlayerHp },
          cannonCooldowns: newCooldowns,
          distance: newDistance,
          timeElapsed: s.activeBattle.timeElapsed + 0.1,
          status: lost ? 'lost' : s.activeBattle.status,
          damageLog: [
            ...s.activeBattle.damageLog,
            { side: 'player' as const, damage: enemyDamage, timestamp: Date.now() },
          ],
        },
      };
    });
  },
  endBattle: (victory) => {
    const state = get();
    if (!state.activeBattle) return { gold: 0, blueprints: [] };

    const result = victory
      ? {
          gold: state.activeBattle.enemyShip.loot.gold,
          blueprints: state.activeBattle.enemyShip.loot.blueprints || [],
        }
      : {
          gold: -Math.round(state.player.gold * 0.15),
          blueprints: [],
        };

    if (result.gold !== 0) get().updateGold(result.gold);

    if (victory && result.blueprints.length > 0) {
      set((s) => ({
        player: {
          ...s.player,
          inventory: {
            ...s.player.inventory,
            blueprints: [
              ...s.player.inventory.blueprints,
              ...result.blueprints.map((bp) => ({
                id: bp,
                name: `缴获图纸: ${bp}`,
                tier: 3,
              })),
            ],
          },
          stats: {
            ...s.player.stats,
            shipsSunk: s.player.stats.shipsSunk + 1,
            totalBattles: s.player.stats.totalBattles + 1,
            plunderCount: s.player.stats.plunderCount + 1,
          },
        },
      }));
    } else {
      set((s) => ({
        player: {
          ...s.player,
          stats: {
            ...s.player.stats,
            totalBattles: s.player.stats.totalBattles + 1,
          },
        },
      }));
    }

    set({ activeBattle: null });
    return result;
  },

  marketListings: MARKET_LISTINGS,
  tradeHistory: HISTORICAL_TRADES,
  announcements: [
    { id: uid(), text: '📢 全服公告：传奇船长「黑胡子」的合同即将上架拍卖！', timestamp: Date.now() - 60000 },
    { id: uid(), text: '⚔️ 海盗王「摩根」刚刚击沉了无敌舰队旗舰！', timestamp: Date.now() - 120000 },
  ],
  createListing: (type, itemData, price) => {
    const tier = itemData.blueprintTier || (itemData.crew?.level || 1);
    const suggestion = getPriceSuggestion(type, tier);
    const listing: MarketListing = {
      id: uid(),
      sellerId: get().player.id,
      sellerName: get().player.name,
      type,
      item: itemData,
      price,
      suggestedPriceMin: suggestion.min,
      suggestedPriceMax: suggestion.max,
      listedAt: Date.now(),
    };
    set((s) => ({ marketListings: [...s.marketListings, listing] }));
  },
  buyListing: (listingId) => {
    const state = get();
    const listing = state.marketListings.find((l) => l.id === listingId);
    if (!listing) return false;
    if (state.player.gold < listing.price) return false;

    get().updateGold(-listing.price);

    if (listing.type === 'crewContract' && listing.item.crew) {
      get().recruitCrew(listing.item.crew);
    } else if (listing.type === 'blueprint' && listing.item.blueprintId) {
      set((s) => ({
        player: {
          ...s.player,
          inventory: {
            ...s.player.inventory,
            blueprints: [
              ...s.player.inventory.blueprints,
              {
                id: listing.item.blueprintId!,
                name: listing.item.blueprintName || '未知图纸',
                tier: listing.item.blueprintTier || 2,
              },
            ],
          },
        },
      }));
    }

    const triggeredBounty = listing.price > listing.suggestedPriceMax * 1.5;
    const record: TradeRecord = {
      id: uid(),
      listingId,
      buyerName: state.player.name,
      sellerName: listing.sellerName,
      itemName:
        listing.type === 'blueprint'
          ? listing.item.blueprintName || '图纸'
          : listing.item.crew?.name || '船员合同',
      price: listing.price,
      timestamp: Date.now(),
      triggeredBounty,
    };

    const itemName =
      listing.type === 'blueprint'
        ? listing.item.blueprintName || '图纸'
        : `${listing.item.crew?.name || '船员'}合同`;

    set((s) => ({
      marketListings: s.marketListings.filter((l) => l.id !== listingId),
      tradeHistory: [record, ...s.tradeHistory],
      announcements: [
        {
          id: uid(),
          text: `💰 成交！${record.buyerName} 以 ${record.price} 金币购得「${itemName}」${triggeredBounty ? ' —— 赏金猎人已闻风出动！' : ''}`,
          timestamp: Date.now(),
        },
        ...s.announcements.slice(0, 9),
      ],
    }));

    return true;
  },

  weeklyLog: INITIAL_WEEKLY_LOG,
  generateWeeklyLog: () => {
    const state = get();
    const log: WeeklyLog = {
      ...INITIAL_WEEKLY_LOG,
      battleStats: {
        ...INITIAL_WEEKLY_LOG.battleStats,
        shipsSunk: state.player.stats.shipsSunk,
      },
      totalGoldEarned: state.player.stats.totalWealth,
      events: state.voyageEvents,
    };
    set({ weeklyLog: log });
  },

  leaderboard: LEADERBOARD_DATA,
}));
