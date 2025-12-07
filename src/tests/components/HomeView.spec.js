import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import { ref } from 'vue'
import HomeView from '@/views/HomeView.vue'
import { useFlowStore } from '@/stores/flowStore'

// Mock Vue Query
vi.mock('@tanstack/vue-query', () => ({
  useQuery: vi.fn(() => ({
    data: ref(null),
    isLoading: ref(false),
    isError: ref(false)
  }))
}))

// Mock Vue Flow
vi.mock('@vue-flow/core', () => ({
  VueFlow: {
    name: 'VueFlow',
    template: '<div class="vue-flow-mock"><slot /></div>',
    props: ['nodes', 'edges', 'nodeTypes', 'edgeTypes', 'defaultViewport', 'fitViewOnInit', 'selectNodesOnDrag', 'nodesFocusable', 'edgesFocusable']
  },
  useVueFlow: vi.fn(() => ({
    fitView: vi.fn(),
    onNodeClick: vi.fn(),
    onNodeDragStart: vi.fn(),
    onNodeDragStop: vi.fn(),
    getSelectedNodes: ref([])
  })),
  Position: {
    Top: 'top',
    Bottom: 'bottom',
    Left: 'left',
    Right: 'right'
  }
}))

vi.mock('@vue-flow/background', () => ({
  Background: { template: '<div class="background-mock"></div>' }
}))

vi.mock('@vue-flow/controls', () => ({
  Controls: { template: '<div class="controls-mock"></div>' }
}))

// Import the mocked modules
import { useQuery } from '@tanstack/vue-query'
import { useVueFlow } from '@vue-flow/core'

const createMockRouter = () => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { 
        path: '/', 
        name: 'home', 
        component: HomeView,
        children: [
          { path: 'node/:id', name: 'node-details', component: { template: '<div>Node</div>' } }
        ]
      }
    ]
  })
}

describe('HomeView', () => {
  let mockFitView
  let mockOnNodeClick
  let mockOnNodeDragStart
  let mockOnNodeDragStop
  let nodeClickCallback

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockFitView = vi.fn()
    mockOnNodeClick = vi.fn((callback) => {
      nodeClickCallback = callback
    })
    mockOnNodeDragStart = vi.fn()
    mockOnNodeDragStop = vi.fn()
    
    useVueFlow.mockReturnValue({
      fitView: mockFitView,
      onNodeClick: mockOnNodeClick,
      onNodeDragStart: mockOnNodeDragStart,
      onNodeDragStop: mockOnNodeDragStop,
      getSelectedNodes: ref([])
    })
  })

  const mountHome = async (queryState = {}) => {
    useQuery.mockReturnValue({
      data: ref(queryState.data || null),
      isLoading: ref(queryState.isLoading || false),
      isError: ref(queryState.isError || false)
    })

    const router = createMockRouter()
    await router.push('/')
    await router.isReady()

    return mount(HomeView, {
      global: {
        plugins: [
          router,
          createTestingPinia({
            initialState: {
              flow: { nodes: [], edges: [] }
            },
            stubActions: false
          })
        ],
        stubs: {
          CreateNodeModal: { template: '<div class="modal-stub"></div>' },
          VProgressCircular: { template: '<div class="progress-stub">Loading...</div>' },
          VBtn: { template: '<button><slot /></button>' },
          VBtnGroup: { template: '<div class="btn-group"><slot /></div>' },
          VIcon: { template: '<i></i>' }
        }
      }
    })
  }

  // Test 1: Loading State
  describe('Loading State', () => {
    it('shows loading indicator when isLoading is true', async () => {
      const wrapper = await mountHome({ isLoading: true })
      await flushPromises()
      
      expect(wrapper.find('.progress-stub').exists()).toBe(true)
    })
  })

  // Test 2: Error State
  describe('Error State', () => {
    it('shows error message when isError is true', async () => {
      const wrapper = await mountHome({ isError: true })
      await flushPromises()
      
      expect(wrapper.text()).toContain('Failed to load flow data')
    })
  })

  // Test 3: Success State
  describe('Success State', () => {
    it('shows VueFlow when data is loaded', async () => {
      const wrapper = await mountHome({ 
        data: [{ id: '1', parentId: -1, type: 'trigger', data: {} }],
        isLoading: false,
        isError: false
      })
      await flushPromises()
      
      expect(wrapper.find('.vue-flow-mock').exists()).toBe(true)
    })

    it('shows toolbar when loaded', async () => {
      const wrapper = await mountHome({ isLoading: false, isError: false })
      await flushPromises()
      
      expect(wrapper.find('.toolbar').exists()).toBe(true)
    })

    it('shows keyboard help when loaded', async () => {
      const wrapper = await mountHome({ isLoading: false, isError: false })
      await flushPromises()
      
      expect(wrapper.find('.keyboard-help').exists()).toBe(true)
    })
  })

  // Test 4: Node Click Handler
  describe('Node Click Navigation', () => {
    it('registers onNodeClick handler', async () => {
      await mountHome()
      await flushPromises()
      
      expect(mockOnNodeClick).toHaveBeenCalled()
    })
  })

  // Test 5: Modal State
  describe('Modal State', () => {
    it('starts with modal closed', async () => {
      const wrapper = await mountHome({ isLoading: false, isError: false })
      await flushPromises()
      
      expect(wrapper.vm.isModalOpen).toBe(false)
    })

    it('can open modal programmatically', async () => {
      const wrapper = await mountHome({ isLoading: false, isError: false })
      await flushPromises()
      
      wrapper.vm.isModalOpen = true
      expect(wrapper.vm.isModalOpen).toBe(true)
    })
  })

  // Test 6: handleCreateNode
  describe('handleCreateNode', () => {
    it('calls store setNodes and setEdges when creating a node', async () => {
      const wrapper = await mountHome({ isLoading: false, isError: false })
      await flushPromises()
      
      const store = useFlowStore()
      store.nodes = [
        { id: '1', data: { id: '1', parentId: -1, type: 'trigger', data: {} } }
      ]
      
      wrapper.vm.handleCreateNode({
        title: 'New Node',
        description: 'Test description',
        type: 'sendMessage',
        parentId: '1'
      })
      
      expect(store.setNodes).toHaveBeenCalled()
      expect(store.setEdges).toHaveBeenCalled()
    })

    it('calls fitView after creating node', async () => {
      vi.useFakeTimers()
      
      const wrapper = await mountHome({ isLoading: false, isError: false })
      await flushPromises()
      
      wrapper.vm.handleCreateNode({
        title: 'New Node',
        description: 'Test',
        type: 'sendMessage',
        parentId: '1'
      })
      
      vi.advanceTimersByTime(150)
      
      expect(mockFitView).toHaveBeenCalled()
      
      vi.useRealTimers()
    })
  })

  // Test 7: Node Types
  describe('Node Types', () => {
    it('configures custom node type', async () => {
      const wrapper = await mountHome({ isLoading: false, isError: false })
      await flushPromises()
      
      expect(wrapper.vm.nodeTypes).toHaveProperty('custom')
    })

    it('configures edge types', async () => {
      const wrapper = await mountHome({ isLoading: false, isError: false })
      await flushPromises()
      
      expect(wrapper.vm.edgeTypes).toHaveProperty('smoothstep')
    })
  })

  // Test 8: Undo/Redo
  describe('Undo/Redo', () => {
    it('has canUndo computed property', async () => {
      const wrapper = await mountHome({ isLoading: false, isError: false })
      await flushPromises()
      
      expect(wrapper.vm.canUndo).toBeDefined()
    })

    it('has canRedo computed property', async () => {
      const wrapper = await mountHome({ isLoading: false, isError: false })
      await flushPromises()
      
      expect(wrapper.vm.canRedo).toBeDefined()
    })
  })

  // Test 9: Add Child Node Handler
  describe('Add Child Node', () => {
    it('has handleAddChildNode function', async () => {
      const wrapper = await mountHome({ isLoading: false, isError: false })
      await flushPromises()
      
      expect(typeof wrapper.vm.handleAddChildNode).toBe('function')
    })

    it('sets pendingParentId and opens modal when adding child node', async () => {
      const wrapper = await mountHome({ isLoading: false, isError: false })
      await flushPromises()
      
      wrapper.vm.handleAddChildNode({ parentId: 'test-id' })
      
      expect(wrapper.vm.pendingParentId).toBe('test-id')
      expect(wrapper.vm.isModalOpen).toBe(true)
    })
  })

  // Test 10: Add Node On Edge Handler
  describe('Add Node On Edge', () => {
    it('has handleAddNodeOnEdge function', async () => {
      const wrapper = await mountHome({ isLoading: false, isError: false })
      await flushPromises()
      
      expect(typeof wrapper.vm.handleAddNodeOnEdge).toBe('function')
    })

    it('sets pendingParentId from sourceId when adding node on edge', async () => {
      const wrapper = await mountHome({ isLoading: false, isError: false })
      await flushPromises()
      
      wrapper.vm.handleAddNodeOnEdge({ sourceId: 'source-id', targetId: 'target-id' })
      
      expect(wrapper.vm.pendingParentId).toBe('source-id')
      expect(wrapper.vm.isModalOpen).toBe(true)
    })
  })
})
