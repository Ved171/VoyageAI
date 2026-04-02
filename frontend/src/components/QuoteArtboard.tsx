import React from 'react';
import { DestinationQuote } from '../types';

interface QuoteArtboardProps {
  quote: DestinationQuote;
}

const QuoteArtboard: React.FC<QuoteArtboardProps> = ({ quote }) => {
  if (!quote || !quote.quote) {
    return (
        <div className="h-full w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 flex flex-col justify-center items-center text-center min-h-[250px]">
            <p className="text-gray-500">Could not load a quote for this destination.</p>
        </div>
    );
  }

  return (
    <div className="h-full w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 flex flex-col justify-center items-center text-center min-h-[250px]">
      <div className="relative">
        <span className="absolute -top-4 -left-6 font-serif text-8xl text-gray-100 select-none">“</span>
        <blockquote className="font-serif text-2xl sm:text-3xl font-medium text-brand-dark z-10 relative">
          {quote.quote}
        </blockquote>
        <span className="absolute -bottom-8 -right-6 font-serif text-8xl text-gray-100 select-none">”</span>
      </div>
      <cite className="mt-8 not-italic">
        <p className="font-semibold text-gray-700">{quote.author}</p>
        <p className="text-gray-500 mt-1 text-sm italic">"{quote.translation}"</p>
      </cite>
    </div>
  );
};

export default QuoteArtboard;
