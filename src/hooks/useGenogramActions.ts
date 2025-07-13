import { Person } from '@/types/genogram';
import { useToast } from '@/hooks/use-toast';

export const useGenogramActions = () => {
  const { toast } = useToast();

  const handleAddPerson = (
    relationship: 'mother' | 'father' | 'sibling' | 'partner' | 'child',
    setCurrentRelationship: (rel: 'mother' | 'father' | 'sibling' | 'partner' | 'child') => void,
    setModalOpen: (open: boolean) => void
  ) => {
    setCurrentRelationship(relationship);
    setModalOpen(true);
  };

  const handleSavePerson = async (
    personData: Omit<Person, 'id' | 'position'>,
    currentRelationship: 'mother' | 'father' | 'sibling' | 'partner' | 'child',
    selectedPersonForAction: string | null,
    people: Person[],
    setPeople: (people: Person[]) => void,
    setSelectedPersonForAction: (id: string | null) => void,
    setModalOpen: (open: boolean) => void,
    updateLayoutFromAPI: (people: Person[]) => Promise<void>
  ) => {
    let modifiedPersonData = { ...personData };
    
    if (selectedPersonForAction) {
      const selectedPerson = people.find(p => p.id === selectedPersonForAction);
      
      if (currentRelationship === 'child') {
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
      } else if (currentRelationship === 'father' || currentRelationship === 'mother') {
        const existingParent = people.find(p => 
          (p.relationship === 'father' || p.relationship === 'mother') && 
          p.relationship !== currentRelationship
        );
        
        if (existingParent) {
          modifiedPersonData = {
            ...personData,
            relationship: currentRelationship,
            relationshipStatus: 'married' as const
          };
        }
      } else if (currentRelationship === 'sibling') {
        let parentIds: string[] = [];
        
        if (selectedPerson?.parentIds && selectedPerson.parentIds.length > 0) {
          parentIds = selectedPerson.parentIds;
        } else if (selectedPerson?.relationship === 'self') {
          const parents = people.filter(p => 
            p.relationship === 'father' || p.relationship === 'mother'
          );
          parentIds = parents.map(p => p.id);
        }
        
        modifiedPersonData = {
          ...personData,
          parentIds: parentIds.length > 0 ? parentIds : undefined
        };
      }
    }
    
    const newPerson: Person = {
      ...modifiedPersonData,
      id: Date.now().toString(),
      position: { x: 0, y: 0 }
    };
    
    const updatedPeople = [...people, newPerson];
    setPeople(updatedPeople);
    
    setSelectedPersonForAction(null);
    setModalOpen(false);
    
    await updateLayoutFromAPI(updatedPeople);
  };

  const handlePersonAction = (
    nodeId: string,
    action: 'addPartner' | 'addChild' | 'addFather' | 'addMother' | 'addSibling' | 'edit' | 'delete',
    people: Person[],
    setSelectedPersonForAction: (id: string | null) => void,
    setCurrentRelationship: (rel: 'mother' | 'father' | 'sibling' | 'partner' | 'child') => void,
    setModalOpen: (open: boolean) => void,
    setEditingPerson: (person: Person | null) => void,
    setEditModalOpen: (open: boolean) => void,
    setPersonToDelete: (id: string | null) => void,
    setDeleteConfirmOpen: (open: boolean) => void
  ) => {
    console.log('Person action:', action, 'for node:', nodeId);
    
    // Map backend node ID to local person ID
    const getLocalPersonId = (backendNodeId: string) => {
      if (backendNodeId === 'person-1') {
        return 'ego'; // Special case for ego person
      }
      // For other backend IDs like person-2, person-3, find corresponding local person
      const foundPerson = people.find(p => {
        if (backendNodeId.startsWith('person-')) {
          const nodeNumber = parseInt(backendNodeId.split('-')[1]);
          return nodeNumber > 1; // Find first non-ego person for now
        }
        return false;
      });
      return foundPerson?.id || backendNodeId;
    };

    const localPersonId = getLocalPersonId(nodeId);
    
    switch (action) {
      case 'addPartner':
        console.log('Setting selected person for action (addPartner):', localPersonId);
        setSelectedPersonForAction(localPersonId);
        setCurrentRelationship('partner');
        console.log('Opening modal for addPartner');
        setModalOpen(true);
        console.log('Modal should be open now');
        break;
      case 'addChild':
        console.log('Setting selected person for action (addChild):', localPersonId);
        setSelectedPersonForAction(localPersonId);
        setCurrentRelationship('child');
        console.log('Opening modal for addChild');
        setModalOpen(true);
        console.log('Modal should be open now');
        break;
      case 'addFather':
        console.log('Setting selected person for action (addFather):', localPersonId);
        setSelectedPersonForAction(localPersonId);
        setCurrentRelationship('father');
        console.log('Opening modal for addFather');
        setModalOpen(true);
        console.log('Modal should be open now');
        break;
      case 'addMother':
        console.log('Setting selected person for action (addMother):', localPersonId);
        setSelectedPersonForAction(localPersonId);
        setCurrentRelationship('mother');
        setModalOpen(true);
        break;
      case 'addSibling':
        console.log('Setting selected person for action (addSibling):', localPersonId);
        setSelectedPersonForAction(localPersonId);
        setCurrentRelationship('sibling');
        setModalOpen(true);
        break;
      case 'edit':
        if (nodeId === 'person-1' || nodeId === '1') {
          toast({
            title: "Info",
            description: "Ihre persönlichen Daten können Sie auf der ersten Seite bearbeiten.",
          });
          return;
        }
        
        let editLocalPersonId = nodeId;
        if (nodeId.startsWith('person-') && !nodeId.includes('person-1')) {
          const foundPerson = people.find(p => {
            const nodeNumber = parseInt(nodeId.split('-')[1]);
            return p.id && nodeNumber > 1;
          });
          editLocalPersonId = foundPerson?.id || nodeId;
        }
        
        const personToEdit = people.find(p => p.id === editLocalPersonId);
        if (personToEdit) {
          setEditingPerson(personToEdit);
          setEditModalOpen(true);
        }
        break;
      case 'delete':
        if (nodeId === 'person-1' || nodeId === '1') {
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

  const handleRelationshipAction = (
    lineId: string,
    fromId: string,
    toId: string,
    action: 'edit',
    people: Person[],
    setCurrentRelationshipEdit: (edit: any) => void,
    setRelationshipModalOpen: (open: boolean) => void
  ) => {
    console.log('Relationship action:', action, 'for line:', lineId);
    
    if (action === 'edit') {
      const fromPerson = people.find(p => p.id === fromId) || { name: 'Sie' };
      const toPerson = people.find(p => p.id === toId) || { name: 'Sie' };
      
      setCurrentRelationshipEdit({
        lineId,
        fromId,
        toId,
        currentStatus: 'married' as const,
        personNames: {
          from: fromPerson.name,
          to: toPerson.name
        }
      });
      setRelationshipModalOpen(true);
    }
  };

  return {
    handleAddPerson,
    handleSavePerson,
    handlePersonAction,
    handleRelationshipAction
  };
};