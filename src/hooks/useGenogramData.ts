import { useState } from 'react';
import { Person, PersonalInfo, RelationshipStatus } from '@/types/genogram';
import { useToast } from '@/hooks/use-toast';

export const useGenogramData = (personalInfo: PersonalInfo) => {
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<string | null>(null);
  const [selectedPersonForAction, setSelectedPersonForAction] = useState<string | null>(null);
  const [genogramData, setGenogramData] = useState<any>(null);
  const { toast } = useToast();

  const createGenogramData = (currentPeople: Person[]) => {
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

    currentPeople.forEach(person => {
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

    currentPeople.forEach(person => {
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

    return { persons, relationships };
  };

  const updateRelationshipStatus = async (newStatus: RelationshipStatus, updateLayoutFromAPI: (people: Person[]) => Promise<void>) => {
    if (!currentRelationshipEdit) return;
    
    const { fromId, toId } = currentRelationshipEdit;
    
    const updatedPeople = people.map(person => {
      if ((fromId === 'ego' && person.id === toId && person.relationship === 'partner') ||
          (toId === 'ego' && person.id === fromId && person.relationship === 'partner')) {
        return { ...person, relationshipStatus: newStatus };
      }
      
      if ((person.id === fromId || person.id === toId) && 
          (person.relationship === 'mother' || person.relationship === 'father')) {
        return { ...person, relationshipStatus: newStatus };
      }
      
      return person;
    });
    
    setPeople(updatedPeople);
    
    toast({
      title: "Beziehung aktualisiert",
      description: `Der Beziehungsstatus wurde erfolgreich geändert.`,
    });
    
    setRelationshipModalOpen(false);
    setCurrentRelationshipEdit(null);
    
    await updateLayoutFromAPI(updatedPeople);
  };

  const deletePerson = async (updateLayoutFromAPI: (people: Person[]) => Promise<void>) => {
    if (personToDelete) {
      let updatedPeople = people.filter(p => p.id !== personToDelete);
      
      updatedPeople = updatedPeople.map(person => ({
        ...person,
        parentIds: person.parentIds?.filter(parentId => parentId !== personToDelete)
      }));

      const deletedPerson = people.find(p => p.id === personToDelete);
      setPeople(updatedPeople);
      
      toast({
        title: "Person gelöscht",
        description: `${deletedPerson?.name || 'Die Person'} wurde erfolgreich entfernt.`,
      });
      
      await updateLayoutFromAPI(updatedPeople);
    }
    
    setDeleteConfirmOpen(false);
    setPersonToDelete(null);
  };

  const editPerson = async (personData: Omit<Person, 'id' | 'position'>, updateLayoutFromAPI: (people: Person[]) => Promise<void>) => {
    if (editingPerson) {
      const updatedPerson: Person = {
        ...personData,
        id: editingPerson.id,
        position: editingPerson.position
      };
      
      const updatedPeople = people.map(p => p.id === editingPerson.id ? updatedPerson : p);
      setPeople(updatedPeople);
      setEditModalOpen(false);
      setEditingPerson(null);
      
      toast({
        title: "Person aktualisiert",
        description: `${updatedPerson.name} wurde erfolgreich bearbeitet.`,
      });
      
      await updateLayoutFromAPI(updatedPeople);
    }
  };

  return {
    // State
    people,
    setPeople,
    modalOpen,
    setModalOpen,
    editModalOpen,
    setEditModalOpen,
    editingPerson,
    setEditingPerson,
    relationshipModalOpen,
    setRelationshipModalOpen,
    currentRelationship,
    setCurrentRelationship,
    currentRelationshipEdit,
    setCurrentRelationshipEdit,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    personToDelete,
    setPersonToDelete,
    selectedPersonForAction,
    setSelectedPersonForAction,
    genogramData,
    setGenogramData,
    
    // Functions
    createGenogramData,
    updateRelationshipStatus,
    deletePerson,
    editPerson
  };
};