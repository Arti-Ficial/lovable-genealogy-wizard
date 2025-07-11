import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RelationshipStatus } from '@/types/genogram';

type RelationshipEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (status: RelationshipStatus) => void;
  currentStatus: RelationshipStatus;
  personNames: { from: string; to: string };
};

const RelationshipEditModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  currentStatus, 
  personNames 
}: RelationshipEditModalProps) => {
  const [selectedStatus, setSelectedStatus] = useState<RelationshipStatus>(currentStatus);

  const handleSave = () => {
    onSave(selectedStatus);
    onClose();
  };

  const handleCancel = () => {
    setSelectedStatus(currentStatus); // Reset to original status
    onClose();
  };

  const getStatusLabel = (status: RelationshipStatus) => {
    switch (status) {
      case 'married': return 'Partnerschaft / Ehe';
      case 'divorced': return 'Geschieden / Getrennt';
      case 'conflicted': return 'Konfliktreiche Beziehung';
      case 'separated': return 'Abgebrochene Beziehung';
      default: return 'Partnerschaft / Ehe';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Beziehung bearbeiten
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="text-sm text-gray-600">
            Beziehung zwischen <strong>{personNames.from}</strong> und <strong>{personNames.to}</strong>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium text-gray-700">
              Beziehungsstatus
            </Label>
            <Select 
              value={selectedStatus} 
              onValueChange={(value: RelationshipStatus) => setSelectedStatus(value)}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue>{getStatusLabel(selectedStatus)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="married">Partnerschaft / Ehe</SelectItem>
                <SelectItem value="divorced">Geschieden / Getrennt</SelectItem>
                <SelectItem value="conflicted">Konfliktreiche Beziehung</SelectItem>
                <SelectItem value="separated">Abgebrochene Beziehung</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 pt-6">
          <Button 
            onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12 text-base"
          >
            Speichern
          </Button>
          <Button 
            onClick={handleCancel}
            variant="outline"
            className="flex-1 h-12 text-base"
          >
            Abbrechen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RelationshipEditModal;