import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FamilyIcon from './FamilyIcon';
import SimpleGenogramRenderer from './SimpleGenogramRenderer';
import PersonModal from './PersonModal';
import RelationshipEditModal from './RelationshipEditModal';
import { calculateGenogramLayout, calculateGenogramLayoutFromBackend, type GenogramInput, type GenogramBackendData, type GenogramLayoutResult } from '@/lib/dagre-layout';
import { Person, RelationshipStatus } from '@/types/genogram';

// Function to process genogram data using dagre layout
function processGenogramData(inputData: GenogramInput): GenogramLayoutResult {
  console.log('Processing genogram data with dagre:', inputData);
  const result = calculateGenogramLayout(inputData);
  console.log('Dagre layout result:', result);
  return result;
}

// Function to process backend genogram data using dagre layout
function processBackendGenogramData(inputData: GenogramBackendData): GenogramLayoutResult {
  console.log('Processing backend genogram data with dagre:', inputData);
  const result = calculateGenogramLayoutFromBackend(inputData);
  console.log('Backend dagre layout result:', result);
  return result;
}

type GenogramResultProps = {
  genogramData?: GenogramLayoutResult | GenogramInput | GenogramBackendData | null;
  mermaidCode?: string;
  onReset: () => void;
};

const GenogramResult = ({ genogramData, mermaidCode, onReset }: GenogramResultProps) => {
  const [currentData, setCurrentData] = useState<GenogramLayoutResult | null>(null);
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isRelationshipModalOpen, setIsRelationshipModalOpen] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState<{
    id: string;
    fromId: string;
    toId: string;
    status: RelationshipStatus;
    personNames: { from: string; to: string };
  } | null>(null);
  const [modalContext, setModalContext] = useState<{
    type: 'mother' | 'father' | 'sibling' | 'partner' | 'child';
    targetPersonId: string;
    existingPerson?: Person;
  } | null>(null);
  const { toast } = useToast();
  console.log('Rendering genogram with data:', genogramData);
  
  // Determine which data to use and process it
  let dataToRender: GenogramLayoutResult;
  
  // Use current data if available, otherwise process initial data
  if (currentData) {
    dataToRender = currentData;
  } else if (genogramData) {
  
    // Check if it's already processed layout data
    if ('nodes' in genogramData && 'lines' in genogramData && 
        genogramData.nodes.every(n => 'x' in n && 'y' in n)) {
      // Already processed layout data
      dataToRender = genogramData as GenogramLayoutResult;
    }
    // Check if it's backend data format with nodes and edges
    else if ('nodes' in genogramData && 'edges' in genogramData) {
      // Backend data format - process with dagre
      dataToRender = processBackendGenogramData(genogramData as GenogramBackendData);
    }
    // Check if it's old format with persons and relationships
    else if ('persons' in genogramData && 'relationships' in genogramData) {
      // Old input data format - process with dagre
      dataToRender = processGenogramData(genogramData as GenogramInput);
    }
    else {
      // Unknown format - create empty layout result
      console.warn('Unknown genogram data format:', genogramData);
      dataToRender = { nodes: [], lines: [] };
    }
    
    // Set current data for future modifications
    if (!currentData) {
      setCurrentData(dataToRender);
    }
  } else {
    // No data available
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-6xl mx-auto shadow-xl">
          <CardContent className="text-center space-y-4 pt-6">
            <h2 className="text-2xl font-bold text-gray-900">Keine Daten verfügbar</h2>
            <p className="text-gray-600">Es wurden keine Genogramm-Daten empfangen.</p>
            <Button onClick={onReset} variant="outline">
              Zurück zum Start
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Helper functions for managing persons and relationships
  const generateNewId = () => `person-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const findPersonById = (id: string) => {
    return dataToRender.nodes.find(node => node.id === id);
  };

  const createNewPerson = (personData: Omit<Person, 'id' | 'position'>, targetPersonId: string, relationship: string): GenogramLayoutResult => {
    const newPerson = {
      id: generateNewId(),
      name: personData.name,
      shape: personData.gender === 'female' ? 'circle' as const : 'rect' as const,
      x: 0, // Will be repositioned by layout algorithm
      y: 0,
      isEgo: false,
      isDeceased: personData.isDeceased || false,
      ...personData
    };

    const newNodes = [...dataToRender.nodes, newPerson];
    let newLines = [...dataToRender.lines];

    // Add relationship line based on type
    if (relationship === 'partner') {
      newLines.push({
        fromX: 0, fromY: 0, toX: 0, toY: 0,
        type: 'partner',
        relationshipStatus: 'married',
        fromId: targetPersonId,
        toId: newPerson.id,
        id: `${targetPersonId}-${newPerson.id}`
      });
    } else if (relationship === 'child') {
      newLines.push({
        fromX: 0, fromY: 0, toX: 0, toY: 0,
        type: 'parent-child',
        fromId: targetPersonId,
        toId: newPerson.id,
        id: `${targetPersonId}-${newPerson.id}`
      });
    }

    // Re-calculate layout with new data
    const backendFormat = {
      nodes: newNodes.map(node => ({
        id: node.id,
        label: node.name,
        shape: node.shape === 'circle' ? 'circle' : 'square',
        width: 120,
        height: 60,
        isEgo: node.isEgo
      })),
      edges: newLines.map(line => ({
        from: line.fromId || '',
        to: line.toId || '',
        type: line.type || 'partner'
      }))
    };

    return processBackendGenogramData(backendFormat);
  };

  const updatePerson = (personId: string, updatedData: Partial<Person>): GenogramLayoutResult => {
    const updatedNodes = dataToRender.nodes.map(node => 
      node.id === personId 
        ? { 
            ...node, 
            name: updatedData.name || node.name,
            shape: updatedData.gender === 'female' ? 'circle' as const : (node.shape === 'circle' ? 'circle' : 'rect' as const),
            isDeceased: updatedData.isDeceased !== undefined ? updatedData.isDeceased : (node as any).isDeceased
          }
        : node
    );

    return { ...dataToRender, nodes: updatedNodes };
  };

  const deletePerson = (personId: string): GenogramLayoutResult => {
    const updatedNodes = dataToRender.nodes.filter(node => node.id !== personId);
    const updatedLines = dataToRender.lines.filter(line => 
      line.fromId !== personId && line.toId !== personId
    );

    return { nodes: updatedNodes, lines: updatedLines };
  };

  const updateRelationshipStatus = (lineId: string, newStatus: RelationshipStatus): GenogramLayoutResult => {
    const updatedLines = dataToRender.lines.map(line =>
      (line.id === lineId) ? { ...line, relationshipStatus: newStatus } : line
    );

    return { ...dataToRender, lines: updatedLines };
  };

  // Event handlers
  const handlePersonAction = (nodeId: string, action: 'addPartner' | 'addChild' | 'edit' | 'delete') => {
    if (action === 'delete') {
      const updatedData = deletePerson(nodeId);
      setCurrentData(updatedData);
      toast({
        title: "Person gelöscht",
        description: "Die Person wurde erfolgreich aus dem Genogramm entfernt.",
      });
    } else if (action === 'edit') {
      const person = findPersonById(nodeId);
      if (person) {
        const personData: Person = {
          id: person.id,
          name: person.name,
          gender: person.shape === 'circle' ? 'female' : 'male',
          birthDate: new Date(),
          deathDate: undefined,
          occupation: '',
          notes: '',
          relationship: 'self',
          position: { x: person.x, y: person.y },
          isDeceased: (person as any).isDeceased || false
        };
        setModalContext({
          type: 'partner', // This will be ignored for edit mode
          targetPersonId: nodeId,
          existingPerson: personData
        });
        setIsPersonModalOpen(true);
      }
    } else {
      const relationshipType = action === 'addPartner' ? 'partner' : 'child';
      setModalContext({
        type: relationshipType,
        targetPersonId: nodeId
      });
      setIsPersonModalOpen(true);
    }
  };

  const handleRelationshipAction = (lineId: string, fromId: string, toId: string, action: 'edit') => {
    if (action === 'edit') {
      const line = dataToRender.lines.find(l => l.id === lineId);
      const fromPerson = findPersonById(fromId);
      const toPerson = findPersonById(toId);
      
      if (line && fromPerson && toPerson) {
        setSelectedRelationship({
          id: lineId,
          fromId,
          toId,
          status: (line.relationshipStatus as RelationshipStatus) || 'married',
          personNames: {
            from: fromPerson.name,
            to: toPerson.name
          }
        });
        setIsRelationshipModalOpen(true);
      }
    }
  };

  const handlePersonSave = (personData: Omit<Person, 'id' | 'position'>) => {
    if (modalContext?.existingPerson) {
      // Edit existing person
      const updatedData = updatePerson(modalContext.targetPersonId, personData);
      setCurrentData(updatedData);
      toast({
        title: "Person aktualisiert",
        description: "Die Änderungen wurden erfolgreich gespeichert.",
      });
    } else if (modalContext) {
      // Add new person
      const updatedData = createNewPerson(personData, modalContext.targetPersonId, modalContext.type);
      setCurrentData(updatedData);
      toast({
        title: "Person hinzugefügt",
        description: `Die neue Person wurde als ${modalContext.type === 'partner' ? 'Partner/in' : 'Kind'} hinzugefügt.`,
      });
    }
    
    setIsPersonModalOpen(false);
    setModalContext(null);
  };

  const handleRelationshipSave = (status: RelationshipStatus) => {
    if (selectedRelationship) {
      const updatedData = updateRelationshipStatus(selectedRelationship.id, status);
      setCurrentData(updatedData);
      toast({
        title: "Beziehung aktualisiert",
        description: "Der Beziehungsstatus wurde erfolgreich geändert.",
      });
    }
    
    setIsRelationshipModalOpen(false);
    setSelectedRelationship(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl mx-auto shadow-xl animate-fade-in">
        <CardHeader className="text-center pb-6">
          <div className="mb-4 flex justify-center">
            <FamilyIcon className="w-16 h-16 text-blue-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Ihr persönliches Genogramm
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="bg-white rounded-lg border p-6 mb-6 min-h-[500px] flex items-center justify-center overflow-auto">
            <SimpleGenogramRenderer 
              data={dataToRender}
              onPersonAction={handlePersonAction}
              onRelationshipAction={handleRelationshipAction}
              readonly={false}
            />
          </div>

          <div className="flex justify-center">
            <Button
              onClick={onReset}
              size="lg"
              variant="outline"
              className="h-14 px-8 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <RotateCcw className="w-5 h-5 mr-3" />
              Neues Genogramm erstellen
            </Button>
          </div>

          {/* Modals for editing */}
          <PersonModal
            isOpen={isPersonModalOpen}
            onClose={() => {
              setIsPersonModalOpen(false);
              setModalContext(null);
            }}
            onSave={handlePersonSave}
            relationship={modalContext?.type || 'partner'}
            existingPeople={dataToRender.nodes.map(node => ({
              id: node.id,
              name: node.name,
              gender: node.shape === 'circle' ? 'female' as const : 'male' as const,
              birthDate: new Date(),
              deathDate: undefined,
              occupation: '',
              notes: '',
              relationship: 'self' as const,
              position: { x: node.x, y: node.y },
              isDeceased: (node as any).isDeceased || false
            }))}
            existingPerson={modalContext?.existingPerson}
          />

          <RelationshipEditModal
            isOpen={isRelationshipModalOpen}
            onClose={() => {
              setIsRelationshipModalOpen(false);
              setSelectedRelationship(null);
            }}
            onSave={handleRelationshipSave}
            currentStatus={selectedRelationship?.status || 'married'}
            personNames={selectedRelationship?.personNames || { from: '', to: '' }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default GenogramResult;