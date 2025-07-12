
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PersonalInfo } from '@/types/genogram';
import FamilyIcon from './FamilyIcon';
import GenogramResult from './GenogramResult';
import GenerateButton from './GenerateButton';
import GenogramCanvas from './GenogramCanvas';
import GenogramModals from './GenogramModals';
import { useGenogramData } from '@/hooks/useGenogramData';
import { useGenogramAPI } from '@/hooks/useGenogramAPI';
import { useGenogramActions } from '@/hooks/useGenogramActions';

type GenogramWorkspaceProps = {
  personalInfo: PersonalInfo;
  onGenogramGenerated: (data: any, mermaidCode?: string) => void;
};

const GenogramWorkspace = ({ personalInfo, onGenogramGenerated }: GenogramWorkspaceProps) => {
  const [mermaidCode, setMermaidCode] = useState<string | null>(null);
  
  const genogramData = useGenogramData(personalInfo);
  const genogramAPI = useGenogramAPI(personalInfo);
  const genogramActions = useGenogramActions();

  // Create wrapper functions for the hooks
  const updateLayoutFromAPI = (people: any[]) => 
    genogramAPI.updateLayoutFromAPI(people, genogramData.setGenogramData, genogramData.setPeople);

  const handleSavePerson = (personData: any) =>
    genogramActions.handleSavePerson(
      personData,
      genogramData.currentRelationship,
      genogramData.selectedPersonForAction,
      genogramData.people,
      genogramData.setPeople,
      genogramData.setSelectedPersonForAction,
      genogramData.setModalOpen,
      updateLayoutFromAPI
    );

  const handleEditPerson = (personData: any) =>
    genogramData.editPerson(personData, updateLayoutFromAPI);

  const handleDeleteConfirm = () =>
    genogramData.deletePerson(updateLayoutFromAPI);

  const handleRelationshipStatusSave = (newStatus: any) =>
    genogramData.updateRelationshipStatus(newStatus, updateLayoutFromAPI);

  const handlePersonAction = (action, personId) => {
    // Log zur Überprüfung, dass die Funktion aufgerufen wird
    console.log(`Aktion '${action}' für Person '${personId}' wird ausgeführt.`);

    // Setze die ausgewählte Person für das Modal
    genogramData.setSelectedPersonForAction(personId);

    // Öffne das Modal basierend auf der Aktion
    if (action === 'add-partner' || action === 'add-child' || action === 'add-father' || action === 'add-mother' || action === 'add-sibling' || action === 'edit-person') {
      genogramData.setModalOpen(true);
    }

    // Logik für das Löschen
    if (action === 'delete-person') {
      if (window.confirm('Möchten Sie diese Person und alle ihre Verbindungen wirklich löschen?')) {
        // Hier kommt die Löschlogik hin
        console.log(`Lösche Person ${personId}`);
        // ... implementiere die Löschlogik ...
        // Nach dem Löschen neu an die API senden
        // sendToApi(updatedData); 
      }
    }
  };

  const handleRelationshipAction = (lineId: string, fromId: string, toId: string, action: 'edit') =>
    genogramActions.handleRelationshipAction(
      lineId,
      fromId,
      toId,
      action,
      genogramData.people,
      genogramData.setCurrentRelationshipEdit,
      genogramData.setRelationshipModalOpen
    );

  const generateGenogramData = () =>
    genogramAPI.generateGenogramData(genogramData.people, onGenogramGenerated);

  const handleReset = () => {
    setMermaidCode(null);
    genogramData.setGenogramData(null);
    genogramData.setPeople([]);
  };

  // If we have generated genogram data, show the result
  if (genogramData.genogramData) {
    return (
      <GenogramResult
        genogramData={genogramData.genogramData}
        mermaidCode={mermaidCode || undefined}
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
          <div className="bg-white rounded-lg border p-6 mb-6 min-h-[500px] flex items-center justify-center overflow-auto">
            <GenogramCanvas
              people={genogramData.people}
              personalInfo={personalInfo}
              genogramData={genogramData.genogramData}
              onPersonAction={handlePersonAction}
              onRelationshipAction={handleRelationshipAction}
            />
          </div>

        </CardContent>
      </Card>

      <GenogramModals
        modalOpen={genogramData.modalOpen}
        setModalOpen={genogramData.setModalOpen}
        currentRelationship={genogramData.currentRelationship}
        people={genogramData.people}
        selectedPersonForAction={genogramData.selectedPersonForAction}
        setSelectedPersonForAction={genogramData.setSelectedPersonForAction}
        onSavePerson={handleSavePerson}
        editModalOpen={genogramData.editModalOpen}
        setEditModalOpen={genogramData.setEditModalOpen}
        editingPerson={genogramData.editingPerson}
        setEditingPerson={genogramData.setEditingPerson}
        onEditPerson={handleEditPerson}
        relationshipModalOpen={genogramData.relationshipModalOpen}
        setRelationshipModalOpen={genogramData.setRelationshipModalOpen}
        currentRelationshipEdit={genogramData.currentRelationshipEdit}
        setCurrentRelationshipEdit={genogramData.setCurrentRelationshipEdit}
        onRelationshipStatusSave={handleRelationshipStatusSave}
        deleteConfirmOpen={genogramData.deleteConfirmOpen}
        setDeleteConfirmOpen={genogramData.setDeleteConfirmOpen}
        onDeleteConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default GenogramWorkspace;
