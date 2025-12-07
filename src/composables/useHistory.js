import { ref, computed } from 'vue'

/**
 * Composable for managing undo/redo history
 * @param {number} maxHistory - Maximum number of history states to keep
 */
export function useHistory(maxHistory = 50) {
  const past = ref([])
  const future = ref([])
  const currentState = ref(null)

  const canUndo = computed(() => past.value.length > 0)
  const canRedo = computed(() => future.value.length > 0)

  //Initializes with a state
  function init(state) {
    currentState.value = JSON.parse(JSON.stringify(state))
    past.value = []
    future.value = []
  }

  //Records a new state (call before making changes)
  function record(state) {
    if (currentState.value !== null) {
      past.value.push(currentState.value)
      
      // Limits history size
      if (past.value.length > maxHistory) {
        past.value.shift()
      }
    }
    
    currentState.value = JSON.parse(JSON.stringify(state))
    // Clears future when new action is taken
    future.value = []
  }

  //Undos to previous state
  function undo() {
    if (!canUndo.value) return null

    // Saves the current state to future
    future.value.push(currentState.value)
    
    // Restores the previous state
    currentState.value = past.value.pop()
    
    return JSON.parse(JSON.stringify(currentState.value))
  }

  //Redos to next state
  function redo() {
    if (!canRedo.value) return null

    // Saves the current state to past
    past.value.push(currentState.value)
    
    // Restores the future state
    currentState.value = future.value.pop()
    
    return JSON.parse(JSON.stringify(currentState.value))
  }

  //Clears all history
  function clear() {
    past.value = []
    future.value = []
  }

  //Discards the last recorded state (use when an action was cancelled)
  function discardLast() {
    if (past.value.length > 0) {
      currentState.value = past.value.pop()
    }
  }

  //Gets current history info
  const historyInfo = computed(() => ({
    undoCount: past.value.length,
    redoCount: future.value.length,
    canUndo: canUndo.value,
    canRedo: canRedo.value
  }))

  return {
    canUndo,
    canRedo,
    historyInfo,
    init,
    record,
    undo,
    redo,
    clear,
    discardLast
  }
}

