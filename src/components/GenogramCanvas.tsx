
import React from 'react';
import { Person, PersonalInfo } from '@/types/genogram';
import PersonSymbol from './PersonSymbol';
import AddPersonButton from './AddPersonButton';
import ConnectionLines from './ConnectionLines';

type GenogramCanvasProps = {
  people: Person[];
  personalInfo: PersonalInfo;
  onAddPerson: (relationship: 'mother' | 'father' | 'sibling' | 'partner' | 'child') => void;
};

const GenogramCanvas = ({ people, personalInfo, onAddPerson }: GenogramCanvasProps) => {
  const centerX = 400;
  const centerY = 200;

  const addButtonPositions = {
    mother: { x: 250, y: 100 },
    father: { x: 550, y: 100 },
    sibling: { x: 200, y: 200 },
    partner: { x: 600, y: 200 },
    child: { x: 400, y: 350 }
  };

  return (
    <div className="relative bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 min-h-[500px] overflow-hidden">
      {/* Connection lines */}
      <ConnectionLines people={people} centerX={centerX} centerY={centerY} />
      
      {/* Central person (self) */}
      <div className="absolute transform -translate-x-1/2 -translate-y-1/2" style={{ left: centerX, top: centerY }}>
        <div className="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg">
          <div className="text-center">
            <div className="font-semibold text-lg">{personalInfo.name}</div>
            <div className="text-sm opacity-90">Sie</div>
          </div>
        </div>
      </div>

      {/* Add person buttons */}
      {Object.entries(addButtonPositions).map(([relationship, position]) => (
        <AddPersonButton
          key={relationship}
          relationship={relationship as 'mother' | 'father' | 'sibling' | 'partner' | 'child'}
          position={position}
          onAddPerson={onAddPerson}
        />
      ))}

      {/* Render all added people */}
      {people.map(person => (
        <PersonSymbol key={person.id} person={person} />
      ))}
    </div>
  );
};

export default GenogramCanvas;
