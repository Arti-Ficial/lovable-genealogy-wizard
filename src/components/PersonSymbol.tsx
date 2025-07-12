
import React from 'react';
import { Circle, Square } from 'lucide-react';
import { Person } from '@/types/genogram';
import PersonContextMenu from './PersonContextMenu';

type PersonSymbolProps = {
  person: Person;
  onPersonAction?: (personId: string, action: 'addPartner' | 'addChild' | 'addFather' | 'addMother' | 'addSibling' | 'edit' | 'delete') => void;
};

const PersonSymbol = ({ person, onPersonAction }: PersonSymbolProps) => {
  const IconComponent = person.gender === 'female' ? Circle : Square;
  const isDeceased = person.isDeceased || !!person.deathDate;
  
  const handlePersonAction = (action: 'addPartner' | 'addChild' | 'addFather' | 'addMother' | 'addSibling' | 'edit' | 'delete') => {
    if (onPersonAction) {
      onPersonAction(person.id, action);
    }
  };

  const symbolContent = (
    <div className="flex flex-col items-center">
      <div className={`relative ${isDeceased ? 'opacity-60' : ''}`}>
        <IconComponent 
          className={`w-12 h-12 ${person.gender === 'female' ? 'text-pink-500' : 'text-blue-500'} fill-current ${onPersonAction ? 'cursor-pointer hover:opacity-80' : ''}`}
        />
        {isDeceased && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 w-full h-0.5 bg-gray-800 rotate-45 top-1/2 -translate-y-1/2"></div>
              <div className="absolute inset-0 w-full h-0.5 bg-gray-800 -rotate-45 top-1/2 -translate-y-1/2"></div>
            </div>
          </div>
        )}
      </div>
      <span className="mt-2 text-sm font-medium text-gray-700 text-center max-w-20 break-words">
        {person.name}
      </span>
    </div>
  );
  
  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2"
      style={{ left: person.position.x, top: person.position.y }}
    >
      {onPersonAction ? (
        <PersonContextMenu
          onAddPartner={() => handlePersonAction('addPartner')}
          onAddChild={() => handlePersonAction('addChild')}
          onAddFather={() => handlePersonAction('addFather')}
          onAddMother={() => handlePersonAction('addMother')}
          onAddSibling={() => handlePersonAction('addSibling')}
          onEditPerson={() => handlePersonAction('edit')}
          onDeletePerson={() => handlePersonAction('delete')}
        >
          {symbolContent}
        </PersonContextMenu>
      ) : (
        symbolContent
      )}
    </div>
  );
};

export default PersonSymbol;
