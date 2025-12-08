import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { h } from 'vue'
import CreateNodeModal from '@/components/CreateNodeModal.vue'
import { useFlowStore } from '@/stores/flowStore'

// VApp wrapper to provide Vuetify layout context
const VAppWrapper = {
  template: '<v-app><slot /></v-app>'
}

describe('CreateNodeModal', () => {
  const mountModal = (props = {}, storeState = {}) => {
    return mount(VAppWrapper, {
      slots: {
        default: h(CreateNodeModal, {
          modelValue: true,
          ...props
        })
      },
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              flow: {
                nodes: [],
                edges: [],
                ...storeState
              }
            },
            stubActions: false
          })
        ]
      }
    })
  }

  // Test 1: Default Values
  describe('Default Values', () => {
    it('has sendMessage as default type', async () => {
      const wrapper = mountModal()
      await flushPromises()
      
      const modalComponent = wrapper.findComponent(CreateNodeModal)
      expect(modalComponent.vm.formData.type).toBe('sendMessage')
    })

    it('has empty title by default', async () => {
      const wrapper = mountModal()
      await flushPromises()
      
      const modalComponent = wrapper.findComponent(CreateNodeModal)
      expect(modalComponent.vm.formData.title).toBe('')
    })

    it('has null parentId by default', async () => {
      const wrapper = mountModal()
      await flushPromises()
      
      const modalComponent = wrapper.findComponent(CreateNodeModal)
      expect(modalComponent.vm.formData.parentId).toBe(null)
    })
  })

  // Test 2: Type Options
  describe('Type Options', () => {
    it('provides correct type options', async () => {
      const wrapper = mountModal()
      await flushPromises()
      
      const modalComponent = wrapper.findComponent(CreateNodeModal)
      expect(modalComponent.vm.typeOptions).toEqual([
        { title: 'Send Message', value: 'sendMessage' },
        { title: 'Add Comments', value: 'addComment' },
        { title: 'Business Hours', value: 'dateTime' }
      ])
    })
  })

  // Test 3: Parent Options
  describe('Parent Options', () => {
    it('populates parent options from store nodes', async () => {
      const wrapper = mount(VAppWrapper, {
        slots: {
          default: h(CreateNodeModal, { modelValue: true })
        },
        global: {
          plugins: [
            createTestingPinia({
              initialState: {
                flow: {
                  nodes: [
                    { id: '1', data: { name: 'Node One', type: 'trigger' } },
                    { id: '2', data: { name: 'Node Two', type: 'sendMessage' } }
                  ],
                  edges: []
                }
              },
              stubActions: false
            })
          ]
        }
      })
      await flushPromises()
      
      const modalComponent = wrapper.findComponent(CreateNodeModal)
      expect(modalComponent.vm.parentOptions).toHaveLength(2)
      expect(modalComponent.vm.parentOptions[0].title).toBe('Node One')
      expect(modalComponent.vm.parentOptions[1].title).toBe('Node Two')
    })

    it('uses node type as fallback when name is missing', async () => {
      const wrapper = mount(VAppWrapper, {
        slots: {
          default: h(CreateNodeModal, { modelValue: true })
        },
        global: {
          plugins: [
            createTestingPinia({
              initialState: {
                flow: {
                  nodes: [{ id: '1', data: { type: 'trigger' } }],
                  edges: []
                }
              },
              stubActions: false
            })
          ]
        }
      })
      await flushPromises()
      
      const modalComponent = wrapper.findComponent(CreateNodeModal)
      expect(modalComponent.vm.parentOptions[0].title).toBe('trigger')
    })

    it('uses "Unknown Node" when both name and type are missing', async () => {
      const wrapper = mount(VAppWrapper, {
        slots: {
          default: h(CreateNodeModal, { modelValue: true })
        },
        global: {
          plugins: [
            createTestingPinia({
              initialState: {
                flow: {
                  nodes: [{ id: '1', data: {} }],
                  edges: []
                }
              },
              stubActions: false
            })
          ]
        }
      })
      await flushPromises()
      
      const modalComponent = wrapper.findComponent(CreateNodeModal)
      expect(modalComponent.vm.parentOptions[0].title).toBe('Unknown Node')
    })
  })

  // Test 4: Successful Submission
  describe('Successful Submission', () => {
    it('emits create event with correct payload when form is valid', async () => {
      const wrapper = mountModal()
      await flushPromises()
      
      const modalComponent = wrapper.findComponent(CreateNodeModal)
      
      // Set form data directly
      modalComponent.vm.formData.title = 'Test Title'
      modalComponent.vm.formData.description = 'Test Description'
      modalComponent.vm.formData.type = 'sendMessage'
      modalComponent.vm.formData.parentId = '1'
      modalComponent.vm.valid = true
      
      modalComponent.vm.onSubmit()
      
      expect(modalComponent.emitted('create')).toBeTruthy()
      expect(modalComponent.emitted('create')[0][0]).toMatchObject({
        title: 'Test Title',
        description: 'Test Description',
        type: 'sendMessage',
        parentId: '1'
      })
    })

    it('emits update:modelValue with false after successful submission', async () => {
      const wrapper = mountModal()
      await flushPromises()
      
      const modalComponent = wrapper.findComponent(CreateNodeModal)
      modalComponent.vm.formData.title = 'Test'
      modalComponent.vm.formData.description = 'Test'
      modalComponent.vm.formData.parentId = '1'
      modalComponent.vm.valid = true
      
      modalComponent.vm.onSubmit()
      
      expect(modalComponent.emitted('update:modelValue')).toBeTruthy()
      expect(modalComponent.emitted('update:modelValue')[0][0]).toBe(false)
    })
  })

  // Test 5: Form Reset
  describe('Form Reset', () => {
    it('resets form fields after successful submission', async () => {
      const wrapper = mountModal()
      await flushPromises()
      
      const modalComponent = wrapper.findComponent(CreateNodeModal)
      
      modalComponent.vm.formData.title = 'Test Title'
      modalComponent.vm.formData.description = 'Test Description'
      modalComponent.vm.formData.type = 'addComment'
      modalComponent.vm.formData.parentId = '123'
      modalComponent.vm.valid = true
      
      modalComponent.vm.onSubmit()
      
      expect(modalComponent.vm.formData.title).toBe('')
      expect(modalComponent.vm.formData.description).toBe('')
      expect(modalComponent.vm.formData.type).toBe('sendMessage')
      expect(modalComponent.vm.formData.parentId).toBe(null)
    })

    it('resets form when resetForm is called', async () => {
      const wrapper = mountModal()
      await flushPromises()
      
      const modalComponent = wrapper.findComponent(CreateNodeModal)
      
      modalComponent.vm.formData.title = 'Test Title'
      modalComponent.vm.formData.description = 'Test Description'
      
      modalComponent.vm.resetForm()
      
      expect(modalComponent.vm.formData.title).toBe('')
      expect(modalComponent.vm.formData.description).toBe('')
    })
  })

  // Test 6: Validation
  describe('Validation Logic', () => {
    it('does not emit create event when form is invalid', async () => {
      const wrapper = mountModal()
      await flushPromises()
      
      const modalComponent = wrapper.findComponent(CreateNodeModal)
      modalComponent.vm.valid = false
      
      modalComponent.vm.onSubmit()
      
      expect(modalComponent.emitted('create')).toBeFalsy()
    })
  })

  // Test 7: Dialog Visibility
  describe('Dialog Visibility', () => {
    it('is hidden when modelValue is false', async () => {
      const wrapper = mount(VAppWrapper, {
        slots: {
          default: h(CreateNodeModal, { modelValue: false })
        },
        global: {
          plugins: [createTestingPinia({ stubActions: false })]
        }
      })
      await flushPromises()
      
      const modalComponent = wrapper.findComponent(CreateNodeModal)
      const dialog = modalComponent.findComponent({ name: 'VDialog' })
      expect(dialog.props('modelValue')).toBe(false)
    })
  })
})
