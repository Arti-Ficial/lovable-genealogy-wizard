
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
    const invisibleNodes = new Set<string>();
    
    // Parse style definitions to determine gender and invisible nodes
    lines.forEach(line => {
      if (line.includes('shape:circle')) {
        const styleMatch = line.match(/style\s+(\w+)\s+shape:circle/);
        if (styleMatch) {
          genderMap[styleMatch[1]] = 'female';
        }
      }
      
      // Detect invisible nodes (usually for partnership midpoints)
      if (line.includes('fill:none,stroke:none')) {
        const invisibleMatch = line.match(/style\s+(\w+)\s+fill:none,stroke:none/);
        if (invisibleMatch) {
          invisibleNodes.add(invisibleMatch[1]);
        }
      }
    });
    
    // Parse visible people nodes
    lines.forEach(line => {
      const nodeMatch = line.match(/(\w+)\[([^\]]+)\]|\w+\(([^)]+)\)/);
      if (nodeMatch) {
        const id = nodeMatch[1] || line.match(/(\w+)\(/)?.[1];
        const name = nodeMatch[2] || nodeMatch[3];
        
        // Skip invisible nodes
        if (!id || invisibleNodes.has(id)) return;
        
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
    
    // Parse connections - handle chains like p1 --- p1_2 --- p2
    lines.forEach(line => {
      // Handle partnership chains: p1 --- invisible --- p2
      const chainMatch = line.match(/(\w+)\s*---\s*(\w+)\s*---\s*(\w+)/);
      if (chainMatch) {
        const person1 = chainMatch[1];
        const invisible = chainMatch[2];
        const person2 = chainMatch[3];
        
        // If middle node is invisible, create direct partnership
        if (invisibleNodes.has(invisible)) {
          connections.push({
            from: person1,
            to: person2,
            type: 'partner'
          });
          
          // Store the invisible node for parent-child connections
          connections.push({
            from: invisible,
            to: 'MIDPOINT',
            type: 'partner'
          });
        }
      }
      
      // Handle direct partnerships
      const partnerMatch = line.match(/^(\w+)\s*---\s*(\w+)$/);
      if (partnerMatch && !line.includes('---') || line.split('---').length === 2) {
        const from = partnerMatch[1];
        const to = partnerMatch[2];
        
        // Only add if both are visible people
        if (!invisibleNodes.has(from) && !invisibleNodes.has(to)) {
          connections.push({
            from,
            to,
            type: 'partner'
          });
        }
      }
      
      // Parent-child relationships (invisible --> child)
      const parentChildMatch = line.match(/(\w+)\s*-->\s*(\w+)/);
      if (parentChildMatch) {
        const from = parentChildMatch[1];
        const to = parentChildMatch[2];
        
        // If parent is invisible, it represents a partnership
        if (invisibleNodes.has(from)) {
          connections.push({
            from: from,
            to: to,
            type: 'parent-child'
          });
        } else {
          connections.push({
            from,
            to,
            type: 'parent-child'
          });
        }
      }
    });
    
    // Create hierarchical layout with special handling for partner arrangements
    const layoutPeople = (people: Person[], connections: Connection[]) => {
      // Find generations based on invisible parent-child relationships
      const generations: { [key: string]: number } = {};
      const invisibleToChildren: { [key: string]: string[] } = {};
      
      // First pass: collect invisible parent connections
      connections.forEach(conn => {
        if (conn.type === 'parent-child') {
          const isInvisibleParent = conn.from.includes('_') || !people.find(p => p.id === conn.from);
          if (isInvisibleParent) {
            if (!invisibleToChildren[conn.from]) invisibleToChildren[conn.from] = [];
            invisibleToChildren[conn.from].push(conn.to);
          }
        }
      });
      
      // Assign generations starting from people with no invisible parents
      const hasInvisibleParent = new Set<string>();
      Object.values(invisibleToChildren).flat().forEach(childId => {
        hasInvisibleParent.add(childId);
      });
      
      // Find root generation (no invisible parents)
      people.forEach(person => {
        if (!hasInvisibleParent.has(person.id)) {
          generations[person.id] = 0; // Root generation
        }
      });
      
      // Set children generation
      Object.values(invisibleToChildren).flat().forEach(childId => {
        const child = people.find(p => p.id === childId);
        if (child) {
          generations[child.id] = 1; // Children are generation 1
        }
      });
      
      // Handle any remaining people without generations
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
      const generationSpacing = 180;
      const svgWidth = 800;
      
      // Position each generation
      Object.keys(generationGroups).forEach(genKey => {
        const gen = parseInt(genKey);
        const genPeople = generationGroups[gen];
        const genY = startY + (gen * generationSpacing);
        
        if (gen === 0) {
          // For root generation, arrange partners side by side
          const partnerPairs: Person[][] = [];
          const processedPeople = new Set<string>();
          
          // Group partners together
          connections.forEach(conn => {
            if (conn.type === 'partner') {
              const person1 = genPeople.find(p => p.id === conn.from);
              const person2 = genPeople.find(p => p.id === conn.to);
              
              if (person1 && person2 && !processedPeople.has(person1.id) && !processedPeople.has(person2.id)) {
                partnerPairs.push([person1, person2]);
                processedPeople.add(person1.id);
                processedPeople.add(person2.id);
              }
            }
          });
          
          // Add singles
          genPeople.forEach(person => {
            if (!processedPeople.has(person.id)) {
              partnerPairs.push([person]);
            }
          });
          
          // Position partner pairs
          const pairSpacing = 200;
          const partnerSpacing = 80;
          const totalPairWidth = (partnerPairs.length - 1) * pairSpacing;
          const startX = (svgWidth - totalPairWidth) / 2;
          
          partnerPairs.forEach((pair, pairIndex) => {
            const pairCenterX = startX + (pairIndex * pairSpacing);
            
            if (pair.length === 2) {
              // Partner pair
              pair[0].x = pairCenterX - partnerSpacing / 2;
              pair[0].y = genY;
              pair[1].x = pairCenterX + partnerSpacing / 2;
              pair[1].y = genY;
            } else {
              // Single person
              pair[0].x = pairCenterX;
              pair[0].y = genY;
            }
          });
        } else {
          // For other generations, simple horizontal arrangement
          const personSpacing = 120;
          const totalWidth = (genPeople.length - 1) * personSpacing;
          const startX = (svgWidth - totalWidth) / 2;
          
          genPeople.forEach((person, index) => {
            person.x = startX + (index * personSpacing);
            person.y = genY;
          });
        }
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
    const invisibleToChildren: { [key: string]: string[] } = {};
    
    // Process all connections
    connections.forEach(conn => {
      if (conn.type === 'parent-child') {
        // Check if parent is an invisible node (partnership midpoint)
        const isInvisibleParent = conn.from.includes('_') || !people.find(p => p.id === conn.from);
        
        if (isInvisibleParent) {
          // Store children of invisible partnership nodes
          if (!invisibleToChildren[conn.from]) invisibleToChildren[conn.from] = [];
          invisibleToChildren[conn.from].push(conn.to);
          
          // Also track parents for the child
          if (!parentsOf[conn.to]) parentsOf[conn.to] = [];
          parentsOf[conn.to].push(conn.from);
        } else {
          // Normal parent-child relationship
          if (!childrenOf[conn.from]) childrenOf[conn.from] = [];
          if (!parentsOf[conn.to]) parentsOf[conn.to] = [];
          
          childrenOf[conn.from].push(conn.to);
          parentsOf[conn.to].push(conn.from);
        }
      }
    });

    // Find partner relationships
    const partnerPairs: { parent1: Person; parent2: Person; children: Person[] }[] = [];
    const processedParents = new Set<string>();

    // First, handle explicit partnerships
    connections.forEach(conn => {
      if (conn.type === 'partner') {
        const person1 = people.find(p => p.id === conn.from);
        const person2 = people.find(p => p.id === conn.to);
        
        if (person1 && person2 && !processedParents.has(person1.id) && !processedParents.has(person2.id)) {
          // Find their children by looking for invisible partnership nodes
          const childrenIds: string[] = [];
          
          // Look for all possible invisible node patterns that could represent this partnership
          Object.keys(invisibleToChildren).forEach(invisibleNode => {
            // Check if this invisible node represents the partnership
            // It could be p1_2, p1_p2, etc.
            const hasFirstInitial = invisibleNode.includes(person1.id.charAt(0).toLowerCase()) || invisibleNode.includes(person1.id);
            const hasSecondInitial = invisibleNode.includes(person2.id.charAt(0).toLowerCase()) || invisibleNode.includes(person2.id);
            
            if (hasFirstInitial && hasSecondInitial) {
              childrenIds.push(...invisibleToChildren[invisibleNode]);
            }
          });
          
          const childrenPersons = childrenIds.map(childId => people.find(p => p.id === childId)).filter(Boolean) as Person[];
          
          // Only create partnership if they have children or if explicitly connected
          if (childrenPersons.length > 0) {
            partnerPairs.push({
              parent1: person1,
              parent2: person2,
              children: childrenPersons
            });
            
            processedParents.add(person1.id);
            processedParents.add(person2.id);
          }
        }
      }
    });

    // Handle remaining partnerships by shared children
    people.forEach(person => {
      if (processedParents.has(person.id)) return;
      
      const children = childrenOf[person.id] || [];
      if (children.length === 0) return;

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

    return { partnerPairs, childrenOf, parentsOf, invisibleToChildren };
  };

  const { people, connections } = parseGenogram(mermaidCode);
  const { partnerPairs, childrenOf, invisibleToChildren } = identifyFamilyStructures(people, connections);
  
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
        {/* Render ONLY our custom family connections - NO direct connections */}
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
