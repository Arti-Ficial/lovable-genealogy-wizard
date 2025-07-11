
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
        
        // Initialize mermaid with configuration that supports shape styling
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            primaryColor: '#ffffff',
            primaryTextColor: '#000000',
            primaryBorderColor: '#000000',
            lineColor: '#000000',
            background: '#ffffff',
            mainBkg: '#ffffff',
            secondBkg: '#ffffff',
            tertiaryColor: '#ffffff'
          },
          flowchart: {
            htmlLabels: false,
            curve: 'basis',
            useMaxWidth: true,
            wrappingWidth: 200,
            nodeSpacing: 50,
            rankSpacing: 50,
            padding: 20
          },
          fontFamily: 'arial',
          fontSize: 12,
          logLevel: 'debug',
          securityLevel: 'loose',
          // Enable shape styling
          deterministicIds: true,
          deterministicIDSeed: 'genogram'
        });

        // Clear any existing content
        const element = document.getElementById('genogram-diagram');
        if (element) {
          element.innerHTML = '';
          
          console.log('Mermaid code to render:', mermaidCode);
          
          // Generate unique ID for this render
          const diagramId = `genogram-${Date.now()}`;
          
          // Render the mermaid diagram
          const { svg } = await mermaid.render(diagramId, mermaidCode);
          
          element.innerHTML = svg;
          
          // Additional processing to ensure shapes are rendered correctly
          const svgElement = element.querySelector('svg');
          if (svgElement) {
            // Force browser to re-parse and apply all styles using getBBox which works for SVG
            svgElement.style.display = 'none';
            svgElement.getBBox(); // trigger reflow for SVG elements
            svgElement.style.display = '';
            
            // Add custom CSS to ensure circle shapes are rendered
            const style = document.createElement('style');
            style.textContent = `
              .node rect[data-shape="circle"] {
                rx: 50%;
                ry: 50%;
              }
              .node[data-shape="circle"] rect {
                rx: 50%;
                ry: 50%;
              }
              .flowchart-label {
                dominant-baseline: middle;
                text-anchor: middle;
              }
            `;
            svgElement.appendChild(style);
          }
        }
      } catch (error) {
        console.error('Error rendering Mermaid diagram:', error);
        const element = document.getElementById('genogram-diagram');
        if (element) {
          element.innerHTML = '<p class="text-red-500">Fehler beim Laden des Genogramms</p>';
        }
      }
    };

    // Add small delay to ensure DOM is ready
    const timer = setTimeout(loadMermaid, 100);
    return () => clearTimeout(timer);
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
          <div className="bg-white rounded-lg border p-6 mb-6 min-h-[500px] flex items-center justify-center overflow-auto">
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
