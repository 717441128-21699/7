import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { getPriceSuggestion } from '../utils/gameUtils';
import type { MarketListing, CrewMember } from '../types';

type MarketTab = 'blueprint' | 'crewContract';
type SortKey = 'price' | 'time' | 'tier';

interface ListingItem {
  type: 'blueprint' | 'crewContract';
  blueprintId?: string;
  blueprintName?: string;
  blueprintTier?: number;
  crew?: CrewMember;
}

export default function Market() {
  const {
    player,
    marketListings,
    tradeHistory,
    announcements,
    createListing,
    buyListing,
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<MarketTab>('blueprint');
  const [sortKey, setSortKey] = useState<SortKey>('time');
  const [sortAsc, setSortAsc] = useState(false);
  const [tierFilter, setTierFilter] = useState<number | null>(null);
  const [pricingItem, setPricingItem] = useState<ListingItem | null>(null);
  const [listingPrice, setListingPrice] = useState<string>('');
  const [purchaseSuccess, setPurchaseSuccess] = useState<{
    show: boolean;
    itemName: string;
    price: number;
    bounty: boolean;
  } | null>(null);

  const marqueeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pricingItem) {
      const tier = pricingItem.blueprintTier || (pricingItem.crew?.level || 1);
      const suggestion = getPriceSuggestion(pricingItem.type, tier);
      setListingPrice(suggestion.avg.toString());
    }
  }, [pricingItem]);

  const filteredListings = marketListings
    .filter((l) => l.type === activeTab)
    .filter((l) => {
      if (tierFilter === null) return true;
      const tier =
        l.type === 'blueprint' ? l.item.blueprintTier || 1 : l.item.crew?.level || 1;
      return tier === tierFilter;
    })
    .sort((a, b) => {
      let diff = 0;
      if (sortKey === 'price') diff = a.price - b.price;
      else if (sortKey === 'time') diff = a.listedAt - b.listedAt;
      else if (sortKey === 'tier') {
        const tierA = a.type === 'blueprint' ? a.item.blueprintTier || 1 : a.item.crew?.level || 1;
        const tierB = b.type === 'blueprint' ? b.item.blueprintTier || 1 : b.item.crew?.level || 1;
        diff = tierA - tierB;
      }
      return sortAsc ? diff : -diff;
    });

  const myListings = marketListings.filter((l) => l.sellerId === player.id);

  const getPriceColor = (listing: MarketListing) => {
    const avg = (listing.suggestedPriceMin + listing.suggestedPriceMax) / 2;
    if (listing.price < listing.suggestedPriceMin) return 'text-green-400 bg-green-400/20';
    if (listing.price > listing.suggestedPriceMax) return 'text-blood-400 bg-blood-400/20';
    return 'text-gold-400 bg-gold-400/20';
  };

  const getPriceLabel = (listing: MarketListing) => {
    if (listing.price < listing.suggestedPriceMin) return '低价';
    if (listing.price > listing.suggestedPriceMax) return '高价';
    return '正常';
  };

  const handleBuy = (listing: MarketListing) => {
    const success = buyListing(listing.id);
    if (success) {
      const itemName =
        listing.type === 'blueprint'
          ? listing.item.blueprintName || '图纸'
          : listing.item.crew?.name || '船员';
      const triggeredBounty = listing.price > listing.suggestedPriceMax * 1.5;
      setPurchaseSuccess({
        show: true,
        itemName,
        price: listing.price,
        bounty: triggeredBounty,
      });
      setTimeout(() => setPurchaseSuccess(null), 3000);
    }
  };

  const handleConfirmListing = () => {
    if (!pricingItem) return;
    const price = parseInt(listingPrice);
    if (isNaN(price) || price <= 0) return;
    createListing(pricingItem.type, pricingItem, price);
    setPricingItem(null);
    setListingPrice('');
  };

  const availableBlueprints = player.inventory.blueprints.filter(
    (bp) => !myListings.some((l) => l.type === 'blueprint' && l.item.blueprintId === bp.id),
  );

  const availableCrew = player.crew.filter(
    (c) => !myListings.some((l) => l.type === 'crewContract' && l.item.crew?.id === c.id),
  );

  const scrollText = announcements.map((a) => a.text).join('  ⚓  ');

  return (
    <div className="min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="marquee-container relative flex items-center"
      >
        <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center px-3 bg-ocean-700 border-r-2 border-gold-500/50">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-gold-400 text-sm"
          >
            📢
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

      <div className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="heading-display text-3xl md:text-4xl text-gold-300 text-center mb-6"
          >
            🏪 海盗交易市场 🏪
          </motion.h1>

          <div className="flex items-center justify-between mb-4 pirate-card p-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💰</span>
              <span className="font-display font-bold text-gold-300 text-xl">
                {player.gold.toLocaleString()}
              </span>
              <span className="text-parchment-300 text-sm">金币</span>
            </div>
            <div className="text-sm text-parchment-300">
              今日成交: <span className="text-gold-300 font-mono">{tradeHistory.length}</span> 笔
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="pirate-card p-4">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h3 className="heading-display text-xl text-gold-300">📜 市场浏览</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setActiveTab('blueprint')}
                      className={`wood-tab ${activeTab === 'blueprint' ? 'wood-tab-active' : ''}`}
                    >
                      📋 图纸
                    </button>
                    <button
                      onClick={() => setActiveTab('crewContract')}
                      className={`wood-tab ${activeTab === 'crewContract' ? 'wood-tab-active' : ''}`}
                    >
                      👥 船员合同
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <div className="flex items-center gap-1">
                    <span className="text-parchment-300 text-xs">排序:</span>
                    {(['time', 'price', 'tier'] as SortKey[]).map((k) => (
                      <button
                        key={k}
                        onClick={() => {
                          if (sortKey === k) setSortAsc(!sortAsc);
                          else {
                            setSortKey(k);
                            setSortAsc(false);
                          }
                        }}
                        className={`px-2 py-1 text-xs rounded border transition-all ${
                          sortKey === k
                            ? 'bg-gold-500 text-ocean-700 border-gold-300'
                            : 'bg-ocean-700/50 text-parchment-300 border-ocean-500/50 hover:border-gold-500/50'
                        }`}
                      >
                        {k === 'time' ? '时间' : k === 'price' ? '价格' : 'Tier'}
                        {sortKey === k && (sortAsc ? ' ↑' : ' ↓')}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-parchment-300 text-xs">Tier:</span>
                    <button
                      onClick={() => setTierFilter(null)}
                      className={`px-2 py-1 text-xs rounded border transition-all ${
                        tierFilter === null
                          ? 'bg-gold-500 text-ocean-700 border-gold-300'
                          : 'bg-ocean-700/50 text-parchment-300 border-ocean-500/50 hover:border-gold-500/50'
                      }`}
                    >
                      全部
                    </button>
                    {[1, 2, 3, 4, 5].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTierFilter(tierFilter === t ? null : t)}
                        className={`px-2 py-1 text-xs rounded border transition-all ${
                          tierFilter === t
                            ? 'bg-gold-500 text-ocean-700 border-gold-300'
                            : 'bg-ocean-700/50 text-parchment-300 border-ocean-500/50 hover:border-gold-500/50'
                        }`}
                      >
                        T{t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  <AnimatePresence mode="popLayout">
                    {filteredListings.map((listing) => {
                      const tier =
                        listing.type === 'blueprint'
                          ? listing.item.blueprintTier || 1
                          : listing.item.crew?.level || 1;
                      const itemName =
                        listing.type === 'blueprint'
                          ? listing.item.blueprintName || '未知图纸'
                          : listing.item.crew?.name || '未知船员';
                      return (
                        <motion.div
                          key={listing.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="parchment-panel p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-display font-bold text-lg text-ocean-700 truncate">
                                  {listing.type === 'blueprint' ? '📋' : '👤'} {itemName}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-wood-600 text-parchment-100 text-xs font-display">
                                  T{tier}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-mono ${getPriceColor(listing)}`}
                                >
                                  {getPriceLabel(listing)}
                                </span>
                              </div>
                              <div className="text-sm text-wood-700 mb-2">
                                卖家: <span className="font-semibold">{listing.sellerName}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-wood-600">
                                  建议区间: {listing.suggestedPriceMin} - {listing.suggestedPriceMax}
                                </span>
                                <span className="text-xs text-wood-500">
                                  {Math.round((Date.now() - listing.listedAt) / 60000)}分钟前
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <div className="font-display font-bold text-2xl text-ocean-700">
                                💰 {listing.price}
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleBuy(listing)}
                                disabled={player.gold < listing.price || listing.sellerId === player.id}
                                className={`pirate-btn-gold text-sm px-4 py-1.5 ${
                                  player.gold < listing.price || listing.sellerId === player.id
                                    ? 'opacity-50 cursor-not-allowed'
                                    : ''
                                }`}
                              >
                                {listing.sellerId === player.id
                                  ? '我的上架'
                                  : player.gold < listing.price
                                  ? '金币不足'
                                  : '购买'}
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  {filteredListings.length === 0 && (
                    <div className="text-center py-12 text-parchment-400">
                      <div className="text-5xl mb-3 opacity-50">🏝️</div>
                      <div>暂无符合条件的商品</div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="pirate-card p-4">
                <h3 className="heading-display text-xl text-gold-300 mb-4">💼 我的上架</h3>

                <div className="mb-4">
                  <h4 className="text-parchment-300 text-sm mb-2 font-display">可上架物品:</h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {availableBlueprints.map((bp) => (
                      <motion.div
                        key={bp.id}
                        whileHover={{ x: 4 }}
                        onClick={() =>
                          setPricingItem({
                            type: 'blueprint',
                            blueprintId: bp.id,
                            blueprintName: bp.name,
                            blueprintTier: bp.tier,
                          })
                        }
                        className="parchment-panel p-2 cursor-pointer hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">📋</span>
                            <div>
                              <div className="font-display font-semibold text-ocean-700 text-sm">
                                {bp.name}
                              </div>
                              <div className="text-xs text-wood-600">Tier {bp.tier}</div>
                            </div>
                          </div>
                          <span className="text-gold-600 text-xs">点击上架 →</span>
                        </div>
                      </motion.div>
                    ))}
                    {availableCrew.map((c) => (
                      <motion.div
                        key={c.id}
                        whileHover={{ x: 4 }}
                        onClick={() =>
                          setPricingItem({
                            type: 'crewContract',
                            crew: c,
                          })
                        }
                        className="parchment-panel p-2 cursor-pointer hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{c.avatar}</span>
                            <div>
                              <div className="font-display font-semibold text-ocean-700 text-sm">
                                {c.name}
                              </div>
                              <div className="text-xs text-wood-600">
                                Lv.{c.level} · {c.role === 'captain' ? '船长' : c.role === 'gunner' ? '炮手' : '水手'}
                              </div>
                            </div>
                          </div>
                          <span className="text-gold-600 text-xs">点击上架 →</span>
                        </div>
                      </motion.div>
                    ))}
                    {availableBlueprints.length === 0 && availableCrew.length === 0 && (
                      <div className="text-center py-6 text-parchment-400 text-sm">
                        暂无可上架物品
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-parchment-300 text-sm mb-2 font-display">已上架:</h4>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                    {myListings.length === 0 ? (
                      <div className="text-center py-6 text-parchment-400 text-sm">
                        暂无上架商品
                      </div>
                    ) : (
                      myListings.map((listing) => {
                        const itemName =
                          listing.type === 'blueprint'
                            ? listing.item.blueprintName || '图纸'
                            : listing.item.crew?.name || '船员';
                        return (
                          <motion.div
                            key={listing.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="parchment-panel p-2"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-display font-semibold text-ocean-700 text-sm">
                                  {listing.type === 'blueprint' ? '📋' : '👤'} {itemName}
                                </div>
                                <div className="text-xs text-wood-600">
                                  💰 {listing.price} · {Math.round((Date.now() - listing.listedAt) / 60000)}分钟前
                                </div>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="pirate-btn-danger text-xs px-3 py-1"
                              >
                                下架
                              </motion.button>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {pricingItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="pirate-card p-6 max-w-md w-full"
            >
              <h3 className="heading-display text-2xl text-gold-300 mb-4 text-center">
                💰 定价上架
              </h3>

              <div className="parchment-panel p-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">
                    {pricingItem.type === 'blueprint' ? '📋' : pricingItem.crew?.avatar || '👤'}
                  </span>
                  <div>
                    <div className="font-display font-bold text-xl text-ocean-700">
                      {pricingItem.type === 'blueprint'
                        ? pricingItem.blueprintName
                        : pricingItem.crew?.name}
                    </div>
                    <div className="text-sm text-wood-600">
                      Tier {pricingItem.blueprintTier || pricingItem.crew?.level || 1}
                    </div>
                  </div>
                </div>
              </div>

              {(() => {
                const tier = pricingItem.blueprintTier || (pricingItem.crew?.level || 1);
                const suggestion = getPriceSuggestion(pricingItem.type, tier);
                return (
                  <>
                    <div className="mb-4 text-sm text-parchment-300">
                      <div className="mb-1">近7天均价: <span className="text-gold-300 font-mono">{suggestion.avg}</span> 金币</div>
                      <div>
                        建议区间: 
                        <span className="text-green-400 font-mono mx-1">{suggestion.min}</span>
                        ~
                        <span className="text-blood-400 font-mono mx-1">{suggestion.max}</span>
                        金币
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-parchment-300 text-sm mb-2 font-display">
                        输入售价 (金币)
                      </label>
                      <input
                        type="number"
                        value={listingPrice}
                        onChange={(e) => setListingPrice(e.target.value)}
                        className="w-full px-4 py-3 bg-ocean-700/50 border-2 border-gold-500/50 rounded text-gold-200 font-mono text-lg text-center focus:border-gold-400 focus:outline-none transition-colors"
                        placeholder="输入价格"
                      />
                      {listingPrice && parseInt(listingPrice) > suggestion.max * 1.5 && (
                        <div className="mt-2 text-xs text-blood-400">
                          ⚠️ 高价成交可能会吸引赏金猎人！
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setPricingItem(null);
                    setListingPrice('');
                  }}
                  className="pirate-btn flex-1"
                >
                  取消
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleConfirmListing}
                  disabled={!listingPrice || parseInt(listingPrice) <= 0}
                  className="pirate-btn-gold flex-1"
                >
                  确认上架
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {purchaseSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className={`pirate-card p-4 border-4 ${
                purchaseSuccess.bounty ? 'border-blood-400' : 'border-gold-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-4xl animate-treasure-glow">
                  {purchaseSuccess.bounty ? '💰' : '✅'}
                </span>
                <div>
                  <div className="font-display font-bold text-xl text-gold-300">
                    购买成功！
                  </div>
                  <div className="text-parchment-300 text-sm">
                    「{purchaseSuccess.itemName}」 - {purchaseSuccess.price} 金币
                  </div>
                  {purchaseSuccess.bounty && (
                    <div className="text-blood-400 text-xs mt-1 font-bold">
                      ⚠️ 高价成交！赏金猎人已闻风出动！
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
