import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useNodeEditor } from '@/composables/useNodeEditor'

// Mock vue-router
const mockRouteParams = ref({ id: '1' })
const mockPush = vi.fn()

vi.mock('vue-router', () => ({
    useRoute: () => ({
        params: mockRouteParams.value
    }),
    useRouter: () => ({
        push: mockPush
    })
}))

describe('useNodeEditor', () => {
    let mockStore

    beforeEach(() => {
        mockStore = {
            nodes: [
                {
                    id: '1',
                    data: {
                        name: 'Test Node',
                        type: 'sendMessage',
                        data: {
                            payload: [{ type: 'text', text: 'Hello World' }]
                        }
                    }
                }
            ],
            updateNode: vi.fn(),
            removeNode: vi.fn()
        }
        mockRouteParams.value = { id: '1' }
        mockPush.mockClear()
    })

    describe('activeNode', () => {
        it('finds node by route param id', () => {
            const { activeNode } = useNodeEditor(mockStore)
            
            expect(activeNode.value).toBeDefined()
            expect(activeNode.value.id).toBe('1')
        })

        it('returns undefined when node not found', () => {
            mockRouteParams.value = { id: 'nonexistent' }
            const { activeNode } = useNodeEditor(mockStore)
            
            expect(activeNode.value).toBeUndefined()
        })
    })

    describe('nodeData', () => {
        it('returns node data when active node exists', () => {
            const { nodeData } = useNodeEditor(mockStore)
            
            expect(nodeData.value.name).toBe('Test Node')
            expect(nodeData.value.type).toBe('sendMessage')
        })

        it('returns empty object when no active node', () => {
            mockRouteParams.value = { id: 'nonexistent' }
            const { nodeData } = useNodeEditor(mockStore)
            
            expect(nodeData.value).toEqual({})
        })
    })

    describe('nodeTypeInfo', () => {
        it('returns correct config for sendMessage type', () => {
            const { nodeTypeInfo } = useNodeEditor(mockStore)
            
            expect(nodeTypeInfo.value.icon).toBe('mdi-message-text-outline')
            expect(nodeTypeInfo.value.label).toBe('Send Message')
        })

        it('returns correct config for trigger type', () => {
            mockStore.nodes[0].data.type = 'trigger'
            const { nodeTypeInfo } = useNodeEditor(mockStore)
            
            expect(nodeTypeInfo.value.icon).toBe('mdi-flash')
            expect(nodeTypeInfo.value.label).toBe('Trigger')
        })

        it('returns correct config for dateTime type', () => {
            mockStore.nodes[0].data.type = 'dateTime'
            const { nodeTypeInfo } = useNodeEditor(mockStore)
            
            expect(nodeTypeInfo.value.icon).toBe('mdi-clock-outline')
            expect(nodeTypeInfo.value.label).toBe('Business Hours')
        })

        it('returns correct config for addComment type', () => {
            mockStore.nodes[0].data.type = 'addComment'
            const { nodeTypeInfo } = useNodeEditor(mockStore)
            
            expect(nodeTypeInfo.value.icon).toBe('mdi-comment-text-outline')
            expect(nodeTypeInfo.value.label).toBe('Add Comment')
        })

        it('returns default config for unknown type', () => {
            mockStore.nodes[0].data.type = 'unknown'
            const { nodeTypeInfo } = useNodeEditor(mockStore)
            
            expect(nodeTypeInfo.value.icon).toBe('mdi-circle-outline')
            expect(nodeTypeInfo.value.label).toBe('Node')
        })
    })

    describe('messageAttachments', () => {
        it('returns attachments from payload', () => {
            mockStore.nodes[0].data.data.payload = [
                { type: 'text', text: 'Hello' },
                { type: 'attachment', attachment: 'image.png' }
            ]
            const { messageAttachments } = useNodeEditor(mockStore)
            
            expect(messageAttachments.value).toHaveLength(1)
            expect(messageAttachments.value[0].type).toBe('attachment')
        })

        it('returns empty array when no payload', () => {
            mockStore.nodes[0].data.data = {}
            const { messageAttachments } = useNodeEditor(mockStore)
            
            expect(messageAttachments.value).toEqual([])
        })
    })

    describe('populateLocalState', () => {
        it('populates editable fields from node data', () => {
            const { editableName, editableMessage } = useNodeEditor(mockStore)
            
            expect(editableName.value).toBe('Test Node')
            expect(editableMessage.value).toBe('Hello World')
        })

        it('populates comment for addComment type', () => {
            mockStore.nodes[0].data.type = 'addComment'
            mockStore.nodes[0].data.data = { comment: 'My comment' }
            
            const { editableComment } = useNodeEditor(mockStore)
            
            expect(editableComment.value).toBe('My comment')
        })

        it('populates times and timezone for dateTime type', () => {
            mockStore.nodes[0].data.type = 'dateTime'
            mockStore.nodes[0].data.data = {
                times: [{ day: 'mon', startTime: '09:00', endTime: '17:00' }],
                timezone: 'America/New_York'
            }
            
            const { editableTimes, editableTimezone } = useNodeEditor(mockStore)
            
            expect(editableTimes.value).toHaveLength(1)
            expect(editableTimezone.value).toBe('America/New_York')
        })

        it('defaults timezone to UTC when not set', () => {
            mockStore.nodes[0].data.data = {}
            
            const { editableTimezone } = useNodeEditor(mockStore)
            
            expect(editableTimezone.value).toBe('UTC')
        })
    })

    describe('saveChanges', () => {
        it('does nothing when no active node', () => {
            mockRouteParams.value = { id: 'nonexistent' }
            const { saveChanges } = useNodeEditor(mockStore)
            
            saveChanges()
            
            expect(mockStore.updateNode).not.toHaveBeenCalled()
        })

        it('saves name change', () => {
            const { editableName, saveChanges } = useNodeEditor(mockStore)
            
            editableName.value = 'New Name'
            saveChanges()
            
            expect(mockStore.updateNode).toHaveBeenCalledWith('1', expect.objectContaining({
                name: 'New Name'
            }))
        })

        it('saves message text for sendMessage type', () => {
            const { editableMessage, saveChanges } = useNodeEditor(mockStore)
            
            editableMessage.value = 'Updated message'
            saveChanges()
            
            expect(mockStore.updateNode).toHaveBeenCalledWith('1', expect.objectContaining({
                data: expect.objectContaining({
                    payload: [{ type: 'text', text: 'Updated message' }]
                })
            }))
        })

        it('saves comment for addComment type', () => {
            mockStore.nodes[0].data.type = 'addComment'
            mockStore.nodes[0].data.data = { comment: 'Old comment' }
            
            const { editableComment, saveChanges } = useNodeEditor(mockStore)
            
            editableComment.value = 'New comment'
            saveChanges()
            
            expect(mockStore.updateNode).toHaveBeenCalledWith('1', expect.objectContaining({
                data: expect.objectContaining({
                    comment: 'New comment'
                })
            }))
        })

        it('saves times and timezone for dateTime type', () => {
            mockStore.nodes[0].data.type = 'dateTime'
            mockStore.nodes[0].data.data = {
                times: [{ day: 'mon', startTime: '09:00', endTime: '17:00' }],
                timezone: 'UTC'
            }
            
            const { editableTimes, editableTimezone, saveChanges } = useNodeEditor(mockStore)
            
            editableTimes.value = [{ day: 'tue', startTime: '10:00', endTime: '18:00' }]
            editableTimezone.value = 'America/New_York'
            saveChanges()
            
            expect(mockStore.updateNode).toHaveBeenCalledWith('1', expect.objectContaining({
                data: expect.objectContaining({
                    times: [{ day: 'tue', startTime: '10:00', endTime: '18:00' }],
                    timezone: 'America/New_York'
                })
            }))
        })
    })

    describe('closeDrawer', () => {
        it('navigates to home', () => {
            const { closeDrawer } = useNodeEditor(mockStore)
            
            closeDrawer()
            
            expect(mockPush).toHaveBeenCalledWith('/')
        })
    })

    describe('deleteNode', () => {
        it('does nothing when no active node', () => {
            mockRouteParams.value = { id: 'nonexistent' }
            const { deleteNode } = useNodeEditor(mockStore)
            
            deleteNode()
            
            expect(mockStore.removeNode).not.toHaveBeenCalled()
        })

        it('removes node and navigates home when confirmed', () => {
            vi.spyOn(window, 'confirm').mockReturnValue(true)
            const { deleteNode } = useNodeEditor(mockStore)
            
            deleteNode()
            
            expect(mockStore.removeNode).toHaveBeenCalledWith('1')
            expect(mockPush).toHaveBeenCalledWith('/')
            
            vi.restoreAllMocks()
        })

        it('does not remove node when cancelled', () => {
            vi.spyOn(window, 'confirm').mockReturnValue(false)
            const { deleteNode } = useNodeEditor(mockStore)
            
            deleteNode()
            
            expect(mockStore.removeNode).not.toHaveBeenCalled()
            expect(mockPush).not.toHaveBeenCalled()
            
            vi.restoreAllMocks()
        })
    })
})

