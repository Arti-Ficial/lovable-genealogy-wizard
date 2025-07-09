
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Person, Gender } from '@/types/genogram';

type PersonModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (person: Omit<Person, 'id' | 'position'>) => void;
  relationship: 'mother' | 'father' | 'sibling' | 'partner' | 'child';
  existingPeople: Person[];
};

const PersonModal = ({ isOpen, onClose, onSave, relationship, existingPeople }: PersonModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    gender: '' as Gender | '',
    birthDate: undefined as Date | undefined,
    deathDate: undefined as Date | undefined,
    occupation: '',
    notes: '',
    parentIds: [] as string[]
  });

  const getModalTitle = () => {
    switch (relationship) {
      case 'mother': return 'Mutter erfassen';
      case 'father': return 'Vater erfassen';
      case 'sibling': return 'Geschwister erfassen';
      case 'partner': return 'Partner/in erfassen';
      case 'child': return 'Kind erfassen';
      default: return 'Person erfassen';
    }
  };

  const shouldShowParentSelection = () => {
    return relationship === 'sibling' || relationship === 'child';
  };

  const handleParentToggle = (personId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      parentIds: checked 
        ? [...prev.parentIds, personId]
        : prev.parentIds.filter(id => id !== personId)
    }));
  };

  const handleSave = () => {
    if (!formData.name || !formData.gender || !formData.birthDate) {
      return;
    }

    onSave({
      name: formData.name,
      gender: formData.gender as Gender,
      birthDate: formData.birthDate,
      deathDate: formData.deathDate,
      occupation: formData.occupation || undefined,
      notes: formData.notes || undefined,
      relationship: relationship === 'child' ? 'child' : relationship,
      parentIds: shouldShowParentSelection() ? formData.parentIds : undefined
    });

    // Reset form
    setFormData({
      name: '',
      gender: '',
      birthDate: undefined,
      deathDate: undefined,
      occupation: '',
      notes: '',
      parentIds: []
    });
    onClose();
  };

  const handleCancel = () => {
    // Reset form
    setFormData({
      name: '',
      gender: '',
      birthDate: undefined,
      deathDate: undefined,
      occupation: '',
      notes: '',
      parentIds: []
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {getModalTitle()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-medium text-gray-700">
              Name *
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Vollständiger Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium text-gray-700">
              Geschlecht *
            </Label>
            <Select onValueChange={(value: Gender) => setFormData(prev => ({ ...prev, gender: value }))}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Geschlecht wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Männlich</SelectItem>
                <SelectItem value="female">Weiblich</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium text-gray-700">
              Geburtsdatum *
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-12 text-base",
                    !formData.birthDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.birthDate ? (
                    format(formData.birthDate, "PPP", { locale: de })
                  ) : (
                    <span>Geburtsdatum wählen</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.birthDate}
                  onSelect={(date) => setFormData(prev => ({ ...prev, birthDate: date }))}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                  enableYearNavigation={true}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium text-gray-700">
              Sterbedatum (optional)
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-12 text-base",
                    !formData.deathDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.deathDate ? (
                    format(formData.deathDate, "PPP", { locale: de })
                  ) : (
                    <span>Sterbedatum wählen</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.deathDate}
                  onSelect={(date) => setFormData(prev => ({ ...prev, deathDate: date }))}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                  enableYearNavigation={true}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="occupation" className="text-base font-medium text-gray-700">
              Beruf (optional)
            </Label>
            <Input
              id="occupation"
              type="text"
              placeholder="Beruf oder Tätigkeit"
              value={formData.occupation}
              onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-base font-medium text-gray-700">
              Besondere Ereignisse, Merkmale oder Krankheiten (optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Wichtige Informationen zu dieser Person..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="min-h-[100px] text-base resize-none"
            />
          </div>

          {shouldShowParentSelection() && existingPeople.length > 0 && (
            <div className="space-y-4 border-t pt-6">
              <Label className="text-base font-medium text-gray-700">
                Eltern des {relationship === 'child' ? 'Kindes' : 'Geschwisters'}
              </Label>
              <div className="space-y-3">
                {existingPeople.map((person) => (
                  <div key={person.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`parent-${person.id}`}
                      checked={formData.parentIds.includes(person.id)}
                      onCheckedChange={(checked) => 
                        handleParentToggle(person.id, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={`parent-${person.id}`}
                      className="text-sm font-normal text-gray-600 cursor-pointer"
                    >
                      {person.name} ({person.gender === 'male' ? 'Männlich' : 'Weiblich'})
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Wählen Sie die Eltern aus, um Halbgeschwister-Beziehungen korrekt darzustellen.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-6">
          <Button 
            onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12 text-base"
            disabled={!formData.name || !formData.gender || !formData.birthDate}
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

export default PersonModal;
