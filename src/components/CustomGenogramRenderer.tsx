
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
      
      const generations: { [key: string]: number } = {};
      const visited = new Set<string>();
      
      const roots = people.filter(person => !parentsOf[person.id] || parentsOf[person.id].length === 0);
      
      if (roots.length === 0 && people.length > 0) {
        roots.push(people[0]);
      }
      
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
      
      people.forEach(person => {
        if (generations[person.id] === undefined) {
          generations[person.id] = 0;
        }
      });
      
      const generationGroups: { [key: number]: Person[] } = {};
      people.forEach(person => {
        const gen = generations[person.id];
        if (!generationGroups[gen]) generationGroups[gen] = [];
        generationGroups[gen].push({ ...person, generation: gen });
      });
      
      const startY = 100;
      const generationSpacing = 150;
      const personSpacing = 180;
      const svgWidth = 800;
      
      Object.keys(generationGroups).forEach(genKey => {
        const gen = parseInt(genKey);
        const genPeople = generationGroups[gen];
        const genY = startY + (gen * generationSpacing);
        
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

  // Identify partner relationships and family structures
  const identifyFamilyStructures = (people: Person[], connections: Connection[]) => {
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

    // Find partner relationships (people who share children)
    const partnerPairs: { parent1: Person; parent2: Person; children: Person[] }[] = [];
    const processedParents = new Set<string>();

    people.forEach(person => {
      if (processedParents.has(person.id)) return;
      
      const children = childrenOf[person.id] || [];
      if (children.length === 0) return;

      // Find potential partners (other parents of the same children)
      const potentialPartners = people.filter(other => 
        other.id !== person.id && 
        !processedParents.has(other.id) &&
        children.some(childId => (childrenOf[other.id] || []).includes(childId))
      );

      if (potentialPartners.length > 0) {
        const partner = potentialPartners[0];
        const sharedChildren = children.filter(childId => 
          (childrenOf[partner.id] || []).includes(childId)
        );
        
        if (sharedChildren.length > 0) {
          partnerPairs.push({
            parent1: person,
            parent2: partner,
            children: sharedChildren.map(childId => people.find(p => p.id === childId)!).filter(Boolean)
          });
          
          processedParents.add(person.id);
          processedParents.add(partner.id);
        }
      }
    });

    return { partnerPairs, childrenOf, parentsOf };
  };

  const { people, connections } = parseGenogram(mermaidCode);
  const { partnerPairs, childrenOf } = identifyFamilyStructures(people, connections);
  
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
  
  const FamilyConnections = () => {
    const connectionElements: JSX.Element[] = [];

    partnerPairs.forEach((family, familyIndex) => {
      const { parent1, parent2, children } = family;
      
      // 1. Partner connection (horizontal line between parents)
      connectionElements.push(
        <line
          key={`partner-${familyIndex}`}
          x1={parent1.x}
          y1={parent1.y}
          x2={parent2.x}
          y2={parent2.y}
          stroke="#6b7280"
          strokeWidth="2"
        />
      );

      if (children.length > 0) {
        // 2. Find midpoint of partner line
        const midX = (parent1.x + parent2.x) / 2;
        const parentY = parent1.y; // Assuming both parents are on same level
        const childrenY = children[0].y; // All children should be on same generation
        
        // Calculate sibling line position
        const siblingLineY = parentY + (childrenY - parentY) / 2;
        
        // 3. Sibling line (horizontal line connecting all children)
        if (children.length > 1) {
          const leftmostChild = Math.min(...children.map(c => c.x));
          const rightmostChild = Math.max(...children.map(c => c.x));
          
          connectionElements.push(
            <line
              key={`sibling-line-${familyIndex}`}
              x1={leftmostChild}
              y1={siblingLineY}
              x2={rightmostChild}
              y2={siblingLineY}
              stroke="#6b7280"
              strokeWidth="2"
            />
          );
        } else {
          // For single child, create a small horizontal line at the child's x position
          connectionElements.push(
            <line
              key={`sibling-line-${familyIndex}`}
              x1={children[0].x - 20}
              y1={siblingLineY}
              x2={children[0].x + 20}
              y2={siblingLineY}
              stroke="#6b7280"
              strokeWidth="2"
            />
          );
        }

        // 4. Single vertical line from parent midpoint to sibling line
        connectionElements.push(
          <line
            key={`parent-to-children-${familyIndex}`}
            x1={midX}
            y1={parentY + 40} // Start just below parent symbols
            x2={midX}
            y2={siblingLineY}
            stroke="#6b7280"
            strokeWidth="2"
          />
        );

        // 5. Individual lines from sibling line to each child
        children.forEach((child, childIndex) => {
          connectionElements.push(
            <line
              key={`child-${familyIndex}-${childIndex}`}
              x1={child.x}
              y1={siblingLineY}
              x2={child.x}
              y2={child.y - 40} // Stop just above child symbol
              stroke="#6b7280"
              strokeWidth="2"
            />
          );
        });
      }
    });

    // Handle single parents (no partner but have children)
    people.forEach(person => {
      const children = childrenOf[person.id] || [];
      const hasPartner = partnerPairs.some(pair => 
        pair.parent1.id === person.id || pair.parent2.id === person.id
      );
      
      if (children.length > 0 && !hasPartner) {
        const childrenPersons = children.map(childId => 
          people.find(p => p.id === childId)!
        ).filter(Boolean);
        
        if (childrenPersons.length > 0) {
          const childrenY = childrenPersons[0].y;
          const siblingLineY = person.y + (childrenY - person.y) / 2;
          
          // Sibling line for single parent's children
          if (childrenPersons.length > 1) {
            const leftmostChild = Math.min(...childrenPersons.map(c => c.x));
            const rightmostChild = Math.max(...childrenPersons.map(c => c.x));
            
            connectionElements.push(
              <line
                key={`single-sibling-line-${person.id}`}
                x1={leftmostChild}
                y1={siblingLineY}
                x2={rightmostChild}
                y2={siblingLineY}
                stroke="#6b7280"
                strokeWidth="2"
              />
            );
          } else {
            // For single child, create a small horizontal line at the child's x position
            connectionElements.push(
              <line
                key={`single-sibling-line-${person.id}`}
                x1={childrenPersons[0].x - 20}
                y1={siblingLineY}
                x2={childrenPersons[0].x + 20}
                y2={siblingLineY}
                stroke="#6b7280"
                strokeWidth="2"
              />
            );
          }

          // Single vertical line from parent to sibling line
          connectionElements.push(
            <line
              key={`single-parent-${person.id}`}
              x1={person.x}
              y1={person.y + 40}
              x2={person.x}
              y2={siblingLineY}
              stroke="#6b7280"
              strokeWidth="2"
            />
          );

          // Lines from sibling line to each child
          childrenPersons.forEach((child, childIndex) => {
            connectionElements.push(
              <line
                key={`single-child-${person.id}-${childIndex}`}
                x1={child.x}
                y1={siblingLineY}
                x2={child.x}
                y2={child.y - 40}
                stroke="#6b7280"
                strokeWidth="2"
              />
            );
          });
        }
      }
    });

    return <>{connectionElements}</>;
  };
  
  // Calculate dynamic SVG dimensions based on content
  const maxY = Math.max(...people.map(p => p.y)) + 100;
  const svgWidth = 800;
  const svgHeight = Math.max(600, maxY);
  
  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg width={svgWidth} height={svgHeight} className="border rounded-lg bg-white">
        {/* Render family connections */}
        <FamilyConnections />
        
        {/* Render people nodes */}
        {people.map(person => (
          <PersonNode key={person.id} person={person} />
        ))}
      </svg>
    </div>
  );
};

export default CustomGenogramRenderer;
