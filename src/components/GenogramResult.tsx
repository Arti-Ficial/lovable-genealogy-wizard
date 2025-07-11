
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RotateCcw } from 'lucide-react';
import FamilyIcon from './FamilyIcon';
import SimpleGenogramRenderer from './SimpleGenogramRenderer';

// Temporary conversion function until backend sends new format
const convertMermaidToGenogramData = (mermaidCode: string) => {
  // For now, create mock data that matches the expected layout
  // This will be replaced when backend sends the new format
  return {
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
};

type GenogramData = {
  nodes: Array<{
    id: string;
    name: string;
    shape: 'circle' | 'rect';
    x: number;
    y: number;
  }>;
  lines: Array<{
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
  }>;
};

type GenogramResultProps = {
  genogramData?: GenogramData;
  mermaidCode?: string; // Temporary backward compatibility
  onReset: () => void;
};

const GenogramResult = ({ genogramData, mermaidCode, onReset }: GenogramResultProps) => {
  // Use provided genogramData or convert from mermaidCode (temporary)
  const data = genogramData || (mermaidCode ? convertMermaidToGenogramData(mermaidCode) : { nodes: [], lines: [] });
  console.log('Rendering genogram with data:', data);

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
            <SimpleGenogramRenderer data={data} />
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
