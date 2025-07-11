
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
      // Vordefinierte Standardfamilie - direkt als GenogramData Format
      const testGenogramData = {
        nodes: [
          { id: '1', name: 'Georg', shape: 'rect' as const, x: 200, y: 100 },
          { id: '2', name: 'Helga', shape: 'circle' as const, x: 100, y: 100 },
          { id: '3', name: 'Peter', shape: 'rect' as const, x: 400, y: 100 },
          { id: '4', name: 'Maria', shape: 'circle' as const, x: 500, y: 100 },
          { id: '5', name: 'Sabine', shape: 'circle' as const, x: 600, y: 100 },
          { id: '6', name: 'Andreas', shape: 'rect' as const, x: 1000, y: 100 },
          { id: '7', name: 'Julia', shape: 'circle' as const, x: 1100, y: 100 }
        ],
        lines: [
          { fromX: 100, fromY: 100, toX: 200, toY: 100 }, // Helga --- Georg
          { fromX: 400, fromY: 100, toX: 500, toY: 100 }, // Peter --- Maria
          { fromX: 1000, fromY: 100, toX: 1100, toY: 100 } // Andreas --- Julia
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
