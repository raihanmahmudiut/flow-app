import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'

// Test component that uses the composable
const createTestComponent = (options) => {
    return defineComponent({
        setup() {
            const result = useKeyboardShortcuts(options)
            return { ...result, ...options }
        },
        template: '<div>Test</div>'
    })
}

describe('useKeyboardShortcuts', () => {
    let onUndo, onRedo, onOpenNode, onDeleteNode, onEscape, getSelectedNodes

    beforeEach(() => {
        onUndo = vi.fn()
        onRedo = vi.fn()
        onOpenNode = vi.fn()
        onDeleteNode = vi.fn()
        onEscape = vi.fn()
        getSelectedNodes = vi.fn(() => [])
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    const mountWithShortcuts = (overrides = {}) => {
        return mount(createTestComponent({
            onUndo,
            onRedo,
            onOpenNode,
            onDeleteNode,
            onEscape,
            getSelectedNodes,
            ...overrides
        }))
    }

    const triggerKeydown = (key, options = {}) => {
        const event = new KeyboardEvent('keydown', {
            key,
            ctrlKey: options.ctrlKey || false,
            metaKey: options.metaKey || false,
            shiftKey: options.shiftKey || false,
            bubbles: true
        })
        window.dispatchEvent(event)
    }

    describe('Undo shortcut (Ctrl+Z)', () => {
        it('calls onUndo when Ctrl+Z is pressed', async () => {
            mountWithShortcuts()
            await nextTick()

            triggerKeydown('z', { ctrlKey: true })

            expect(onUndo).toHaveBeenCalledTimes(1)
        })

        it('calls onUndo when Cmd+Z is pressed (Mac)', async () => {
            mountWithShortcuts()
            await nextTick()

            triggerKeydown('z', { metaKey: true })

            expect(onUndo).toHaveBeenCalledTimes(1)
        })

        it('does not call onUndo when just Z is pressed', async () => {
            mountWithShortcuts()
            await nextTick()

            triggerKeydown('z')

            expect(onUndo).not.toHaveBeenCalled()
        })
    })

    describe('Redo shortcut (Ctrl+Y or Ctrl+Shift+Z)', () => {
        it('calls onRedo when Ctrl+Y is pressed', async () => {
            mountWithShortcuts()
            await nextTick()

            triggerKeydown('y', { ctrlKey: true })

            expect(onRedo).toHaveBeenCalledTimes(1)
        })

        it('calls onRedo when Ctrl+Shift+Z is pressed', async () => {
            mountWithShortcuts()
            await nextTick()

            triggerKeydown('z', { ctrlKey: true, shiftKey: true })

            expect(onRedo).toHaveBeenCalledTimes(1)
        })

        it('calls onRedo when Cmd+Shift+Z is pressed (Mac)', async () => {
            mountWithShortcuts()
            await nextTick()

            triggerKeydown('z', { metaKey: true, shiftKey: true })

            expect(onRedo).toHaveBeenCalledTimes(1)
        })
    })

    describe('Open node shortcut (Enter/Space)', () => {
        it('calls onOpenNode with selected node when Enter is pressed', async () => {
            const selectedNode = { id: '1', type: 'sendMessage' }
            getSelectedNodes.mockReturnValue([selectedNode])
            
            mountWithShortcuts()
            await nextTick()

            triggerKeydown('Enter')

            expect(onOpenNode).toHaveBeenCalledWith(selectedNode)
        })

        it('calls onOpenNode with selected node when Space is pressed', async () => {
            const selectedNode = { id: '1', type: 'sendMessage' }
            getSelectedNodes.mockReturnValue([selectedNode])
            
            mountWithShortcuts()
            await nextTick()

            triggerKeydown(' ')

            expect(onOpenNode).toHaveBeenCalledWith(selectedNode)
        })

        it('does not call onOpenNode when no nodes are selected', async () => {
            getSelectedNodes.mockReturnValue([])
            
            mountWithShortcuts()
            await nextTick()

            triggerKeydown('Enter')

            expect(onOpenNode).not.toHaveBeenCalled()
        })

        it('does not call onOpenNode when multiple nodes are selected', async () => {
            getSelectedNodes.mockReturnValue([{ id: '1' }, { id: '2' }])
            
            mountWithShortcuts()
            await nextTick()

            triggerKeydown('Enter')

            expect(onOpenNode).not.toHaveBeenCalled()
        })
    })

    describe('Delete node shortcut (Delete/Backspace)', () => {
        it('calls onDeleteNode when Delete is pressed with selected node', async () => {
            const selectedNode = { id: '1', type: 'sendMessage' }
            getSelectedNodes.mockReturnValue([selectedNode])
            
            mountWithShortcuts()
            await nextTick()

            triggerKeydown('Delete')

            expect(onDeleteNode).toHaveBeenCalledWith(selectedNode)
        })

        it('calls onDeleteNode when Backspace is pressed with selected node', async () => {
            const selectedNode = { id: '1', type: 'sendMessage' }
            getSelectedNodes.mockReturnValue([selectedNode])
            
            mountWithShortcuts()
            await nextTick()

            triggerKeydown('Backspace')

            expect(onDeleteNode).toHaveBeenCalledWith(selectedNode)
        })

        it('does not call onDeleteNode when no nodes are selected', async () => {
            getSelectedNodes.mockReturnValue([])
            
            mountWithShortcuts()
            await nextTick()

            triggerKeydown('Delete')

            expect(onDeleteNode).not.toHaveBeenCalled()
        })
    })

    describe('Escape shortcut', () => {
        it('calls onEscape when Escape is pressed', async () => {
            mountWithShortcuts()
            await nextTick()

            triggerKeydown('Escape')

            expect(onEscape).toHaveBeenCalledTimes(1)
        })
    })

    describe('isInputFocused', () => {
        it('returns isInputFocused function', () => {
            const wrapper = mountWithShortcuts()
            expect(typeof wrapper.vm.isInputFocused).toBe('function')
        })
    })

    describe('Event listener cleanup', () => {
        it('removes event listener on unmount', async () => {
            const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
            
            const wrapper = mountWithShortcuts()
            await nextTick()
            
            wrapper.unmount()

            expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
        })
    })
})

