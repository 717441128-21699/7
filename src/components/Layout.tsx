import { motion } from 'framer-motion';
import { Star, Crown } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AnnouncementBar from './AnnouncementBar';
import { useGameStore } from '../store/gameStore';
import { formatNumber } from '../utils/gameUtils';

export function Layout() {
  const { player } = useGameStore();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-ocean-gradient">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <motion.header
          initial={{ y: -80 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bg-ocean-700/90 backdrop-blur-sm border-b-2 border-gold-500/50"
        >
          <AnnouncementBar />

          <div className="flex items-center justify-between px-6 py-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-600/30 to-gold-400/20 border border-gold-500/60 rounded-lg shadow-lg"
              >
                <span className="text-2xl">💰</span>
                <span className="font-display text-xl font-bold text-gold-300">
                  {formatNumber(player.gold)}
                </span>
                <span className="font-display text-xs text-gold-400/70 uppercase tracking-wider ml-1">
                  金币
                </span>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4"
            >
              <div className="flex items-center gap-2 px-3 py-1.5 bg-ocean-600/60 border border-copper-500/40 rounded-lg">
                <Star className="w-4 h-4 text-copper-500 fill-copper-500" />
                <span className="font-display text-sm text-parchment-200">
                  声望 {player.reputation}
                </span>
              </div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3 px-3 py-1.5 bg-ocean-600/60 border border-gold-500/40 rounded-lg cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-xl border-2 border-gold-300 shadow-md">
                  {player.avatar}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-display font-bold text-gold-200 text-sm">
                    {player.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <Crown className="w-3 h-3 text-gold-400 fill-gold-400" />
                    <span className="font-mono text-xs text-parchment-300">
                      Lv.{player.level}
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.header>

        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
