import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { RECRUITABLE_CREW } from '../data/mockData';
import { getCrewRoleLabel, formatNumber } from '../utils/gameUtils';
import type { CrewRole } from '../types';
import CrewCard from '../components/CrewCard';

type TabType = 'my' | 'recruit';
type RoleFilter = 'all' | CrewRole;

const roleFilters: { key: RoleFilter; label: string; icon: string }[] = [
  { key: 'all', label: '全部', icon: '👥' },
  { key: 'captain', label: '船长', icon: '🧭' },
  { key: 'gunner', label: '炮手', icon: '💣' },
  { key: 'sailor', label: '水手', icon: '⛵' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
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

export default function Crew() {
  const navigate = useNavigate();
  const { player, crew, recruitCrew, dismissCrew } = useGameStore();
  const [activeTab, setActiveTab] = useState<TabType>('my');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 2500);
  };

  const avgLoyalty = useMemo(() => {
    if (crew.length === 0) return 0;
    return Math.round(crew.reduce((s, c) => s + c.loyalty, 0) / crew.length);
  }, [crew]);

  const myCrewFiltered = useMemo(() => {
    if (roleFilter === 'all') return crew;
    return crew.filter((c) => c.role === roleFilter);
  }, [crew, roleFilter]);

  const recruitFiltered = useMemo(() => {
    const recruitedIds = new Set(crew.map((c) => c.id));
    let list = RECRUITABLE_CREW.filter((c) => !recruitedIds.has(c.id));
    if (roleFilter !== 'all') {
      list = list.filter((c) => c.role === roleFilter);
    }
    return list;
  }, [crew, roleFilter]);

  const handleRecruit = (member: typeof RECRUITABLE_CREW[number]) => {
    const price = member.contractPrice || 100;
    if (player.gold < price) {
      showToast('error', `💰 金币不足！需要 ${price} 金币`);
      return;
    }
    const success = recruitCrew(member);
    if (success) {
      showToast('success', `🎉 成功招募「${member.name}」！`);
    } else {
      showToast('error', '招募失败');
    }
  };

  const handleDismiss = (id: string, name: string) => {
    dismissCrew(id);
    showToast('success', `👋 已解雇「${name}」`);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg font-display font-bold shadow-2xl border-2 ${
              toast.type === 'success'
                ? 'bg-gradient-to-r from-copper-500 to-copper-600 text-parchment-100 border-gold-400'
                : 'bg-gradient-to-r from-blood-500 to-blood-600 text-parchment-100 border-blood-300'
            }`}
          >
            {toast.text}
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
            👥 船员管理
          </h1>
          <p className="text-parchment-300 text-sm mt-1">
            招募精英水手，组建你的海盗军团
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

      <div className="pirate-card p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-ocean-700/50 p-4 rounded-lg border border-gold-500/30 text-center">
            <div className="text-3xl mb-1">👥</div>
            <div className="font-display font-bold text-gold-300 text-2xl">{crew.length}</div>
            <div className="text-xs text-parchment-300">当前船员</div>
          </div>
          <div className="bg-ocean-700/50 p-4 rounded-lg border border-gold-500/30 text-center">
            <div className="text-3xl mb-1">❤️</div>
            <div className="font-display font-bold text-gold-300 text-2xl">{avgLoyalty}%</div>
            <div className="text-xs text-parchment-300">平均忠诚度</div>
          </div>
          <div className="bg-ocean-700/50 p-4 rounded-lg border border-gold-500/30 text-center">
            <div className="text-3xl mb-1">🧭</div>
            <div className="font-display font-bold text-gold-300 text-2xl">
              {crew.filter((c) => c.role === 'captain').length}
            </div>
            <div className="text-xs text-parchment-300">船长</div>
          </div>
          <div className="bg-ocean-700/50 p-4 rounded-lg border border-gold-500/30 text-center">
            <div className="text-3xl mb-1">💣</div>
            <div className="font-display font-bold text-gold-300 text-2xl">
              {crew.filter((c) => c.role === 'gunner').length}
            </div>
            <div className="text-xs text-parchment-300">炮手</div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-0 ml-2">
        <button
          onClick={() => setActiveTab('my')}
          className={`wood-tab ${activeTab === 'my' ? 'wood-tab-active' : ''}`}
        >
          <span className="mr-1">⚓</span>
          我的船员
        </button>
        <button
          onClick={() => setActiveTab('recruit')}
          className={`wood-tab ${activeTab === 'recruit' ? 'wood-tab-active' : ''}`}
        >
          <span className="mr-1">📜</span>
          招募船员
        </button>
      </div>

      <div className="pirate-card rounded-tl-none p-4 md:p-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {roleFilters.map((f) => (
            <motion.button
              key={f.key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setRoleFilter(f.key)}
              className={`px-4 py-2 rounded-lg font-display text-sm border-2 transition-all ${
                roleFilter === f.key
                  ? 'bg-gold-500 text-ocean-700 border-gold-300 shadow-lg shadow-gold-500/30'
                  : 'bg-ocean-700/50 text-parchment-200 border-ocean-500/30 hover:border-gold-500/50'
              }`}
            >
              <span className="mr-1">{f.icon}</span>
              {f.label}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'my' ? (
            <motion.div
              key="my"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {myCrewFiltered.length === 0 ? (
                <motion.div
                  variants={itemVariants}
                  className="col-span-full text-center py-16"
                >
                  <div className="text-6xl mb-4 opacity-50">🏴‍☠️</div>
                  <h3 className="heading-display text-xl text-parchment-300 mb-2">
                    你还没有船员
                  </h3>
                  <p className="text-parchment-400 text-sm mb-6">
                    切换到「招募船员」标签页，招募你的第一批伙伴吧！
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab('recruit')}
                    className="pirate-btn-gold"
                  >
                    📜 前往招募
                  </motion.button>
                </motion.div>
              ) : (
                myCrewFiltered.map((member) => (
                  <motion.div key={member.id} variants={itemVariants} className="relative">
                    <CrewCard crew={member} />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDismiss(member.id, member.name)}
                      className="absolute top-2 right-2 px-3 py-1 bg-blood-500/90 text-parchment-100 text-xs font-display rounded border border-blood-300 hover:bg-blood-400 transition-colors"
                    >
                      解雇
                    </motion.button>
                  </motion.div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="recruit"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {recruitFiltered.length === 0 ? (
                <motion.div
                  variants={itemVariants}
                  className="col-span-full text-center py-16"
                >
                  <div className="text-6xl mb-4 opacity-50">✅</div>
                  <h3 className="heading-display text-xl text-parchment-300 mb-2">
                    暂无可招募船员
                  </h3>
                  <p className="text-parchment-400 text-sm">
                    你已招募了所有该类别的船员
                  </p>
                </motion.div>
              ) : (
                recruitFiltered.map((member) => {
                  const price = member.contractPrice || 100;
                  const canAfford = player.gold >= price;
                  return (
                    <motion.div
                      key={member.id}
                      variants={itemVariants}
                      className="relative"
                    >
                      <CrewCard crew={member} />
                      <div className="absolute top-2 right-2 flex flex-col items-end gap-2">
                        <span className="px-3 py-1 bg-gold-500/90 text-ocean-700 text-xs font-display font-bold rounded border border-gold-300">
                          💰 {formatNumber(price)}
                        </span>
                        <motion.button
                          whileHover={{ scale: canAfford ? 1.05 : 1 }}
                          whileTap={{ scale: canAfford ? 0.95 : 1 }}
                          onClick={() => handleRecruit(member)}
                          disabled={!canAfford}
                          className={`px-4 py-1.5 text-xs font-display font-bold rounded border-2 transition-all ${
                            canAfford
                              ? 'bg-gradient-to-b from-gold-400 to-gold-600 text-ocean-700 border-gold-300 hover:shadow-lg hover:shadow-gold-500/40'
                              : 'bg-ocean-700/50 text-parchment-400 border-ocean-600/50 cursor-not-allowed'
                          }`}
                        >
                          {canAfford ? '📜 招募' : '金币不足'}
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
