import { describe, it, expect, beforeEach } from 'vitest'
import { useHistory } from '@/composables/useHistory'

describe('useHistory', () => {
  let history

  beforeEach(() => {
    history = useHistory(10)
  })

  describe('Initial State', () => {
    it('starts with canUndo as false', () => {
      expect(history.canUndo.value).toBe(false)
    })

    it('starts with canRedo as false', () => {
      expect(history.canRedo.value).toBe(false)
    })
  })

  describe('init', () => {
    it('initializes with given state', () => {
      const state = { nodes: [{ id: '1' }], edges: [] }
      history.init(state)
      
      expect(history.canUndo.value).toBe(false)
      expect(history.canRedo.value).toBe(false)
    })

    it('clears existing history on init', () => {
      history.init({ a: 1 })
      history.record({ a: 2 })
      history.record({ a: 3 })
      
      expect(history.canUndo.value).toBe(true)
      
      history.init({ a: 4 })
      
      expect(history.canUndo.value).toBe(false)
      expect(history.canRedo.value).toBe(false)
    })
  })

  describe('record', () => {
    it('enables undo after recording', () => {
      history.init({ value: 1 })
      history.record({ value: 2 })
      
      expect(history.canUndo.value).toBe(true)
    })

    it('clears redo stack when recording new state', () => {
      history.init({ value: 1 })
      history.record({ value: 2 })
      history.record({ value: 3 })
      history.undo()
      
      expect(history.canRedo.value).toBe(true)
      
      history.record({ value: 4 })
      
      expect(history.canRedo.value).toBe(false)
    })

    it('respects max history limit', () => {
      const smallHistory = useHistory(3)
      smallHistory.init({ value: 0 })
      
      smallHistory.record({ value: 1 })
      smallHistory.record({ value: 2 })
      smallHistory.record({ value: 3 })
      smallHistory.record({ value: 4 })
      
      // Should only be able to undo 3 times (max history)
      expect(smallHistory.historyInfo.value.undoCount).toBe(3)
    })
  })

  describe('undo', () => {
    it('returns previous state', () => {
      history.init({ value: 1 })
      history.record({ value: 2 })
      
      const result = history.undo()
      
      expect(result).toEqual({ value: 1 })
    })

    it('enables redo after undo', () => {
      history.init({ value: 1 })
      history.record({ value: 2 })
      history.undo()
      
      expect(history.canRedo.value).toBe(true)
    })

    it('returns null when nothing to undo', () => {
      history.init({ value: 1 })
      
      const result = history.undo()
      
      expect(result).toBe(null)
    })

    it('can undo multiple times', () => {
      history.init({ value: 1 })
      history.record({ value: 2 })
      history.record({ value: 3 })
      
      expect(history.undo()).toEqual({ value: 2 })
      expect(history.undo()).toEqual({ value: 1 })
      expect(history.canUndo.value).toBe(false)
    })
  })

  describe('redo', () => {
    it('returns next state', () => {
      history.init({ value: 1 })
      history.record({ value: 2 })
      history.undo()
      
      const result = history.redo()
      
      expect(result).toEqual({ value: 2 })
    })

    it('disables redo after all redone', () => {
      history.init({ value: 1 })
      history.record({ value: 2 })
      history.undo()
      history.redo()
      
      expect(history.canRedo.value).toBe(false)
    })

    it('returns null when nothing to redo', () => {
      history.init({ value: 1 })
      
      const result = history.redo()
      
      expect(result).toBe(null)
    })

    it('can redo multiple times', () => {
      history.init({ value: 1 })
      history.record({ value: 2 })
      history.record({ value: 3 })
      history.undo()
      history.undo()
      
      expect(history.redo()).toEqual({ value: 2 })
      expect(history.redo()).toEqual({ value: 3 })
      expect(history.canRedo.value).toBe(false)
    })
  })

  describe('clear', () => {
    it('clears all history', () => {
      history.init({ value: 1 })
      history.record({ value: 2 })
      history.record({ value: 3 })
      history.undo()
      
      history.clear()
      
      expect(history.canUndo.value).toBe(false)
      expect(history.canRedo.value).toBe(false)
    })
  })

  describe('discardLast', () => {
    it('removes the last recorded state without adding to redo', () => {
      history.init({ value: 1 })
      history.record({ value: 2 })
      history.record({ value: 3 })
      
      expect(history.historyInfo.value.undoCount).toBe(2)
      
      history.discardLast()
      
      expect(history.historyInfo.value.undoCount).toBe(1)
      expect(history.canRedo.value).toBe(false)
    })

    it('does nothing when history is empty', () => {
      history.init({ value: 1 })
      
      history.discardLast()
      
      expect(history.canUndo.value).toBe(false)
      expect(history.canRedo.value).toBe(false)
    })

    it('restores current state to previous', () => {
      history.init({ value: 1 })
      history.record({ value: 2 })
      
      // After discardLast, current state should be { value: 1 }
      history.discardLast()
      
      // Now if we undo, there should be nothing to undo
      expect(history.canUndo.value).toBe(false)
    })
  })

  describe('historyInfo', () => {
    it('provides accurate counts', () => {
      history.init({ value: 1 })
      history.record({ value: 2 })
      history.record({ value: 3 })
      
      expect(history.historyInfo.value.undoCount).toBe(2)
      expect(history.historyInfo.value.redoCount).toBe(0)
      
      history.undo()
      
      expect(history.historyInfo.value.undoCount).toBe(1)
      expect(history.historyInfo.value.redoCount).toBe(1)
    })
  })

  describe('Deep Copy', () => {
    it('creates independent copies of state', () => {
      const original = { nested: { value: 1 } }
      history.init(original)
      
      original.nested.value = 999
      history.record({ nested: { value: 2 } })
      
      const restored = history.undo()
      
      expect(restored.nested.value).toBe(1)
    })
  })
})

