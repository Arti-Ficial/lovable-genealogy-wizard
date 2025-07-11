
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
    console.log('Loading test family...');

    try {
      // Vordefinierte Standardfamilie
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
          { "from": 1, "to": 3, "type": "parent-child" },
          { "from": 2, "to": 3, "type": "parent-child" },
          { "from": 1, "to": 5, "type": "parent-child" },
          { "from": 2, "to": 5, "type": "parent-child" },
          { "from": 3, "to": 4, "type": "partner" },
          { "from": 3, "to": 6, "type": "parent-child" },
          { "from": 4, "to": 6, "type": "parent-child" },
          { "from": 3, "to": 7, "type": "parent-child" },
          { "from": 4, "to": 7, "type": "parent-child" }
        ]
      };

      console.log('Sending test family to API:', testFamily);

      // API-Call zum n8n Webhook
      const response = await fetch('https://trkmuc.app.n8n.cloud/webhook-test/12345', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testFamily)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('API response:', result);
        
        if (result.mermaidCode) {
          setMermaidCode(result.mermaidCode);
          setCurrentStep('result');
          toast({
            title: "Standardfamilie erfolgreich geladen!",
            description: "Das Test-Genogramm wurde generiert und wird angezeigt.",
          });
        } else {
          throw new Error('Kein Mermaid-Code in der Antwort erhalten');
        }
      } else {
        throw new Error(`API-Fehler: ${response.status}`);
      }
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
        mermaidCode={mermaidCode}
        onReset={() => {
          setCurrentStep('welcome');
          setMermaidCode('');
        }}
      />
    );
  }

  return <GenogramWorkspace personalInfo={personalInfo} />;
};

export default GenogramWizard;
