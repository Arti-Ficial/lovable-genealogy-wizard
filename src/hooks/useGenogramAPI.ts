import { useState } from 'react';
import { Person, PersonalInfo } from '@/types/genogram';
import { useToast } from '@/hooks/use-toast';

const API_URL = 'https://trkmuc.app.n8n.cloud/webhook/12345';

export const useGenogramAPI = (personalInfo: PersonalInfo) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const updateLayoutFromAPI = async (updatedPeople: Person[], setGenogramData: (data: any) => void, setPeople: (people: Person[]) => void) => {
    try {
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

      const persons = [egoPerson];
      const relationships = [];
      let nextId = 2;
      const idMapping: { [key: string]: number } = {};
      idMapping['ego'] = 1;

      updatedPeople.forEach(person => {
        const numericId = nextId++;
        idMapping[person.id] = numericId;
        
        const personData: any = {
          id: numericId,
          name: person.name,
          gender: person.gender === 'male' ? 'male' : person.gender === 'female' ? 'female' : 'unknown',
          birthDate: person.birthDate.toISOString().split('T')[0],
          deathDate: person.deathDate?.toISOString().split('T')[0] || undefined,
          occupation: person.occupation || '',
          notes: person.notes || '',
          isEgo: false,
          maritalStatus: '',
          originalId: person.id
        };
        persons.push(personData);
      });

      updatedPeople.forEach(person => {
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

      const genogramData = { persons, relationships };
      console.log('Sending layout request to n8n:', genogramData);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(genogramData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Layout response from n8n:', result);
        
        if (result.genogramData && result.genogramData.nodes) {
          const updatedPeopleWithPositions = updatedPeople.map(person => {
            const nodeData = result.genogramData.nodes.find((node: any) => {
              if (person.relationship === 'self') return node.id === 1;
              return node.originalId === person.id;
            });
            
            if (nodeData) {
              return {
                ...person,
                position: { x: nodeData.x, y: nodeData.y }
              };
            }
            return person;
          });
          
          setPeople(updatedPeopleWithPositions);
          setGenogramData(result.genogramData);
        }
      } else {
        console.error('Layout API call failed');
      }
    } catch (error) {
      console.error('Error updating layout:', error);
    }
  };

  const generateGenogramData = async (people: Person[], onGenogramGenerated: (data: any, mermaidCode?: string) => void) => {
    setIsGenerating(true);
    
    try {
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

      const persons = [egoPerson];
      const relationships = [];
      let nextId = 2;
      const idMapping: { [key: string]: number } = {};
      idMapping['ego'] = 1;

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

      const genogramData = { persons, relationships };
      console.log('Generated genogram data:', genogramData);

      const response = await fetch(API_URL, {
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
          onGenogramGenerated(result.genogramData);
          toast({
            title: "Genogramm erfolgreich erstellt!",
            description: "Ihr Genogramm wurde generiert und wird angezeigt.",
          });
        } else if (result.mermaidCode) {
          onGenogramGenerated(null, result.mermaidCode);
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

  return {
    isGenerating,
    updateLayoutFromAPI,
    generateGenogramData
  };
};