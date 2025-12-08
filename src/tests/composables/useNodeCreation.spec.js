import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useNodeCreation } from '@/composables/useNodeCreation'

// Mock the useLayout module
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

describe('useNodeCreation', () => {
    let mockStore
    let mockFitView

    beforeEach(() => {
        mockStore = {
            nodes: [],
            recordState: vi.fn(),
            setNodes: vi.fn(),
            setEdges: vi.fn()
        }
        mockFitView = vi.fn()
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    describe('Initial state', () => {
        it('initializes with modal closed', () => {
            const { isModalOpen } = useNodeCreation(mockStore, mockFitView)
            expect(isModalOpen.value).toBe(false)
        })

        it('initializes with no pending parent', () => {
            const { pendingParentId } = useNodeCreation(mockStore, mockFitView)
            expect(pendingParentId.value).toBe(null)
        })
    })

    describe('openModal', () => {
        it('opens the modal', () => {
            const { openModal, isModalOpen } = useNodeCreation(mockStore, mockFitView)
            
            openModal('parent-1')
            
            expect(isModalOpen.value).toBe(true)
        })

        it('sets the pending parent ID', () => {
            const { openModal, pendingParentId } = useNodeCreation(mockStore, mockFitView)
            
            openModal('parent-1')
            
            expect(pendingParentId.value).toBe('parent-1')
        })

        it('converts numeric parent ID to string', () => {
            const { openModal, pendingParentId } = useNodeCreation(mockStore, mockFitView)
            
            openModal(123)
            
            expect(pendingParentId.value).toBe('123')
        })

        it('handles null parent ID', () => {
            const { openModal, pendingParentId } = useNodeCreation(mockStore, mockFitView)
            
            openModal(null)
            
            expect(pendingParentId.value).toBe(null)
        })
    })

    describe('closeModal', () => {
        it('closes the modal', () => {
            const { openModal, closeModal, isModalOpen } = useNodeCreation(mockStore, mockFitView)
            
            openModal('parent-1')
            closeModal()
            
            expect(isModalOpen.value).toBe(false)
        })

        it('resets pending parent ID', () => {
            const { openModal, closeModal, pendingParentId } = useNodeCreation(mockStore, mockFitView)
            
            openModal('parent-1')
            closeModal()
            
            expect(pendingParentId.value).toBe(null)
        })
    })

    describe('generateId', () => {
        it('generates an ID of default length 6', () => {
            const { generateId } = useNodeCreation(mockStore, mockFitView)
            
            const id = generateId()
            
            expect(id.length).toBe(6)
        })

        it('generates an ID of specified length', () => {
            const { generateId } = useNodeCreation(mockStore, mockFitView)
            
            const id = generateId(4)
            
            expect(id.length).toBe(4)
        })

        it('generates unique IDs', () => {
            const { generateId } = useNodeCreation(mockStore, mockFitView)
            
            const ids = new Set()
            for (let i = 0; i < 100; i++) {
                ids.add(generateId())
            }
            
            expect(ids.size).toBe(100)
        })
    })

    describe('handleCreateNode', () => {
        it('records state before creating node', () => {
            const { handleCreateNode } = useNodeCreation(mockStore, mockFitView)
            
            handleCreateNode({
                type: 'sendMessage',
                title: 'Test Node',
                description: 'Hello',
                parentId: 'parent-1'
            })

            expect(mockStore.recordState).toHaveBeenCalledTimes(1)
        })

        it('creates a sendMessage node with correct structure', () => {
            const { handleCreateNode } = useNodeCreation(mockStore, mockFitView)
            
            handleCreateNode({
                type: 'sendMessage',
                title: 'Test Message',
                description: 'Hello World',
                parentId: 'parent-1'
            })

            expect(mockStore.setNodes).toHaveBeenCalled()
            const setNodesCall = mockStore.setNodes.mock.calls[0][0]
            const createdNode = setNodesCall[0].data
            
            expect(createdNode.type).toBe('sendMessage')
            expect(createdNode.name).toBe('Test Message')
            expect(createdNode.data.payload).toEqual([{ type: 'text', text: 'Hello World' }])
        })

        it('creates an addComment node with correct structure', () => {
            const { handleCreateNode } = useNodeCreation(mockStore, mockFitView)
            
            handleCreateNode({
                type: 'addComment',
                title: 'Test Comment',
                description: 'My comment',
                parentId: 'parent-1'
            })

            expect(mockStore.setNodes).toHaveBeenCalled()
            const setNodesCall = mockStore.setNodes.mock.calls[0][0]
            const createdNode = setNodesCall[0].data
            
            expect(createdNode.type).toBe('addComment')
            expect(createdNode.name).toBe('Test Comment')
            expect(createdNode.data.comment).toBe('My comment')
        })

        it('creates dateTime node with success and failure connectors', () => {
            const { handleCreateNode } = useNodeCreation(mockStore, mockFitView)
            
            handleCreateNode({
                type: 'dateTime',
                title: 'Business Hours',
                parentId: 'parent-1'
            })

            expect(mockStore.setNodes).toHaveBeenCalled()
            const setNodesCall = mockStore.setNodes.mock.calls[0][0]
            
            // Should create 3 nodes: dateTime + success + failure
            expect(setNodesCall.length).toBe(3)
            
            const dateTimeNode = setNodesCall.find(n => n.data.type === 'dateTime')
            const successNode = setNodesCall.find(n => n.data.name === 'Success')
            const failureNode = setNodesCall.find(n => n.data.name === 'Failure')
            
            expect(dateTimeNode).toBeDefined()
            expect(successNode).toBeDefined()
            expect(failureNode).toBeDefined()
            
            expect(dateTimeNode.data.data.times).toHaveLength(5) // Mon-Fri
            expect(dateTimeNode.data.data.timezone).toBe('UTC')
        })

        it('uses pending parent ID over form parent ID', () => {
            const { openModal, handleCreateNode } = useNodeCreation(mockStore, mockFitView)
            
            openModal('pending-parent')
            handleCreateNode({
                type: 'sendMessage',
                title: 'Test',
                description: 'Hello',
                parentId: 'form-parent'
            })

            const setNodesCall = mockStore.setNodes.mock.calls[0][0]
            const createdNode = setNodesCall[0].data
            
            expect(createdNode.parentId).toBe('pending-parent')
        })

        it('resets pending parent ID after creation', () => {
            const { openModal, handleCreateNode, pendingParentId } = useNodeCreation(mockStore, mockFitView)
            
            openModal('parent-1')
            handleCreateNode({
                type: 'sendMessage',
                title: 'Test',
                description: 'Hello'
            })

            expect(pendingParentId.value).toBe(null)
        })

        it('calls fitView for regular nodes after timeout', () => {
            const { handleCreateNode } = useNodeCreation(mockStore, mockFitView)
            
            handleCreateNode({
                type: 'sendMessage',
                title: 'Test',
                description: 'Hello',
                parentId: 'parent-1'
            })

            expect(mockFitView).not.toHaveBeenCalled()
            
            vi.advanceTimersByTime(100)
            
            expect(mockFitView).toHaveBeenCalledTimes(1)
        })

        it('does not call fitView for dateTime nodes', () => {
            const { handleCreateNode } = useNodeCreation(mockStore, mockFitView)
            
            handleCreateNode({
                type: 'dateTime',
                title: 'Business Hours',
                parentId: 'parent-1'
            })

            vi.advanceTimersByTime(200)
            
            expect(mockFitView).not.toHaveBeenCalled()
        })
    })
})

