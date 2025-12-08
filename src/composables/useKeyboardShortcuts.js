import { onMounted, onUnmounted } from 'vue'

export function useKeyboardShortcuts({
    onUndo,
    onRedo,
    onOpenNode,
    onDeleteNode,
    onEscape,
    getSelectedNodes
}) {
    
     // Checks if an input element is currently focused
     //Prevents shortcuts from firing when user is typing
    function isInputFocused() {
        const activeElement = document.activeElement
        return activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.isContentEditable
        )
    }

    // Main keydown event handler
    // Routes keyboard events to appropriate handlers
    function handleKeydown(event) {
        const { ctrlKey, metaKey, shiftKey, key } = event
        const modKey = ctrlKey || metaKey

        // Undo: Ctrl+Z
        if (modKey && key === 'z' && !shiftKey) {
            event.preventDefault()
            onUndo?.()
            return
        }

        // Redo: Ctrl+Shift+Z / Ctrl+Y
        if (modKey && (key === 'y' || (key === 'z' && shiftKey))) {
            event.preventDefault()
            onRedo?.()
            return
        }

        // Open selected node: Enter/Space
        if (key === 'Enter' || key === ' ') {
            const selectedNodes = getSelectedNodes?.() || []
            if (selectedNodes.length === 1) {
                event.preventDefault()
                onOpenNode?.(selectedNodes[0])
            }
            return
        }

        // Delete selected node: Delete/Backspace
        if (key === 'Delete' || key === 'Backspace') {
            if (isInputFocused()) return
            
            const selectedNodes = getSelectedNodes?.() || []
            if (selectedNodes.length === 1) {
                event.preventDefault()
                onDeleteNode?.(selectedNodes[0])
            }
            return
        }

        // Escape: Generic escape handler
        if (key === 'Escape') {
            onEscape?.()
        }
    }

    // Registers and cleans up event listeners
    onMounted(() => {
        window.addEventListener('keydown', handleKeydown)
    })

    onUnmounted(() => {
        window.removeEventListener('keydown', handleKeydown)
    })

    return {
        isInputFocused
    }
}

