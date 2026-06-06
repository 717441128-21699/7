import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

interface DamageFloat {
  id: string;
  side: 'player' | 'enemy';
  damage: number;
  timestamp: number;
}

export default function Battle() {
  const {
    activeBattle,
    startBattle,
    fireCannon,
    changeHeading,
    initiateBoarding,
    tickBattle,
    endBattle,
  } = useGameStore();

  const [damageFloats, setDamageFloats] = useState<DamageFloat[]>([]);
  const [cannonShots, setCannonShots] = useState<{ id: string; x: number; y: number }[]>([]);
  const lastProcessedLogRef = useRef<number>(-1);
  const lastCannonCooldownRef = useRef<number[]>([]);

  useEffect(() => {
    if (!activeBattle) {
      startBattle();
    }
  }, [activeBattle, startBattle]);

  useEffect(() => {
    if (!activeBattle || activeBattle.status !== 'fighting') return;
    const interval = setInterval(() => {
      tickBattle();
    }, 100);
    return () => clearInterval(interval);
  }, [activeBattle, tickBattle]);

  useEffect(() => {
    if (!activeBattle) return;
    const log = activeBattle.damageLog;
    if (log.length > 0 && log.length - 1 > lastProcessedLogRef.current) {
      const newEntries = log.slice(lastProcessedLogRef.current + 1);
      newEntries.forEach((entry) => {
        if (entry.damage > 0) {
          const id = `${entry.timestamp}-${Math.random()}`;
          setDamageFloats((prev) => [
            ...prev,
            { id, side: entry.side, damage: entry.damage, timestamp: entry.timestamp },
          ]);
          setTimeout(() => {
            setDamageFloats((prev) => prev.filter((f) => f.id !== id));
          }, 1000);
        }
      });
      lastProcessedLogRef.current = log.length - 1;
    }
  }, [activeBattle?.damageLog]);

  useEffect(() => {
    if (!activeBattle) return;
    const cooldowns = activeBattle.cannonCooldowns;
    if (lastCannonCooldownRef.current.length === cooldowns.length) {
      cooldowns.forEach((cd, i) => {
        if (lastCannonCooldownRef.current[i] > 0 && cd === 0) {
          return;
        }
        if (lastCannonCooldownRef.current[i] === 0 && cd > 0) {
          const id = `shot-${Date.now()}-${i}`;
          const startX = 150;
          const startY = 200;
          setCannonShots((prev) => [...prev, { id, x: startX, y: startY }]);
          setTimeout(() => {
            setCannonShots((prev) => prev.filter((s) => s.id !== id));
          }, 800);
        }
      });
    }
    lastCannonCooldownRef.current = [...cooldowns];
  }, [activeBattle?.cannonCooldowns]);

  if (!activeBattle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-6xl"
        >
          ⚓
        </motion.div>
      </div>
    );
  }

  const { playerShip, enemyShip, playerHeading, distance, cannonCooldowns, status, playerCrew } = activeBattle;

  const handleFireCannon = (index: number) => {
    fireCannon(index);
  };

  const handleBoarding = () => {
    initiateBoarding();
  };

  const handleCloseModal = () => {
    if (status === 'won') {
      endBattle(true);
    } else if (status === 'lost') {
      endBattle(false);
    }
  };

  const playerX = 100 + (100 - distance) * 2.5;
  const enemyX = 700 - (100 - distance) * 2.5;

  const headingArrowX = playerX + 50 + Math.cos((playerHeading * Math.PI) / 180) * 40;
  const headingArrowY = 200 - Math.sin((playerHeading * Math.PI) / 180) * 40;

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="heading-display text-3xl md:text-4xl text-gold-300 text-center mb-6"
        >
          ⚔️ 海上决战 ⚔️
        </motion.h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="pirate-card p-4 border-4 border-gold-400"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="heading-display text-xl text-gold-300">🏴‍☠️ {playerShip.name}</h3>
              <span className="text-sm text-parchment-300">我方舰船</span>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm text-parchment-200 mb-1">
                  <span>❤️ 船体耐久</span>
                  <span className="font-mono">
                    {playerShip.currentHp} / {playerShip.maxHp}
                  </span>
                </div>
                <div className="stat-bar">
                  <motion.div
                    animate={{
                      width: `${(playerShip.currentHp / playerShip.maxHp) * 100}%`,
                    }}
                    className="stat-bar-fill bg-gradient-to-r from-blood-400 to-blood-600"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-parchment-300">👥 船员: {playerCrew.length}</span>
                <span className="text-parchment-300">💥 火力: {playerShip.firepower}</span>
              </div>
            </div>
            <div className="relative h-4 mt-2">
              <AnimatePresence>
                {damageFloats
                  .filter((f) => f.side === 'player')
                  .map((f) => (
                    <motion.span
                      key={f.id}
                      initial={{ y: 0, opacity: 1 }}
                      animate={{ y: -40, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1 }}
                      className="damage-float absolute right-4"
                    >
                      -{f.damage}
                    </motion.span>
                  ))}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="pirate-card p-4 border-4 border-blood-400"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="heading-display text-xl text-blood-300">☠️ {enemyShip.name}</h3>
              <span className="text-sm text-parchment-300">敌方舰船</span>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm text-parchment-200 mb-1">
                  <span>❤️ 船体耐久</span>
                  <span className="font-mono">
                    {enemyShip.hp} / {enemyShip.maxHp}
                  </span>
                </div>
                <div className="stat-bar">
                  <motion.div
                    animate={{ width: `${(enemyShip.hp / enemyShip.maxHp) * 100}%` }}
                    className="stat-bar-fill bg-gradient-to-r from-blood-400 to-blood-600"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-parchment-300">👥 船员: {enemyShip.crewCount}</span>
                <span className="text-parchment-300">💥 火力: {enemyShip.firepower}</span>
              </div>
            </div>
            <div className="relative h-4 mt-2">
              <AnimatePresence>
                {damageFloats
                  .filter((f) => f.side === 'enemy')
                  .map((f) => (
                    <motion.span
                      key={f.id}
                      initial={{ y: 0, opacity: 1 }}
                      animate={{ y: -40, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1 }}
                      className="damage-float absolute right-4 text-gold-400"
                    >
                      -{f.damage}
                    </motion.span>
                  ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="pirate-card p-3 mb-4 overflow-hidden"
        >
          <svg viewBox="0 0 800 400" className="w-full h-auto max-h-[400px]">
            <defs>
              <linearGradient id="oceanGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0A2342" />
                <stop offset="50%" stopColor="#061528" />
                <stop offset="100%" stopColor="#040E1B" />
              </linearGradient>
              <linearGradient id="shipGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EECB4C" />
                <stop offset="100%" stopColor="#806516" />
              </linearGradient>
              <linearGradient id="shipRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EB4F4F" />
                <stop offset="100%" stopColor="#540000" />
              </linearGradient>
            </defs>
            <rect width="800" height="400" fill="url(#oceanGrad)" />
            {[0, 1, 2, 3, 4].map((row) => (
              <g key={row}>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <motion.path
                    key={i}
                    d={`M ${i * 120 - 60} ${300 + row * 20} Q ${i * 120} ${290 + row * 20} ${i * 120 + 60} ${300 + row * 20}`}
                    stroke="#2A5A8C"
                    strokeWidth="2"
                    fill="none"
                    opacity="0.3"
                    animate={{ x: [0, 20, 0] }}
                    transition={{
                      duration: 3 + row * 0.5,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </g>
            ))}
            <g transform={`translate(${playerX}, 180)`}>
              <motion.g animate={{ y: [0, -4, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
                <path d="M -40 20 L -35 40 L 35 40 L 40 20 L 30 10 L -30 10 Z" fill="url(#shipGold)" stroke="#C9A227" strokeWidth="2" />
                <rect x="-5" y="-40" width="10" height="50" fill="#5C4033" />
                <path d="M 5 -40 L 45 -25 L 5 -10 Z" fill="#F4E4BC" stroke="#C9A227" strokeWidth="1.5" />
                <path d="M -5 -40 L -45 -25 L -5 -10 Z" fill="#F4E4BC" stroke="#C9A227" strokeWidth="1.5" opacity="0.8" />
                <rect x="-40" y="-5" width="10" height="8" fill="#061528" rx="2" />
                <rect x="-20" y="-5" width="10" height="8" fill="#061528" rx="2" />
                <rect x="0" y="-5" width="10" height="8" fill="#061528" rx="2" />
                <rect x="20" y="-5" width="10" height="8" fill="#061528" rx="2" />
              </motion.g>
            </g>
            <g transform={`translate(${enemyX}, 180)`}>
              <motion.g animate={{ y: [0, 4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                <path d="M -40 20 L -35 40 L 35 40 L 40 20 L 30 10 L -30 10 Z" fill="url(#shipRed)" stroke="#BD1E1E" strokeWidth="2" />
                <rect x="-5" y="-40" width="10" height="50" fill="#38261F" />
                <path d="M -5 -40 L -45 -25 L -5 -10 Z" fill="#1C0000" stroke="#BD1E1E" strokeWidth="1.5" />
                <path d="M 5 -40 L 45 -25 L 5 -10 Z" fill="#1C0000" stroke="#BD1E1E" strokeWidth="1.5" opacity="0.8" />
                <rect x="-40" y="-5" width="10" height="8" fill="#1C0000" rx="2" />
                <rect x="-20" y="-5" width="10" height="8" fill="#1C0000" rx="2" />
                <rect x="0" y="-5" width="10" height="8" fill="#1C0000" rx="2" />
                <rect x="20" y="-5" width="10" height="8" fill="#1C0000" rx="2" />
              </motion.g>
            </g>
            <motion.line
              x1={playerX + 30}
              y1="200"
              x2={headingArrowX}
              y2={headingArrowY}
              stroke="#EECB4C"
              strokeWidth="3"
              markerEnd="url(#arrowGold)"
            />
            <defs>
              <marker id="arrowGold" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                <path d="M0,0 L0,6 L9,3 z" fill="#EECB4C" />
              </marker>
            </defs>
            {cannonShots.map((shot) => (
              <motion.circle
                key={shot.id}
                cx={shot.x}
                cy={shot.y}
                r="6"
                fill="#EECB4C"
                initial={{ cx: playerX + 40, cy: 195, opacity: 1 }}
                animate={{
                  cx: [playerX + 40, (playerX + enemyX) / 2, enemyX - 40],
                  cy: [195, 120, 195],
                  opacity: [1, 1, 0.8],
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            ))}
            {cannonShots.map((shot) => (
              <motion.path
                key={`trail-${shot.id}`}
                d={`M ${playerX + 40} 195 Q ${(playerX + enemyX) / 2} 120 ${enemyX - 40} 195`}
                stroke="#EECB4C"
                strokeWidth="2"
                fill="none"
                strokeDasharray="5,5"
                initial={{ pathLength: 0, opacity: 0.8 }}
                animate={{ pathLength: 1, opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            ))}
            <text x="400" y="380" textAnchor="middle" fill="#F4E4BC" fontSize="16" fontFamily="Cinzel, serif">
              距离: {Math.round(distance)} 海里
            </text>
          </svg>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="pirate-card p-4"
          >
            <h3 className="heading-display text-lg text-gold-300 mb-3">🧭 航行控制</h3>
            <div className="flex items-center justify-center gap-6 mb-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => changeHeading(-15)}
                disabled={status !== 'fighting'}
                className="pirate-btn text-2xl px-6 py-4"
              >
                ⬅️
              </motion.button>
              <div className="compass-ring flex items-center justify-center">
                <motion.div
                  animate={{ rotate: playerHeading }}
                  transition={{ type: 'spring', stiffness: 100 }}
                  className="absolute w-1 h-12 bg-gold-400 origin-bottom"
                  style={{ bottom: '50%' }}
                />
                <div className="absolute w-2 h-2 rounded-full bg-gold-500" />
                <span className="absolute top-1 text-gold-300 text-xs font-display">N</span>
                <span className="absolute bottom-1 text-gold-300 text-xs font-display">S</span>
                <span className="absolute left-1 text-gold-300 text-xs font-display">W</span>
                <span className="absolute right-1 text-gold-300 text-xs font-display">E</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => changeHeading(15)}
                disabled={status !== 'fighting'}
                className="pirate-btn text-2xl px-6 py-4"
              >
                ➡️
              </motion.button>
            </div>
            <div className="text-center text-parchment-200 font-mono text-lg mb-4">
              航向: {playerHeading}°
            </div>
            <motion.button
              whileHover={distance <= 30 ? { scale: 1.05 } : {}}
              whileTap={distance <= 30 ? { scale: 0.95 } : {}}
              onClick={handleBoarding}
              disabled={status !== 'fighting' || distance > 30}
              className={`w-full pirate-btn ${distance <= 30 ? 'pirate-btn-danger' : 'opacity-50 cursor-not-allowed'}`}
            >
              ⚔️ 登船战 {distance > 30 && `(距离需 ≤ 30)`}
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="pirate-card p-4"
          >
            <h3 className="heading-display text-lg text-gold-300 mb-3">💣 火炮控制</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {playerShip.cannons.map((cannon, i) => {
                const cooldown = cannonCooldowns[i] || 0;
                const isCooling = cooldown > 0;
                const progress = isCooling ? (1 - cooldown / cannon.fireRate) * 100 : 100;
                return (
                  <motion.button
                    key={i}
                    whileHover={!isCooling ? { scale: 1.03 } : {}}
                    whileTap={!isCooling ? { scale: 0.97 } : {}}
                    onClick={() => handleFireCannon(i)}
                    disabled={isCooling || status !== 'fighting'}
                    className={`relative p-3 rounded-lg border-2 transition-all overflow-hidden ${
                      isCooling
                        ? 'bg-ocean-700/50 border-ocean-500/50 opacity-60 cursor-not-allowed'
                        : 'bg-gradient-to-b from-wood-500 to-wood-600 border-gold-500 hover:border-gold-300 shadow-md hover:shadow-gold-500/30'
                    }`}
                  >
                    <div className="relative z-10">
                      <div className="text-2xl mb-1">💣</div>
                      <div className="text-xs font-display text-gold-200 truncate">{cannon.name}</div>
                      <div className="text-xs text-parchment-300 mt-1">伤害: {cannon.damage}</div>
                      {isCooling && (
                        <div className="text-xs font-mono text-gold-400 mt-1 font-bold">
                          {cooldown.toFixed(1)}s
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-ocean-800">
                      <motion.div
                        animate={{ width: `${progress}%` }}
                        className={`h-full ${isCooling ? 'bg-gold-500' : 'bg-gold-300'}`}
                      />
                    </div>
                  </motion.button>
                );
              })}
              {playerShip.cannons.length === 0 && (
                <div className="col-span-full text-center text-parchment-400 py-4">
                  未装备火炮
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {(status === 'won' || status === 'lost') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 50 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className={`pirate-card p-8 max-w-md w-full text-center ${
                  status === 'won' ? 'border-4 border-gold-400' : 'border-4 border-blood-400'
                }`}
              >
                {status === 'won' ? (
                  <>
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="text-7xl mb-4"
                    >
                      🏆
                    </motion.div>
                    <h2 className="heading-display text-3xl text-gold-300 mb-6">胜利！</h2>
                    <div className="space-y-4 mb-6">
                      <motion.div
                        initial={{ x: -30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center justify-center gap-3 bg-ocean-700/50 p-4 rounded-lg"
                      >
                        <span className="text-4xl animate-treasure-glow">💰</span>
                        <span className="heading-display text-2xl text-gold-300">
                          +{enemyShip.loot.gold} 金币
                        </span>
                      </motion.div>
                      {enemyShip.loot.blueprints && enemyShip.loot.blueprints.length > 0 && (
                        <motion.div
                          initial={{ x: 30, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="flex items-center justify-center gap-3 bg-ocean-700/50 p-4 rounded-lg"
                        >
                          <span className="text-4xl animate-treasure-glow">📜</span>
                          <span className="heading-display text-2xl text-gold-300">
                            +{enemyShip.loot.blueprints.length} 图纸
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <motion.div
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-7xl mb-4"
                    >
                      💀
                    </motion.div>
                    <h2 className="heading-display text-3xl text-blood-300 mb-6">战败...</h2>
                    <div className="space-y-4 mb-6">
                      <motion.div
                        initial={{ x: -30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center justify-center gap-3 bg-blood-900/30 p-4 rounded-lg"
                      >
                        <span className="text-4xl">💰</span>
                        <span className="heading-display text-2xl text-blood-300">
                          -{Math.round(useGameStore.getState().player.gold * 0.15)} 金币
                        </span>
                      </motion.div>
                      {activeBattle.casualties.player > 0 && (
                        <motion.div
                          initial={{ x: 30, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="flex items-center justify-center gap-3 bg-blood-900/30 p-4 rounded-lg"
                        >
                          <span className="text-4xl">👥</span>
                          <span className="heading-display text-2xl text-blood-300">
                            -{activeBattle.casualties.player} 船员
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCloseModal}
                  className="pirate-btn-gold w-full text-lg"
                >
                  {status === 'won' ? '收集战利品' : '返回港口'}
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
