
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Person, PersonalInfo, RelationshipStatus } from '@/types/genogram';
import PersonModal from './PersonModal';
import RelationshipEditModal from './RelationshipEditModal';
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [relationshipModalOpen, setRelationshipModalOpen] = useState(false);
  const [currentRelationship, setCurrentRelationship] = useState<'mother' | 'father' | 'sibling' | 'partner' | 'child'>('mother');
  const [currentRelationshipEdit, setCurrentRelationshipEdit] = useState<{
    lineId: string;
    fromId: string;
    toId: string;
    currentStatus: RelationshipStatus;
    personNames: { from: string; to: string };
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mermaidCode, setMermaidCode] = useState<string | null>(null);
  const [genogramData, setGenogramData] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<string | null>(null);
  const [selectedPersonForAction, setSelectedPersonForAction] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAddPerson = (relationship: 'mother' | 'father' | 'sibling' | 'partner' | 'child') => {
    setCurrentRelationship(relationship);
    setModalOpen(true);
  };

  const handleSavePerson = (personData: Omit<Person, 'id' | 'position'>) => {
    // Wenn ein Partner oder Kind hinzugefügt wird, berücksichtige den Kontext
    let modifiedPersonData = { ...personData };
    
    if (selectedPersonForAction && currentRelationship === 'child') {
      // Für Kinder: Setze die ausgewählte Person und deren Partner als Eltern
      const selectedPerson = people.find(p => p.id === selectedPersonForAction);
      const partner = people.find(p => 
        p.relationship === 'partner' && selectedPerson?.relationship === 'self' ||
        (selectedPerson?.relationship === 'partner' && p.relationship === 'self')
      );
      
      const parentIds = [selectedPersonForAction];
      if (partner) {
        parentIds.push(partner.id);
      }
      
      modifiedPersonData = {
        ...personData,
        parentIds
      };
    }
    
    const newPerson: Person = {
      ...modifiedPersonData,
      id: Date.now().toString(),
      position: getPositionForRelationship(modifiedPersonData.relationship)
    };
    
    setPeople(prev => [...prev, newPerson]);
    console.log('New person added:', newPerson);
    
    // Reset der Auswahl
    setSelectedPersonForAction(null);
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
              type: 'partner',
              relationshipStatus: person.relationshipStatus || 'married'
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
        
        if (result.genogramData) {
          // Neue API-Antwort mit genogramData
          setGenogramData(result.genogramData);
          toast({
            title: "Genogramm erfolgreich erstellt!",
            description: "Ihr Genogramm wurde generiert und wird angezeigt.",
          });
        } else if (result.mermaidCode) {
          // Fallback für alte API-Antwort
          setMermaidCode(result.mermaidCode);
          toast({
            title: "Genogramm erfolgreich erstellt!",
            description: "Ihr Genogramm wurde generiert und wird angezeigt.",
          });
        } else {
          throw new Error('No genogram data in response');
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
    setGenogramData(null);
    setPeople([]);
  };

  const handleRelationshipAction = (lineId: string, fromId: string, toId: string, action: 'edit') => {
    console.log('Relationship action:', action, 'for line:', lineId);
    
    if (action === 'edit') {
      // Find the people involved in this relationship
      const fromPerson = people.find(p => p.id === fromId) || { name: 'Sie' }; // Default to 'Sie' for ego
      const toPerson = people.find(p => p.id === toId) || { name: 'Sie' };
      
      // For now, assume married status, but this should be retrieved from actual data
      const currentStatus: RelationshipStatus = 'married'; // TODO: Get from actual relationship data
      
      setCurrentRelationshipEdit({
        lineId,
        fromId,
        toId,
        currentStatus,
        personNames: {
          from: fromPerson.name,
          to: toPerson.name
        }
      });
      setRelationshipModalOpen(true);
    }
  };

  const handleRelationshipStatusSave = (newStatus: RelationshipStatus) => {
    if (!currentRelationshipEdit) return;
    
    // TODO: Update the relationship status in the data
    // This would need to be implemented to actually update the relationship data
    console.log('Updating relationship status to:', newStatus);
    
    toast({
      title: "Beziehung aktualisiert",
      description: `Der Beziehungsstatus wurde erfolgreich geändert.`,
    });
    
    setRelationshipModalOpen(false);
    setCurrentRelationshipEdit(null);
  };

  const handlePersonAction = (nodeId: string, action: 'addPartner' | 'addChild' | 'edit' | 'delete') => {
    console.log('Person action:', action, 'for node:', nodeId);
    switch (action) {
      case 'addPartner':
        setSelectedPersonForAction(nodeId);
        setCurrentRelationship('partner');
        setModalOpen(true);
        break;
      case 'addChild':
        setSelectedPersonForAction(nodeId);
        setCurrentRelationship('child');
        setModalOpen(true);
        break;
      case 'edit':
        // Handle editing of ego person
        if (nodeId === 'ego') {
          toast({
            title: "Info",
            description: "Ihre persönlichen Daten können Sie auf der ersten Seite bearbeiten.",
          });
          return;
        }
        
        const personToEdit = people.find(p => p.id === nodeId);
        if (personToEdit) {
          setEditingPerson(personToEdit);
          setEditModalOpen(true);
        }
        break;
      case 'delete':
        // Prevent deleting ego person
        if (nodeId === 'ego') {
          toast({
            title: "Nicht möglich",
            description: "Sie können sich selbst nicht löschen.",
            variant: "destructive"
          });
          return;
        }
        
        setPersonToDelete(nodeId);
        setDeleteConfirmOpen(true);
        break;
    }
  };

  const handleDeleteConfirm = () => {
    if (personToDelete) {
      // Entferne die Person und alle Beziehungen zu dieser Person
      setPeople(prev => prev.filter(p => p.id !== personToDelete));
      
      // Entferne auch Referenzen in parentIds anderer Personen
      setPeople(prev => prev.map(person => ({
        ...person,
        parentIds: person.parentIds?.filter(parentId => parentId !== personToDelete)
      })));

      const deletedPerson = people.find(p => p.id === personToDelete);
      toast({
        title: "Person gelöscht",
        description: `${deletedPerson?.name || 'Die Person'} wurde erfolgreich entfernt.`,
      });
    }
    
    setDeleteConfirmOpen(false);
    setPersonToDelete(null);
  };

  const handleEditPerson = (personData: Omit<Person, 'id' | 'position'>) => {
    if (editingPerson) {
      const updatedPerson: Person = {
        ...personData,
        id: editingPerson.id,
        position: editingPerson.position
      };
      
      setPeople(prev => prev.map(p => p.id === editingPerson.id ? updatedPerson : p));
      setEditModalOpen(false);
      setEditingPerson(null);
      
      toast({
        title: "Person aktualisiert",
        description: `${updatedPerson.name} wurde erfolgreich bearbeitet.`,
      });
    }
  };

  // If genogram data or mermaid code is available, show the result view
  if (genogramData || mermaidCode) {
    return (
      <GenogramResult 
        genogramData={genogramData}
        mermaidCode={mermaidCode} 
        onReset={handleReset}
        onPersonAction={handlePersonAction}
        onRelationshipAction={handleRelationshipAction}
      />
    );
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
            onPersonAction={handlePersonAction}
          />

          <GenerateButton
            isGenerating={isGenerating}
            onGenerate={generateGenogramData}
          />
        </CardContent>
      </Card>

      <PersonModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedPersonForAction(null);
        }}
        onSave={handleSavePerson}
        relationship={currentRelationship}
        existingPeople={people}
      />

      <PersonModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingPerson(null);
        }}
        onSave={handleEditPerson}
        relationship={editingPerson?.relationship === 'self' ? 'child' : editingPerson?.relationship || 'child'}
        existingPeople={people}
        existingPerson={editingPerson || undefined}
      />

      <RelationshipEditModal
        isOpen={relationshipModalOpen}
        onClose={() => {
          setRelationshipModalOpen(false);
          setCurrentRelationshipEdit(null);
        }}
        onSave={handleRelationshipStatusSave}
        currentStatus={currentRelationshipEdit?.currentStatus || 'married'}
        personNames={currentRelationshipEdit?.personNames || { from: '', to: '' }}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Person löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diese Person wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
              Alle Beziehungen zu dieser Person werden ebenfalls entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmOpen(false)}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GenogramWorkspace;
