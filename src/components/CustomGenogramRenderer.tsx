
import React from 'react';

type Person = {
  id: string;
  name: string;
  gender: 'male' | 'female';
  x: number;
  y: number;
};

type Connection = {
  from: string;
  to: string;
  type: 'parent-child' | 'partner' | 'sibling';
};

type CustomGenogramRendererProps = {
  mermaidCode: string;
};

const CustomGenogramRenderer = ({ mermaidCode }: CustomGenogramRendererProps) => {
  const parseGenogram = (code: string) => {
    const lines = code.split('\n').map(line => line.trim()).filter(line => line);
    const people: Person[] = [];
    const connections: Connection[] = [];
    const genderMap: { [key: string]: 'male' | 'female' } = {};
    
    // Parse style definitions to determine gender
    lines.forEach(line => {
      if (line.includes('shape:circle')) {
        const styleMatch = line.match(/style\s+(\w+)\s+shape:circle/);
        if (styleMatch) {
          genderMap[styleMatch[1]] = 'female';
        }
      }
    });
    
    // Parse nodes
    lines.forEach(line => {
      const nodeMatch = line.match(/(\w+)\[([^\]]+)\]/);
      if (nodeMatch) {
        const id = nodeMatch[1];
        const name = nodeMatch[2];
        const gender = genderMap[id] || 'male';
        
        people.push({
          id,
          name,
          gender,
          x: 0,
          y: 0
        });
      }
    });
    
    // Parse connections
    lines.forEach(line => {
      if (line.includes('---') || line.includes('-->')) {
        const connectionMatch = line.match(/(\w+)\s*---\s*(\w+)|(\w+)\s*-->\s*(\w+)/);
        if (connectionMatch) {
          const from = connectionMatch[1] || connectionMatch[3];
          const to = connectionMatch[2] || connectionMatch[4];
          connections.push({
            from,
            to,
            type: 'parent-child'
          });
        }
      }
    });
    
    // Auto-layout positions
    const layoutPeople = (people: Person[]) => {
      const centerX = 400;
      const centerY = 300;
      const spacing = 150;
      
      people.forEach((person, index) => {
        const angle = (index * 2 * Math.PI) / people.length;
        const radius = Math.max(100, people.length * 30);
        
        person.x = centerX + Math.cos(angle) * radius;
        person.y = centerY + Math.sin(angle) * radius;
      });
      
      return people;
    };
    
    return {
      people: layoutPeople(people),
      connections
    };
  };

  const { people, connections } = parseGenogram(mermaidCode);
  
  const PersonNode = ({ person }: { person: Person }) => {
    const isCircle = person.gender === 'female';
    const size = 80;
    const halfSize = size / 2;
    
    return (
      <g key={person.id}>
        {isCircle ? (
          <circle
            cx={person.x}
            cy={person.y}
            r={halfSize}
            fill="#fce7f3"
            stroke="#ec4899"
            strokeWidth="2"
          />
        ) : (
          <rect
            x={person.x - halfSize}
            y={person.y - halfSize}
            width={size}
            height={size}
            fill="#e6f3ff"
            stroke="#2563eb"
            strokeWidth="2"
          />
        )}
        <text
          x={person.x}
          y={person.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="14"
          fontWeight="bold"
          fill="#1f2937"
        >
          {person.name}
        </text>
      </g>
    );
  };
  
  const ConnectionLine = ({ connection, people }: { connection: Connection; people: Person[] }) => {
    const fromPerson = people.find(p => p.id === connection.from);
    const toPerson = people.find(p => p.id === connection.to);
    
    if (!fromPerson || !toPerson) return null;
    
    return (
      <line
        x1={fromPerson.x}
        y1={fromPerson.y}
        x2={toPerson.x}
        y2={toPerson.y}
        stroke="#6b7280"
        strokeWidth="2"
      />
    );
  };
  
  const svgWidth = 800;
  const svgHeight = 600;
  
  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg width={svgWidth} height={svgHeight} className="border rounded-lg bg-white">
        {/* Render connections first (behind nodes) */}
        {connections.map((connection, index) => (
          <ConnectionLine key={index} connection={connection} people={people} />
        ))}
        
        {/* Render people nodes */}
        {people.map(person => (
          <PersonNode key={person.id} person={person} />
        ))}
      </svg>
    </div>
  );
};

export default CustomGenogramRenderer;
