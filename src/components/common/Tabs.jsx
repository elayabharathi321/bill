/**
 * Horizontal tab bar.
 */
export default function Tabs({ tabs = [], active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-md bg-gray-100 p-1">
      {tabs.map((tab) => {
        const isActive = tab.value === active;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}