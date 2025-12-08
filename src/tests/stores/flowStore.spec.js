import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFlowStore } from '@/stores/flowStore'
import { getLayoutElements } from '@/utils/useLayout'

// Helper to create raw data for layout function
function createRawNode(id, parentId = -1, type = 'sendMessage') {
  return {
    id,
    parentId,
    type,
    name: `Node ${id}`,
    data: {}
  }
}

// Helper to create a properly structured node for testing (without layout)
function createTestNode(id, parentId = -1, type = 'sendMessage') {
  return {
    id,
    type: 'custom',
    data: {
      id,
      parentId,
      type,
      name: `Node ${id}`,
      data: {}
    },
    position: { x: 0, y: 0 }
  }
}

describe('flowStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // Test 1: Initial State
  describe('Initial State', () => {
    it('starts with empty nodes array', () => {
      const store = useFlowStore()
      expect(store.nodes).toEqual([])
    })

    it('starts with empty edges array', () => {
      const store = useFlowStore()
      expect(store.edges).toEqual([])
    })
  })

  // Test 2: Set Actions
  describe('Set Actions', () => {
    it('setNodes correctly updates the nodes state', () => {
      const store = useFlowStore()
      const nodes = [
        { id: '1', type: 'custom', data: {} },
        { id: '2', type: 'custom', data: {} }
      ]
      
      store.setNodes(nodes)
      
      expect(store.nodes).toEqual(nodes)
      expect(store.nodes).toHaveLength(2)
    })

    it('setEdges correctly updates the edges state', () => {
      const store = useFlowStore()
      const edges = [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-3', source: '2', target: '3' }
      ]
      
      store.setEdges(edges)
      
      expect(store.edges).toEqual(edges)
      expect(store.edges).toHaveLength(2)
    })

    it('setNodes replaces existing nodes', () => {
      const store = useFlowStore()
      store.setNodes([{ id: '1' }])
      store.setNodes([{ id: '2' }, { id: '3' }])
      
      expect(store.nodes).toHaveLength(2)
      expect(store.nodes[0].id).toBe('2')
    })

    it('setEdges replaces existing edges', () => {
      const store = useFlowStore()
      store.setEdges([{ id: 'e1' }])
      store.setEdges([{ id: 'e2' }, { id: 'e3' }])
      
      expect(store.edges).toHaveLength(2)
      expect(store.edges[0].id).toBe('e2')
    })
  })

  // Test 3: Remove Node
  describe('Remove Node', () => {
    it('removes the node with matching id', () => {
      const store = useFlowStore()
      store.setNodes([
        createTestNode('1', -1, 'trigger'),
        createTestNode('2', '1'),
        createTestNode('3', '1')
      ])
      
      store.removeNode('2')
      
      expect(store.nodes).toHaveLength(2)
      expect(store.nodes.find(n => n.id === '2')).toBeUndefined()
    })

    it('does nothing if node id does not exist', () => {
      const store = useFlowStore()
      store.setNodes([
        createTestNode('1', -1, 'trigger'),
        createTestNode('2', '1')
      ])
      
      store.removeNode('999')
      
      expect(store.nodes).toHaveLength(2)
    })

    it('cascades deletion to child nodes', () => {
      const store = useFlowStore()
      store.setNodes([
        createTestNode('1', -1, 'trigger'),
        createTestNode('2', '1'),
        createTestNode('3', '2'), // child of 2
        createTestNode('4', '1')  // sibling of 2
      ])
      
      store.removeNode('2')
      
      // Node 2 and its child (3) should be removed
      expect(store.nodes).toHaveLength(2)
      expect(store.nodes.find(n => n.id === '2')).toBeUndefined()
      expect(store.nodes.find(n => n.id === '3')).toBeUndefined()
      expect(store.nodes.find(n => n.id === '1')).toBeDefined()
      expect(store.nodes.find(n => n.id === '4')).toBeDefined()
    })
  })

  // Test 4: Re-layout after deletion
  describe('Re-layout After Deletion', () => {
    it('updates isLeaf property on parent after child deletion', () => {
      const store = useFlowStore()
      // Use getLayoutElements to properly set up nodes with isLeaf
      const rawData = [
        createRawNode('1', -1, 'trigger'),
        createRawNode('2', '1')
      ]
      const { nodes, edges } = getLayoutElements(rawData)
      store.setNodes(nodes)
      store.setEdges(edges)
      
      // Initially, node 1 is not a leaf (has child)
      expect(store.nodes.find(n => n.id === '1').data.isLeaf).toBe(false)
      
      store.removeNode('2')
      
      // After removing child, node 1 should become a leaf
      expect(store.nodes.find(n => n.id === '1').data.isLeaf).toBe(true)
    })

    it('recalculates positions after deletion', () => {
      const store = useFlowStore()
      const rawData = [
        createRawNode('1', -1, 'trigger'),
        createRawNode('2', '1'),
        createRawNode('3', '1')
      ]
      const { nodes, edges } = getLayoutElements(rawData)
      store.setNodes(nodes)
      store.setEdges(edges)
      
      store.removeNode('2')
      
      // Positions should be recalculated (node 3 may move)
      const node3 = store.nodes.find(n => n.id === '3')
      expect(node3).toBeDefined()
      // Position should exist and be valid
      expect(node3.position).toBeDefined()
      expect(typeof node3.position.x).toBe('number')
      expect(typeof node3.position.y).toBe('number')
    })

    it('removes edges connected to deleted nodes', () => {
      const store = useFlowStore()
      const rawData = [
        createRawNode('1', -1, 'trigger'),
        createRawNode('2', '1'),
        createRawNode('3', '1')
      ]
      const { nodes, edges } = getLayoutElements(rawData)
      store.setNodes(nodes)
      store.setEdges(edges)
      
      // Should have 2 edges: 1->2 and 1->3
      expect(store.edges.length).toBe(2)
      
      store.removeNode('2')
      
      // Should only have edge 1->3
      expect(store.edges.length).toBe(1)
      expect(store.edges[0].target).toBe('3')
    })
  })

  // Test 5: State Reactivity
  describe('State Reactivity', () => {
    it('nodes array is reactive', () => {
      const store = useFlowStore()
      const initialRef = store.nodes
      
      store.setNodes([{ id: '1' }])
      
      // The reference should be different after update
      expect(store.nodes).not.toBe(initialRef)
    })
  })
})
