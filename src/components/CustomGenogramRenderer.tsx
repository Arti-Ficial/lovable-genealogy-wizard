
import React from 'react';

type Person = {
  id: string;
  name: string;
  gender: 'male' | 'female';
  x: number;
  y: number;
  generation?: number;
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
    
    // Create hierarchical layout
    const layoutPeople = (people: Person[], connections: Connection[]) => {
      // Create adjacency lists for parent-child relationships
      const childrenOf: { [key: string]: string[] } = {};
      const parentsOf: { [key: string]: string[] } = {};
      
      connections.forEach(conn => {
        if (conn.type === 'parent-child') {
          if (!childrenOf[conn.from]) childrenOf[conn.from] = [];
          if (!parentsOf[conn.to]) parentsOf[conn.to] = [];
          
          childrenOf[conn.from].push(conn.to);
          parentsOf[conn.to].push(conn.from);
        }
      });
      
      // Assign generations (0 = root, higher numbers = deeper generations)
      const generations: { [key: string]: number } = {};
      const visited = new Set<string>();
      
      // Find root nodes (people with no parents)
      const roots = people.filter(person => !parentsOf[person.id] || parentsOf[person.id].length === 0);
      
      // If no clear roots, use the first person as root
      if (roots.length === 0 && people.length > 0) {
        roots.push(people[0]);
      }
      
      // BFS to assign generations
      const queue: { id: string; generation: number }[] = [];
      roots.forEach(root => {
        generations[root.id] = 0;
        queue.push({ id: root.id, generation: 0 });
        visited.add(root.id);
      });
      
      while (queue.length > 0) {
        const { id, generation } = queue.shift()!;
        
        if (childrenOf[id]) {
          childrenOf[id].forEach(childId => {
            if (!visited.has(childId)) {
              generations[childId] = generation + 1;
              queue.push({ id: childId, generation: generation + 1 });
              visited.add(childId);
            }
          });
        }
      }
      
      // Assign generation 0 to any unvisited nodes
      people.forEach(person => {
        if (generations[person.id] === undefined) {
          generations[person.id] = 0;
        }
      });
      
      // Group people by generation
      const generationGroups: { [key: number]: Person[] } = {};
      people.forEach(person => {
        const gen = generations[person.id];
        if (!generationGroups[gen]) generationGroups[gen] = [];
        generationGroups[gen].push({ ...person, generation: gen });
      });
      
      // Layout parameters
      const startY = 100;
      const generationSpacing = 150;
      const personSpacing = 180;
      const svgWidth = 800;
      
      // Position people within each generation
      Object.keys(generationGroups).forEach(genKey => {
        const gen = parseInt(genKey);
        const genPeople = generationGroups[gen];
        const genY = startY + (gen * generationSpacing);
        
        // Center the generation horizontally
        const totalWidth = (genPeople.length - 1) * personSpacing;
        const startX = (svgWidth - totalWidth) / 2;
        
        genPeople.forEach((person, index) => {
          person.x = startX + (index * personSpacing);
          person.y = genY;
        });
      });
      
      return people.map(person => {
        const updatedPerson = generationGroups[generations[person.id]]?.find(p => p.id === person.id);
        return updatedPerson || person;
      });
    };
    
    return {
      people: layoutPeople(people, connections),
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
    
    // For parent-child relationships, draw L-shaped connections
    if (connection.type === 'parent-child') {
      const midY = fromPerson.y + (toPerson.y - fromPerson.y) / 2;
      
      return (
        <g>
          {/* Vertical line from parent down */}
          <line
            x1={fromPerson.x}
            y1={fromPerson.y + 40}
            x2={fromPerson.x}
            y2={midY}
            stroke="#6b7280"
            strokeWidth="2"
          />
          {/* Horizontal line across */}
          <line
            x1={fromPerson.x}
            y1={midY}
            x2={toPerson.x}
            y2={midY}
            stroke="#6b7280"
            strokeWidth="2"
          />
          {/* Vertical line to child */}
          <line
            x1={toPerson.x}
            y1={midY}
            x2={toPerson.x}
            y2={toPerson.y - 40}
            stroke="#6b7280"
            strokeWidth="2"
          />
        </g>
      );
    }
    
    // For other relationships, draw straight lines
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
  
  // Calculate dynamic SVG dimensions based on content
  const maxY = Math.max(...people.map(p => p.y)) + 100;
  const svgWidth = 800;
  const svgHeight = Math.max(600, maxY);
  
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
