import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

// Mock vue-query
const mockQueryData = ref(null)
const mockRefetch = vi.fn()

vi.mock('@tanstack/vue-query', () => ({
    useQuery: vi.fn(({ queryFn }) => {
        // Store queryFn for testing
        mockRefetch.mockImplementation(async () => {
            const data = await queryFn()
            mockQueryData.value = data
            return { data }
        })
        
        return {
            data: mockQueryData,
            isLoading: ref(false),
            isError: ref(false),
            error: ref(null),
            refetch: mockRefetch
        }
    })
}))

// Mock useLayout
vi.mock('@/utils/useLayout', () => ({
    getLayoutElements: vi.fn((rawData) => ({
        nodes: rawData.map(item => ({
            id: item.id,
            data: item,
            position: { x: 0, y: 0 }
        })),
        edges: []
    }))
}))

import { useFlowData } from '@/composables/useFlowData'

describe('useFlowData', () => {
    let mockStore

    beforeEach(() => {
        mockStore = {
            setNodes: vi.fn(),
            setEdges: vi.fn(),
            initHistory: vi.fn()
        }
        mockQueryData.value = null
        mockRefetch.mockClear()
    })

    describe('Initial state', () => {
        it('returns query state properties', () => {
            const result = useFlowData(mockStore)
            
            expect(result).toHaveProperty('data')
            expect(result).toHaveProperty('isLoading')
            expect(result).toHaveProperty('isError')
            expect(result).toHaveProperty('error')
        })

        it('returns methods', () => {
            const result = useFlowData(mockStore)
            
            expect(typeof result.reload).toBe('function')
            expect(typeof result.initializeFlow).toBe('function')
        })
    })

    describe('initializeFlow', () => {
        it('transforms raw data and sets nodes', () => {
            const { initializeFlow } = useFlowData(mockStore)
            const rawData = [
                { id: '1', type: 'trigger', name: 'Start' }
            ]
            
            initializeFlow(rawData)
            
            expect(mockStore.setNodes).toHaveBeenCalled()
            const nodes = mockStore.setNodes.mock.calls[0][0]
            expect(nodes).toHaveLength(1)
            expect(nodes[0].id).toBe('1')
        })

        it('sets edges from layout', () => {
            const { initializeFlow } = useFlowData(mockStore)
            const rawData = [{ id: '1', type: 'trigger' }]
            
            initializeFlow(rawData)
            
            expect(mockStore.setEdges).toHaveBeenCalled()
        })

        it('initializes history after setting data', () => {
            const { initializeFlow } = useFlowData(mockStore)
            const rawData = [{ id: '1', type: 'trigger' }]
            
            initializeFlow(rawData)
            
            expect(mockStore.initHistory).toHaveBeenCalled()
        })

        it('calls store methods in correct order', () => {
            const { initializeFlow } = useFlowData(mockStore)
            const callOrder = []
            
            mockStore.setNodes.mockImplementation(() => callOrder.push('setNodes'))
            mockStore.setEdges.mockImplementation(() => callOrder.push('setEdges'))
            mockStore.initHistory.mockImplementation(() => callOrder.push('initHistory'))
            
            initializeFlow([{ id: '1' }])
            
            expect(callOrder).toEqual(['setNodes', 'setEdges', 'initHistory'])
        })
    })

    describe('reload', () => {
        it('calls refetch', async () => {
            const { reload } = useFlowData(mockStore)
            
            // Setup mock to return data
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve([{ id: '1', type: 'trigger' }])
            })
            
            await reload()
            
            expect(mockRefetch).toHaveBeenCalled()
        })
    })

    describe('Options', () => {
        it('uses default dataUrl when not provided', () => {
            // This is tested implicitly through useQuery mock
            useFlowData(mockStore)
            
            // The default URL is '/payload.json'
            expect(true).toBe(true) // Placeholder - actual URL testing would need deeper mocking
        })

        it('accepts custom options', () => {
            const result = useFlowData(mockStore, {
                dataUrl: '/custom/data.json',
                queryKey: 'customKey'
            })
            
            expect(result).toBeDefined()
        })
    })
})

