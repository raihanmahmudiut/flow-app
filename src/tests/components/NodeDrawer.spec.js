import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import { h } from 'vue'
import NodeDrawer from '@/views/NodeDrawer.vue'
import { useFlowStore } from '@/stores/flowStore'

// Create a mock router
const createMockRouter = (initialRoute = '/node/123') => {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
      { path: '/node/:id', name: 'node-details', component: NodeDrawer }
    ]
  })
}

// VApp wrapper to provide Vuetify layout context
const VAppWrapper = {
  template: '<v-app><slot /></v-app>'
}

describe('NodeDrawer', () => {
  const mountDrawer = async (routeId, storeNodes = []) => {
    const router = createMockRouter()
    await router.push(`/node/${routeId}`)
    await router.isReady()

    return mount(VAppWrapper, {
      slots: {
        default: h(NodeDrawer)
      },
      global: {
        plugins: [
          router,
          createTestingPinia({
            initialState: {
              flow: {
                nodes: storeNodes,
                edges: []
              }
            },
            stubActions: false
          })
        ]
      }
    })
  }

  // Test 1: Route Matching
  describe('Route Matching', () => {
    it('renders the correct node based on route params', async () => {
      const wrapper = await mountDrawer('123', [
        { id: '123', data: { name: 'Test Node', type: 'sendMessage', data: {} } },
        { id: '456', data: { name: 'Other Node', type: 'trigger', data: {} } }
      ])
      
      await flushPromises()
      
      const drawerComponent = wrapper.findComponent(NodeDrawer)
      expect(drawerComponent.vm.activeNode).toBeDefined()
      expect(drawerComponent.vm.activeNode.id).toBe('123')
    })
  })

  // Test 2: Empty State
  describe('Empty State', () => {
    it('shows "Node not found" when route ID does not exist in store', async () => {
      const wrapper = await mountDrawer('nonexistent', [
        { id: '123', data: { name: 'Test Node', type: 'sendMessage', data: {} } }
      ])
      
      await flushPromises()
      
      expect(wrapper.text()).toContain('Node not found')
    })

    it('shows "Node not found" when store is empty', async () => {
      const wrapper = await mountDrawer('123', [])
      
      await flushPromises()
      
      expect(wrapper.text()).toContain('Node not found')
    })
  })

  // Test 3: Conditional Rendering - sendMessage
  describe('Conditional Rendering - sendMessage', () => {
    it('shows message section for sendMessage type', async () => {
      const wrapper = await mountDrawer('123', [
        { 
          id: '123', 
          data: { 
            name: 'Message Node', 
            type: 'sendMessage', 
            data: { payload: [{ type: 'text', text: 'Hello' }] } 
          } 
        }
      ])
      
      await flushPromises()
      
      // Updated: Component now shows "Message:" label
      expect(wrapper.text()).toContain('Message')
    })
  })

  // Test 4: Conditional Rendering - addComment
  describe('Conditional Rendering - addComment', () => {
    it('shows comment section for addComment type', async () => {
      const wrapper = await mountDrawer('123', [
        { 
          id: '123', 
          data: { 
            type: 'addComment', 
            data: { comment: 'My comment' } 
          } 
        }
      ])
      
      await flushPromises()
      
      expect(wrapper.text()).toContain('Internal Comment')
    })
  })

  // Test 5: Conditional Rendering - dateTime
  describe('Conditional Rendering - dateTime', () => {
    it('shows business hours section for dateTime type', async () => {
      const wrapper = await mountDrawer('123', [
        { 
          id: '123', 
          data: { 
            type: 'dateTime', 
            data: { 
              timezone: 'UTC',
              times: [{ day: 'mon', startTime: '09:00', endTime: '17:00' }] 
            } 
          } 
        }
      ])
      
      await flushPromises()
      
      expect(wrapper.text()).toContain('Business Hours')
    })
  })

  // Test 6: Delete Action
  describe('Delete Action', () => {
    it('calls store.removeNode when delete is confirmed', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      
      const wrapper = await mountDrawer('123', [
        { id: '123', data: { type: 'trigger', data: {} } }
      ])
      
      await flushPromises()
      
      const store = useFlowStore()
      const drawerComponent = wrapper.findComponent(NodeDrawer)
      
      drawerComponent.vm.deleteNode()
      
      expect(window.confirm).toHaveBeenCalled()
      expect(store.removeNode).toHaveBeenCalledWith('123')
      
      vi.restoreAllMocks()
    })

    it('does not call store.removeNode when delete is cancelled', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      
      const wrapper = await mountDrawer('123', [
        { id: '123', data: { type: 'trigger', data: {} } }
      ])
      
      await flushPromises()
      
      const store = useFlowStore()
      const drawerComponent = wrapper.findComponent(NodeDrawer)
      
      drawerComponent.vm.deleteNode()
      
      expect(store.removeNode).not.toHaveBeenCalled()
      
      vi.restoreAllMocks()
    })
  })

  // Test 7: messageText Computed
  describe('messageText Computed', () => {
    it('gets message text from payload', async () => {
      const wrapper = await mountDrawer('123', [
        { 
          id: '123', 
          data: { 
            type: 'sendMessage', 
            data: { payload: [{ type: 'text', text: 'Hello World' }] } 
          } 
        }
      ])
      
      await flushPromises()
      
      const drawerComponent = wrapper.findComponent(NodeDrawer)
      expect(drawerComponent.vm.messageText).toBe('Hello World')
    })

    it('returns empty string when no payload', async () => {
      const wrapper = await mountDrawer('123', [
        { id: '123', data: { type: 'sendMessage', data: {} } }
      ])
      
      await flushPromises()
      
      const drawerComponent = wrapper.findComponent(NodeDrawer)
      expect(drawerComponent.vm.messageText).toBe('')
    })
  })

  // Test 8: businessTimes Computed
  describe('businessTimes Computed', () => {
    it('returns times array from node data', async () => {
      const times = [
        { day: 'mon', startTime: '09:00', endTime: '17:00' },
        { day: 'tue', startTime: '10:00', endTime: '18:00' }
      ]
      
      const wrapper = await mountDrawer('123', [
        { id: '123', data: { type: 'dateTime', data: { times } } }
      ])
      
      await flushPromises()
      
      const drawerComponent = wrapper.findComponent(NodeDrawer)
      expect(drawerComponent.vm.businessTimes).toEqual(times)
    })

    it('returns empty array when no times', async () => {
      const wrapper = await mountDrawer('123', [
        { id: '123', data: { type: 'dateTime', data: {} } }
      ])
      
      await flushPromises()
      
      const drawerComponent = wrapper.findComponent(NodeDrawer)
      expect(drawerComponent.vm.businessTimes).toEqual([])
    })
  })

  // Test 9: Node Type Info
  describe('Node Type Info', () => {
    it('shows correct icon for sendMessage type', async () => {
      const wrapper = await mountDrawer('123', [
        { id: '123', data: { type: 'sendMessage', data: {} } }
      ])
      
      await flushPromises()
      
      const drawerComponent = wrapper.findComponent(NodeDrawer)
      expect(drawerComponent.vm.nodeTypeInfo.icon).toBe('mdi-message-text-outline')
    })

    it('shows correct icon for dateTime type', async () => {
      const wrapper = await mountDrawer('123', [
        { id: '123', data: { type: 'dateTime', data: {} } }
      ])
      
      await flushPromises()
      
      const drawerComponent = wrapper.findComponent(NodeDrawer)
      expect(drawerComponent.vm.nodeTypeInfo.icon).toBe('mdi-clock-outline')
    })

    it('shows correct icon for trigger type', async () => {
      const wrapper = await mountDrawer('123', [
        { id: '123', data: { type: 'trigger', data: {} } }
      ])
      
      await flushPromises()
      
      const drawerComponent = wrapper.findComponent(NodeDrawer)
      expect(drawerComponent.vm.nodeTypeInfo.icon).toBe('mdi-flash')
    })
  })
})
