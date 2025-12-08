import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useNodeDrag } from '@/composables/useNodeDrag'

describe('useNodeDrag', () => {
    let mockStore

    beforeEach(() => {
        mockStore = {
            recordState: vi.fn(),
            discardLastRecord: vi.fn()
        }
    })

    describe('onDragStart', () => {
        it('records state when drag starts', () => {
            const { onDragStart } = useNodeDrag(mockStore)
            
            onDragStart({
                nodes: [{ id: '1', position: { x: 100, y: 200 } }]
            })

            expect(mockStore.recordState).toHaveBeenCalledTimes(1)
        })

        it('saves starting positions of dragged nodes', () => {
            const { onDragStart, onDragStop } = useNodeDrag(mockStore)
            const nodes = [
                { id: '1', position: { x: 100, y: 200 } },
                { id: '2', position: { x: 300, y: 400 } }
            ]
            
            onDragStart({ nodes })
            
            // Verify positions were saved by checking drag stop behavior
            // If we stop at same position, it should discard
            onDragStop({ nodes })
            
            expect(mockStore.discardLastRecord).toHaveBeenCalled()
        })
    })

    describe('onDragStop', () => {
        it('does nothing if drag start was not called', () => {
            const { onDragStop } = useNodeDrag(mockStore)
            
            onDragStop({
                nodes: [{ id: '1', position: { x: 100, y: 200 } }]
            })

            expect(mockStore.discardLastRecord).not.toHaveBeenCalled()
        })

        it('discards recorded state if node did not move', () => {
            const { onDragStart, onDragStop } = useNodeDrag(mockStore)
            const node = { id: '1', position: { x: 100, y: 200 } }
            
            onDragStart({ nodes: [node] })
            onDragStop({ nodes: [node] }) // Same position

            expect(mockStore.discardLastRecord).toHaveBeenCalledTimes(1)
        })

        it('discards recorded state if movement is within threshold (1px)', () => {
            const { onDragStart, onDragStop } = useNodeDrag(mockStore)
            
            onDragStart({
                nodes: [{ id: '1', position: { x: 100, y: 200 } }]
            })
            
            onDragStop({
                nodes: [{ id: '1', position: { x: 100.5, y: 200.5 } }] // Moved less than 1px
            })

            expect(mockStore.discardLastRecord).toHaveBeenCalledTimes(1)
        })

        it('keeps recorded state if node moved more than threshold', () => {
            const { onDragStart, onDragStop } = useNodeDrag(mockStore)
            
            onDragStart({
                nodes: [{ id: '1', position: { x: 100, y: 200 } }]
            })
            
            onDragStop({
                nodes: [{ id: '1', position: { x: 110, y: 200 } }] // Moved 10px in x
            })

            expect(mockStore.discardLastRecord).not.toHaveBeenCalled()
        })

        it('keeps recorded state if any node moved', () => {
            const { onDragStart, onDragStop } = useNodeDrag(mockStore)
            
            onDragStart({
                nodes: [
                    { id: '1', position: { x: 100, y: 200 } },
                    { id: '2', position: { x: 300, y: 400 } }
                ]
            })
            
            onDragStop({
                nodes: [
                    { id: '1', position: { x: 100, y: 200 } }, // Not moved
                    { id: '2', position: { x: 350, y: 400 } }  // Moved
                ]
            })

            expect(mockStore.discardLastRecord).not.toHaveBeenCalled()
        })

        it('resets tracking after drag stop', () => {
            const { onDragStart, onDragStop } = useNodeDrag(mockStore)
            const node = { id: '1', position: { x: 100, y: 200 } }
            
            onDragStart({ nodes: [node] })
            onDragStop({ nodes: [node] })
            
            // Second drag stop should do nothing (tracking was reset)
            mockStore.discardLastRecord.mockClear()
            onDragStop({ nodes: [node] })

            expect(mockStore.discardLastRecord).not.toHaveBeenCalled()
        })
    })

    describe('Multiple drag operations', () => {
        it('handles multiple drag cycles correctly', () => {
            const { onDragStart, onDragStop } = useNodeDrag(mockStore)
            
            // First drag - no movement
            onDragStart({ nodes: [{ id: '1', position: { x: 100, y: 200 } }] })
            onDragStop({ nodes: [{ id: '1', position: { x: 100, y: 200 } }] })
            expect(mockStore.discardLastRecord).toHaveBeenCalledTimes(1)
            
            // Second drag - with movement
            onDragStart({ nodes: [{ id: '1', position: { x: 100, y: 200 } }] })
            onDragStop({ nodes: [{ id: '1', position: { x: 200, y: 300 } }] })
            expect(mockStore.discardLastRecord).toHaveBeenCalledTimes(1) // Still 1, not called again
            
            expect(mockStore.recordState).toHaveBeenCalledTimes(2)
        })
    })
})

