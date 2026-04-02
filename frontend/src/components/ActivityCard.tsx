import React from 'react';
import { Activity, ActivityType } from '../types';
import { ClockIcon, LocationMarkerIcon, FoodIcon, MuseumIcon, NatureIcon, ShoppingIcon, EntertainmentIcon, LandmarkIcon } from './icons/Icons';

interface ActivityCardProps {
  activity: Activity;
  isSelected: boolean;
  onSelect: () => void;
}

const ActivityIcon: React.FC<{ type: ActivityType }> = ({ type }) => {
  const iconMap: Record<ActivityType, React.ReactNode> = {
    'Food & Drink': <FoodIcon className="h-6 w-6 text-white" />,
    'Museum & Art': <MuseumIcon className="h-6 w-6 text-white" />,
    'Outdoor & Nature': <NatureIcon className="h-6 w-6 text-white" />,
    'Shopping': <ShoppingIcon className="h-6 w-6 text-white" />,
    'Entertainment': <EntertainmentIcon className="h-6 w-6 text-white" />,
    'Landmark': <LandmarkIcon className="h-6 w-6 text-white" />,
    'Other': <LocationMarkerIcon className="h-6 w-6 text-white" />,
  };
  return iconMap[type] || iconMap['Other'];
};

const ActivityCard: React.FC<ActivityCardProps> = ({ activity, isSelected, onSelect }) => {
  return (
    <div className="relative" onClick={onSelect} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onSelect()} aria-pressed={isSelected}>
      {/* Timeline Dot and Icon */}
      <div className={`absolute -left-14 top-0 h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white transition-all duration-300 ${isSelected ? 'bg-orange-600 scale-110 shadow-lg shadow-orange-500/30' : 'bg-orange-500'}`}>
        <ActivityIcon type={activity.activityType} />
      </div>

      <div className={`ml-4 bg-white p-8 rounded-[32px] transition-all duration-500 cursor-pointer ${isSelected ? 'ring-4 ring-orange-500/20 shadow-2xl scale-[1.02]' : 'shadow-sm border border-slate-100 hover:shadow-xl hover:border-orange-100'}`}>
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-orange-50 px-3 py-1 rounded-full flex items-center">
            <ClockIcon className="h-4 w-4 text-orange-500 mr-2" />
            <p className="font-black text-orange-500 text-xs uppercase tracking-widest">{activity.time}</p>
          </div>
        </div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{activity.name}</h3>
        <p className="mt-3 text-slate-500 font-medium leading-relaxed">{activity.description}</p>
        
        <div className="mt-6 pt-6 border-t border-slate-50 flex items-start space-x-3">
            <LocationMarkerIcon className="h-5 w-5 text-slate-300 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-slate-400 font-bold">{activity.location}</p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ActivityCard);