import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Square, Circle, Loader2 } from 'lucide-react';
import { Person, PersonalInfo } from '@/types/genogram';
import PersonModal from './PersonModal';
import FamilyIcon from './FamilyIcon';
import GenogramResult from './GenogramResult';
import { useToast } from '@/hooks/use-toast';

type GenogramWorkspaceProps = {
  personalInfo: PersonalInfo;
};

const GenogramWorkspace = ({ personalInfo }: GenogramWorkspaceProps) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentRelationship, setCurrentRelationship] = useState<'mother' | 'father' | 'sibling' | 'partner' | 'child'>('mother');
  const [isGenerating, setIsGenerating] = useState(false);
  const [mermaidCode, setMermaidCode] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAddPerson = (relationship: 'mother' | 'father' | 'sibling' | 'partner' | 'child') => {
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
      case 'child':
        return { x: baseX, y: baseY + 150 };
      default:
        return { x: baseX, y: baseY };
    }
  };

  const generateGenogramData = async () => {
    setIsGenerating(true);
    
    try {
      // Create ego person (self)
      const egoPerson = {
        id: 1,
        name: personalInfo.name,
        gender: personalInfo.gender === 'male' ? 'male' : personalInfo.gender === 'female' ? 'female' : 'unknown',
        birthDate: personalInfo.birthDate?.toISOString().split('T')[0] || '',
        deathDate: undefined,
        occupation: '',
        isEgo: true,
        maritalStatus: personalInfo.maritalStatus,
        notes: personalInfo.purpose || ''
      };

      // Create other persons with incremental IDs
      const persons = [egoPerson];
      const relationships = [];
      let nextId = 2;

      // Map string IDs to numeric IDs for API
      const idMapping: { [key: string]: number } = {};
      idMapping['ego'] = 1; // ego person always has ID 1

      // Add all other people
      people.forEach(person => {
        const numericId = nextId++;
        idMapping[person.id] = numericId;
        
        persons.push({
          id: numericId,
          name: person.name,
          gender: person.gender === 'male' ? 'male' : person.gender === 'female' ? 'female' : 'unknown',
          birthDate: person.birthDate.toISOString().split('T')[0],
          deathDate: person.deathDate?.toISOString().split('T')[0] || undefined,
          occupation: person.occupation || '',
          notes: person.notes || '',
          isEgo: false,
          maritalStatus: ''
        });
      });

      // Create relationships
      people.forEach(person => {
        const personId = idMapping[person.id];
        
        switch (person.relationship) {
          case 'mother':
          case 'father':
            relationships.push({
              from: personId,
              to: 1, // ego
              type: 'parent-child'
            });
            break;
          case 'child':
            relationships.push({
              from: 1, // ego
              to: personId,
              type: 'parent-child'
            });
            break;
          case 'partner':
            relationships.push({
              from: 1, // ego
              to: personId,
              type: 'partner'
            });
            break;
          case 'sibling':
            relationships.push({
              from: 1, // ego
              to: personId,
              type: 'sibling'
            });
            break;
        }

        // Add parent relationships for children and siblings if parentIds exist
        if (person.parentIds && person.parentIds.length > 0) {
          person.parentIds.forEach(parentId => {
            const parentNumericId = idMapping[parentId];
            if (parentNumericId) {
              relationships.push({
                from: parentNumericId,
                to: personId,
                type: 'parent-child'
              });
            }
          });
        }
      });

      const genogramData = {
        persons,
        relationships
      };

      console.log('Generated genogram data:', genogramData);

      // Send to API
      const response = await fetch('https://trkmuc.app.n8n.cloud/webhook-test/12345', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(genogramData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('API response:', result);
        
        if (result.mermaidCode) {
          setMermaidCode(result.mermaidCode);
          toast({
            title: "Genogramm erfolgreich erstellt!",
            description: "Ihr Genogramm wurde generiert und wird angezeigt.",
          });
        } else {
          throw new Error('No mermaid code in response');
        }
      } else {
        throw new Error('API call failed');
      }

    } catch (error) {
      console.error('Error generating genogram:', error);
      toast({
        title: "Fehler beim Erstellen",
        description: "Das Genogramm konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setMermaidCode(null);
    setPeople([]);
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

  // If mermaid code is available, show the result view
  if (mermaidCode) {
    return <GenogramResult mermaidCode={mermaidCode} onReset={handleReset} />;
  }

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

            <div className="absolute transform -translate-x-1/2 -translate-y-1/2" style={{ left: 400, top: 350 }}>
              <Button
                onClick={() => handleAddPerson('child')}
                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border-2 border-yellow-300 h-12 px-4"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Kind hinzufügen
              </Button>
            </div>

            {/* Render all added people */}
            {people.map(person => renderPersonSymbol(person))}
          </div>

          {/* Generate Genogram Button */}
          <div className="mt-8 flex justify-center">
            <Button
              onClick={generateGenogramData}
              disabled={isGenerating}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white h-14 px-8 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Genogramm wird erstellt...
                </>
              ) : (
                <>
                  Genogramm erstellen & visualisieren
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <PersonModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSavePerson}
        relationship={currentRelationship}
        existingPeople={people}
      />
    </div>
  );
};

export default GenogramWorkspace;
