
import React, { useState } from 'react';
import { PersonalInfo, RelationshipStatus } from '@/types/genogram';
import { useToast } from '@/hooks/use-toast';
import WelcomeScreen from './WelcomeScreen';
import PersonalInfoForm from './PersonalInfoForm';
import GenogramWorkspace from './GenogramWorkspace';
import GenogramResult from './GenogramResult';
import RelationshipEditModal from './RelationshipEditModal';
import PersonModal from './PersonModal';

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

  const handlePersonalInfoSubmit = async () => {
    console.log('Personal Info:', personalInfo);
    setIsLoading(true);
    
    try {
      // Create a basic person object from personal info
      const mainPerson = {
        id: 1,
        name: personalInfo.name,
        birthDate: personalInfo.birthDate ? personalInfo.birthDate.toISOString().split('T')[0] : null,
        gender: personalInfo.gender,
        maritalStatus: personalInfo.maritalStatus,
        position: { x: 0, y: 0 }
      };

      const genogramData = {
        persons: [mainPerson],
        relationships: []
      };

      console.log('Sending personal info to API:', genogramData);

      // Send to API
      const response = await fetch('https://trkmuc.app.n8n.cloud/webhook-test/12345', {
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
          setGenogramData(result.genogramData);
          setCurrentStep('result');
          toast({
            title: "Genogramm erfolgreich erstellt!",
            description: "Ihr Genogramm wurde basierend auf Ihren Angaben generiert.",
          });
        } else if (result.mermaidCode) {
          setMermaidCode(result.mermaidCode);
          setCurrentStep('result');
          toast({
            title: "Genogramm erfolgreich erstellt!",
            description: "Ihr Genogramm wurde basierend auf Ihren Angaben generiert.",
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
        title: "Fehler",
        description: "Beim Erstellen des Genogramms ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadTestFamily = () => {
    // Setze vordefinierte Testdaten und gehe direkt zum Workspace
    setPersonalInfo({
      name: 'Andreas Test',
      birthDate: new Date('1990-01-15'),
      gender: 'male',
      maritalStatus: 'single',
      purpose: 'Familienanalyse'
    });
    setCurrentStep('workspace');
    
    toast({
      title: "Testdaten geladen",
      description: "Sie können nun im Arbeitsbereich Ihr Genogramm erstellen.",
    });
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
        isLoading={isLoading}
      />
    );
  }

  // Handle genogram generation from workspace
  const handleGenogramGenerated = (genogramData: any, mermaidCode?: string) => {
    if (genogramData) {
      setGenogramData(genogramData);
    }
    if (mermaidCode) {
      setMermaidCode(mermaidCode);
    }
    setCurrentStep('result');
  };

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

  return <GenogramWorkspace personalInfo={personalInfo} onGenogramGenerated={handleGenogramGenerated} />;
};

export default GenogramWizard;
