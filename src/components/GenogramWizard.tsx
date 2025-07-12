
import React, { useState } from 'react';
import { PersonalInfo, RelationshipStatus } from '@/types/genogram';
import { useToast } from '@/hooks/use-toast';
import WelcomeScreen from './WelcomeScreen';
import PersonalInfoForm from './PersonalInfoForm';
import GenogramWorkspace from './GenogramWorkspace';
import GenogramResult from './GenogramResult';
import RelationshipEditModal from './RelationshipEditModal';
import PersonModal from './PersonModal';

const GenogramWizard = () => {
  const [currentStep, setCurrentStep] = useState<'welcome' | 'personal' | 'workspace' | 'result'>('welcome');
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    name: '',
    birthDate: undefined,
    gender: '',
    maritalStatus: '',
    purpose: ''
  });
  const [mermaidCode, setMermaidCode] = useState<string>('');
  const [genogramData, setGenogramData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRelationshipModalOpen, setIsRelationshipModalOpen] = useState(false);
  const [isPersonEditModalOpen, setIsPersonEditModalOpen] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState<{
    lineId: string;
    fromId: string;
    toId: string;
  } | null>(null);
  const [editingPerson, setEditingPerson] = useState<any>(null);
  const { toast } = useToast();

  const handleStartGenogram = () => {
    setCurrentStep('personal');
  };

  const handlePersonalInfoSubmit = () => {
    console.log('Personal Info:', personalInfo);
    setCurrentStep('workspace');
  };

  const handleLoadTestFamily = async () => {
    setIsLoading(true);
    console.log('Loading test family with API call...');

    try {
      // Vordefinierte Standardfamilie - korrektes JSON-Objekt
      const testFamily = {
        "persons": [
          { "id": 1, "name": "Georg", "gender": "male" },
          { "id": 2, "name": "Helga", "gender": "female" },
          { "id": 3, "name": "Peter", "gender": "male" },
          { "id": 4, "name": "Maria", "gender": "female" },
          { "id": 5, "name": "Sabine", "gender": "female" },
          { "id": 6, "name": "Andreas", "gender": "male", "isEgo": true },
          { "id": 7, "name": "Julia", "gender": "female" }
        ],
        "relationships": [
          { "from": 1, "to": 2, "type": "partner" },
          { "from": 3, "to": 4, "type": "partner" },
          { "from": 1, "to": 3, "type": "parent-child" },
          { "from": 2, "to": 3, "type": "parent-child" },
          { "from": 1, "to": 5, "type": "parent-child" },
          { "from": 2, "to": 5, "type": "parent-child" },
          { "from": 3, "to": 6, "type": "parent-child" },
          { "from": 4, "to": 6, "type": "parent-child" },
          { "from": 3, "to": 7, "type": "parent-child" },
          { "from": 4, "to": 7, "type": "parent-child" }
        ]
      };

      console.log('Sending test family to n8n webhook:', testFamily);
      console.log('Using webhook URL: https://trkmuc.app.n8n.cloud/webhook-test/12345');

      // API-Call zum n8n Webhook mit der korrekten Production URL
      const response = await fetch('https://trkmuc.app.n8n.cloud/webhook-test/12345', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testFamily)
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const result = await response.json();
        console.log('API response received:', result);
        
        // Check if we received genogramData (new processed format) or raw input data
        if (result.genogramData) {
          console.log('Using genogramData from API response');
          setGenogramData(result.genogramData);
          setCurrentStep('result');
          toast({
            title: "Standardfamilie erfolgreich geladen!",
            description: "Das Test-Genogramm wurde vom Server generiert und wird angezeigt.",
          });
        } else if (result.persons && result.relationships) {
          // Received raw input data - pass it directly to GenogramResult for dagre processing
          console.log('Using raw input data from API response for dagre processing');
          setGenogramData(result);
          setCurrentStep('result');
          toast({
            title: "Standardfamilie erfolgreich geladen!",
            description: "Das Test-Genogramm wurde mit dagre-Layout berechnet und wird angezeigt.",
          });
        } else if (result.mermaidCode) {
          // Fallback für altes Format
          console.log('Using mermaidCode from API response (fallback)');
          setMermaidCode(result.mermaidCode);
          setCurrentStep('result');
          toast({
            title: "Standardfamilie erfolgreich geladen!",
            description: "Das Test-Genogramm wurde vom Server generiert und wird angezeigt.",
          });
        } else {
          throw new Error('Weder genogramData noch mermaidCode in der API-Antwort erhalten');
        }
      } else {
        const errorText = await response.text();
        console.error('API response error text:', errorText);
        throw new Error(`API-Fehler: ${response.status} - ${response.statusText}. Details: ${errorText}`);
      }
      
    } catch (error) {
      console.error('Detaillierter Fehler beim Laden der Standardfamilie:', error);
      
      // Spezifische Fehlerbehandlung
      let errorMessage = "Die Verbindung zum Server konnte nicht hergestellt werden. Bitte versuchen Sie es später erneut.";
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = "Netzwerkfehler: Die Verbindung zum n8n-Server konnte nicht hergestellt werden. Bitte überprüfen Sie Ihre Internetverbindung.";
      } else if (error instanceof Error) {
        errorMessage = `Fehler: ${error.message}`;
      }
      
      toast({
        title: "Verbindungsfehler",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePersonalInfo = (field: keyof PersonalInfo, value: any) => {
    setPersonalInfo(prev => ({ ...prev, [field]: value }));
  };

  if (currentStep === 'welcome') {
    return (
      <WelcomeScreen 
        onStart={handleStartGenogram} 
        onLoadTestFamily={handleLoadTestFamily}
      />
    );
  }

  if (currentStep === 'personal') {
    return (
      <PersonalInfoForm
        personalInfo={personalInfo}
        onUpdatePersonalInfo={updatePersonalInfo}
        onSubmit={handlePersonalInfoSubmit}
      />
    );
  }

  const handlePersonAction = (nodeId: string, action: 'addPartner' | 'addChild' | 'edit' | 'delete') => {
    console.log('Person action in wizard:', action, 'for node:', nodeId);
    
    if (action === 'edit' && genogramData) {
      // Find the person to edit from genogramData
      let personToEdit = null;
      
      if (genogramData.nodes) {
        // Dagre format - find in nodes
        personToEdit = genogramData.nodes.find((node: any) => node.id === nodeId);
      } else if (genogramData.persons) {
        // Backend format - find in persons
        personToEdit = genogramData.persons.find((person: any) => `person-${person.id}` === nodeId);
      }
      
      if (personToEdit) {
        setEditingPerson(personToEdit);
        setIsPersonEditModalOpen(true);
      }
    } else {
      // All other actions are not available in result view
      toast({
        title: "Funktion im Ergebnis-Modus nicht verfügbar",
        description: "Gehen Sie zurück zum Arbeitsbereich, um Personen hinzuzufügen oder zu bearbeiten.",
      });
    }
  };

  const handlePersonEditSave = (personData: any) => {
    if (editingPerson && genogramData) {
      const updatedGenogramData = { ...genogramData };
      
      if (updatedGenogramData.nodes) {
        // Dagre format - update the nodes array
        updatedGenogramData.nodes = updatedGenogramData.nodes.map((node: any) => {
          if (node.id === editingPerson.id) {
            return { 
              ...node, 
              name: personData.name,
              gender: personData.gender,
              isDeceased: personData.isDeceased
            };
          }
          return node;
        });
      } else if (updatedGenogramData.persons) {
        // Backend format - update the persons array
        updatedGenogramData.persons = updatedGenogramData.persons.map((person: any) => {
          if (`person-${person.id}` === editingPerson.id) {
            return { 
              ...person, 
              name: personData.name,
              gender: personData.gender === 'male' ? 'male' : personData.gender === 'female' ? 'female' : 'unknown',
              isDeceased: personData.isDeceased
            };
          }
          return person;
        });
      }
      
      setGenogramData(updatedGenogramData);
      setIsPersonEditModalOpen(false);
      setEditingPerson(null);
      
      toast({
        title: "Person aktualisiert",
        description: `${personData.name} wurde erfolgreich bearbeitet.`,
      });
    }
  };

  const handleRelationshipAction = (lineId: string, fromId: string, toId: string, action: 'edit') => {
    console.log('Relationship action in wizard:', action, 'for line:', lineId);
    setSelectedRelationship({ lineId, fromId, toId });
    setIsRelationshipModalOpen(true);
  };

  const handleRelationshipSave = (status: RelationshipStatus) => {
    if (selectedRelationship && genogramData) {
      // Update the genogram data with the new relationship status
      const updatedGenogramData = { ...genogramData };
      
      // Handle both backend format and dagre format
      if (updatedGenogramData.lines) {
        // Dagre format - update the lines array
        updatedGenogramData.lines = updatedGenogramData.lines.map((line: any) => {
          const isTargetLine = line.id === selectedRelationship.lineId || 
              (line.fromId === selectedRelationship.fromId && line.toId === selectedRelationship.toId) ||
              (line.fromId === selectedRelationship.toId && line.toId === selectedRelationship.fromId);
          
          if (isTargetLine) {
            return { ...line, relationshipStatus: status };
          }
          return line;
        });
      } else if (updatedGenogramData.edges) {
        // Backend format - update the edges array by adding relationshipStatus to partnership edges
        const dummyNodeId = `partner-${selectedRelationship.fromId.replace('person-', '')}-${selectedRelationship.toId.replace('person-', '')}`;
        const reverseDummyNodeId = `partner-${selectedRelationship.toId.replace('person-', '')}-${selectedRelationship.fromId.replace('person-', '')}`;
        
        updatedGenogramData.edges = updatedGenogramData.edges.map((edge: any) => {
          // Update edges that connect to the partnership dummy node
          if ((edge.from === selectedRelationship.fromId && (edge.to === dummyNodeId || edge.to === reverseDummyNodeId)) ||
              (edge.from === selectedRelationship.toId && (edge.to === dummyNodeId || edge.to === reverseDummyNodeId))) {
            return { ...edge, relationshipStatus: status };
          }
          return edge;
        });
      } else if (updatedGenogramData.relationships) {
        // Original input format - update the relationships array
        updatedGenogramData.relationships = updatedGenogramData.relationships.map((rel: any) => {
          const fromId = `person-${rel.from}`;
          const toId = `person-${rel.to}`;
          if ((fromId === selectedRelationship.fromId && toId === selectedRelationship.toId) ||
              (fromId === selectedRelationship.toId && toId === selectedRelationship.fromId)) {
            return { ...rel, relationshipStatus: status };
          }
          return rel;
        });
      }
      
      setGenogramData(updatedGenogramData);
      
      toast({
        title: "Beziehung aktualisiert",
        description: `Der Beziehungsstatus wurde auf "${getStatusLabel(status)}" geändert.`,
      });
    }
    
    setIsRelationshipModalOpen(false);
    setSelectedRelationship(null);
  };

  // Helper function to get status label
  const getStatusLabel = (status: RelationshipStatus) => {
    switch (status) {
      case 'married': return 'Partnerschaft / Ehe';
      case 'divorced': return 'Geschieden / Getrennt';
      case 'conflicted': return 'Konfliktreiche Beziehung';
      case 'separated': return 'Abgebrochene Beziehung';
      default: return 'Partnerschaft / Ehe';
    }
  };

  // Helper function to get person names from genogram data
  const getPersonNames = (fromId: string, toId: string) => {
    if (!genogramData) return { from: fromId, to: toId };
    
    // Handle both backend format and dagre format
    const nodes = genogramData.nodes || (genogramData.persons ? genogramData.persons.map((p: any) => ({ id: `person-${p.id}`, name: p.name })) : []);
    
    const fromPerson = nodes.find((node: any) => node.id === fromId);
    const toPerson = nodes.find((node: any) => node.id === toId);
    
    return {
      from: fromPerson?.name || fromPerson?.label || fromId,
      to: toPerson?.name || toPerson?.label || toId
    };
  };

  // Helper function to get current relationship status
  const getCurrentRelationshipStatus = (fromId: string, toId: string): RelationshipStatus => {
    if (!genogramData) return 'married';
    
    // Handle both backend format and dagre format
    if (genogramData.lines) {
      // Dagre format - find the line
      const line = genogramData.lines.find((line: any) => 
        (line.fromId === fromId && line.toId === toId) ||
        (line.fromId === toId && line.toId === fromId)
      );
      return line?.relationshipStatus || 'married';
    } else if (genogramData.relationships) {
      // Original input format - find the relationship
      const rel = genogramData.relationships.find((rel: any) => {
        const relFromId = `person-${rel.from}`;
        const relToId = `person-${rel.to}`;
        return (relFromId === fromId && relToId === toId) ||
               (relFromId === toId && relToId === fromId);
      });
      return rel?.relationshipStatus || 'married';
    }
    
    return 'married';
  };

  if (currentStep === 'result') {
    return (
      <>
        <GenogramResult 
          genogramData={genogramData}
          mermaidCode={mermaidCode}
          onPersonAction={handlePersonAction}
          onRelationshipAction={handleRelationshipAction}
          onReset={() => {
            setCurrentStep('welcome');
            setMermaidCode('');
            setGenogramData(null);
          }}
        />
        
        {editingPerson && (
          <PersonModal
            isOpen={isPersonEditModalOpen}
            onClose={() => {
              setIsPersonEditModalOpen(false);
              setEditingPerson(null);
            }}
            onSave={handlePersonEditSave}
            relationship={editingPerson.relationship === 'self' ? 'child' : editingPerson.relationship || 'child'}
            existingPeople={[]}
            existingPerson={editingPerson}
          />
        )}

        {selectedRelationship && (
          <RelationshipEditModal
            isOpen={isRelationshipModalOpen}
            onClose={() => {
              setIsRelationshipModalOpen(false);
              setSelectedRelationship(null);
            }}
            onSave={handleRelationshipSave}
            currentStatus={getCurrentRelationshipStatus(selectedRelationship.fromId, selectedRelationship.toId)}
            personNames={getPersonNames(selectedRelationship.fromId, selectedRelationship.toId)}
          />
        )}
      </>
    );
  }

  return <GenogramWorkspace personalInfo={personalInfo} />;
};

export default GenogramWizard;
