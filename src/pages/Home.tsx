import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { formatNumber, getEventEmoji } from '../utils/gameUtils';
import { useEffect } from 'react';

const quickEntries = [
  { icon: '⚓', label: '船坞', path: '/shipyard', color: 'from-ocean-500 to-ocean-700' },
  { icon: '👥', label: '船员', path: '/crew', color: 'from-copper-500 to-copper-600' },
  { icon: '🧭', label: '航海', path: '/voyage', color: 'from-ocean-400 to-ocean-600' },
  { icon: '⚔️', label: '海战', path: '/battle', color: 'from-blood-400 to-blood-600' },
  { icon: '🏪', label: '市场', path: '/market', color: 'from-gold-500 to-gold-700' },
  { icon: '📜', label: '日志', path: '/log', color: 'from-parchment-600 to-wood-500' },
  { icon: '🏆', label: '排行榜', path: '/leaderboard', color: 'from-gold-400 to-gold-600' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100 },
  },
};

export default function Home() {
  const navigate = useNavigate();
  const { player, currentShip, voyageEvents, startVoyage, generateWeeklyLog, loadPlayer } = useGameStore();

  useEffect(() => {
    loadPlayer().catch(() => {});
    const init = async () => {
      if (voyageEvents.length === 0) {
        for (let i = 0; i < 5; i++) {
          await startVoyage();
        }
      }
      await generateWeeklyLog();
    };
    init().catch(() => {});
  }, [loadPlayer, voyageEvents.length, startVoyage, generateWeeklyLog]);

  const recentEvents = [...voyageEvents]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 6);

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins}分钟前`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}小时前`;
    return `${Math.floor(hrs / 24)}天前`;
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen p-4 md:p-8"
    >
      <motion.div variants={itemVariants} className="pirate-card p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <motion.div
              animate={{ rotate: [0, -5, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
              className="relative"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-wood-500 to-wood-700 border-4 border-gold-500 flex items-center justify-center text-5xl shadow-2xl shadow-gold-500/30">
                {player.avatar}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gold-500 border-2 border-ocean-600 flex items-center justify-center text-ocean-700 font-display font-bold text-sm">
                {player.level}
              </div>
            </motion.div>
            <div>
              <h1 className="heading-display text-3xl md:text-4xl text-gold-300 mb-2">
                {player.name}
              </h1>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 bg-ocean-700/60 px-4 py-2 rounded-lg border border-gold-500/40">
                  <span className="text-2xl">💰</span>
                  <span className="font-display font-bold text-gold-300 text-xl">
                    {formatNumber(player.gold)}
                  </span>
                  <span className="text-parchment-300 text-sm">金币</span>
                </div>
                <div className="flex items-center gap-2 bg-ocean-700/60 px-4 py-2 rounded-lg border border-gold-500/40">
                  <span className="text-2xl">⭐</span>
                  <span className="font-display font-bold text-gold-300 text-xl">
                    {player.reputation}
                  </span>
                  <span className="text-parchment-300 text-sm">声望</span>
                </div>
                <div className="flex items-center gap-2 bg-ocean-700/60 px-4 py-2 rounded-lg border border-gold-500/40">
                  <span className="text-2xl">🚢</span>
                  <span className="font-display font-bold text-gold-300 text-xl">
                    {player.ships.length}
                  </span>
                  <span className="text-parchment-300 text-sm">船只</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/voyage')}
              className="pirate-btn-gold text-lg"
            >
              🧭 出发航海
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/battle')}
              className="pirate-btn-danger text-lg"
            >
              ⚔️ 开始战斗
            </motion.button>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-6">
        <h2 className="heading-display text-2xl text-gold-300 mb-4 flex items-center gap-2">
          <span>🏴‍☠️</span> 快速入口
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {quickEntries.map((entry) => (
            <motion.button
              key={entry.path}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(entry.path)}
              className={`pirate-card p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-gradient-to-br ${entry.color} hover:shadow-gold-500/40`}
            >
              <span className="text-4xl">{entry.icon}</span>
              <span className="font-display font-semibold text-gold-200">
                {entry.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="pirate-card p-6">
          <h2 className="heading-display text-2xl text-gold-300 mb-4 flex items-center gap-2">
            <span>📜</span> 最近航海事件
          </h2>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gold-500 via-gold-500/50 to-transparent" />
            <div className="space-y-4">
              {recentEvents.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative pl-12"
                >
                  <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-ocean-700 border-2 border-gold-500 flex items-center justify-center text-lg">
                    {getEventEmoji(event.type)}
                  </div>
                  <div className={`parchment-panel p-3 ${event.resolved ? 'opacity-70' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display font-bold text-ocean-700">
                          {event.title}
                        </h3>
                        <p className="text-sm text-ocean-600 mt-1">
                          {event.description}
                        </p>
                      </div>
                      <span className="text-xs text-wood-700 whitespace-nowrap">
                        {formatTime(event.timestamp)}
                      </span>
                    </div>
                    {event.reward && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {event.reward.gold && (
                          <span className="inline-flex items-center gap-1 bg-gold-500/30 text-ocean-700 px-2 py-0.5 rounded text-xs font-semibold">
                            💰 +{event.reward.gold}
                          </span>
                        )}
                        {event.reward.blueprints && event.reward.blueprints.length > 0 && (
                          <span className="inline-flex items-center gap-1 bg-copper-500/30 text-ocean-700 px-2 py-0.5 rounded text-xs font-semibold">
                            📋 +{event.reward.blueprints.length}图纸
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
                            💰 -{event.penalty.goldLoss}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {recentEvents.length === 0 && (
                <div className="text-center py-8 text-parchment-300">
                  暂无航海记录，去冒险吧！
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="pirate-card p-6">
          <h2 className="heading-display text-2xl text-gold-300 mb-4 flex items-center gap-2">
            <span>🚢</span> 当前船只
          </h2>
          {currentShip ? (
            <div>
              <div className="parchment-panel p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-bold text-2xl text-ocean-700">
                    {currentShip.name}
                  </h3>
                  <span className="text-wood-700 text-sm">
                    {currentShip.hull.name}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center">
                    <div className="text-3xl mb-1">⚡</div>
                    <div className="font-display font-bold text-ocean-700 text-xl">
                      {currentShip.speed}
                    </div>
                    <div className="text-xs text-wood-700">速度</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-1">💥</div>
                    <div className="font-display font-bold text-ocean-700 text-xl">
                      {currentShip.firepower}
                    </div>
                    <div className="text-xs text-wood-700">火力</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-1">🛡️</div>
                    <div className="font-display font-bold text-ocean-700 text-xl">
                      {currentShip.defense}
                    </div>
                    <div className="text-xs text-wood-700">防御</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm text-ocean-700 mb-1">
                      <span>❤️ 船体耐久</span>
                      <span className="font-semibold">
                        {currentShip.currentHp} / {currentShip.maxHp}
                      </span>
                    </div>
                    <div className="stat-bar">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(currentShip.currentHp / currentShip.maxHp) * 100}%`,
                        }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="stat-bar-fill bg-gradient-to-r from-blood-400 to-blood-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-ocean-700/50 p-3 rounded-lg border border-gold-500/30">
                  <div className="text-parchment-300 mb-1">风帆</div>
                  <div className="font-display text-gold-200 font-semibold">
                    🎏 {currentShip.sail.name}
                  </div>
                </div>
                <div className="bg-ocean-700/50 p-3 rounded-lg border border-gold-500/30">
                  <div className="text-parchment-300 mb-1">装甲</div>
                  <div className="font-display text-gold-200 font-semibold">
                    🛡️ {currentShip.armor.name}
                  </div>
                </div>
                <div className="bg-ocean-700/50 p-3 rounded-lg border border-gold-500/30 col-span-2">
                  <div className="text-parchment-300 mb-1">
                    火炮 ({currentShip.cannons.length}/{currentShip.hull.maxCannons})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentShip.cannons.map((c, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 bg-wood-600 text-parchment-200 px-2 py-1 rounded text-xs"
                      >
                        💣 {c.name}
                      </span>
                    ))}
                    {currentShip.cannons.length === 0 && (
                      <span className="text-parchment-400 text-xs">未装备火炮</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/shipyard')}
                  className="pirate-btn flex-1"
                >
                  ⚓ 前往船坞
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/battle')}
                  className="pirate-btn-danger flex-1"
                >
                  ⚔️ 出航作战
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 opacity-50">🚢</div>
              <h3 className="heading-display text-xl text-parchment-300 mb-2">
                你还没有船只
              </h3>
              <p className="text-parchment-400 text-sm mb-6">
                去船坞建造你的第一艘海盗船吧！
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/shipyard')}
                className="pirate-btn-gold"
              >
                ⚓ 前往船坞建造
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
