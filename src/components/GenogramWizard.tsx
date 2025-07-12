
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

  const handlePersonalInfoSubmit = () => {
    console.log('Personal Info:', personalInfo);
    setCurrentStep('workspace');
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
