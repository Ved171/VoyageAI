import React from 'react';
import { TravelCost } from '../types';
import { Plane, TrainFront, Bus, Car, HelpCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface TravelCostCardProps {
    travelCost: TravelCost
}

const BUDGET_DATA = [
  { name: 'Accommodation', value: 40, color: '#f97316' }, // orange-500
  { name: 'Food & Dining', value: 25, color: '#0f172a' }, // slate-900
  { name: 'Activities', value: 20, color: '#475569' }, // slate-600
  { name: 'Transport', value: 15, color: '#94a3b8' }, // slate-400
];

const TravelCostCard: React.FC<TravelCostCardProps> = ({ travelCost }) => {
  const isOther = travelCost.mode === 'other';

  const getIcon = () => {
    switch (travelCost.mode) {
      case 'flight': return <Plane className="h-8 w-8 text-brand-primary" />;
      case 'train': return <TrainFront className="h-8 w-8 text-brand-primary" />;
      case 'bus': return <Bus className="h-8 w-8 text-brand-primary" />;
      case 'car': return <Car className="h-8 w-8 text-brand-primary" />;
      default: return <HelpCircle className="h-8 w-8 text-brand-primary" />;
    }
  };

  const title = isOther 
    ? 'A Note on Travel' 
    : `Estimated ${travelCost.mode.charAt(0).toUpperCase() + travelCost.mode.slice(1)} Cost`;

  return (
    <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 w-full animate-fadeInUp overflow-hidden">
      
      {/* Left Column: Cost Details */}
      <div className={`flex-1 flex flex-col justify-center text-center md:text-left ${isOther ? 'w-full' : ''}`}>
        <div className="flex justify-center md:justify-start items-center mb-4">
          {!isOther && (
            <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center border border-brand-primary/20 shadow-lg shadow-brand-primary/10">
              {getIcon()}
            </div>
          )}
        </div>
        <p className="text-[10px] font-black tracking-[0.2em] uppercase text-text-muted">
          {title}
        </p>
        
        {!isOther ? (
          <p className="text-2xl md:text-3xl font-black text-text-main mt-2 tracking-tighter transition-all duration-500">
            {travelCost.estimatedCost}
          </p>
        ) : null}

        <p className={`text-xs text-text-muted mt-4 font-medium leading-relaxed max-w-md ${!isOther ? 'text-left' : 'mx-auto md:mx-0 text-sm'}`}>
          {travelCost.costDisclaimer}
        </p>
      </div>

      {/* Right Column: Chart & Legend */}
      {!isOther && (
        <div className="flex-1 w-full flex flex-col items-center md:items-end">
          <div className="h-32 md:h-40 w-full max-w-xs relative drop-shadow-2xl">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={BUDGET_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  strokeWidth={0}
                >
                  {BUDGET_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--surface-container-highest)',
                    borderRadius: '16px', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', 
                    padding: '8px 16px',
                    color: '#dfe4fe',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: '#dfe4fe', fontWeight: 'bold' }}
                  formatter={(value: number) => `${value}%`}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center glow effect */}
            <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-brand-primary/10 blur-xl pointer-events-none" />
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4">
            {BUDGET_DATA.map((item, idx) => (
              <div key={idx} className="flex items-center text-[9px] font-black text-text-muted uppercase tracking-widest">
                <div className="w-2.5 h-2.5 rounded-full mr-2 shadow-sm" style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}55` }} />
                {item.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(TravelCostCard);