import { useBlogStore, PRODUCTS, ActiveProduct } from '../store/blogStore';

const PRODUCT_ICONS: Record<string, string> = {
  'talsy.ai': 'T',
  'MockWin.ai': 'M',
  'yashvini.in': 'Y',
};

const PRODUCT_COLORS: Record<string, string> = {
  'talsy.ai': 'bg-blue-600',
  'MockWin.ai': 'bg-violet-600',
  'yashvini.in': 'bg-emerald-600',
};

const PRODUCT_LIGHT_COLORS: Record<string, string> = {
  'talsy.ai': 'bg-blue-50 border-blue-200 text-blue-700',
  'MockWin.ai': 'bg-violet-50 border-violet-200 text-violet-700',
  'yashvini.in': 'bg-emerald-50 border-emerald-200 text-emerald-700',
};

export function ProductSwitcher() {
  const { activeProduct, switchProduct } = useBlogStore();

  return (
    <div className="px-3 pb-3">
      <p className="text-[10px] font-700 text-gray-400 uppercase tracking-widest px-1 mb-2">Product</p>
      <div className="space-y-1">
        {PRODUCTS.map((p: ActiveProduct) => {
          const isActive = activeProduct.name === p.name;
          return (
            <button
              key={p.name}
              onClick={() => { if (!isActive) switchProduct(p); }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all ${
                isActive
                  ? `${PRODUCT_LIGHT_COLORS[p.name]} border font-600`
                  : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <div className={`w-6 h-6 rounded-md ${PRODUCT_COLORS[p.name]} flex items-center justify-center text-white text-[10px] font-800 flex-shrink-0`}>
                {PRODUCT_ICONS[p.name]}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-600 truncate ${isActive ? '' : 'text-gray-600'}`}>{p.name}</p>
              </div>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
