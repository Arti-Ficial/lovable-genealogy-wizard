
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RotateCcw } from 'lucide-react';
import FamilyIcon from './FamilyIcon';

type GenogramResultProps = {
  mermaidCode: string;
  onReset: () => void;
};

const GenogramResult = ({ mermaidCode, onReset }: GenogramResultProps) => {
  React.useEffect(() => {
    const loadMermaid = async () => {
      try {
        // Dynamically import mermaid
        const mermaid = (await import('mermaid')).default;
        
        // Initialize mermaid
        mermaid.initialize({
          startOnLoad: true,
          theme: 'default',
          flowchart: {
            htmlLabels: true,
            curve: 'basis'
          }
        });

        // Clear any existing content
        const element = document.getElementById('genogram-diagram');
        if (element) {
          element.innerHTML = '';
          
          // Render the mermaid diagram
          const { svg } = await mermaid.render('genogram', mermaidCode);
          element.innerHTML = svg;
        }
      } catch (error) {
        console.error('Error rendering Mermaid diagram:', error);
        const element = document.getElementById('genogram-diagram');
        if (element) {
          element.innerHTML = '<p class="text-red-500">Fehler beim Laden des Genogramms</p>';
        }
      }
    };

    loadMermaid();
  }, [mermaidCode]);

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
          <div className="bg-white rounded-lg border p-6 mb-6 min-h-[500px] flex items-center justify-center">
            <div id="genogram-diagram" className="w-full h-full flex items-center justify-center">
              <div className="text-gray-500">Genogramm wird geladen...</div>
            </div>
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
