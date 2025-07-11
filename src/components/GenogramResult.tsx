
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RotateCcw } from 'lucide-react';
import FamilyIcon from './FamilyIcon';
import CustomGenogramRenderer from './CustomGenogramRenderer';

type GenogramResultProps = {
  mermaidCode: string;
  onReset: () => void;
};

const GenogramResult = ({ mermaidCode, onReset }: GenogramResultProps) => {
  console.log('Rendering genogram with code:', mermaidCode);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl mx-auto shadow-xl animate-fade-in">
        <CardHeader className="text-center pb-6">
          <div className="mb-4 flex justify-center">
            <FamilyIcon className="w-16 h-16 text-blue-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Ihr persönliches Genogramm
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="bg-white rounded-lg border p-6 mb-6 min-h-[500px] flex items-center justify-center overflow-auto">
            <CustomGenogramRenderer mermaidCode={mermaidCode} />
          </div>

          <div className="flex justify-center">
            <Button
              onClick={onReset}
              size="lg"
              variant="outline"
              className="h-14 px-8 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <RotateCcw className="w-5 h-5 mr-3" />
              Neues Genogramm erstellen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GenogramResult;
