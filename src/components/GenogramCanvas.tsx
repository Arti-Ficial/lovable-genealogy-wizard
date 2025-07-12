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
  if (people.length > 0 && genogramData) {
    return (
      <SimpleGenogramRenderer 
        data={genogramData}
        onPersonAction={onPersonAction}
        onRelationshipAction={onRelationshipAction}
      />
    );
  }

  if (people.length > 0) {
    return (
      <div className="text-center space-y-4">
        <div className="text-lg font-semibold text-gray-700">
          {people.length + 1} Personen hinzugefügt
        </div>
        <div className="text-sm text-gray-500">
          Das Layout wird berechnet...
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {personalInfo.name} (Sie)
          </div>
          {people.map(person => (
            <div key={person.id} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
              {person.name}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="text-center text-gray-500">
      <FamilyIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
      <p className="text-lg">Fügen Sie Familienmitglieder hinzu</p>
      <p className="text-sm">Klicken Sie mit der rechten Maustaste auf eine Person, um neue Familienmitglieder hinzuzufügen</p>
    </div>
  );
};

export default GenogramCanvas;