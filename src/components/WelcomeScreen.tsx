
import React from 'react';
import { Button } from '@/components/ui/button';
import FamilyIcon from './FamilyIcon';

type WelcomeScreenProps = {
  onStart: () => void;
};

const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
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
          onClick={onStart}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          Neues Genogramm erstellen
        </Button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
