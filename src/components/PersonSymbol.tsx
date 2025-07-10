
import React from 'react';
import { Circle, Square } from 'lucide-react';
import { Person } from '@/types/genogram';

type PersonSymbolProps = {
  person: Person;
};

const PersonSymbol = ({ person }: PersonSymbolProps) => {
  const IconComponent = person.gender === 'female' ? Circle : Square;
  const isDeceased = !!person.deathDate;
  
  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2"
      style={{ left: person.position.x, top: person.position.y }}
    >
      <div className="flex flex-col items-center">
        <div className={`relative ${isDeceased ? 'opacity-60' : ''}`}>
          <IconComponent 
            className={`w-12 h-12 ${person.gender === 'female' ? 'text-pink-500' : 'text-blue-500'} fill-current`}
          />
          {isDeceased && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-0.5 bg-red-500 rotate-45"></div>
            </div>
          )}
        </div>
        <span className="mt-2 text-sm font-medium text-gray-700 text-center max-w-20 break-words">
          {person.name}
        </span>
      </div>
    </div>
  );
};

export default PersonSymbol;
