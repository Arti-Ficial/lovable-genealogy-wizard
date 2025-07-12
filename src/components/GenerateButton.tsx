
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type GenerateButtonProps = {
  isGenerating: boolean;
  onGenerate: () => void;
};

const GenerateButton = ({ isGenerating, onGenerate }: GenerateButtonProps) => {
  return (
    <div className="mt-8 flex justify-center">
      <Button
        onClick={onGenerate}
        disabled={isGenerating}
        size="lg"
        className="bg-green-600 hover:bg-green-700 text-white h-14 px-8 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
            Genogramm wird erstellt...
          </>
        ) : (
          <>
            Genogramm erstellen & visualisieren
          </>
        )}
      </Button>
    </div>
  );
};

export default GenerateButton;
