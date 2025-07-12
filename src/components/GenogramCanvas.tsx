import React from 'react';
import { Person, PersonalInfo } from '@/types/genogram';
import FamilyIcon from './FamilyIcon';
import SimpleGenogramRenderer from './SimpleGenogramRenderer';

type GenogramCanvasProps = {
  people: Person[];
  personalInfo: PersonalInfo;
  genogramData: any;
  onPersonAction: (nodeId: string, action: 'addPartner' | 'addChild' | 'addFather' | 'addMother' | 'addSibling' | 'edit' | 'delete') => void;
  onRelationshipAction: (lineId: string, fromId: string, toId: string, action: 'edit') => void;
};

const GenogramCanvas = ({ people, personalInfo, genogramData, onPersonAction, onRelationshipAction }: GenogramCanvasProps) => {
  // Always show the ego person as a visible, clickable node
  const egoData = {
    nodes: [{
      id: 'ego',
      name: personalInfo.name,
      shape: personalInfo.gender === 'male' ? 'rect' : 'circle' as 'circle' | 'rect',
      x: 400, // Center position
      y: 300,
      isEgo: true
    }],
    lines: []
  };

  // If we have genogram data from API, show that instead
  if (people.length > 0 && genogramData) {
    return (
      <SimpleGenogramRenderer 
        data={genogramData}
        onPersonAction={onPersonAction}
        onRelationshipAction={onRelationshipAction}
      />
    );
  }

  // Always show the ego person (even if no other family members added yet)
  return (
    <div className="w-full h-full flex items-center justify-center">
      <SimpleGenogramRenderer 
        data={egoData}
        onPersonAction={onPersonAction}
        onRelationshipAction={onRelationshipAction}
      />
    </div>
  );
};

export default GenogramCanvas;