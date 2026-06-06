import { motion } from 'framer-motion';
import { Megaphone } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export function AnnouncementBar() {
  const { announcements } = useGameStore();

  if (announcements.length === 0) return null;

  const scrollText = announcements.map((a) => a.text).join('  ⚓  ');

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="marquee-container relative flex items-center"
    >
      <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center px-3 bg-ocean-700 border-r-2 border-gold-500/50">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Megaphone className="w-4 h-4 text-gold-400" />
        </motion.div>
      </div>
      <div className="ml-12 overflow-hidden">
        <motion.div
          className="marquee-text"
          animate={{ x: ['100%', '-100%'] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          <span className="px-4">{scrollText}</span>
          <span className="px-4">{scrollText}</span>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default AnnouncementBar;
