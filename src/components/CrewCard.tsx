import { motion } from 'framer-motion';
import { Heart, Star } from 'lucide-react';
import type { CrewMember } from '../types';
import { getCrewRoleLabel } from '../utils/gameUtils';
import { cn } from '../lib/utils';

interface CrewCardProps {
  crew: CrewMember;
  onClick?: () => void;
}

const roleStyles: Record<string, string> = {
  captain: 'bg-gold-500 text-ocean-700 border-gold-300',
  gunner: 'bg-blood-500 text-parchment-100 border-blood-300',
  sailor: 'bg-copper-500 text-parchment-100 border-copper-600',
};

function renderStars(skillValue: number) {
  const stars = Math.min(5, Math.max(0, Math.floor(skillValue / 20)));
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'w-3.5 h-3.5',
            i < stars ? 'text-gold-400 fill-gold-400' : 'text-ocean-700'
          )}
        />
      ))}
    </div>
  );
}

export function CrewCard({ crew, onClick }: CrewCardProps) {
  const topSkill = Object.entries(crew.skills).reduce(
    (max, [, val]) => (val > max ? val : max),
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={cn(
        'pirate-card p-4 cursor-pointer',
        onClick && 'hover:shadow-gold-500/30 hover:border-gold-400'
      )}
    >
      <div className="flex items-start gap-3">
        <motion.div
          whileHover={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.5 }}
          className="w-14 h-14 rounded-full bg-ocean-700 border-2 border-gold-500 flex items-center justify-center text-3xl shrink-0 shadow-lg"
        >
          {crew.avatar}
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display font-bold text-gold-200 truncate">
              {crew.name}
            </h3>
            <span className="font-mono text-xs text-parchment-400">
              Lv.{crew.level}
            </span>
          </div>

          <motion.span
            className={cn(
              'inline-block mt-1 px-2 py-0.5 text-xs font-display uppercase tracking-wider border rounded',
              roleStyles[crew.role]
            )}
          >
            {getCrewRoleLabel(crew.role)}
          </motion.span>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-blood-400 fill-blood-400" />
          <div className="flex-1 h-2 bg-ocean-800 rounded-full overflow-hidden border border-ocean-400/30">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${crew.loyalty}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-blood-400 to-blood-600 rounded-full"
            />
          </div>
          <span className="font-mono text-xs text-parchment-300 w-8 text-right">
            {crew.loyalty}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-display text-xs text-parchment-300 uppercase tracking-wider">
            最高技能
          </span>
          {renderStars(topSkill)}
        </div>
      </div>
    </motion.div>
  );
}

export default CrewCard;
