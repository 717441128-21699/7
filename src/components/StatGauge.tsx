import { motion } from 'framer-motion';

interface StatGaugeProps {
  value: number;
  label: string;
  max?: number;
}

export function StatGauge({ value, label, max = 100 }: StatGaugeProps) {
  const percentage = Math.min(1, Math.max(0, value / max));
  const angle = -90 + percentage * 180;
  const radius = 45;
  const circumference = Math.PI * radius;
  const dashOffset = circumference * (1 - percentage);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring' }}
      whileHover={{ scale: 1.05 }}
      className="relative flex flex-col items-center"
    >
      <div className="relative w-28 h-16 overflow-hidden">
        <svg
          viewBox="0 0 100 55"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B0000" />
              <stop offset="50%" stopColor="#C9A227" />
              <stop offset="100%" stopColor="#2A9D8F" />
            </linearGradient>
          </defs>
          <path
            d="M 5 50 A 45 45 0 0 1 95 50"
            fill="none"
            stroke="#040E1B"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <motion.path
            d="M 5 50 A 45 45 0 0 1 95 50"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ transformOrigin: 'center' }}
          />
          <motion.line
            x1="50"
            y1="50"
            x2="50"
            y2="15"
            stroke="#EECB4C"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ rotate: -90 }}
            animate={{ rotate: angle }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ transformOrigin: '50px 50px' }}
          />
          <circle cx="50" cy="50" r="4" fill="#C9A227" />
        </svg>
      </div>
      <div className="text-center -mt-1">
        <motion.span
          key={value}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-xl font-bold text-gold-300"
        >
          {Math.round(value)}
        </motion.span>
        <p className="font-display text-xs text-parchment-300 uppercase tracking-wider mt-0.5">
          {label}
        </p>
      </div>
    </motion.div>
  );
}

export default StatGauge;
