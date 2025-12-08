import { ref } from 'vue'

// Tracks node positions before drag starts and discards the recorded state if no actual movement occurred (prevents cluttering undo history)
export function useNodeDrag(store) {
    // Tracking positions before drag starts
    const dragStartPositions = ref(null)

    // Records current state and saves starting positions
    function onDragStart({ nodes: draggedNodes }) {
        // Records current state FIRST before any position changes
        store.recordState()
        
        // then saves starting positions to compare later
        dragStartPositions.value = draggedNodes.map(n => ({
            id: n.id,
            x: n.position.x,
            y: n.position.y
        }))
    }

    // Checks if any actual movement occurred and discards the recorded state if not
    function onDragStop({ nodes: draggedNodes }) {
        if (!dragStartPositions.value) return

        // Checks if any dragged node actually moved by comparing the starting position with the current position
        let anyMoved = false
        const MOVEMENT_THRESHOLD = 1 // this is in pixels

        for (const node of draggedNodes) {
            const startPos = dragStartPositions.value.find(p => p.id === node.id)
            if (startPos) {
                const dx = Math.abs(startPos.x - node.position.x)
                const dy = Math.abs(startPos.y - node.position.y)
                if (dx > MOVEMENT_THRESHOLD || dy > MOVEMENT_THRESHOLD) {
                    anyMoved = true
                    break
                }
            }
        }

        // If no actual movement, discards the recorded state
        if (!anyMoved) {
            store.discardLastRecord()
        }

        // at the end we reset the tracking
        dragStartPositions.value = null
    }

    return {
        onDragStart,
        onDragStop
    }
}

