import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { formatNumber } from '../utils/gameUtils';
import type { PlayerRank } from '../types';

type TabType = 'wealth' | 'power' | 'plunder';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
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

const tabs: { key: TabType; label: string; icon: string }[] = [
  { key: 'wealth', label: '财富榜', icon: '💰' },
  { key: 'power', label: '战力榜', icon: '⚔️' },
  { key: 'plunder', label: '掠夺榜', icon: '🏴‍☠️' },
];

const medalColors: Record<number, { bg: string; border: string; text: string; pulse: string }> = {
  1: {
    bg: 'from-yellow-400 via-yellow-500 to-amber-600',
    border: 'border-yellow-300',
    text: 'text-yellow-100',
    pulse: 'shadow-yellow-400/60',
  },
  2: {
    bg: 'from-slate-300 via-slate-400 to-slate-500',
    border: 'border-slate-200',
    text: 'text-slate-100',
    pulse: 'shadow-slate-400/40',
  },
  3: {
    bg: 'from-amber-600 via-orange-600 to-orange-700',
    border: 'border-amber-400',
    text: 'text-amber-100',
    pulse: 'shadow-amber-500/40',
  },
};

const medals: Record<number, string> = {
  1: '👑',
  2: '🥈',
  3: '🥉',
};

export default function Leaderboard() {
  const { leaderboard, player, loadLeaderboard } = useGameStore();
  const [activeTab, setActiveTab] = useState<TabType>('wealth');

  useEffect(() => {
    loadLeaderboard().catch(() => {});
  }, [loadLeaderboard]);

  const currentData = leaderboard[activeTab];
  const topThree = currentData.slice(0, 3);
  const restPlayers = currentData.slice(3, 10);
  const maxValue = currentData[0]?.value || 1;

  const myRank: PlayerRank = {
    rank: currentData.length + 5,
    id: player.id,
    name: player.name,
    avatar: player.avatar,
    value:
      activeTab === 'wealth'
        ? player.gold
        : activeTab === 'power'
          ? player.level * 100 + player.stats.shipsSunk * 50
          : player.stats.plunderCount,
    level: player.level,
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen p-4 md:p-8"
    >
      <motion.div variants={itemVariants} className="pirate-card p-6 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="heading-display text-3xl text-gold-300 mb-2 flex items-center gap-2">
              <span>🏆</span> 海盗排行榜
            </h1>
            <p className="text-parchment-300 text-sm">争夺七大洋霸主之位</p>
          </div>
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <motion.button
                key={tab.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.key)}
                className={`wood-tab ${activeTab === tab.key ? 'wood-tab-active' : ''}`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-end">
          {[2, 1, 3].map((rank) => {
            const playerData = topThree.find((p) => p.rank === rank);
            if (!playerData) return null;
            const colors = medalColors[rank];
            const heightClass = rank === 1 ? 'md:h-80' : 'md:h-64';

            return (
              <motion.div
                key={playerData.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: rank * 0.1, type: 'spring', stiffness: 80 }}
                className={`relative ${heightClass}`}
              >
                {rank === 1 && (
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.4, 0.7, 0.4],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${colors.bg} blur-2xl opacity-50`}
                  />
                )}
                <div
                  className={`relative h-full rounded-2xl border-4 ${colors.border} bg-gradient-to-b ${colors.bg} p-5 flex flex-col items-center justify-between shadow-2xl ${colors.pulse}`}
                >
                  <motion.div
                    animate={rank === 1 ? { y: [0, -8, 0] } : {}}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="text-5xl mb-2"
                  >
                    {medals[rank]}
                  </motion.div>
                  <div className="relative">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`w-20 h-20 md:w-24 md:h-24 rounded-full bg-ocean-700 border-4 ${colors.border} flex items-center justify-center text-5xl md:text-6xl shadow-lg`}
                    >
                      {playerData.avatar}
                    </motion.div>
                    <div
                      className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-ocean-600 border-2 ${colors.border} flex items-center justify-center ${colors.text} font-display font-bold text-lg`}
                    >
                      {playerData.level}
                    </div>
                  </div>
                  <div className="text-center mt-3">
                    <h3 className={`font-display font-bold text-lg md:text-xl ${colors.text} drop-shadow-lg`}>
                      {playerData.name}
                    </h3>
                    <div className="mt-2 bg-ocean-900/40 rounded-lg px-4 py-2 border border-white/20">
                      <div className={`font-display font-bold text-2xl md:text-3xl ${colors.text}`}>
                        {formatNumber(playerData.value)}
                      </div>
                      <div className="text-xs text-white/70 uppercase tracking-wider">
                        {tabs.find((t) => t.key === activeTab)?.label.slice(0, -1)}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="pirate-card p-4 md:p-6 mb-6">
        <h2 className="heading-display text-xl text-gold-300 mb-4 flex items-center gap-2">
          <span>📋</span> 第 4 - 10 名
        </h2>
        <div className="space-y-2">
          {restPlayers.map((p, idx) => {
            const progress = (p.value / maxValue) * 100;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.01, x: 5 }}
                className="flex items-center gap-4 bg-ocean-700/40 rounded-lg border border-gold-500/20 p-3 hover:border-gold-500/50 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-ocean-600 border-2 border-gold-500/50 flex items-center justify-center font-display font-bold text-gold-300 text-lg">
                  {p.rank}
                </div>
                <div className="w-12 h-12 rounded-full bg-ocean-700 border-2 border-gold-500/30 flex items-center justify-center text-3xl shrink-0">
                  {p.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display font-semibold text-parchment-200 truncate">
                      {p.name}
                    </span>
                    <span className="font-display font-bold text-gold-300 text-lg">
                      {formatNumber(p.value)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 stat-bar">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ delay: idx * 0.05 + 0.3, duration: 0.8, ease: 'easeOut' }}
                        className="stat-bar-fill bg-gradient-to-r from-gold-500 to-gold-300"
                      />
                    </div>
                    <span className="inline-flex items-center gap-1 bg-ocean-600 px-2 py-0.5 rounded text-xs font-display text-gold-200 border border-gold-500/30">
                      Lv.{p.level}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {restPlayers.length === 0 && (
            <div className="text-center py-8 text-parchment-300">
              暂无更多排名数据
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        variants={itemVariants}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        className="relative"
      >
        <motion.div
          animate={{
            boxShadow: [
              '0 0 20px rgba(201, 162, 39, 0.3)',
              '0 0 40px rgba(201, 162, 39, 0.6)',
              '0 0 20px rgba(201, 162, 39, 0.3)',
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="pirate-card p-4 md:p-6 border-4 border-gold-400"
        >
          <div className="absolute -top-3 left-6 bg-gold-500 text-ocean-700 px-4 py-1 rounded font-display font-bold text-sm">
            ⭐ 我的排名
          </div>
          <div className="flex items-center gap-4 pt-2">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 border-4 border-gold-300 flex items-center justify-center font-display font-bold text-ocean-700 text-xl shadow-lg shadow-gold-500/50">
              {myRank.rank}
            </div>
            <div className="w-16 h-16 rounded-full bg-ocean-700 border-4 border-gold-400 flex items-center justify-center text-4xl shrink-0 shadow-lg">
              {myRank.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <span className="font-display font-bold text-2xl text-gold-200 truncate">
                  {myRank.name}
                </span>
                <span className="font-display font-bold text-3xl text-gold-300">
                  {formatNumber(myRank.value)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 stat-bar h-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((myRank.value / maxValue) * 100, 100)}%` }}
                    transition={{ delay: 0.8, duration: 1, ease: 'easeOut' }}
                    className="stat-bar-fill h-full bg-gradient-to-r from-gold-400 via-yellow-300 to-gold-400"
                  />
                </div>
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-gold-500 to-gold-600 px-3 py-1 rounded font-display font-bold text-ocean-700 text-sm border-2 border-gold-300">
                  Lv.{myRank.level}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
