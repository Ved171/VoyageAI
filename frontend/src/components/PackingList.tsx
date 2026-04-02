import React, { useState } from 'react';
import { BriefcaseIcon, CheckCircleIcon } from './icons/Icons';

interface PackingListProps {
  packingList: string[];
}

const PackingList: React.FC<PackingListProps> = ({ packingList }) => {
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  if (!packingList || packingList.length === 0) {
    return null;
  }

  const toggleItem = (index: number) => {
    setCheckedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="bg-white rounded-[48px] shadow-2xl p-12 mb-20 border border-slate-100 animate-fadeInUp">
      <div className="flex items-center mb-10">
        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mr-5">
          <BriefcaseIcon className="h-6 w-6 text-orange-500" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Adventure Essentials</h2>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-6">
        {packingList.map((item, index) => (
          <li 
            key={index} 
            className="flex items-center cursor-pointer group p-4 rounded-2xl hover:bg-slate-50 transition-all"
            onClick={() => toggleItem(index)}
          >
            <div className={`h-6 w-6 rounded-lg border-2 mr-4 flex items-center justify-center transition-all ${
              checkedItems[index] 
                ? 'bg-orange-500 border-orange-500 shadow-lg shadow-orange-500/30' 
                : 'border-slate-200 group-hover:border-orange-300'
            }`}>
              {checkedItems[index] && <CheckCircleIcon className="h-4 w-4 text-white" />}
            </div>
            <span className={`text-lg font-bold transition-all ${checkedItems[index] ? 'text-slate-300 line-through' : 'text-slate-700'}`}>
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default React.memo(PackingList);