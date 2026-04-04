
import React from 'react';
import { DollarIcon, BuildingLibraryIcon, StarIcon } from './components/icons/Icons';
import { UserPreferences } from './types';

export const INTEREST_TAGS: string[] = [
  'History',
  'Art & Culture',
  'Foodie',
  'Street Food',
  'Adventure',
  'Nature',
  'Nightlife',
  'Shopping',
  'Relaxation',
  'Technology',
  'Architecture',
  'Music',
  'Hidden Gems',
  'Photography',
  'Hiking',
  'Beach',
  'Wellness'
];

export const BUDGET_OPTIONS: {
  value: UserPreferences['budget'];
  label: string;
  description: string;
  // FIX: Added React import to satisfy the React namespace requirements for TypeScript.
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}[] = [
    {
      value: 'budget',
      label: 'Budget-Friendly',
      description: 'Backpacker-friendly and cost-effective choices.',
      icon: DollarIcon,
    },
    {
      value: 'moderate',
      label: 'Moderate',
      description: 'A balance of comfort and value.',
      icon: BuildingLibraryIcon,
    },
    {
      value: 'luxury',
      label: 'Luxury',
      description: 'Premium experiences and top-tier services.',
      icon: StarIcon,
    },
  ];