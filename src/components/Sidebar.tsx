import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import {
  Anchor,
  Ship,
  Users,
  Compass,
  Swords,
  Store,
  ScrollText,
  Trophy,
} from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { to: '/', label: '港口', Icon: Anchor },
  { to: '/shipyard', label: '船坞', Icon: Ship },
  { to: '/crew', label: '船员', Icon: Users },
  { to: '/voyage', label: '航行', Icon: Compass },
  { to: '/battle', label: '战斗', Icon: Swords },
  { to: '/market', label: '市场', Icon: Store },
  { to: '/log', label: '日志', Icon: ScrollText },
  { to: '/leaderboard', label: '排行', Icon: Trophy },
];

export function Sidebar() {
  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-60 h-full bg-ocean-700/90 backdrop-blur-sm border-r-2 border-gold-500/50 flex flex-col"
    >
      <div className="p-5 border-b border-gold-500/30">
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-2xl shadow-lg">
            ⚓
          </div>
          <div>
            <h1 className="font-display font-bold text-gold-300 text-lg tracking-wider">
              海盗旗
            </h1>
            <p className="font-display text-xs text-parchment-400 uppercase tracking-widest">
              Pirate Flag
            </p>
          </div>
        </motion.div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, Icon }, index) => (
          <motion.div
            key={to}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08, duration: 0.3 }}
          >
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 px-4 py-3 rounded-lg font-display uppercase tracking-wider text-sm transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-gold-500/30 to-gold-500/10 text-gold-300 border-l-4 border-gold-400 shadow-inner'
                    : 'text-parchment-200 hover:bg-ocean-600/50 hover:text-gold-200 border-l-4 border-transparent'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5 transition-colors',
                        isActive ? 'text-gold-400' : 'text-parchment-300 group-hover:text-gold-300'
                      )}
                    />
                  </motion.div>
                  <span>{label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-2 h-2 rounded-full bg-gold-400 shadow-[0_0_8px_#C9A227]"
                    />
                  )}
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      <div className="p-4 border-t border-gold-500/30">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="text-center font-display text-xs text-parchment-400"
        >
          <p>v1.0.0</p>
          <p className="mt-1 text-gold-500/60">⚓ 扬帆起航 ⚓</p>
        </motion.div>
      </div>
    </motion.aside>
  );
}

export default Sidebar;
