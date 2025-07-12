import React from 'react';
import { Person, RelationshipStatus } from '@/types/genogram';

type ImprovedConnectionLinesProps = {
  people: Person[];
  centerX?: number;
  centerY?: number;
  onRelationshipClick?: (fromId: string, toId: string, status: RelationshipStatus) => void;
};

const ImprovedConnectionLines = ({ 
  people, 
  centerX = 400, 
  centerY = 200,
  onRelationshipClick 
}: ImprovedConnectionLinesProps) => {
  
  const getLineStyle = (status: RelationshipStatus = 'married') => {
    switch (status) {
      case 'divorced':
        return { strokeDasharray: '10,5', stroke: '#EF4444' };
      case 'conflicted':
        return { strokeDasharray: '5,5', stroke: '#F59E0B' };
      case 'separated':
        return { strokeDasharray: '15,10', stroke: '#6B7280' };
      default:
        return { stroke: '#374151' };
    }
  };

  const renderPartnershipLine = (person: Person) => {
    if (person.relationship !== 'partner') return null;
    
    const lineStyle = getLineStyle(person.relationshipStatus);
    const lineId = `partnership-ego-${person.id}`;
    
    return (
      <g key={lineId}>
        {/* Sichtbare Linie */}
        <line
          x1={centerX}
          y1={centerY}
          x2={person.position.x}
          y2={person.position.y}
          strokeWidth="3"
          {...lineStyle}
        />
        {/* Unsichtbares, klickbares Rechteck über der Linie */}
        <rect
          x={Math.min(centerX, person.position.x)}
          y={Math.min(centerY, person.position.y) - 10}
          width={Math.abs(person.position.x - centerX)}
          height={20}
          fill="transparent"
          className="cursor-pointer hover:fill-blue-200 hover:fill-opacity-30"
          onClick={() => onRelationshipClick?.('ego', person.id, person.relationshipStatus || 'married')}
        />
      </g>
    );
  };

  const renderParentChildLine = (person: Person) => {
    if (!['mother', 'father', 'child'].includes(person.relationship)) return null;
    
    return (
      <line
        key={`parent-child-${person.id}`}
        x1={centerX}
        y1={centerY}
        x2={person.position.x}
        y2={person.position.y}
        stroke="#6B7280"
        strokeWidth="2"
        className="opacity-70"
      />
    );
  };

  const renderSiblingLine = (person: Person) => {
    if (person.relationship !== 'sibling') return null;
    
    // Suche nach gemeinsamen Eltern
    const parents = people.filter(p => p.relationship === 'mother' || p.relationship === 'father');
    
    if (parents.length > 0) {
      // Linie von Eltern zu Geschwister
      const parentCenter = parents.reduce((acc, parent) => ({
        x: acc.x + parent.position.x / parents.length,
        y: acc.y + parent.position.y / parents.length
      }), { x: 0, y: 0 });
      
      return (
        <line
          key={`sibling-${person.id}`}
          x1={parentCenter.x}
          y1={parentCenter.y}
          x2={person.position.x}
          y2={person.position.y}
          stroke="#6B7280"
          strokeWidth="2"
          className="opacity-70"
        />
      );
    }
    
    // Fallback: Direkte Linie zum Ego
    return (
      <line
        key={`sibling-ego-${person.id}`}
        x1={centerX}
        y1={centerY}
        x2={person.position.x}
        y2={person.position.y}
        stroke="#6B7280"
        strokeWidth="2"
        strokeDasharray="8,4"
        className="opacity-60"
      />
    );
  };

  const renderParentPartnershipLine = () => {
    const mother = people.find(p => p.relationship === 'mother');
    const father = people.find(p => p.relationship === 'father');
    
    if (mother && father) {
      const status = mother.relationshipStatus || father.relationshipStatus || 'married';
      const lineStyle = getLineStyle(status);
      const lineId = `parents-partnership`;
      
      return (
        <g key={lineId}>
          {/* Sichtbare Linie zwischen Eltern */}
          <line
            x1={mother.position.x}
            y1={mother.position.y}
            x2={father.position.x}
            y2={father.position.y}
            strokeWidth="3"
            {...lineStyle}
          />
          {/* Klickbares Rechteck */}
          <rect
            x={Math.min(mother.position.x, father.position.x)}
            y={Math.min(mother.position.y, father.position.y) - 10}
            width={Math.abs(father.position.x - mother.position.x)}
            height={20}
            fill="transparent"
            className="cursor-pointer hover:fill-blue-200 hover:fill-opacity-30"
            onClick={() => onRelationshipClick?.(mother.id, father.id, status)}
          />
        </g>
      );
    }
    
    return null;
  };

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      <g className="pointer-events-auto">
        {/* Partnerschaftslinien (klickbar) */}
        {people.map(person => renderPartnershipLine(person))}
        
        {/* Eltern-Partnerschaftslinie (klickbar) */}
        {renderParentPartnershipLine()}
        
        {/* Andere Verbindungslinien (nicht klickbar) */}
        <g className="pointer-events-none">
          {people.map(person => renderParentChildLine(person))}
          {people.map(person => renderSiblingLine(person))}
        </g>
      </g>
    </svg>
  );
};

export default ImprovedConnectionLines;