
import React from 'react';
import { Person } from '@/types/genogram';

type ConnectionLinesProps = {
  people: Person[];
  centerX?: number;
  centerY?: number;
};

const ConnectionLines = ({ people, centerX = 400, centerY = 200 }: ConnectionLinesProps) => {
  const renderConnectionLine = (person: Person) => {
    const personX = person.position.x;
    const personY = person.position.y;
    
    return (
      <line
        key={`line-${person.id}`}
        x1={centerX}
        y1={centerY}
        x2={personX}
        y2={personY}
        stroke="#6B7280"
        strokeWidth="2"
        className="opacity-60"
      />
    );
  };

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      {people.map(person => renderConnectionLine(person))}
    </svg>
  );
};

export default ConnectionLines;
