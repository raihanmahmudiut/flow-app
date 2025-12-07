import { describe, it, expect } from 'vitest'
import { getLayoutElements } from '@/utils/useLayout'

describe('useLayout - getLayoutElements', () => {
  // Test 1: Basic Node Creation
  describe('Basic Node Creation', () => {
    it('converts raw items into valid Vue Flow nodes', () => {
      const rawData = [
        { id: '1', parentId: -1, type: 'trigger', data: { type: 'conversationOpened' } }
      ]
      
      const { nodes } = getLayoutElements(rawData)
      
      expect(nodes).toHaveLength(1)
      expect(nodes[0]).toMatchObject({
        id: '1',
        type: 'custom',
        data: { id: '1', parentId: -1, type: 'trigger', data: { type: 'conversationOpened' } }
      })
    })

    it('handles numeric IDs by converting to string', () => {
      const rawData = [{ id: 1, parentId: -1, type: 'trigger', data: {} }]
      
      const { nodes } = getLayoutElements(rawData)
      
      expect(nodes[0].id).toBe('1')
      expect(typeof nodes[0].id).toBe('string')
    })
  })

  // Test 2: Edge Generation
  describe('Edge Generation', () => {
    it('creates an edge from parent to child when parentId exists', () => {
      const rawData = [
        { id: '1', parentId: -1, type: 'trigger', data: {} },
        { id: '2', parentId: '1', type: 'sendMessage', data: {} }
      ]
      
      const { edges } = getLayoutElements(rawData)
      
      expect(edges).toHaveLength(1)
      expect(edges[0]).toMatchObject({
        id: 'e1-2',
        source: '1',
        target: '2',
        type: 'smoothstep'
      })
    })

    it('creates multiple edges for multiple children', () => {
      const rawData = [
        { id: '1', parentId: -1, type: 'trigger', data: {} },
        { id: '2', parentId: '1', type: 'sendMessage', data: {} },
        { id: '3', parentId: '1', type: 'addComment', data: {} }
      ]
      
      const { edges } = getLayoutElements(rawData)
      
      expect(edges).toHaveLength(2)
      expect(edges.map(e => e.target)).toContain('2')
      expect(edges.map(e => e.target)).toContain('3')
    })
  })

  // Test 3: Layout Coordinates
  describe('Layout Coordinates', () => {
    it('assigns position { x, y } properties to nodes', () => {
      const rawData = [
        { id: '1', parentId: -1, type: 'trigger', data: {} }
      ]
      
      const { nodes } = getLayoutElements(rawData)
      
      expect(nodes[0].position).toBeDefined()
      expect(typeof nodes[0].position.x).toBe('number')
      expect(typeof nodes[0].position.y).toBe('number')
    })

    it('sets targetPosition and sourcePosition on nodes', () => {
      const rawData = [{ id: '1', parentId: -1, type: 'trigger', data: {} }]
      
      const { nodes } = getLayoutElements(rawData)
      
      expect(nodes[0].targetPosition).toBeDefined()
      expect(nodes[0].sourcePosition).toBeDefined()
    })
  })

  // Test 4: Order Independence (Child before Parent)
  describe('Order Independence', () => {
    it('handles child appearing before parent without crashing', () => {
      const rawData = [
        { id: '2', parentId: '1', type: 'sendMessage', data: {} },
        { id: '1', parentId: -1, type: 'trigger', data: {} }
      ]
      
      expect(() => getLayoutElements(rawData)).not.toThrow()
      
      const { nodes, edges } = getLayoutElements(rawData)
      
      expect(nodes).toHaveLength(2)
      expect(edges).toHaveLength(1)
      expect(edges[0].source).toBe('1')
      expect(edges[0].target).toBe('2')
    })
  })

  // Test 5: Orphan/Root Nodes
  describe('Orphan/Root Nodes', () => {
    it('does not generate edge for node with parentId: -1', () => {
      const rawData = [
        { id: '1', parentId: -1, type: 'trigger', data: {} }
      ]
      
      const { edges } = getLayoutElements(rawData)
      
      expect(edges).toHaveLength(0)
    })

    it('does not generate edge for node with parentId: null', () => {
      const rawData = [
        { id: '1', parentId: null, type: 'trigger', data: {} }
      ]
      
      const { edges } = getLayoutElements(rawData)
      
      expect(edges).toHaveLength(0)
    })

    it('does not generate edge for node without parentId', () => {
      const rawData = [
        { id: '1', type: 'trigger', data: {} }
      ]
      
      const { edges } = getLayoutElements(rawData)
      
      expect(edges).toHaveLength(0)
    })
  })

  // Test 6: Empty Array
  describe('Empty Array Handling', () => {
    it('returns empty nodes and edges for empty input', () => {
      const { nodes, edges } = getLayoutElements([])
      
      expect(nodes).toEqual([])
      expect(edges).toEqual([])
    })
  })

  // Test 7: ID Type Coercion
  describe('ID Type Coercion', () => {
    it('handles numeric parentId referencing string ID', () => {
      const rawData = [
        { id: '1', parentId: -1, type: 'trigger', data: {} },
        { id: '2', parentId: 1, type: 'sendMessage', data: {} } // numeric parentId
      ]
      
      const { edges } = getLayoutElements(rawData)
      
      expect(edges).toHaveLength(1)
      expect(edges[0].source).toBe('1')
    })

    it('handles string parentId referencing numeric ID', () => {
      const rawData = [
        { id: 1, parentId: -1, type: 'trigger', data: {} }, // numeric ID
        { id: 2, parentId: '1', type: 'sendMessage', data: {} } // string parentId
      ]
      
      const { edges } = getLayoutElements(rawData)
      
      expect(edges).toHaveLength(1)
      expect(edges[0].source).toBe('1')
      expect(edges[0].target).toBe('2')
    })
  })

  // Test 8: Complex Graph
  describe('Complex Graph', () => {
    it('handles a multi-level tree structure', () => {
      const rawData = [
        { id: '1', parentId: -1, type: 'trigger', data: {} },
        { id: '2', parentId: '1', type: 'dateTime', data: {} },
        { id: '3', parentId: '2', type: 'dateTimeConnector', data: {} },
        { id: '4', parentId: '2', type: 'dateTimeConnector', data: {} },
        { id: '5', parentId: '3', type: 'sendMessage', data: {} }
      ]
      
      const { nodes, edges } = getLayoutElements(rawData)
      
      expect(nodes).toHaveLength(5)
      expect(edges).toHaveLength(4)
    })
  })
})

