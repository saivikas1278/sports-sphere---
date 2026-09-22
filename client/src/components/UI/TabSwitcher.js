import React, { useState } from 'react';

const TabSwitcher = ({ tabs, activeTab, onTabChange, variant = "pills" }) => {
  const variants = {
    pills: {
      container: "flex space-x-2 bg-gray-100 p-1 rounded-xl",
      activeTab: "px-4 py-2 rounded-lg bg-white shadow-sm text-gray-900 font-medium transition-all duration-300",
      inactiveTab: "px-4 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white/50 transition-all duration-300 cursor-pointer"
    },
    underline: {
      container: "flex space-x-8 border-b border-gray-200",
      activeTab: "pb-4 px-1 border-b-2 border-blue-500 text-blue-600 font-medium transition-all duration-300",
      inactiveTab: "pb-4 px-1 text-gray-500 hover:text-gray-700 cursor-pointer transition-all duration-300"
    },
    buttons: {
      container: "flex space-x-2",
      activeTab: "px-4 md:px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium shadow-lg transform scale-105 transition-all duration-300",
      inactiveTab: "px-4 md:px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 cursor-pointer transition-all duration-300"
    }
  };

  const selectedVariant = variants[variant];

  return (
    <div className={selectedVariant.container}>
      {tabs.map((tab) => (
        <div
          key={tab.key}
          className={
            activeTab === tab.key 
              ? selectedVariant.activeTab 
              : selectedVariant.inactiveTab
          }
          onClick={() => onTabChange(tab.key)}
        >
          {tab.icon && <span className="mr-2">{tab.icon}</span>}
          {tab.label}
        </div>
      ))}
    </div>
  );
};

export default TabSwitcher;
