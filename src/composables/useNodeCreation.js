import { ref } from 'vue'
import { getLayoutElements } from '../utils/useLayout'

export function useNodeCreation(store, fitView) {
    const isModalOpen = ref(false)
    const pendingParentId = ref(null)

    // Generates a random ID for new nodes
    function generateId(length = 6) {
        return Math.random().toString(36).substring(2, 2 + length)
    }

    // Opens the create node modal with a preset parent
    function openModal(parentId) {
        pendingParentId.value = parentId?.toString() || null
        isModalOpen.value = true
    }

    // Closes the modal and resets pending parent
    function closeModal() {
        pendingParentId.value = null
        isModalOpen.value = false
    }

    // Creates a Business Hours (dateTime) node with Success/Failure connectors
    function createDateTimeNodes(newId, parentId, formData) {
        const successId = generateId(6)
        const failureId = generateId(6)

        const dateTimeNode = {
            id: newId,
            parentId: parentId,
            type: 'dateTime',
            name: formData.title || 'Business Hours',
            data: {
                times: [
                    { startTime: '09:00', endTime: '17:00', day: 'mon' },
                    { startTime: '09:00', endTime: '17:00', day: 'tue' },
                    { startTime: '09:00', endTime: '17:00', day: 'wed' },
                    { startTime: '09:00', endTime: '17:00', day: 'thu' },
                    { startTime: '09:00', endTime: '17:00', day: 'fri' },
                ],
                connectors: [successId, failureId],
                timezone: 'UTC',
                action: 'businessHours'
            }
        }

        const successNode = {
            id: successId,
            parentId: newId,
            type: 'dateTimeConnector',
            name: 'Success',
            data: { connectorType: 'success' }
        }

        const failureNode = {
            id: failureId,
            parentId: newId,
            type: 'dateTimeConnector',
            name: 'Failure',
            data: { connectorType: 'failure' }
        }

        return [dateTimeNode, successNode, failureNode]
    }

    // Creates a regular node (sendMessage, addComment, etc.)
    function createRegularNodeData(newId, parentId, formData) {
        return {
            id: newId,
            parentId: parentId,
            type: formData.type,
            name: formData.title,
            data: {
                ...(formData.type === 'sendMessage' && {
                    payload: [{ type: 'text', text: formData.description }]
                }),
                ...(formData.type === 'addComment' && {
                    comment: formData.description
                }),
            }
        }
    }

    // Main handler for creating a new node
    function handleCreateNode(formData) {
        store.recordState()

        const newId = generateId(4)
        const parentId = pendingParentId.value || formData.parentId

        let newNodes
        if (formData.type === 'dateTime') {
            newNodes = createDateTimeNodes(newId, parentId, formData)
        } else {
            newNodes = [createRegularNodeData(newId, parentId, formData)]
        }

        // Gets current nodes as raw data and adds new nodes
        const currentRawData = store.nodes.map(n => n.data)
        const allRawData = [...currentRawData, ...newNodes]

        // Re-layouts the graph
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutElements(allRawData)

        store.setNodes(layoutedNodes)
        store.setEdges(layoutedEdges)

        // here we reset the modal state
        pendingParentId.value = null

        // Fits view after layout which is only for regular nodes
        if (formData.type !== 'dateTime' && fitView) {
            setTimeout(() => fitView(), 100)
        }
    }

    return {
        // State
        isModalOpen,
        pendingParentId,
        
        // Methods
        openModal,
        closeModal,
        handleCreateNode,
        generateId
    }
}

