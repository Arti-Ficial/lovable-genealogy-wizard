import dagre from 'dagre';

export type GenogramNode = {
  id: string;
  name: string;
  shape: 'circle' | 'rect';
  isEgo?: boolean;
};

export type GenogramRelationship = {
  from: string;
  to: string;
  type: 'partner' | 'parent-child' | 'sibling';
};

export type GenogramInput = {
  persons: Array<{
    id: number;
    name: string;
    gender: 'male' | 'female';
    isEgo?: boolean;
  }>;
  relationships: Array<{
    from: number;
    to: number;
    type: 'partner' | 'parent-child' | 'sibling';
  }>;
};

export type GenogramLayoutResult = {
  nodes: Array<{
    id: string;
    name: string;
    shape: 'circle' | 'rect';
    x: number;
    y: number;
    isEgo?: boolean;
  }>;
  lines: Array<{
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    type: string;
  }>;
};

export function calculateGenogramLayout(input: GenogramInput): GenogramLayoutResult {
  // Create a new directed graph
  const g = new dagre.graphlib.Graph();
  
  // Set graph attributes
  g.setGraph({
    rankdir: 'TB', // Top to bottom layout
    nodesep: 100,  // Horizontal spacing between nodes
    ranksep: 120,  // Vertical spacing between ranks
    marginx: 50,
    marginy: 50
  });
  
  // Set default edge and node attributes
  g.setDefaultEdgeLabel(() => ({}));
  g.setDefaultNodeLabel(() => ({}));
  
  // Add nodes to the graph
  input.persons.forEach(person => {
    g.setNode(person.id.toString(), {
      label: person.name,
      width: 80,
      height: 80,
      shape: person.gender === 'male' ? 'rect' : 'circle'
    });
  });
  
  // Add edges to the graph
  input.relationships.forEach(rel => {
    // For dagre, we need to determine the direction of parent-child relationships
    if (rel.type === 'parent-child') {
      // Parent points to child
      g.setEdge(rel.from.toString(), rel.to.toString(), { type: rel.type });
    } else {
      // For partner and sibling relationships, add undirected edges
      g.setEdge(rel.from.toString(), rel.to.toString(), { type: rel.type });
    }
  });
  
  // Calculate layout
  dagre.layout(g);
  
  // Extract nodes with calculated positions
  const nodes = g.nodes().map(nodeId => {
    const node = g.node(nodeId);
    const person = input.persons.find(p => p.id.toString() === nodeId);
    
    return {
      id: nodeId,
      name: node.label,
      shape: node.shape as 'circle' | 'rect',
      x: node.x,
      y: node.y,
      isEgo: person?.isEgo || false
    };
  });
  
  // Extract edges with calculated positions
  const lines = g.edges().map(edgeId => {
    const edge = g.edge(edgeId);
    const sourceNode = g.node(edgeId.v);
    const targetNode = g.node(edgeId.w);
    
    // Calculate line positions from node centers
    return {
      fromX: sourceNode.x,
      fromY: sourceNode.y,
      toX: targetNode.x,
      toY: targetNode.y,
      type: edge.type || 'default'
    };
  });
  
  return { nodes, lines };
}