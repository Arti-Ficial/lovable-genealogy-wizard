
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
  // Entfernt - keine Bearbeitungsfunktionen in der Ergebnis-Ansicht
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
    console.log('Loading test family with API call...');

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

      console.log('Sending test family to n8n webhook:', testFamily);
      console.log('Using webhook URL: https://trkmuc.app.n8n.cloud/webhook-test/12345');

      // API-Call zum n8n Webhook mit der korrekten Production URL
      const response = await fetch('https://trkmuc.app.n8n.cloud/webhook-test/12345', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testFamily)
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const result = await response.json();
        console.log('API response received:', result);
        
        // Check if we received genogramData (new processed format) or raw input data
        if (result.genogramData) {
          console.log('Using genogramData from API response');
          setGenogramData(result.genogramData);
          setCurrentStep('result');
          toast({
            title: "Standardfamilie erfolgreich geladen!",
            description: "Das Test-Genogramm wurde vom Server generiert und wird angezeigt.",
          });
        } else if (result.persons && result.relationships) {
          // Received raw input data - pass it directly to GenogramResult for dagre processing
          console.log('Using raw input data from API response for dagre processing');
          setGenogramData(result);
          setCurrentStep('result');
          toast({
            title: "Standardfamilie erfolgreich geladen!",
            description: "Das Test-Genogramm wurde mit dagre-Layout berechnet und wird angezeigt.",
          });
        } else if (result.mermaidCode) {
          // Fallback für altes Format
          console.log('Using mermaidCode from API response (fallback)');
          setMermaidCode(result.mermaidCode);
          setCurrentStep('result');
          toast({
            title: "Standardfamilie erfolgreich geladen!",
            description: "Das Test-Genogramm wurde vom Server generiert und wird angezeigt.",
          });
        } else {
          throw new Error('Weder genogramData noch mermaidCode in der API-Antwort erhalten');
        }
      } else {
        const errorText = await response.text();
        console.error('API response error text:', errorText);
        throw new Error(`API-Fehler: ${response.status} - ${response.statusText}. Details: ${errorText}`);
      }
      
    } catch (error) {
      console.error('Detaillierter Fehler beim Laden der Standardfamilie:', error);
      
      // Spezifische Fehlerbehandlung
      let errorMessage = "Die Verbindung zum Server konnte nicht hergestellt werden. Bitte versuchen Sie es später erneut.";
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = "Netzwerkfehler: Die Verbindung zum n8n-Server konnte nicht hergestellt werden. Bitte überprüfen Sie Ihre Internetverbindung.";
      } else if (error instanceof Error) {
        errorMessage = `Fehler: ${error.message}`;
      }
      
      toast({
        title: "Verbindungsfehler",
        description: errorMessage,
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

  // Entfernt - keine Bearbeitungsfunktionen in der Ergebnis-Ansicht

  // Entfernt - keine Bearbeitungsfunktionen in der Ergebnis-Ansicht

  // Entfernt - keine Bearbeitungsfunktionen in der Ergebnis-Ansicht

  // Entfernt - keine Bearbeitungsfunktionen in der Ergebnis-Ansicht

  // Entfernt - keine Bearbeitungsfunktionen in der Ergebnis-Ansicht

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

  return (
    <GenogramWorkspace 
      personalInfo={personalInfo} 
      onGenogramGenerated={(data, mermaidCode) => {
        setGenogramData(data);
        setMermaidCode(mermaidCode || '');
        setCurrentStep('result');
      }}
    />
  );
};

export default GenogramWizard;
