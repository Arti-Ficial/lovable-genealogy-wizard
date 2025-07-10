
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Person, PersonalInfo } from '@/types/genogram';
import PersonModal from './PersonModal';
import FamilyIcon from './FamilyIcon';
import GenogramResult from './GenogramResult';
import GenogramCanvas from './GenogramCanvas';
import GenerateButton from './GenerateButton';
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
    const baseX = 400;
    const baseY = 200;
    
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
      idMapping['ego'] = 1;

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
              to: 1,
              type: 'parent-child'
            });
            break;
          case 'child':
            relationships.push({
              from: 1,
              to: personId,
              type: 'parent-child'
            });
            break;
          case 'partner':
            relationships.push({
              from: 1,
              to: personId,
              type: 'partner'
            });
            break;
          case 'sibling':
            relationships.push({
              from: 1,
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
          <GenogramCanvas
            people={people}
            personalInfo={personalInfo}
            onAddPerson={handleAddPerson}
          />

          <GenerateButton
            isGenerating={isGenerating}
            onGenerate={generateGenogramData}
          />
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
