import React, { useState, useCallback } from 'react';
import { DayPlan, Activity } from '../types';
import ActivityCard from './ActivityCard';
import MapView from './MapView';

interface DayCardProps {
  dayPlan: DayPlan;
  style?: React.CSSProperties;
}

const DayCard: React.FC<DayCardProps> = ({ dayPlan, style }) => {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const handleBoundsReset = useCallback(() => {
    setSelectedActivity(null);
  }, []);

  return (
    <section className="animate-fadeInUp" style={style} aria-labelledby={`day-${dayPlan.day}-heading`}>
        <div className="mb-12">
            <div className="flex items-baseline space-x-6">
                <span className="text-7xl font-black text-orange-500 tracking-tighter">0{dayPlan.day}</span>
                <h2 id={`day-${dayPlan.day}-heading`} className="text-4xl font-black text-slate-900 tracking-tight">{dayPlan.title}</h2>
            </div>
            <p className="text-slate-500 mt-6 max-w-3xl text-lg font-medium leading-relaxed">{dayPlan.summary}</p>
        </div>
      
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-20">
            {/* Activities Column */}
            <div className="relative border-l-4 border-slate-100 pl-12 space-y-12">
                {dayPlan.activities.map((activity, index) => (
                    <ActivityCard 
                        key={index} 
                        activity={activity} 
                        isSelected={selectedActivity === activity}
                        onSelect={() => setSelectedActivity(activity)}
                    />
                ))}
            </div>
            
            {/* Map Column */}
            <div className="mt-12 lg:mt-0">
                <div className="lg:sticky top-28 h-96 lg:h-[calc(100vh-12rem)] min-h-[500px] rounded-[48px] overflow-hidden shadow-2xl border border-slate-100">
                    <MapView 
                        activities={dayPlan.activities} 
                        selectedActivity={selectedActivity}
                        onBoundsReset={handleBoundsReset}
                    />
                </div>
            </div>
        </div>
    </section>
  );
};

export default React.memo(DayCard);