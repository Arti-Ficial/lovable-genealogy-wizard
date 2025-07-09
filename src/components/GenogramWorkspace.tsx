
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Square, Circle } from 'lucide-react';
import { Person, PersonalInfo } from '@/types/genogram';
import PersonModal from './PersonModal';
import FamilyIcon from './FamilyIcon';

type GenogramWorkspaceProps = {
  personalInfo: PersonalInfo;
};

const GenogramWorkspace = ({ personalInfo }: GenogramWorkspaceProps) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentRelationship, setCurrentRelationship] = useState<'mother' | 'father' | 'sibling' | 'partner'>('mother');

  const handleAddPerson = (relationship: 'mother' | 'father' | 'sibling' | 'partner') => {
    setCurrentRelationship(relationship);
    setModalOpen(true);
  };

  const handleSavePerson = (personData: Omit<Person, 'id' | 'position'>) => {
    const newPerson: Person = {
      ...personData,
      id: Date.now().toString(),
      position: getPositionForRelationship(personData.relationship)
    };
    
    setPeople(prev => [...prev, newPerson]);
    console.log('New person added:', newPerson);
  };

  const getPositionForRelationship = (relationship: string) => {
    const baseX = 400; // Center of workspace
    const baseY = 200; // Center of workspace
    
    switch (relationship) {
      case 'mother':
        return { x: baseX - 150, y: baseY - 100 };
      case 'father':
        return { x: baseX + 150, y: baseY - 100 };
      case 'partner':
        return { x: baseX + 200, y: baseY };
      case 'sibling':
        return { x: baseX - 200, y: baseY };
      default:
        return { x: baseX, y: baseY };
    }
  };

  const renderPersonSymbol = (person: Person) => {
    const IconComponent = person.gender === 'female' ? Circle : Square;
    const isDeceased = !!person.deathDate;
    
    return (
      <div
        key={person.id}
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

  const renderConnectionLine = (person: Person) => {
    const centerX = 400;
    const centerY = 200;
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl mx-auto shadow-xl animate-fade-in">
        <CardHeader className="text-center pb-6">
          <div className="mb-4 flex justify-center">
            <FamilyIcon className="w-16 h-16 text-blue-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Schritt 2: Stellen Sie Ihre Familie zusammen
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="relative bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 min-h-[500px] overflow-hidden">
            {/* SVG for connection lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {people.map(person => renderConnectionLine(person))}
            </svg>
            
            {/* Central person (self) */}
            <div className="absolute transform -translate-x-1/2 -translate-y-1/2" style={{ left: 400, top: 200 }}>
              <div className="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg">
                <div className="text-center">
                  <div className="font-semibold text-lg">{personalInfo.name}</div>
                  <div className="text-sm opacity-90">Sie</div>
                </div>
              </div>
            </div>

            {/* Add buttons around the central person */}
            <div className="absolute transform -translate-x-1/2 -translate-y-1/2" style={{ left: 250, top: 100 }}>
              <Button
                onClick={() => handleAddPerson('mother')}
                className="bg-pink-100 hover:bg-pink-200 text-pink-700 border-2 border-pink-300 h-12 px-4"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Mutter hinzufügen
              </Button>
            </div>

            <div className="absolute transform -translate-x-1/2 -translate-y-1/2" style={{ left: 550, top: 100 }}>
              <Button
                onClick={() => handleAddPerson('father')}
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 border-2 border-blue-300 h-12 px-4"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Vater hinzufügen
              </Button>
            </div>

            <div className="absolute transform -translate-x-1/2 -translate-y-1/2" style={{ left: 200, top: 200 }}>
              <Button
                onClick={() => handleAddPerson('sibling')}
                className="bg-green-100 hover:bg-green-200 text-green-700 border-2 border-green-300 h-12 px-4"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Geschwister hinzufügen
              </Button>
            </div>

            <div className="absolute transform -translate-x-1/2 -translate-y-1/2" style={{ left: 600, top: 200 }}>
              <Button
                onClick={() => handleAddPerson('partner')}
                className="bg-purple-100 hover:bg-purple-200 text-purple-700 border-2 border-purple-300 h-12 px-4"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Partner/in hinzufügen
              </Button>
            </div>

            {/* Render all added people */}
            {people.map(person => renderPersonSymbol(person))}
          </div>
        </CardContent>
      </Card>

      <PersonModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSavePerson}
        relationship={currentRelationship}
      />
    </div>
  );
};

export default GenogramWorkspace;
