import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type {
  Ship,
  CrewMember,
  BattleState,
  MarketListing,
  TradeRecord,
  VoyageEvent,
  Player,
  Weather,
  ShipHull,
  ShipCannon,
  ShipSail,
  ShipArmor,
  EnemyShip,
} from './types';
import {
  SHIP_HULLS,
  SHIP_CANNONS,
  SHIP_SAILS,
  SHIP_ARMORS,
  RECRUITABLE_CREW,
  ENEMY_SHIPS,
  RANDOM_EVENTS,
  WEATHER_TYPES,
  MARKET_LISTINGS,
  HISTORICAL_TRADES,
  LEADERBOARD_DATA,
  INITIAL_PLAYER,
  INITIAL_WEEKLY_LOG,
} from './data';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const PLAYER_ID = 'player-1';

let player: Player = JSON.parse(JSON.stringify(INITIAL_PLAYER));
let ships: Ship[] = [];
let crew: CrewMember[] = [];
let marketListings: MarketListing[] = JSON.parse(JSON.stringify(MARKET_LISTINGS));
let tradeRecords: TradeRecord[] = JSON.parse(JSON.stringify(HISTORICAL_TRADES));
let announcements: string[] = [];
let voyageEvents: VoyageEvent[] = [];
let weeklyLog = JSON.parse(JSON.stringify(INITIAL_WEEKLY_LOG));
let battles: Map<string, BattleState> = new Map();

function error(message: string) {
  return { success: false, error: message };
}

function getLastBattle(): BattleState | undefined {
  const entries = Array.from(battles.entries());
  if (entries.length === 0) return undefined;
  return entries[entries.length - 1][1];
}

function calculateShipStats(
  hull: ShipHull,
  cannons: ShipCannon[],
  sail: ShipSail,
  armor: ShipArmor,
  playerCrew: CrewMember[]
) {
  const captain = playerCrew.find((c) => c.role === 'captain');
  const gunners = playerCrew.filter((c) => c.role === 'gunner');
  const sailors = playerCrew.filter((c) => c.role === 'sailor');

  let speed = hull.baseSpeed + sail.speedBonus - armor.speedPenalty;
  let defense = hull.baseDefense + armor.defenseBonus;
  let firepower = cannons.reduce((sum, c) => sum + c.damage, 0);
  const maxHp = (hull.baseDefense + 100) * 2;

  if (captain) {
    speed += (captain.skills.navigation || 0) * 0.1;
    defense += (captain.skills.leadership || 0) * 0.15;
    firepower += (captain.skills.combat || 0) * 0.2;
  }

  if (gunners.length > 0) {
    const avgGunnery = gunners.reduce((s, g) => s + (g.skills.gunnery || 0), 0) / gunners.length;
    firepower += avgGunnery * 0.3;
  }

  if (sailors.length > 0) {
    const avgSailing = sailors.reduce((s, sa) => s + (sa.skills.sailing || 0), 0) / sailors.length;
    speed += avgSailing * 0.15;
  }

  return {
    speed: Math.round(speed),
    firepower: Math.round(firepower),
    defense: Math.round(defense),
    maxHp: Math.round(maxHp),
    maxCrew: hull.maxCrew,
    maxCannons: hull.maxCannons,
  };
}

app.get('/api/player', (req, res) => {
  res.json(player);
});

app.patch('/api/player/gold', (req, res) => {
  const { delta } = req.body;
  if (typeof delta !== 'number') {
    return res.status(400).json(error('delta 必须是数字'));
  }
  player.gold = Math.max(0, player.gold + delta);
  if (delta > 0) {
    player.stats.totalWealth += delta;
  }
  res.json(player);
});

app.get('/api/weather', (req, res) => {
  const weather = WEATHER_TYPES[Math.floor(Math.random() * WEATHER_TYPES.length)];
  res.json(weather);
});

app.get('/api/modules', (req, res) => {
  res.json({
    hulls: SHIP_HULLS,
    cannons: SHIP_CANNONS,
    sails: SHIP_SAILS,
    armors: SHIP_ARMORS,
  });
});

app.get('/api/crew/recruitable', (req, res) => {
  const recruitedIds = crew.map((c) => c.id);
  const available = RECRUITABLE_CREW.filter((c) => !recruitedIds.includes(c.id));
  res.json(available);
});

app.post('/api/ships/build', (req, res) => {
  const { name, hull, cannons, sail, armor, hullId, cannonIds, sailId, armorId } = req.body;

  let resolvedHull: ShipHull | undefined;
  let resolvedCannons: ShipCannon[] = [];
  let resolvedSail: ShipSail | undefined;
  let resolvedArmor: ShipArmor | undefined;

  if (hull && cannons && sail && armor) {
    resolvedHull = typeof hull === 'string' ? SHIP_HULLS.find((h) => h.id === hull) : hull;
    resolvedCannons = Array.isArray(cannons)
      ? cannons.map((c) => (typeof c === 'string' ? SHIP_CANNONS.find((sc) => sc.id === c) : c)).filter(Boolean)
      : [];
    resolvedSail = typeof sail === 'string' ? SHIP_SAILS.find((s) => s.id === sail) : sail;
    resolvedArmor = typeof armor === 'string' ? SHIP_ARMORS.find((a) => a.id === armor) : armor;
  } else if (name && hullId && cannonIds && sailId && armorId) {
    resolvedHull = SHIP_HULLS.find((h) => h.id === hullId);
    resolvedSail = SHIP_SAILS.find((s) => s.id === sailId);
    resolvedArmor = SHIP_ARMORS.find((a) => a.id === armorId);
    resolvedCannons = cannonIds
      .map((id: string) => SHIP_CANNONS.find((c) => c.id === id))
      .filter(Boolean);
  }

  if (!name) {
    return res.status(400).json(error('缺少必要参数'));
  }

  if (!resolvedHull || !resolvedSail || !resolvedArmor || resolvedCannons.length === 0) {
    return res.status(400).json(error('无效的模块'));
  }

  if (resolvedCannons.length > resolvedHull.maxCannons) {
    return res.status(400).json(error(`火炮数量超出船体上限(${resolvedHull.maxCannons})`));
  }

  const totalCost =
    resolvedHull.cost + resolvedSail.cost + resolvedArmor.cost + resolvedCannons.reduce((s, c) => s + c.cost, 0);

  if (player.gold < totalCost) {
    return res.status(400).json(error(`金币不足，需要${totalCost}金币`));
  }

  player.gold -= totalCost;

  const stats = calculateShipStats(resolvedHull, resolvedCannons, resolvedSail, resolvedArmor, crew);

  const newShip: Ship = {
    id: `ship-${uuidv4()}`,
    name,
    hull: resolvedHull,
    cannons: resolvedCannons,
    sail: resolvedSail,
    armor: resolvedArmor,
    speed: stats.speed,
    firepower: stats.firepower,
    defense: stats.defense,
    maxHp: stats.maxHp,
    currentHp: stats.maxHp,
  };

  ships.push(newShip);
  player.ships = ships;
  if (!player.activeShipId) {
    player.activeShipId = newShip.id;
  }

  const currentShip = ships.find((s) => s.id === player.activeShipId) || ships[0] || null;

  res.json({
    success: true,
    ship: newShip,
    ships,
    player,
    currentShip,
  });
});

app.get('/api/ships', (req, res) => {
  res.json(ships);
});

app.post('/api/crew/recruit/:id', (req, res) => {
  const { id } = req.params;
  const member = RECRUITABLE_CREW.find((c) => c.id === id);

  if (!member) {
    return res.status(404).json(error('船员不存在'));
  }

  if (crew.some((c) => c.id === id)) {
    return res.status(400).json(error('该船员已招募'));
  }

  const cost = member.contractPrice || 0;
  if (player.gold < cost) {
    return res.status(400).json(error(`金币不足，需要${cost}金币`));
  }

  player.gold -= cost;
  crew.push({ ...member });
  player.crew = crew;

  ships.forEach((ship) => {
    const stats = calculateShipStats(ship.hull, ship.cannons, ship.sail, ship.armor, crew);
    ship.speed = stats.speed;
    ship.firepower = stats.firepower;
    ship.defense = stats.defense;
  });

  res.json({
    success: true,
    crew,
    player,
  });
});

app.delete('/api/crew/:id', (req, res) => {
  const { id } = req.params;
  const index = crew.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json(error('船员不存在'));
  }

  const removedCrew = crew[index];
  crew.splice(index, 1);
  player.crew = crew;

  ships.forEach((ship) => {
    const stats = calculateShipStats(ship.hull, ship.cannons, ship.sail, ship.armor, crew);
    ship.speed = stats.speed;
    ship.firepower = stats.firepower;
    ship.defense = stats.defense;
  });

  res.json({
    success: true,
    crew,
    player,
  });
});

app.post('/api/voyage/start', (req, res) => {
  const eventTemplate = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
  const event: VoyageEvent = {
    ...eventTemplate,
    id: `event-${uuidv4()}`,
    timestamp: Date.now(),
    resolved: false,
  };
  voyageEvents.push(event);
  weeklyLog.events.push(event);
  weeklyLog.voyageCount += 1;
  res.json(event);
});

app.post('/api/voyage/resolve/:eventId', (req, res) => {
  const { eventId } = req.params;
  const event = voyageEvents.find((e) => e.id === eventId);

  if (!event) {
    return res.status(404).json(error('事件不存在'));
  }

  if (event.resolved) {
    return res.status(400).json(error('事件已结算'));
  }

  event.resolved = true;

  if (event.reward) {
    if (event.reward.gold) {
      player.gold += event.reward.gold;
      player.stats.totalWealth += event.reward.gold;
      weeklyLog.totalGoldEarned += event.reward.gold;
    }
    if (event.reward.resources) {
      Object.entries(event.reward.resources).forEach(([key, value]) => {
        player.inventory.resources[key] = (player.inventory.resources[key] || 0) + value;
      });
    }
    if (event.reward.blueprints) {
      event.reward.blueprints.forEach((bpId) => {
        player.inventory.blueprints.push({
          id: bpId,
          name: `图纸-${bpId}`,
          tier: Math.ceil(Math.random() * 4),
        });
      });
    }
  }

  if (event.penalty) {
    if (event.penalty.goldLoss) {
      player.gold = Math.max(0, player.gold - event.penalty.goldLoss);
      weeklyLog.totalGoldSpent += event.penalty.goldLoss;
    }
    if (event.penalty.crewLoss && crew.length > 0) {
      const lossCount = Math.min(event.penalty.crewLoss, crew.length);
      crew.splice(0, lossCount);
      player.crew = crew;
      weeklyLog.battleStats.crewLost += lossCount;
    }
    if (event.penalty.hpLoss && ships.length > 0) {
      const activeShip = ships.find((s) => s.id === player.activeShipId) || ships[0];
      activeShip.currentHp = Math.max(0, activeShip.currentHp - event.penalty.hpLoss);
    }
  }

  const shouldBattle = event.type === 'enemy' || event.type === 'merchant';

  res.json({
    voyageEvents,
    player,
    crew,
    shouldBattle,
  });
});

app.post('/api/battle/start', (req, res) => {
  let activeShip = ships.find((s) => s.id === player.activeShipId);
  if (!activeShip && ships.length > 0) {
    activeShip = ships[0];
  }
  if (!activeShip) {
    return res.status(400).json(error('没有可用船只'));
  }

  const enemyTemplate = ENEMY_SHIPS[Math.floor(Math.random() * ENEMY_SHIPS.length)];
  const enemy: EnemyShip & { hp: number } = {
    ...enemyTemplate,
    hp: enemyTemplate.maxHp,
  };

  const battleId = `battle-${uuidv4()}`;
  const battle: BattleState = {
    id: battleId,
    playerShip: JSON.parse(JSON.stringify(activeShip)),
    enemyShip: enemy,
    playerCrew: JSON.parse(JSON.stringify(crew)),
    cannonCooldowns: activeShip.cannons.map(() => 0),
    playerHeading: 0,
    enemyHeading: 180,
    distance: 100,
    timeElapsed: 0,
    status: 'fighting',
    casualties: { player: 0, enemy: 0 },
    damageLog: [],
  };

  battles.set(battleId, battle);
  player.stats.totalBattles += 1;

  res.json(battle);
});

app.post('/api/battle/fire', (req, res) => {
  const battle = getLastBattle();
  const { index } = req.body;

  if (!battle) {
    return res.status(404).json(error('战斗不存在'));
  }

  if (battle.status !== 'fighting') {
    return res.status(400).json(error('战斗已结束'));
  }

  const fireIndexes: number[] = typeof index === 'number' ? [index] : battle.playerShip.cannons.map((_, i) => i);

  fireIndexes.forEach((i) => {
    const cannon = battle.playerShip.cannons[i];
    if (!cannon) return;
    if (battle.cannonCooldowns[i] <= 0 && battle.distance <= cannon.range) {
      const baseDamage = cannon.damage;
      const gunneryBonus =
        battle.playerCrew
          .filter((c) => c.role === 'gunner')
          .reduce((s, c) => s + (c.skills.gunnery || 0), 0) * 0.005;
      const defenseMitigation = battle.enemyShip.defense / (battle.enemyShip.defense + 100);
      const damage = Math.max(1, Math.round(baseDamage * (1 + gunneryBonus) * (1 - defenseMitigation)));
      battle.enemyShip.hp = Math.max(0, battle.enemyShip.hp - damage);
      battle.cannonCooldowns[i] = cannon.fireRate;

      battle.damageLog.push({
        side: 'player',
        damage,
        timestamp: Date.now(),
      });
    }
  });

  if (battle.enemyShip.hp <= 0) {
    battle.status = 'won';
  }

  res.json(battle);
});

app.post('/api/battle/tick', (req, res) => {
  const battle = getLastBattle();

  if (!battle) {
    return res.status(404).json(error('战斗不存在'));
  }

  if (battle.status !== 'fighting') {
    return res.status(400).json(error('战斗已结束'));
  }

  battle.timeElapsed += 1;
  battle.cannonCooldowns = battle.cannonCooldowns.map((cd) => Math.max(0, cd - 1));

  if (battle.distance <= 80) {
    const baseDamage = battle.enemyShip.firepower / 5;
    const defenseMitigation = battle.playerShip.defense / (battle.playerShip.defense + 100);
    const enemyDamage = Math.max(1, Math.round(baseDamage * (1 - defenseMitigation)));
    battle.playerShip.currentHp = Math.max(0, battle.playerShip.currentHp - enemyDamage);

    battle.damageLog.push({
      side: 'enemy',
      damage: enemyDamage,
      timestamp: Date.now(),
    });
  }

  if (battle.playerShip.currentHp <= 0) {
    battle.status = 'lost';
  }

  const closingSpeed = Math.abs(battle.playerShip.speed - battle.enemyShip.speed) / 10;
  battle.distance = Math.max(0, battle.distance - closingSpeed);

  const currentShip = ships.find((s) => s.id === player.activeShipId) || ships[0] || null;

  res.json({
    battle,
    ships,
    currentShip,
  });
});

app.post('/api/battle/boarding', (req, res) => {
  const battle = getLastBattle();

  if (!battle) {
    return res.status(404).json(error('战斗不存在'));
  }

  if (battle.status !== 'fighting') {
    return res.status(400).json(error('战斗已结束'));
  }

  if (battle.distance > 10) {
    return res.status(400).json(error('距离过远，无法登船'));
  }

  const playerCombat = battle.playerCrew.reduce((s, c) => s + (c.skills.combat || 0), 0);
  const enemyCombat = battle.enemyShip.crewCount * 20;
  const playerRoll = Math.random() * playerCombat;
  const enemyRoll = Math.random() * enemyCombat;

  if (playerRoll > enemyRoll) {
    battle.status = 'won';
    const playerCasualties = Math.max(
      0,
      Math.floor(battle.playerCrew.length * (1 - playerRoll / (playerRoll + enemyRoll)))
    );
    battle.casualties.player = playerCasualties;
    battle.casualties.enemy = battle.enemyShip.crewCount;
  } else {
    const playerCasualties = Math.max(
      1,
      Math.floor(battle.playerCrew.length * 0.3)
    );
    battle.casualties.player = playerCasualties;
    if (battle.playerCrew.length <= playerCasualties) {
      battle.status = 'lost';
    }
  }

  const actualLoss = Math.min(battle.casualties.player, crew.length);
  if (actualLoss > 0) {
    crew.splice(0, actualLoss);
    player.crew = crew;
    battle.playerCrew = JSON.parse(JSON.stringify(crew));
    weeklyLog.battleStats.crewLost += actualLoss;
  }

  res.json({
    battle,
    crew,
    player,
  });
});

app.post('/api/battle/end', (req, res) => {
  const { victory } = req.body;
  const battle = getLastBattle();

  if (!battle) {
    return res.status(404).json(error('战斗不存在'));
  }

  let gold = 0;
  let blueprints: string[] = [];

  if (victory || battle.status === 'won') {
    gold = battle.enemyShip.loot.gold;
    blueprints = battle.enemyShip.loot.blueprints || [];
    player.gold += gold;
    player.stats.totalWealth += gold;
    player.stats.shipsSunk += 1;
    player.stats.plunderCount += 1;
    weeklyLog.battleWins += 1;
    weeklyLog.totalGoldEarned += gold;
    weeklyLog.battleStats.shipsSunk += 1;
    weeklyLog.battleStats.damageDealt += battle.damageLog
      .filter((d) => d.side === 'player')
      .reduce((s, d) => s + d.damage, 0);
    blueprints.forEach((bpId) => {
      player.inventory.blueprints.push({
        id: bpId,
        name: `图纸-${bpId}`,
        tier: Math.ceil(Math.random() * 4),
      });
    });
  } else if (battle.status === 'lost') {
    weeklyLog.battleLosses += 1;
  }

  if (battle.casualties.player > 0 && crew.length > 0) {
    const actualLoss = Math.min(battle.casualties.player, crew.length);
    crew.splice(0, actualLoss);
    player.crew = crew;
    weeklyLog.battleStats.crewLost += actualLoss;
  }

  weeklyLog.battleStats.damageTaken += battle.damageLog
    .filter((d) => d.side === 'enemy')
    .reduce((s, d) => s + d.damage, 0);

  battles.delete(battle.id);

  res.json({
    player,
    result: { gold, blueprints },
  });
});

app.get('/api/market/listings', (req, res) => {
  res.json(marketListings);
});

app.post('/api/market/listings', (req, res) => {
  const { type, item, price, suggestedPriceMin, suggestedPriceMax } = req.body;

  if (!type || !item || !price) {
    return res.status(400).json(error('缺少必要参数'));
  }

  const listing: MarketListing = {
    id: `listing-${uuidv4()}`,
    sellerId: PLAYER_ID,
    sellerName: player.name,
    type,
    item,
    price,
    suggestedPriceMin: suggestedPriceMin || Math.round(price * 0.8),
    suggestedPriceMax: suggestedPriceMax || Math.round(price * 1.2),
    listedAt: Date.now(),
  };

  marketListings.push(listing);
  res.json(marketListings);
});

app.post('/api/market/listings/:id/buy', (req, res) => {
  const { id } = req.params;
  const listingIndex = marketListings.findIndex((l) => l.id === id);

  if (listingIndex === -1) {
    return res.status(404).json(error('商品不存在'));
  }

  const listing = marketListings[listingIndex];

  if (player.gold < listing.price) {
    return res.status(400).json(error('金币不足'));
  }

  player.gold -= listing.price;
  weeklyLog.totalGoldSpent += listing.price;

  const itemName =
    listing.type === 'blueprint'
      ? listing.item.blueprintName || '图纸'
      : listing.item.crew?.name || '船员合同';

  const suggestedAvg = (listing.suggestedPriceMin + listing.suggestedPriceMax) / 2;
  const triggeredBounty = listing.price > suggestedAvg * 1.5;

  if (triggeredBounty) {
    announcements.unshift(`⚠️ 警告：${player.name}以高价购买了${itemName}，赏金猎人已出动！`);
  }

  const tradeRecord: TradeRecord = {
    id: `trade-${uuidv4()}`,
    listingId: listing.id,
    buyerName: player.name,
    sellerName: listing.sellerName,
    itemName,
    price: listing.price,
    timestamp: Date.now(),
    triggeredBounty,
  };

  tradeRecords.unshift(tradeRecord);
  marketListings.splice(listingIndex, 1);

  res.json({
    success: true,
    marketListings,
    tradeRecord,
    announcements,
    triggeredBounty,
  });
});

app.get('/api/market/price-suggestion', (req, res) => {
  const { type, tier } = req.query;
  const parsedTier = parseInt(tier as string) || 1;

  const recentTrades = tradeRecords.filter((t) => {
    const age = Date.now() - t.timestamp;
    return age < 7 * 86400000;
  });

  const matchingTrades = recentTrades.filter((t) => {
    if (type === 'blueprint') {
      return t.itemName.includes('图纸') && t.itemName.includes(`T${parsedTier}`);
    }
    return t.itemName.includes('合同');
  });

  const basePrices: Record<string, number[]> = {
    blueprint: [200, 400, 800, 1600, 3200],
    crewContract: [150, 400, 800, 1500, 2500],
  };

  const basePrice = basePrices[type as string]?.[parsedTier - 1] || 500;

  let avg = basePrice;
  if (matchingTrades.length > 0) {
    avg = Math.round(
      matchingTrades.reduce((s, t) => s + t.price, 0) / matchingTrades.length
    );
  }

  res.json({
    min: Math.round(avg * 0.85),
    max: Math.round(avg * 1.15),
    avg,
  });
});

app.get('/api/leaderboard', (req, res) => {
  res.json(LEADERBOARD_DATA);
});

app.get('/api/logbook', (req, res) => {
  res.json(weeklyLog);
});

app.listen(PORT, () => {
  console.log(`Pirate Server running on http://localhost:${PORT}`);
});
