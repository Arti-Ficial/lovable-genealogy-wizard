import React from 'react';
import { Person, RelationshipStatus } from '@/types/genogram';
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
import PersonModal from './PersonModal';
import RelationshipEditModal from './RelationshipEditModal';

type GenogramModalsProps = {
  // Person Modal
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  currentRelationship: 'mother' | 'father' | 'sibling' | 'partner' | 'child';
  people: Person[];
  selectedPersonForAction: string | null;
  setSelectedPersonForAction: (id: string | null) => void;
  onSavePerson: (personData: Omit<Person, 'id' | 'position'>) => Promise<void>;

  // Edit Modal
  editModalOpen: boolean;
  setEditModalOpen: (open: boolean) => void;
  editingPerson: Person | null;
  setEditingPerson: (person: Person | null) => void;
  onEditPerson: (personData: Omit<Person, 'id' | 'position'>) => Promise<void>;

  // Relationship Modal
  relationshipModalOpen: boolean;
  setRelationshipModalOpen: (open: boolean) => void;
  currentRelationshipEdit: {
    lineId: string;
    fromId: string;
    toId: string;
    currentStatus: RelationshipStatus;
    personNames: { from: string; to: string };
  } | null;
  setCurrentRelationshipEdit: (edit: any) => void;
  onRelationshipStatusSave: (newStatus: RelationshipStatus) => Promise<void>;

  // Delete Modal
  deleteConfirmOpen: boolean;
  setDeleteConfirmOpen: (open: boolean) => void;
  onDeleteConfirm: () => Promise<void>;
};

const GenogramModals = ({
  modalOpen,
  setModalOpen,
  currentRelationship,
  people,
  selectedPersonForAction,
  setSelectedPersonForAction,
  onSavePerson,
  editModalOpen,
  setEditModalOpen,
  editingPerson,
  setEditingPerson,
  onEditPerson,
  relationshipModalOpen,
  setRelationshipModalOpen,
  currentRelationshipEdit,
  setCurrentRelationshipEdit,
  onRelationshipStatusSave,
  deleteConfirmOpen,
  setDeleteConfirmOpen,
  onDeleteConfirm
}: GenogramModalsProps) => {
  return (
    <>
      <PersonModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedPersonForAction(null);
        }}
        onSave={onSavePerson}
        relationship={currentRelationship}
        existingPeople={people}
      />

      <PersonModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingPerson(null);
        }}
        onSave={onEditPerson}
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
        onSave={onRelationshipStatusSave}
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
            <AlertDialogAction onClick={onDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default GenogramModals;