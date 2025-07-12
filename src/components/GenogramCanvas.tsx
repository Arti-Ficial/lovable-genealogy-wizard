
import React from 'react';
import { Person, PersonalInfo, RelationshipStatus } from '@/types/genogram';
import PersonSymbol from './PersonSymbol';
import PersonContextMenu from './PersonContextMenu';

import ImprovedConnectionLines from './ImprovedConnectionLines';

type GenogramCanvasProps = {
  people: Person[];
  personalInfo: PersonalInfo;
  onPersonAction?: (personId: string, action: 'addPartner' | 'addChild' | 'addFather' | 'addMother' | 'addSibling' | 'edit' | 'delete') => void;
  onRelationshipClick?: (fromId: string, toId: string, status: RelationshipStatus) => void;
};

const GenogramCanvas = ({ people, personalInfo, onPersonAction, onRelationshipClick }: GenogramCanvasProps) => {
  // Dynamische Positionierung - Zentrum basiert auf tatsächlichen Positionen falls verfügbar
  const centerX = 400; // Fallback-Position für Ego
  const centerY = 200; // Fallback-Position für Ego

  return (
    <div className="relative bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 min-h-[500px] overflow-hidden">
      {/* Connection lines */}
      <ImprovedConnectionLines 
        people={people} 
        centerX={centerX} 
        centerY={centerY}
        onRelationshipClick={onRelationshipClick}
      />
      
      {/* Central person (self) - Position wird von n8n überschrieben wenn verfügbar */}
      <div className="absolute transform -translate-x-1/2 -translate-y-1/2" style={{ left: centerX, top: centerY }}>
        {onPersonAction ? (
          <PersonContextMenu
            onAddPartner={() => onPersonAction('ego', 'addPartner')}
            onAddChild={() => onPersonAction('ego', 'addChild')}
            onAddFather={() => onPersonAction('ego', 'addFather')}
            onAddMother={() => onPersonAction('ego', 'addMother')}
            onAddSibling={() => onPersonAction('ego', 'addSibling')}
            onEditPerson={() => onPersonAction('ego', 'edit')}
            onDeletePerson={() => onPersonAction('ego', 'delete')}
          >
            <div className="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg cursor-pointer hover:bg-blue-700 transition-colors">
              <div className="text-center">
                <div className="font-semibold text-lg">{personalInfo.name}</div>
                <div className="text-sm opacity-90">Sie</div>
              </div>
            </div>
          </PersonContextMenu>
        ) : (
          <div className="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg">
            <div className="text-center">
              <div className="font-semibold text-lg">{personalInfo.name}</div>
              <div className="text-sm opacity-90">Sie</div>
            </div>
          </div>
        )}
      </div>

      {/* Render all added people - Positionen kommen jetzt von n8n/dagre */}
      {people.map(person => (
        <PersonSymbol 
          key={person.id} 
          person={person} 
          onPersonAction={onPersonAction}
        />
      ))}
    </div>
  );
};

export default GenogramCanvas;
