
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
        
        // Initialize mermaid with configuration
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
          securityLevel: 'loose'
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
          
          // Post-process the SVG to apply custom shapes based on styling
          const svgElement = element.querySelector('svg');
          if (svgElement) {
            // Parse the mermaid code to identify which nodes should be circles
            const circleNodes = new Set<string>();
            const lines = mermaidCode.split('\n');
            
            // Find all nodes that should be circles based on style definitions
            lines.forEach(line => {
              const trimmed = line.trim();
              if (trimmed.includes('shape:circle')) {
                // Extract style number from lines like "style 2 shape:circle"
                const styleMatch = trimmed.match(/style\s+(\d+)\s+shape:circle/);
                if (styleMatch) {
                  const styleNumber = styleMatch[1];
                  // Find which node uses this style
                  lines.forEach(nodeLine => {
                    const nodeMatch = nodeLine.match(/(\d+)\[([^\]]+)\]/);
                    if (nodeMatch && nodeMatch[1] === styleNumber) {
                      circleNodes.add(nodeMatch[1]);
                    }
                  });
                }
              }
            });
            
            console.log('Nodes that should be circles:', Array.from(circleNodes));
            
            // Transform rectangles to circles for female persons
            circleNodes.forEach(nodeId => {
              const nodeElement = svgElement.querySelector(`#flowchart-${nodeId}-${diagramId}`);
              if (nodeElement) {
                const rectElement = nodeElement.querySelector('rect');
                if (rectElement) {
                  // Get the dimensions of the rectangle
                  const width = parseFloat(rectElement.getAttribute('width') || '60');
                  const height = parseFloat(rectElement.getAttribute('height') || '30');
                  const x = parseFloat(rectElement.getAttribute('x') || '0');
                  const y = parseFloat(rectElement.getAttribute('y') || '0');
                  
                  // Calculate circle properties
                  const radius = Math.max(width, height) / 2;
                  const centerX = x + width / 2;
                  const centerY = y + height / 2;
                  
                  // Create a circle element
                  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                  circle.setAttribute('cx', centerX.toString());
                  circle.setAttribute('cy', centerY.toString());
                  circle.setAttribute('r', radius.toString());
                  circle.setAttribute('fill', rectElement.getAttribute('fill') || '#ffffff');
                  circle.setAttribute('stroke', rectElement.getAttribute('stroke') || '#000000');
                  circle.setAttribute('stroke-width', rectElement.getAttribute('stroke-width') || '1');
                  circle.setAttribute('class', rectElement.getAttribute('class') || '');
                  
                  // Replace the rectangle with the circle
                  rectElement.parentNode?.replaceChild(circle, rectElement);
                  
                  console.log(`Converted node ${nodeId} from rectangle to circle`);
                }
              }
            });
            
            // Add custom CSS for better styling
            const style = document.createElement('style');
            style.textContent = `
              .flowchart-label {
                dominant-baseline: middle;
                text-anchor: middle;
              }
              .node rect {
                fill: #e6f3ff;
                stroke: #2563eb;
                stroke-width: 2px;
              }
              .node circle {
                fill: #fce7f3;
                stroke: #ec4899;
                stroke-width: 2px;
              }
            `;
            svgElement.appendChild(style);
            
            // Force browser refresh
            svgElement.style.display = 'none';
            svgElement.getBBox();
            svgElement.style.display = '';
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
