import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface StatBarProps {
  value: number;
  maxValue?: number;
  label: string;
  color?: 'gold' | 'blood' | 'copper' | 'ocean';
}

const colorMap = {
  gold: 'from-gold-400 to-gold-600 shadow-gold-500/50',
  blood: 'from-blood-400 to-blood-600 shadow-blood-500/50',
  copper: 'from-copper-500 to-copper-600 shadow-copper-500/50',
  ocean: 'from-ocean-300 to-ocean-500 shadow-ocean-400/50',
};

export function StatBar({ value, maxValue = 100, label, color = 'gold' }: StatBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <div className="flex justify-between items-center mb-1.5">
        <span className="font-display text-sm text-gold-200 tracking-wider uppercase">
          {label}
        </span>
        <span className="font-mono text-sm text-parchment-200">
          {Math.round(value)} / {maxValue}
        </span>
      </div>
      <div className="stat-bar">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn(
            'stat-bar-fill bg-gradient-to-r shadow-md',
            colorMap[color]
          )}
        />
      </div>
    </motion.div>
  );
}

export default StatBar;
