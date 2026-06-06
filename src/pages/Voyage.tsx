import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { getWeatherEmoji, getEventEmoji, formatNumber } from '../utils/gameUtils';
import type { VoyageEvent } from '../types';

const islands = [
  { x: 200, y: 150, name: '骷髅岛', size: 30 },
  { x: 750, y: 120, name: '宝藏湾', size: 25 },
  { x: 400, y: 400, name: '迷雾礁', size: 22 },
  { x: 850, y: 450, name: '海妖岩', size: 28 },
  { x: 150, y: 480, name: '避风港', size: 20 },
  { x: 600, y: 250, name: '海盗角', size: 24 },
];

const continentPath = `
  M 0 0 L 120 0 L 150 40 L 100 80 L 130 140 L 80 200
  L 40 180 L 0 220 L 0 0 Z
  M 880 0 L 1000 0 L 1000 180 L 950 220 L 900 170
  L 860 200 L 840 140 L 870 80 L 850 30 Z
  M 0 500 L 60 490 L 100 520 L 80 570 L 120 600
  L 0 600 L 0 500 Z
  M 920 540 L 1000 520 L 1000 600 L 900 600 L 880 570 Z
`;

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

function Compass({ direction }: { direction: number }) {
  return (
    <div className="relative w-28 h-28">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="46" fill="#061528" stroke="#C9A227" strokeWidth="3" />
        <circle cx="50" cy="50" r="38" fill="none" stroke="#2A5A8C" strokeWidth="1" strokeDasharray="3 3" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const rad = ((deg - 90) * Math.PI) / 180;
          const x1 = 50 + 30 * Math.cos(rad);
          const y1 = 50 + 30 * Math.sin(rad);
          const x2 = 50 + 38 * Math.cos(rad);
          const y2 = 50 + 38 * Math.sin(rad);
          return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#C9A227" strokeWidth="1.5" />;
        })}
        <text x="50" y="18" textAnchor="middle" fill="#C9A227" fontSize="12" fontFamily="Cinzel, serif" fontWeight="bold">N</text>
        <text x="50" y="90" textAnchor="middle" fill="#F4E4BC" fontSize="10" fontFamily="Cinzel, serif">S</text>
        <text x="12" y="54" textAnchor="middle" fill="#F4E4BC" fontSize="10" fontFamily="Cinzel, serif">W</text>
        <text x="88" y="54" textAnchor="middle" fill="#F4E4BC" fontSize="10" fontFamily="Cinzel, serif">E</text>
        <motion.g
          animate={{ rotate: direction }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ transformOrigin: '50px 50px' }}
        >
          <polygon points="50,18 55,50 50,45 45,50" fill="#BD1E1E" />
          <polygon points="50,82 55,50 50,55 45,50" fill="#F4E4BC" />
          <circle cx="50" cy="50" r="5" fill="#C9A227" stroke="#061528" strokeWidth="1" />
        </motion.g>
      </svg>
    </div>
  );
}

export default function Voyage() {
  const navigate = useNavigate();
  const {
    player,
    currentWeather,
    updateWeather,
    currentLocation,
    voyageEvents,
    startVoyage,
    resolveEvent,
  } = useGameStore();

  const [targetIsland, setTargetIsland] = useState(islands[2]);
  const [activeEvent, setActiveEvent] = useState<VoyageEvent | null>(null);
  const [playerPos, setPlayerPos] = useState(currentLocation);
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    updateWeather().catch(() => {});
    const interval = setInterval(() => {
      updateWeather().catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [updateWeather]);

  useEffect(() => {
    const newTarget = islands[Math.floor(Math.random() * islands.length)];
    setTargetIsland(newTarget);
  }, []);

  const recentEvents = useMemo(
    () => [...voyageEvents].sort((a, b) => b.timestamp - a.timestamp).slice(0, 8),
    [voyageEvents]
  );

  const pendingEvent = useMemo(
    () => voyageEvents.find((e) => !e.resolved),
    [voyageEvents]
  );

  const handleStartVoyage = async () => {
    if (isMoving || activeEvent) return;
    setIsMoving(true);
    setPlayerPos(targetIsland);

    const duration = 2500;
    const startPos = { ...currentLocation };
    const startTime = Date.now();

    const animate = async () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setPlayerPos({
        x: startPos.x + (targetIsland.x - startPos.x) * easeProgress,
        y: startPos.y + (targetIsland.y - startPos.y) * easeProgress,
      });
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsMoving(false);
        try {
          const event = await startVoyage();
          setActiveEvent(event);
          setTargetIsland(islands[Math.floor(Math.random() * islands.length)]);
        } catch (e) {
          console.error('Failed to start voyage', e);
        }
      }
    };
    requestAnimationFrame(animate);
  };

  const handleResolveEvent = async () => {
    if (!activeEvent) return;
    const eventType = activeEvent.type;
    try {
      await resolveEvent(activeEvent.id);
      setActiveEvent(null);
      if (eventType === 'enemy' || eventType === 'merchant') {
        navigate('/battle');
      }
    } catch (e) {
      console.error('Failed to resolve event', e);
    }
  };

  const routeD = `M ${currentLocation.x} ${currentLocation.y} Q ${(currentLocation.x + targetIsland.x) / 2} ${Math.min(currentLocation.y, targetIsland.y) - 50} ${targetIsland.x} ${targetIsland.y}`;

  return (
    <div className="min-h-screen p-4 md:p-6">
      <AnimatePresence>
        {activeEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-900/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="parchment-panel p-6 md:p-8 max-w-md w-full"
            >
              <div className="text-center mb-4">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.6 }}
                  className="text-7xl mb-2"
                >
                  {getEventEmoji(activeEvent.type)}
                </motion.div>
                <h2 className="heading-display text-2xl md:text-3xl text-ocean-700 font-bold">
                  {activeEvent.title}
                </h2>
              </div>
              <p className="text-ocean-600 text-center mb-6 leading-relaxed">
                {activeEvent.description}
              </p>
              {activeEvent.reward && (
                <div className="mb-4 p-3 bg-copper-500/20 rounded-lg border border-copper-500/40">
                  <div className="text-sm text-ocean-700 font-display font-semibold mb-2">🎁 奖励</div>
                  <div className="flex flex-wrap gap-2">
                    {activeEvent.reward.gold && (
                      <span className="inline-flex items-center gap-1 bg-gold-500/40 text-ocean-700 px-3 py-1 rounded font-bold text-sm">
                        💰 +{formatNumber(activeEvent.reward.gold)}
                      </span>
                    )}
                    {activeEvent.reward.resources &&
                      Object.entries(activeEvent.reward.resources).map(([k, v]) => (
                        <span key={k} className="inline-flex items-center gap-1 bg-copper-500/40 text-ocean-700 px-3 py-1 rounded font-bold text-sm">
                          📦 {k} +{v}
                        </span>
                      ))}
                    {activeEvent.reward.blueprints && activeEvent.reward.blueprints.length > 0 && (
                      <span className="inline-flex items-center gap-1 bg-wood-500/40 text-parchment-100 px-3 py-1 rounded font-bold text-sm">
                        📋 +{activeEvent.reward.blueprints.length}图纸
                      </span>
                    )}
                  </div>
                </div>
              )}
              {activeEvent.penalty && (
                <div className="mb-4 p-3 bg-blood-500/20 rounded-lg border border-blood-500/40">
                  <div className="text-sm text-ocean-700 font-display font-semibold mb-2">⚠️ 损失</div>
                  <div className="flex flex-wrap gap-2">
                    {activeEvent.penalty.hpLoss && (
                      <span className="inline-flex items-center gap-1 bg-blood-500/40 text-parchment-100 px-3 py-1 rounded font-bold text-sm">
                        ❤️ -{activeEvent.penalty.hpLoss}
                      </span>
                    )}
                    {activeEvent.penalty.crewLoss && (
                      <span className="inline-flex items-center gap-1 bg-blood-500/40 text-parchment-100 px-3 py-1 rounded font-bold text-sm">
                        👥 -{activeEvent.penalty.crewLoss}船员
                      </span>
                    )}
                    {activeEvent.penalty.goldLoss && (
                      <span className="inline-flex items-center gap-1 bg-blood-500/40 text-parchment-100 px-3 py-1 rounded font-bold text-sm">
                        💰 -{formatNumber(activeEvent.penalty.goldLoss)}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {(activeEvent.type === 'enemy' || activeEvent.type === 'merchant') && (
                <div className="mb-4 p-3 bg-blood-500/20 rounded-lg border border-blood-500/40 text-center">
                  <span className="text-ocean-700 font-display font-semibold">⚔️ 即将进入战斗！</span>
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleResolveEvent}
                className="w-full py-3 text-lg font-display font-bold uppercase tracking-wider rounded-lg border-4 bg-gradient-to-b from-gold-400 to-gold-600 text-ocean-700 border-gold-300 shadow-lg shadow-gold-500/40 hover:shadow-gold-500/60"
              >
                {activeEvent.type === 'enemy' || activeEvent.type === 'merchant' ? '⚔️ 迎战' : '✅ 确认'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="heading-display text-3xl md:text-4xl text-gold-300 flex items-center gap-2">
            🧭 航海冒险
          </h1>
          <p className="text-parchment-300 text-sm mt-1">
            扬帆起航，探索未知海域
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-ocean-700/60 px-4 py-2 rounded-lg border border-gold-500/40">
            <span className="text-2xl">💰</span>
            <span className="font-display font-bold text-gold-300 text-xl">
              {formatNumber(player.gold)}
            </span>
            <span className="text-parchment-300 text-sm">金币</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="pirate-btn"
          >
            ← 返回
          </motion.button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="xl:col-span-2"
        >
          <div className="pirate-card p-4 h-full">
            <h3 className="heading-display text-lg text-gold-300 mb-4 text-center">
              🌤️ 天气状况
            </h3>
            <div className="space-y-4">
              <div className="text-center">
                <motion.div
                  key={currentWeather.type}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="text-6xl mb-2"
                >
                  {getWeatherEmoji(currentWeather.type)}
                </motion.div>
                <div className="font-display text-gold-200 capitalize">
                  {{
                    clear: '晴朗',
                    cloudy: '多云',
                    rain: '降雨',
                    storm: '暴风雨',
                    fog: '浓雾',
                  }[currentWeather.type]}
                </div>
              </div>
              <div className="flex justify-center">
                <Compass direction={currentWeather.windDirection} />
              </div>
              <div className="space-y-3">
                <div className="bg-ocean-700/50 p-3 rounded-lg border border-ocean-500/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-parchment-300 text-sm">💨 风速</span>
                    <span className="font-display font-bold text-gold-300">
                      {currentWeather.windSpeed} 节
                    </span>
                  </div>
                  <div className="stat-bar">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, currentWeather.windSpeed * 2)}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full bg-gradient-to-r from-copper-500 to-ocean-400 rounded-full"
                    />
                  </div>
                </div>
                <div className="bg-ocean-700/50 p-3 rounded-lg border border-ocean-500/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-parchment-300 text-sm">👁️ 能见度</span>
                    <span className="font-display font-bold text-gold-300">
                      {currentWeather.visibility}%
                    </span>
                  </div>
                  <div className="stat-bar">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${currentWeather.visibility}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full bg-gradient-to-r from-parchment-400 to-gold-400 rounded-full"
                    />
                  </div>
                </div>
              </div>
              <div className="text-center text-xs text-parchment-400">
                每 10 秒自动更新
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-7"
        >
          <div className="pirate-card p-3">
            <svg viewBox="0 0 1000 600" className="w-full h-auto rounded-lg" style={{ background: 'linear-gradient(180deg, #0A2342 0%, #081C35 50%, #061528 100%)' }}>
              <defs>
                <pattern id="wavePattern" patternUnits="userSpaceOnUse" width="80" height="20">
                  <path d="M 0 10 Q 20 0 40 10 T 80 10" fill="none" stroke="#2A5A8C" strokeWidth="1" opacity="0.3" />
                </pattern>
                <radialGradient id="islandGrad" cx="30%" cy="30%">
                  <stop offset="0%" stopColor="#5C8A3E" />
                  <stop offset="70%" stopColor="#3E5F28" />
                  <stop offset="100%" stopColor="#2A4018" />
                </radialGradient>
                <linearGradient id="continentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4A6B35" />
                  <stop offset="100%" stopColor="#2D4020" />
                </linearGradient>
                <filter id="glowGold">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <rect x="0" y="0" width="1000" height="600" fill="url(#wavePattern)" />

              <motion.path
                d={routeD}
                fill="none"
                stroke="#C9A227"
                strokeWidth="3"
                strokeDasharray="10 8"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.7 }}
                transition={{ duration: 1.5 }}
              />

              <path d={continentPath} fill="url(#continentGrad)" stroke="#C9A227" strokeWidth="1.5" opacity="0.9" />

              {islands.map((island) => (
                <g key={island.name}>
                  <motion.circle
                    cx={island.x}
                    cy={island.y}
                    r={island.size + 6}
                    fill="#C9A227"
                    opacity="0.2"
                    animate={{ r: [island.size + 4, island.size + 10, island.size + 4], opacity: [0.15, 0.35, 0.15] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <circle cx={island.x} cy={island.y} r={island.size} fill="url(#islandGrad)" stroke="#C9A227" strokeWidth="2" />
                  <circle cx={island.x - island.size * 0.3} cy={island.y - island.size * 0.2} r={island.size * 0.2} fill="#6B8F4B" opacity="0.7" />
                  <text
                    x={island.x}
                    y={island.y + island.size + 18}
                    textAnchor="middle"
                    fill="#F4E4BC"
                    fontSize="14"
                    fontFamily="'IM Fell English', serif"
                  >
                    {island.name}
                  </text>
                  {island.x === targetIsland.x && island.y === targetIsland.y && (
                    <motion.g
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <text
                        x={island.x}
                        y={island.y - island.size - 10}
                        textAnchor="middle"
                        fontSize="24"
                      >
                        🎯
                      </text>
                    </motion.g>
                  )}
                </g>
              ))}

              <g>
                <motion.circle
                  cx={playerPos.x}
                  cy={playerPos.y}
                  r="30"
                  fill="#BD1E1E"
                  opacity="0.2"
                  animate={{ r: [26, 38, 26], opacity: [0.15, 0.4, 0.15] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.text
                  x={playerPos.x}
                  y={playerPos.y + 12}
                  textAnchor="middle"
                  fontSize="40"
                  filter="url(#glowGold)"
                  animate={isMoving ? { rotate: [0, -5, 5, 0] } : { rotate: 0 }}
                  transition={{ duration: 0.5, repeat: isMoving ? Infinity : 0 }}
                >
                  🏴‍☠️
                </motion.text>
              </g>

              <g transform="translate(20, 560)">
                <rect x="0" y="0" width="140" height="30" rx="4" fill="#061528" stroke="#C9A227" strokeWidth="1.5" opacity="0.8" />
                <text x="70" y="20" textAnchor="middle" fill="#C9A227" fontSize="12" fontFamily="Cinzel, serif">
                  🏴‍☠️ 你的位置
                </text>
              </g>
              <g transform="translate(840, 560)">
                <rect x="0" y="0" width="140" height="30" rx="4" fill="#061528" stroke="#C9A227" strokeWidth="1.5" opacity="0.8" />
                <text x="70" y="20" textAnchor="middle" fill="#C9A227" fontSize="12" fontFamily="Cinzel, serif">
                  🎯 目标: {targetIsland.name}
                </text>
              </g>
            </svg>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="xl:col-span-3"
        >
          <div className="pirate-card p-4 h-full flex flex-col">
            <h3 className="heading-display text-lg text-gold-300 mb-4 text-center">
              ⚓ 航海事件
            </h3>
            <div className="flex-1 flex flex-col items-center justify-center">
              {pendingEvent ? (
                <div className="text-center mb-6">
                  <div className="text-5xl mb-2 animate-pulse">⚠️</div>
                  <div className="font-display text-gold-200 mb-1">有待处理事件</div>
                  <div className="text-sm text-parchment-300">
                    {pendingEvent.title}
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-6xl mb-4 opacity-70">🌊</div>
                  <p className="text-parchment-300 text-center mb-6 text-sm">
                    准备就绪，扬帆起航探索未知海域！
                  </p>
                </>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartVoyage}
                disabled={isMoving || !!activeEvent}
                className={`w-full py-4 text-xl font-display font-bold uppercase tracking-wider rounded-lg border-4 transition-all ${
                  isMoving || activeEvent
                    ? 'bg-ocean-700/50 text-parchment-400 border-ocean-600/50 cursor-not-allowed'
                    : 'bg-gradient-to-b from-gold-400 to-gold-600 text-ocean-700 border-gold-300 shadow-lg shadow-gold-500/40 hover:shadow-gold-500/60 animate-pulse-gold'
                }`}
              >
                {isMoving ? '🧭 航行中...' : activeEvent ? '⏳ 处理事件中' : '🌊 开始航海'}
              </motion.button>
            </div>
            <div className="mt-4 pt-4 border-t border-gold-500/30">
              <div className="text-sm text-parchment-300 text-center">
                本次航次: <span className="font-display font-bold text-gold-300">{voyageEvents.length}</span> 次事件
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="pirate-card p-4 md:p-6"
      >
        <h3 className="heading-display text-xl text-gold-300 mb-4 flex items-center gap-2">
          <span>📜</span> 航线日志
        </h3>
        {recentEvents.length === 0 ? (
          <div className="text-center py-12 text-parchment-300">
            <div className="text-5xl mb-3 opacity-50">📖</div>
            <p>暂无航海记录，开启你的第一次冒险吧！</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-gold-500 via-gold-500/50 to-transparent" />
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
              {recentEvents.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="relative pl-14"
                >
                  <div className={`absolute left-0 top-1 w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 ${
                    event.resolved
                      ? 'bg-ocean-700 border-gold-500/50'
                      : 'bg-blood-500 border-blood-300 animate-pulse'
                  }`}>
                    {getEventEmoji(event.type)}
                  </div>
                  <div className={`parchment-panel p-3 ${event.resolved ? 'opacity-80' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-display font-bold text-ocean-700 flex items-center gap-2">
                          {event.title}
                          {event.resolved ? (
                            <span className="text-xs bg-copper-500/30 text-ocean-700 px-2 py-0.5 rounded">已处理</span>
                          ) : (
                            <span className="text-xs bg-blood-500/30 text-ocean-700 px-2 py-0.5 rounded">待处理</span>
                          )}
                        </h4>
                        <p className="text-sm text-ocean-600 mt-1">
                          {event.description}
                        </p>
                      </div>
                      <span className="text-xs text-wood-700 whitespace-nowrap font-mono">
                        {formatTime(event.timestamp)}
                      </span>
                    </div>
                    {event.reward && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {event.reward.gold && (
                          <span className="inline-flex items-center gap-1 bg-gold-500/30 text-ocean-700 px-2 py-0.5 rounded text-xs font-semibold">
                            💰 +{formatNumber(event.reward.gold)}
                          </span>
                        )}
                        {event.reward.blueprints && event.reward.blueprints.length > 0 && (
                          <span className="inline-flex items-center gap-1 bg-copper-500/30 text-ocean-700 px-2 py-0.5 rounded text-xs font-semibold">
                            📋 +{event.reward.blueprints.length}
                          </span>
                        )}
                      </div>
                    )}
                    {event.penalty && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {event.penalty.hpLoss && (
                          <span className="inline-flex items-center gap-1 bg-blood-400/30 text-ocean-700 px-2 py-0.5 rounded text-xs font-semibold">
                            ❤️ -{event.penalty.hpLoss}
                          </span>
                        )}
                        {event.penalty.goldLoss && (
                          <span className="inline-flex items-center gap-1 bg-blood-400/30 text-ocean-700 px-2 py-0.5 rounded text-xs font-semibold">
                            💰 -{formatNumber(event.penalty.goldLoss)}
                          </span>
                        )}
                        {event.penalty.crewLoss && (
                          <span className="inline-flex items-center gap-1 bg-blood-400/30 text-ocean-700 px-2 py-0.5 rounded text-xs font-semibold">
                            👥 -{event.penalty.crewLoss}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
