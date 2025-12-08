import { watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { getLayoutElements } from '../utils/useLayout'

export function useFlowData(store, options = {}) {
    const { 
        dataUrl = '/payload.json', 
        queryKey = 'flowData' 
    } = options

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: [queryKey],
        queryFn: async () => {
            const response = await fetch(dataUrl)
            if (!response.ok) {
                throw new Error(`Failed to fetch flow data: ${response.statusText}`)
            }
            return response.json()
        }
    })

    watch(data, (rawData) => {
        if (rawData) {
            initializeFlow(rawData)
        }
    })

    //Transforms raw data and initializes the store
    function initializeFlow(rawData) {
        const { nodes, edges } = getLayoutElements(rawData)
        store.setNodes(nodes)
        store.setEdges(edges)
        store.initHistory()
    }

    //Reloads flow data from the API
    async function reload() {
        const result = await refetch()
        if (result.data) {
            initializeFlow(result.data)
        }
        return result
    }

    return {
        // Query state
        data,
        isLoading,
        isError,
        error,
        
        // Methods
        reload,
        initializeFlow
    }
}

