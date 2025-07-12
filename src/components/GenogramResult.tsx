import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RotateCcw } from 'lucide-react';
import FamilyIcon from './FamilyIcon';
import SimpleGenogramRenderer from './SimpleGenogramRenderer';
import { calculateGenogramLayout, calculateGenogramLayoutFromBackend, type GenogramInput, type GenogramBackendData, type GenogramLayoutResult } from '@/lib/dagre-layout';

// Function to process genogram data using dagre layout
function processGenogramData(inputData: GenogramInput): GenogramLayoutResult {
  console.log('Processing genogram data with dagre:', inputData);
  const result = calculateGenogramLayout(inputData);
  console.log('Dagre layout result:', result);
  return result;
}

// Function to process backend genogram data using dagre layout
function processBackendGenogramData(inputData: GenogramBackendData): GenogramLayoutResult {
  console.log('Processing backend genogram data with dagre:', inputData);
  const result = calculateGenogramLayoutFromBackend(inputData);
  console.log('Backend dagre layout result:', result);
  return result;
}

type GenogramResultProps = {
  genogramData?: GenogramLayoutResult | GenogramInput | GenogramBackendData | null;
  mermaidCode?: string;
  onReset: () => void;
  onPersonAction?: (nodeId: string, action: 'addPartner' | 'addChild' | 'edit' | 'delete') => void;
  onRelationshipAction?: (lineId: string, fromId: string, toId: string, action: 'edit') => void;
};

const GenogramResult = ({ genogramData, mermaidCode, onReset, onPersonAction, onRelationshipAction }: GenogramResultProps) => {
  console.log('Rendering genogram with data:', genogramData);
  
  // Determine which data to use and process it
  let dataToRender: GenogramLayoutResult;
  
  if (genogramData) {
    // Check if it's already processed layout data
    if ('nodes' in genogramData && 'lines' in genogramData && 
        genogramData.nodes.every(n => 'x' in n && 'y' in n)) {
      // Already processed layout data
      dataToRender = genogramData as GenogramLayoutResult;
    }
    // Check if it's backend data format with nodes and edges
    else if ('nodes' in genogramData && 'edges' in genogramData) {
      // Backend data format - process with dagre
      dataToRender = processBackendGenogramData(genogramData as GenogramBackendData);
    }
    // Check if it's old format with persons and relationships
    else if ('persons' in genogramData && 'relationships' in genogramData) {
      // Old input data format - process with dagre
      dataToRender = processGenogramData(genogramData as GenogramInput);
    }
    else {
      // Unknown format - create empty layout result
      console.warn('Unknown genogram data format:', genogramData);
      dataToRender = { nodes: [], lines: [] };
    }
  } else {
    // No data available
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-6xl mx-auto shadow-xl">
          <CardContent className="text-center space-y-4 pt-6">
            <h2 className="text-2xl font-bold text-gray-900">Keine Daten verfügbar</h2>
            <p className="text-gray-600">Es wurden keine Genogramm-Daten empfangen.</p>
            <Button onClick={onReset} variant="outline">
              Zurück zum Start
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <SimpleGenogramRenderer 
              data={dataToRender} 
              onPersonAction={onPersonAction}
              onRelationshipAction={onRelationshipAction}
            />
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