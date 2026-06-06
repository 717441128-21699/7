import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { calculateShipStats, formatNumber } from '../utils/gameUtils';
import { SHIP_HULLS, SHIP_CANNONS, SHIP_SAILS, SHIP_ARMORS } from '../data/mockData';
import type { ShipHull, ShipCannon, ShipSail, ShipArmor } from '../types';

type TabType = 'hull' | 'cannon' | 'sail' | 'armor';

const tabs: { key: TabType; label: string; icon: string }[] = [
  { key: 'hull', label: '船体', icon: '🚢' },
  { key: 'cannon', label: '火炮', icon: '💣' },
  { key: 'sail', label: '帆', icon: '🎏' },
  { key: 'armor', label: '装甲', icon: '🛡️' },
];

function Gauge({ value, max, label, icon, color }: { value: number; max: number; label: string; icon: string; color: string }) {
  const percentage = Math.min(100, (value / max) * 100);
  const rotation = (percentage / 100) * 180 - 90;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-14 overflow-hidden">
        <svg viewBox="0 0 100 60" className="w-full h-full">
          <path
            d="M 10 55 A 40 40 0 0 1 90 55"
            fill="none"
            stroke="#061528"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <motion.path
            d="M 10 55 A 40 40 0 0 1 90 55"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="126"
            initial={{ strokeDashoffset: 126 }}
            animate={{ strokeDashoffset: 126 - (percentage / 100) * 126 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          />
          <motion.g
            initial={{ rotate: -90 }}
            animate={{ rotate: rotation }}
            style={{ transformOrigin: '50px 55px', transition: 'transform 0.8s ease-out' }}
          >
            <line x1="50" y1="55" x2="50" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <circle cx="50" cy="55" r="4" fill={color} />
          </motion.g>
        </svg>
      </div>
      <div className="flex items-center gap-1 mt-1">
        <span className="text-lg">{icon}</span>
        <span className="font-display font-bold text-gold-300 text-lg">{value}</span>
      </div>
      <span className="text-xs text-parchment-300">{label}</span>
    </div>
  );
}

function StatBar({ value, max, label, icon, color }: { value: number; max: number; label: string; icon: string; color: string }) {
  const percentage = Math.min(100, (value / max) * 100);

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <div className="flex items-center gap-1 text-parchment-200">
          <span>{icon}</span>
          <span>{label}</span>
        </div>
        <span className="font-display font-bold text-gold-300">{value}</span>
      </div>
      <div className="stat-bar">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`stat-bar-fill ${color}`}
        />
      </div>
    </div>
  );
}

function ShipPreview({ hull, cannons, sail, armor }: { hull: ShipHull; cannons: ShipCannon[]; sail: ShipSail; armor: ShipArmor }) {
  const hullScale = 0.6 + (hull.tier / 5) * 0.6;
  const hullWidth = 220 * hullScale;
  const hullHeight = 80 * hullScale;

  const sailColor = sail.tier >= 3 ? '#C9A227' : sail.tier >= 2 ? '#F4E4BC' : '#FCF3D6';
  const armorColor =
    armor.id === 'armor-iron' ? '#6B7280' :
    armor.id === 'armor-copper' ? '#B87333' :
    armor.id === 'armor-double' ? '#7C4A2E' :
    armor.id === 'armor-oak' ? '#8B5A2B' : '#5C4033';

  const cannonCount = cannons.length;
  const maxDisplayCannons = Math.min(cannonCount, hull.maxCannons);
  const cannonPositions = useMemo(() => {
    const positions: number[] = [];
    for (let i = 0; i < maxDisplayCannons; i++) {
      positions.push(30 + (i * (hullWidth - 60)) / Math.max(1, maxDisplayCannons - 1));
    }
    return positions;
  }, [maxDisplayCannons, hullWidth]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [0, 1, 0, -1, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
        style={{ width: hullWidth + 60, height: hullHeight + 180 }}
      >
        <svg viewBox={`0 0 ${hullWidth + 60} ${hullHeight + 180}`} className="w-full h-full">
          <defs>
            <linearGradient id="hullGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={armorColor} />
              <stop offset="100%" stopColor="#38261F" />
            </linearGradient>
            <linearGradient id="sailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={sailColor} />
              <stop offset="100%" stopColor="#D4B98A" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {hull.tier >= 2 && (
            <>
              <rect x={hullWidth / 2 + 25} y="10" width="6" height="120" fill="#5C4033" rx="2" />
              <motion.path
                d={`M ${hullWidth / 2 + 28} 15 Q ${hullWidth / 2 + 70} 40 ${hullWidth / 2 + 28} 80 Q ${hullWidth / 2 + 60} 60 ${hullWidth / 2 + 28} 15`}
                fill="url(#sailGrad)"
                stroke="#806516"
                strokeWidth="1.5"
                initial={{ scaleY: 0, transformOrigin: 'top' }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
            </>
          )}

          {hull.tier >= 3 && (
            <>
              <rect x={hullWidth / 2 - 25} y="25" width="6" height="100" fill="#5C4033" rx="2" />
              <motion.path
                d={`M ${hullWidth / 2 - 22} 30 Q ${hullWidth / 2 + 15} 55 ${hullWidth / 2 - 22} 90 Q ${hullWidth / 2 + 8} 70 ${hullWidth / 2 - 22} 30`}
                fill="url(#sailGrad)"
                stroke="#806516"
                strokeWidth="1.5"
                initial={{ scaleY: 0, transformOrigin: 'top' }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              />
            </>
          )}

          {hull.tier >= 4 && (
            <>
              <rect x={hullWidth / 2 + 70} y="5" width="6" height="130" fill="#5C4033" rx="2" />
              <motion.path
                d={`M ${hullWidth / 2 + 73} 10 Q ${hullWidth / 2 + 110} 40 ${hullWidth / 2 + 73} 95 Q ${hullWidth / 2 + 100} 60 ${hullWidth / 2 + 73} 10`}
                fill="url(#sailGrad)"
                stroke="#806516"
                strokeWidth="1.5"
                initial={{ scaleY: 0, transformOrigin: 'top' }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              />
            </>
          )}

          {hull.tier >= 5 && (
            <>
              <rect x={hullWidth / 2 - 70} y="30" width="6" height="95" fill="#5C4033" rx="2" />
              <motion.path
                d={`M ${hullWidth / 2 - 67} 35 Q ${hullWidth / 2 - 30} 60 ${hullWidth / 2 - 67} 95 Q ${hullWidth / 2 - 38} 75 ${hullWidth / 2 - 67} 35`}
                fill="url(#sailGrad)"
                stroke="#806516"
                strokeWidth="1.5"
                initial={{ scaleY: 0, transformOrigin: 'top' }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              />
            </>
          )}

          <motion.ellipse
            cx={(hullWidth + 60) / 2}
            cy={hullHeight + 140}
            rx={hullWidth / 2 + 10}
            ry="8"
            fill="#0A2342"
            opacity="0.4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 0.6 }}
          />

          <motion.path
            d={`M 30 ${hullHeight + 80}
                Q 20 ${hullHeight + 120} ${(hullWidth + 60) / 2} ${hullHeight + 150}
                Q ${hullWidth + 40} ${hullHeight + 120} ${hullWidth + 30} ${hullHeight + 80}
                L ${hullWidth + 10} ${hullHeight + 50}
                L 50 ${hullHeight + 50}
                Z`}
            fill="url(#hullGrad)"
            stroke="#C9A227"
            strokeWidth="2"
            filter="url(#glow)"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          />

          <rect
            x="45"
            y={hullHeight + 55}
            width={hullWidth - 10}
            height="6"
            fill="#5C4033"
            rx="2"
          />
          <rect
            x="45"
            y={hullHeight + 85}
            width={hullWidth - 10}
            height="6"
            fill="#5C4033"
            rx="2"
          />
          <rect
            x="45"
            y={hullHeight + 115}
            width={hullWidth - 10}
            height="6"
            fill="#5C4033"
            rx="2"
          />

          {armor.id !== 'armor-none' && (
            <path
              d={`M 30 ${hullHeight + 80}
                  Q 20 ${hullHeight + 120} ${(hullWidth + 60) / 2} ${hullHeight + 150}
                  Q ${hullWidth + 40} ${hullHeight + 120} ${hullWidth + 30} ${hullHeight + 80}`}
              fill="none"
              stroke={armorColor}
              strokeWidth="4"
              opacity="0.7"
              strokeDasharray="8 4"
            />
          )}

          {cannonPositions.map((x, i) => (
            <motion.g
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7 + i * 0.05, type: 'spring' }}
            >
              <circle cx={x + 20} cy={hullHeight + 95} r="7" fill="#2A2A2A" stroke="#C9A227" strokeWidth="1.5" />
              <rect x={x + 17} y={hullHeight + 85} width="6" height="12" fill="#1A1A1A" rx="1" />
            </motion.g>
          ))}

          {maxDisplayCannons < hull.maxCannons && (
            <text
              x={(hullWidth + 60) / 2}
              y={hullHeight + 170}
              textAnchor="middle"
              className="fill-parchment-300"
              fontSize="12"
              fontFamily="'IM Fell English', serif"
            >
              +{hull.maxCannons - maxDisplayCannons} 空余炮位
            </text>
          )}
        </svg>
      </motion.div>
    </div>
  );
}

export default function Shipyard() {
  const navigate = useNavigate();
  const { player, buildShip } = useGameStore();

  const [activeTab, setActiveTab] = useState<TabType>('hull');
  const [selectedHull, setSelectedHull] = useState<ShipHull>(SHIP_HULLS[0]);
  const [selectedCannons, setSelectedCannons] = useState<ShipCannon[]>([SHIP_CANNONS[0]]);
  const [selectedSail, setSelectedSail] = useState<ShipSail>(SHIP_SAILS[0]);
  const [selectedArmor, setSelectedArmor] = useState<ShipArmor>(SHIP_ARMORS[0]);
  const [shipName, setShipName] = useState('我的海盗船');
  const [buildMessage, setBuildMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const stats = useMemo(
    () => calculateShipStats(selectedHull, selectedCannons, selectedSail, selectedArmor),
    [selectedHull, selectedCannons, selectedSail, selectedArmor]
  );

  const totalCost = useMemo(
    () =>
      selectedHull.cost +
      selectedCannons.reduce((s, c) => s + c.cost, 0) +
      selectedSail.cost +
      selectedArmor.cost,
    [selectedHull, selectedCannons, selectedSail, selectedArmor]
  );

  const canAfford = player.gold >= totalCost;
  const canBuild = canAfford && shipName.trim().length > 0;

  const handleAddCannon = (cannon: ShipCannon) => {
    if (selectedCannons.length < selectedHull.maxCannons) {
      setSelectedCannons([...selectedCannons, cannon]);
    }
  };

  const handleRemoveCannon = (index: number) => {
    if (selectedCannons.length > 1) {
      setSelectedCannons(selectedCannons.filter((_, i) => i !== index));
    }
  };

  const handleBuild = () => {
    if (!canBuild) return;
    const success = buildShip(shipName.trim(), selectedHull, selectedCannons, selectedSail, selectedArmor);
    if (success) {
      setBuildMessage({ type: 'success', text: `🎉 船只「${shipName.trim()}」建造成功！` });
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } else {
      setBuildMessage({ type: 'error', text: '建造失败，请检查金币是否充足' });
    }
    setTimeout(() => setBuildMessage(null), 3000);
  };

  const renderModuleList = () => {
    switch (activeTab) {
      case 'hull':
        return SHIP_HULLS.map((hull) => (
          <motion.button
            key={hull.id}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedHull(hull)}
            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
              selectedHull.id === hull.id
                ? 'border-gold-500 bg-ocean-600/80 shadow-gold-500/20 shadow-lg'
                : 'border-ocean-500/30 bg-ocean-700/40 hover:border-gold-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-display font-bold text-gold-200">🚢 {hull.name}</span>
              <span className="text-xs bg-gold-500/20 text-gold-300 px-2 py-0.5 rounded">
                T{hull.tier}
              </span>
            </div>
            <p className="text-xs text-parchment-300 mb-2">{hull.description}</p>
            <div className="flex items-center justify-between text-xs">
              <div className="flex gap-3">
                <span className="text-ocean-300">⚡{hull.baseSpeed}</span>
                <span className="text-ocean-300">🛡️{hull.baseDefense}</span>
                <span className="text-ocean-300">👥{hull.maxCrew}</span>
                <span className="text-ocean-300">💣{hull.maxCannons}</span>
              </div>
              <span className="font-display font-bold text-gold-400">💰 {hull.cost}</span>
            </div>
          </motion.button>
        ));

      case 'cannon':
        return (
          <div className="space-y-3">
            <div className="text-sm text-parchment-300 mb-2">
              已装备: <span className="font-display font-bold text-gold-300">{selectedCannons.length}</span> / {selectedHull.maxCannons}
            </div>
            <div className="space-y-2">
              {selectedCannons.map((cannon, idx) => (
                <motion.div
                  key={`sel-${idx}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-2 rounded-lg border-2 border-gold-500/60 bg-ocean-600/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💣</span>
                    <div>
                      <div className="font-display font-semibold text-gold-200 text-sm">{cannon.name}</div>
                      <div className="text-xs text-ocean-300">
                        伤害{cannon.damage} · 射速{cannon.fireRate}s · 射程{cannon.range}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveCannon(idx)}
                    className="text-blood-400 hover:text-blood-300 text-xl px-2"
                    disabled={selectedCannons.length <= 1}
                  >
                    ×
                  </button>
                </motion.div>
              ))}
            </div>
            <div className="border-t border-ocean-500/30 my-3" />
            <div className="text-sm text-parchment-300 mb-2">可添加火炮:</div>
            {SHIP_CANNONS.map((cannon) => {
              const count = selectedCannons.filter((c) => c.id === cannon.id).length;
              const isFull = selectedCannons.length >= selectedHull.maxCannons;
              return (
                <motion.button
                  key={cannon.id}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAddCannon(cannon)}
                  disabled={isFull}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    isFull
                      ? 'border-ocean-600/30 bg-ocean-700/20 opacity-50 cursor-not-allowed'
                      : 'border-ocean-500/30 bg-ocean-700/40 hover:border-gold-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display font-bold text-gold-200">
                      💣 {cannon.name} {count > 0 && <span className="text-xs text-copper-500">(x{count})</span>}
                    </span>
                    <span className="text-xs bg-gold-500/20 text-gold-300 px-2 py-0.5 rounded">
                      T{cannon.tier}
                    </span>
                  </div>
                  <p className="text-xs text-parchment-300 mb-2">{cannon.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex gap-3">
                      <span className="text-ocean-300">💥{cannon.damage}</span>
                      <span className="text-ocean-300">⏱️{cannon.fireRate}s</span>
                      <span className="text-ocean-300">🎯{cannon.range}</span>
                    </div>
                    <span className="font-display font-bold text-gold-400">💰 {cannon.cost}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        );

      case 'sail':
        return SHIP_SAILS.map((sail) => (
          <motion.button
            key={sail.id}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedSail(sail)}
            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
              selectedSail.id === sail.id
                ? 'border-gold-500 bg-ocean-600/80 shadow-gold-500/20 shadow-lg'
                : 'border-ocean-500/30 bg-ocean-700/40 hover:border-gold-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-display font-bold text-gold-200">🎏 {sail.name}</span>
              <span className="text-xs bg-gold-500/20 text-gold-300 px-2 py-0.5 rounded">
                T{sail.tier}
              </span>
            </div>
            <p className="text-xs text-parchment-300 mb-2">{sail.description}</p>
            <div className="flex items-center justify-between text-xs">
              <div className="flex gap-3">
                <span className="text-ocean-300">⚡+{sail.speedBonus}</span>
                <span className="text-ocean-300">🎮+{sail.maneuverBonus}</span>
              </div>
              <span className="font-display font-bold text-gold-400">💰 {sail.cost}</span>
            </div>
          </motion.button>
        ));

      case 'armor':
        return SHIP_ARMORS.map((armor) => (
          <motion.button
            key={armor.id}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedArmor(armor)}
            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
              selectedArmor.id === armor.id
                ? 'border-gold-500 bg-ocean-600/80 shadow-gold-500/20 shadow-lg'
                : 'border-ocean-500/30 bg-ocean-700/40 hover:border-gold-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-display font-bold text-gold-200">🛡️ {armor.name}</span>
              <span className="text-xs bg-gold-500/20 text-gold-300 px-2 py-0.5 rounded">
                T{armor.tier}
              </span>
            </div>
            <p className="text-xs text-parchment-300 mb-2">{armor.description}</p>
            <div className="flex items-center justify-between text-xs">
              <div className="flex gap-3">
                <span className="text-ocean-300">🛡️+{armor.defenseBonus}</span>
                <span className="text-blood-300">⚡-{armor.speedPenalty}</span>
              </div>
              <span className="font-display font-bold text-gold-400">💰 {armor.cost}</span>
            </div>
          </motion.button>
        ));
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <AnimatePresence>
        {buildMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg font-display font-bold shadow-2xl ${
              buildMessage.type === 'success'
                ? 'bg-gradient-to-r from-copper-500 to-copper-600 text-parchment-100 border-2 border-gold-400'
                : 'bg-gradient-to-r from-blood-500 to-blood-600 text-parchment-100 border-2 border-blood-300'
            }`}
          >
            {buildMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="heading-display text-3xl md:text-4xl text-gold-300 flex items-center gap-2">
            ⚓ 船坞
          </h1>
          <p className="text-parchment-300 text-sm mt-1">
            建造你的专属战舰，征服七大洋
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-ocean-700/60 px-4 py-2 rounded-lg border border-gold-500/40">
            <span className="text-2xl">💰</span>
            <span className="font-display font-bold text-gold-300 text-xl">
              {formatNumber(player.gold)}
            </span>
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

      <div className="flex gap-1 mb-0 ml-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`wood-tab ${activeTab === tab.key ? 'wood-tab-active' : ''}`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pirate-card rounded-tl-none p-4 md:p-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-3 space-y-3 max-h-[600px] overflow-y-auto pr-2"
          >
            {renderModuleList()}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="xl:col-span-6"
          >
            <div className="parchment-panel p-4 h-full min-h-[500px] flex flex-col">
              <div className="mb-4">
                <label className="block text-ocean-700 font-display font-semibold mb-2">
                  📝 船只名称
                </label>
                <input
                  type="text"
                  value={shipName}
                  onChange={(e) => setShipName(e.target.value)}
                  maxLength={20}
                  className="w-full px-4 py-2 bg-parchment-100 border-2 border-wood-500 rounded-lg text-ocean-700 font-display focus:outline-none focus:border-gold-500 transition-colors"
                  placeholder="为你的船只命名..."
                />
              </div>
              <div className="flex-1 bg-gradient-to-b from-ocean-300/20 via-ocean-400/20 to-ocean-500/30 rounded-lg border-2 border-wood-500/50 overflow-hidden">
                <ShipPreview
                  hull={selectedHull}
                  cannons={selectedCannons}
                  sail={selectedSail}
                  armor={selectedArmor}
                />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-ocean-700">
                  <span className="font-display font-semibold">当前配置：</span>
                  <span className="text-wood-700 text-sm ml-2">
                    {selectedHull.name} + {selectedCannons.length}门火炮 + {selectedSail.name} + {selectedArmor.name}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-3 space-y-4"
          >
            <div className="pirate-card p-4">
              <h3 className="heading-display text-lg text-gold-300 mb-4 text-center">
                📊 船只属性
              </h3>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <Gauge value={stats.speed} max={100} label="速度" icon="⚡" color="#2A9D8F" />
                <Gauge value={stats.firepower} max={100} label="火力" icon="💥" color="#BD1E1E" />
                <Gauge value={stats.defense} max={100} label="防御" icon="🛡️" color="#C9A227" />
              </div>
              <div className="space-y-3">
                <StatBar
                  value={stats.maxHp}
                  max={1500}
                  label="最大HP"
                  icon="❤️"
                  color="bg-gradient-to-r from-blood-400 to-blood-600"
                />
                <StatBar
                  value={stats.maxCrew}
                  max={80}
                  label="最大载员"
                  icon="👥"
                  color="bg-gradient-to-r from-copper-500 to-copper-600"
                />
                <StatBar
                  value={stats.maxCannons}
                  max={36}
                  label="最大炮位"
                  icon="💣"
                  color="bg-gradient-to-r from-wood-500 to-wood-600"
                />
              </div>
            </div>

            <div className="pirate-card p-4">
              <h3 className="heading-display text-lg text-gold-300 mb-3">
                💰 建造费用
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-parchment-200">
                  <span>🚢 船体</span>
                  <span className="font-display text-gold-300">{selectedHull.cost}</span>
                </div>
                <div className="flex justify-between text-parchment-200">
                  <span>💣 火炮 x{selectedCannons.length}</span>
                  <span className="font-display text-gold-300">
                    {selectedCannons.reduce((s, c) => s + c.cost, 0)}
                  </span>
                </div>
                <div className="flex justify-between text-parchment-200">
                  <span>🎏 风帆</span>
                  <span className="font-display text-gold-300">{selectedSail.cost}</span>
                </div>
                <div className="flex justify-between text-parchment-200">
                  <span>🛡️ 装甲</span>
                  <span className="font-display text-gold-300">{selectedArmor.cost}</span>
                </div>
                <div className="border-t border-gold-500/30 my-2" />
                <div className="flex justify-between">
                  <span className="heading-display text-gold-200 text-lg">总计</span>
                  <span className={`font-display font-bold text-xl ${canAfford ? 'text-gold-400' : 'text-blood-400'}`}>
                    💰 {formatNumber(totalCost)}
                  </span>
                </div>
                {!canAfford && (
                  <div className="text-xs text-blood-400 text-center mt-1">
                    金币不足，还差 {formatNumber(totalCost - player.gold)}
                  </div>
                )}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: canBuild ? 1.03 : 1 }}
              whileTap={{ scale: canBuild ? 0.97 : 1 }}
              onClick={handleBuild}
              disabled={!canBuild}
              className={`w-full py-4 text-xl font-display font-bold uppercase tracking-wider rounded-lg border-4 transition-all ${
                canBuild
                  ? 'bg-gradient-to-b from-gold-400 to-gold-600 text-ocean-700 border-gold-300 shadow-lg shadow-gold-500/40 hover:shadow-gold-500/60 animate-pulse-gold'
                  : 'bg-ocean-700/50 text-parchment-400 border-ocean-600/50 cursor-not-allowed'
              }`}
            >
              🔨 建造船只
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
