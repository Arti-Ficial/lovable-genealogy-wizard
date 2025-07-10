
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

type AddPersonButtonProps = {
  relationship: 'mother' | 'father' | 'sibling' | 'partner' | 'child';
  position: { x: number; y: number };
  onAddPerson: (relationship: 'mother' | 'father' | 'sibling' | 'partner' | 'child') => void;
};

const relationshipConfig = {
  mother: {
    label: 'Mutter hinzufügen',
    colorClass: 'bg-pink-100 hover:bg-pink-200 text-pink-700 border-2 border-pink-300'
  },
  father: {
    label: 'Vater hinzufügen',
    colorClass: 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-2 border-blue-300'
  },
  sibling: {
    label: 'Geschwister hinzufügen',
    colorClass: 'bg-green-100 hover:bg-green-200 text-green-700 border-2 border-green-300'
  },
  partner: {
    label: 'Partner/in hinzufügen',
    colorClass: 'bg-purple-100 hover:bg-purple-200 text-purple-700 border-2 border-purple-300'
  },
  child: {
    label: 'Kind hinzufügen',
    colorClass: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border-2 border-yellow-300'
  }
};

const AddPersonButton = ({ relationship, position, onAddPerson }: AddPersonButtonProps) => {
  const config = relationshipConfig[relationship];

  return (
    <div 
      className="absolute transform -translate-x-1/2 -translate-y-1/2" 
      style={{ left: position.x, top: position.y }}
    >
      <Button
        onClick={() => onAddPerson(relationship)}
        className={`${config.colorClass} h-12 px-4`}
        variant="outline"
      >
        <Plus className="w-4 h-4 mr-2" />
        {config.label}
      </Button>
    </div>
  );
};

export default AddPersonButton;
