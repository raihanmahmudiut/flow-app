import dagre from "dagre"
import { Position } from '@vue-flow/core'

export function getLayoutElements(rawData) {
    const dagreGraph = new dagre.graphlib.Graph()

    dagreGraph.setDefaultEdgeLabel(() => ({}))
    
    dagreGraph.setGraph({ rankdir: 'TB' })
    
    const nodes = []
    const edges = []

    rawData.forEach((item) => {
        // A. Create the Node
        const node = {
          id: item.id.toString(),
          type: 'custom',
          data: { ...item },
          position: { x: 0, y: 0 },
        };
        
        nodes.push(node);
        dagreGraph.setNode(node.id, { width: 250, height: 100 });
        
        if (item.parentId && item.parentId !== -1) {
          const edgeId = `e${item.parentId}-${item.id}`;
          const edge = {
            id: edgeId,
            source: item.parentId.toString(),
            target: item.id.toString(),
            type: 'smoothstep', // Nice curved lines
          };
          edges.push(edge);
          dagreGraph.setEdge(edge.source, edge.target);
        }
      });
    
    dagre.layout(dagreGraph)

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id)
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - 125,
                y: nodeWithPosition.y - 50
            },
            targetPosition: Position.Top,
            sourcePosition: Position.Bottom
        }

    })

    return {nodes: layoutedNodes, edges}
}