import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFlowStore } from '@/stores/flowStore'

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
        { id: '1', data: {} },
        { id: '2', data: {} },
        { id: '3', data: {} }
      ])
      
      store.removeNode('2')
      
      expect(store.nodes).toHaveLength(2)
      expect(store.nodes.find(n => n.id === '2')).toBeUndefined()
    })

    it('does nothing if node id does not exist', () => {
      const store = useFlowStore()
      store.setNodes([{ id: '1' }, { id: '2' }])
      
      store.removeNode('999')
      
      expect(store.nodes).toHaveLength(2)
    })
  })

  // Test 4: Cascading Edge Removal
  describe('Cascading Edge Removal', () => {
    it('removes edges where the deleted node is the source', () => {
      const store = useFlowStore()
      store.setNodes([{ id: '1' }, { id: '2' }, { id: '3' }])
      store.setEdges([
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-3', source: '2', target: '3' }
      ])
      
      store.removeNode('1')
      
      expect(store.edges).toHaveLength(1)
      expect(store.edges[0].id).toBe('e2-3')
    })

    it('removes edges where the deleted node is the target', () => {
      const store = useFlowStore()
      store.setNodes([{ id: '1' }, { id: '2' }, { id: '3' }])
      store.setEdges([
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' }
      ])
      
      store.removeNode('2')
      
      expect(store.edges).toHaveLength(1)
      expect(store.edges[0].target).toBe('3')
    })

    it('removes all edges connected to the deleted node', () => {
      const store = useFlowStore()
      store.setNodes([{ id: '1' }, { id: '2' }, { id: '3' }])
      store.setEdges([
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-3', source: '2', target: '3' }
      ])
      
      store.removeNode('2')
      
      // Both edges should be removed (2 is source of one, target of another)
      expect(store.edges).toHaveLength(0)
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

