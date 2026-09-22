import React from 'react';

const CategoryFilterScroll = ({ categories, activeCategory, onSelectCategory }) => {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide py-2">
      <div className="flex items-center gap-3 px-4 w-max">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              activeCategory === category.id
                ? 'bg-blue-500 text-white shadow-[0_4px_14px_0_rgb(59,130,246,0.39)]'
                : 'glass-pill text-slate-700 hover:bg-white/90'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilterScroll;
