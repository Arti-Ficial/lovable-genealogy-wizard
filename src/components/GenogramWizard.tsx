
import React, { useState } from 'react';
import { PersonalInfo } from '@/types/genogram';
import { useToast } from '@/hooks/use-toast';
import WelcomeScreen from './WelcomeScreen';
import PersonalInfoForm from './PersonalInfoForm';
import GenogramWorkspace from './GenogramWorkspace';
import GenogramResult from './GenogramResult';

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
    console.log('Loading test family directly...');

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

      // Konvertierung zu GenogramData Format für den Renderer
      const testGenogramData = {
        nodes: [
          { id: '1', name: 'Georg', shape: 'rect' as const, x: 200, y: 100 },
          { id: '2', name: 'Helga', shape: 'circle' as const, x: 100, y: 100 },
          { id: '3', name: 'Peter', shape: 'rect' as const, x: 400, y: 200 },
          { id: '4', name: 'Maria', shape: 'circle' as const, x: 500, y: 200 },
          { id: '5', name: 'Sabine', shape: 'circle' as const, x: 300, y: 200 },
          { id: '6', name: 'Andreas', shape: 'rect' as const, x: 450, y: 300 },
          { id: '7', name: 'Julia', shape: 'circle' as const, x: 550, y: 300 }
        ],
        lines: [
          { fromX: 100, fromY: 100, toX: 200, toY: 100 }, // Helga --- Georg
          { fromX: 400, fromY: 200, toX: 500, toY: 200 }, // Peter --- Maria
          { fromX: 150, fromY: 150, toX: 350, toY: 200 }, // Georg-Helga zu Sabine
          { fromX: 150, fromY: 150, toX: 450, toY: 200 }, // Georg-Helga zu Peter
          { fromX: 450, fromY: 250, toX: 450, toY: 300 }, // Peter-Maria zu Andreas
          { fromX: 450, fromY: 250, toX: 550, toY: 300 }  // Peter-Maria zu Julia
        ]
      };

      console.log('Loading predefined genogram data:', testGenogramData);
      
      // Direkt zum Ergebnis-Schritt springen mit vordefinierten Daten
      setGenogramData(testGenogramData);
      setCurrentStep('result');
      
      toast({
        title: "Standardfamilie erfolgreich geladen!",
        description: "Das Test-Genogramm wurde direkt geladen und wird angezeigt.",
      });
      
    } catch (error) {
      console.error('Fehler beim Laden der Standardfamilie:', error);
      toast({
        title: "Fehler",
        description: "Die Standardfamilie konnte nicht geladen werden. Bitte versuchen Sie es erneut.",
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

  if (currentStep === 'result') {
    return (
      <GenogramResult 
        genogramData={genogramData}
        mermaidCode={mermaidCode}
        onReset={() => {
          setCurrentStep('welcome');
          setMermaidCode('');
          setGenogramData(null);
        }}
      />
    );
  }

  return <GenogramWorkspace personalInfo={personalInfo} />;
};

export default GenogramWizard;
