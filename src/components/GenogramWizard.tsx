
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import FamilyIcon from './FamilyIcon';

type PersonalInfo = {
  name: string;
  birthDate: Date | undefined;
  gender: string;
  maritalStatus: string;
  purpose: string;
};

const GenogramWizard = () => {
  const [currentStep, setCurrentStep] = useState<'welcome' | 'personal'>('welcome');
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    name: '',
    birthDate: undefined,
    gender: '',
    maritalStatus: '',
    purpose: ''
  });

  const handleStartGenogram = () => {
    setCurrentStep('personal');
  };

  const handlePersonalInfoSubmit = () => {
    console.log('Personal Info:', personalInfo);
    // Here you would proceed to the next step
  };

  const updatePersonalInfo = (field: keyof PersonalInfo, value: any) => {
    setPersonalInfo(prev => ({ ...prev, [field]: value }));
  };

  if (currentStep === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="max-w-2xl mx-auto text-center animate-fade-in">
          <div className="mb-8 flex justify-center">
            <FamilyIcon className="w-24 h-24 text-blue-600" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Willkommen bei Ihrem persönlichen
            <span className="text-blue-600 block">Genogramm-Assistenten</span>
          </h1>
          
          <p className="text-lg text-gray-700 mb-8 leading-relaxed max-w-xl mx-auto">
            Entdecken Sie die Muster und Verbindungen in Ihrer Familiengeschichte. 
            Dieser Assistent führt Sie Schritt für Schritt durch die Erstellung Ihres 
            persönlichen Genogramms. Es sind keine Vorkenntnisse nötig.
          </p>
          
          <Button 
            onClick={handleStartGenogram}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            Neues Genogramm erstellen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl mx-auto shadow-xl animate-fade-in">
        <CardHeader className="text-center pb-6">
          <div className="mb-4 flex justify-center">
            <FamilyIcon className="w-16 h-16 text-blue-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Schritt 1: Beginnen wir mit Ihnen
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-medium text-gray-700">
              Ihr Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Geben Sie Ihren Namen ein"
              value={personalInfo.name}
              onChange={(e) => updatePersonalInfo('name', e.target.value)}
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium text-gray-700">
              Geburtsdatum
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-12 text-base",
                    !personalInfo.birthDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {personalInfo.birthDate ? (
                    format(personalInfo.birthDate, "PPP", { locale: de })
                  ) : (
                    <span>Wählen Sie ein Datum</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={personalInfo.birthDate}
                  onSelect={(date) => updatePersonalInfo('birthDate', date)}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium text-gray-700">
              Geschlecht
            </Label>
            <Select onValueChange={(value) => updatePersonalInfo('gender', value)}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Wählen Sie Ihr Geschlecht" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Männlich</SelectItem>
                <SelectItem value="female">Weiblich</SelectItem>
                <SelectItem value="diverse">Divers / Unbekannt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium text-gray-700">
              Familienstand
            </Label>
            <Select onValueChange={(value) => updatePersonalInfo('maritalStatus', value)}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Wählen Sie Ihren Familienstand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Ledig</SelectItem>
                <SelectItem value="relationship">In Partnerschaft</SelectItem>
                <SelectItem value="married">Verheiratet</SelectItem>
                <SelectItem value="divorced">Geschieden</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose" className="text-base font-medium text-gray-700">
              Was ist Ihr Anliegen für dieses Genogramm? (optional)
            </Label>
            <Textarea
              id="purpose"
              placeholder="Beschreiben Sie kurz, was Sie mit diesem Genogramm erreichen möchten..."
              value={personalInfo.purpose}
              onChange={(e) => updatePersonalInfo('purpose', e.target.value)}
              className="min-h-[100px] text-base resize-none"
            />
          </div>

          <div className="pt-6">
            <Button 
              onClick={handlePersonalInfoSubmit}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={!personalInfo.name || !personalInfo.birthDate || !personalInfo.gender || !personalInfo.maritalStatus}
            >
              Weiter zur Kernfamilie
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GenogramWizard;
