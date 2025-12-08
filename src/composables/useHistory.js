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

  function init(state) {
    currentState.value = JSON.parse(JSON.stringify(state))
    past.value = []
    future.value = []
  }

  //Records a new state
  function record(state) {
    if (currentState.value !== null) {
      past.value.push(currentState.value)
      
      if (past.value.length > maxHistory) {
        past.value.shift()
      }
    }
    
    currentState.value = JSON.parse(JSON.stringify(state))
    // this will clear future when new action is taken
    future.value = []
  }

  //Undoes to previous state
  function undo() {
    if (!canUndo.value) return null

    future.value.push(currentState.value)
    
    currentState.value = past.value.pop()
    
    return JSON.parse(JSON.stringify(currentState.value))
  }

  //Redos to next state
  function redo() {
    if (!canRedo.value) return null

    past.value.push(currentState.value)
    
    currentState.value = future.value.pop()
    
    return JSON.parse(JSON.stringify(currentState.value))
  }

  // Clears all history
  function clear() {
    past.value = []
    future.value = []
  }

  //Discards the last recorded state
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

