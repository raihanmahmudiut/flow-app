import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomNode from '@/components/CustomNode.vue'

// Mock Vue Flow Handle component
const HandleStub = {
  template: '<div class="handle-stub"></div>',
  props: ['type', 'position']
}

describe('CustomNode', () => {
  const mountNode = (props) => {
    return mount(CustomNode, {
      props,
      global: {
        stubs: {
          Handle: HandleStub
        }
      }
    })
  }

  // Test 1: Prop Rendering - Title
  describe('Title Rendering', () => {
    it('renders data.name as title when provided', () => {
      const wrapper = mountNode({
        data: { name: 'My Custom Node', type: 'sendMessage', data: {} },
        selected: false
      })
      
      expect(wrapper.text()).toContain('My Custom Node')
    })

    it('renders default title for trigger type', () => {
      const wrapper = mountNode({
        data: { type: 'trigger', data: {} },
        selected: false
      })
      
      expect(wrapper.text()).toContain('Trigger')
    })

    it('renders default title for sendMessage type', () => {
      const wrapper = mountNode({
        data: { type: 'sendMessage', data: {} },
        selected: false
      })
      
      expect(wrapper.text()).toContain('Send Message')
    })

    it('renders default title for addComment type', () => {
      const wrapper = mountNode({
        data: { type: 'addComment', data: { comment: '' } },
        selected: false
      })
      
      expect(wrapper.text()).toContain('Add Comment')
    })

    it('renders default title for dateTime type', () => {
      const wrapper = mountNode({
        data: { type: 'dateTime', data: {} },
        selected: false
      })
      
      expect(wrapper.text()).toContain('Date Time')
    })

    it('renders "Unknown Node" for unknown type', () => {
      const wrapper = mountNode({
        data: { type: 'unknownType', data: {} },
        selected: false
      })
      
      expect(wrapper.text()).toContain('Unknown Node')
    })
  })

  // Test 2: Icon Computation
  describe('Icon Computation', () => {
    it('renders mdi-flash icon for trigger type', () => {
      const wrapper = mountNode({
        data: { type: 'trigger', data: {} },
        selected: false
      })
      
      expect(wrapper.html()).toContain('mdi-flash')
    })

    it('renders mdi-message-text-outline icon for sendMessage type', () => {
      const wrapper = mountNode({
        data: { type: 'sendMessage', data: {} },
        selected: false
      })
      
      expect(wrapper.html()).toContain('mdi-message-text-outline')
    })

    it('renders mdi-clock-outline icon for dateTime type', () => {
      const wrapper = mountNode({
        data: { type: 'dateTime', data: {} },
        selected: false
      })
      
      expect(wrapper.html()).toContain('mdi-clock-outline')
    })

    it('renders mdi-comment-text-outline icon for addComment type', () => {
      const wrapper = mountNode({
        data: { type: 'addComment', data: { comment: '' } },
        selected: false
      })
      
      expect(wrapper.html()).toContain('mdi-comment-text-outline')
    })

    it('renders mdi-check icon for success connector', () => {
      const wrapper = mountNode({
        data: { type: 'dateTimeConnector', data: { connectorType: 'success' } },
        selected: false
      })
      
      expect(wrapper.html()).toContain('mdi-check')
    })

    it('renders mdi-close icon for failure connector', () => {
      const wrapper = mountNode({
        data: { type: 'dateTimeConnector', data: { connectorType: 'failure' } },
        selected: false
      })
      
      expect(wrapper.html()).toContain('mdi-close')
    })

    it('renders mdi-circle-outline icon for unknown type', () => {
      const wrapper = mountNode({
        data: { type: 'unknownType', data: {} },
        selected: false
      })
      
      expect(wrapper.html()).toContain('mdi-circle-outline')
    })
  })

  // Test 3: Text Truncation
  describe('Text Truncation', () => {
    it('truncates description longer than 35 characters', () => {
      const longText = 'A'.repeat(40)
      const wrapper = mountNode({
        data: { type: 'addComment', data: { comment: longText } },
        selected: false
      })
      
      expect(wrapper.text()).toContain('...')
      expect(wrapper.text()).not.toContain('A'.repeat(40))
    })

    it('does not truncate description of exactly 35 characters', () => {
      const exactText = 'A'.repeat(35)
      const wrapper = mountNode({
        data: { type: 'addComment', data: { comment: exactText } },
        selected: false
      })
      
      expect(wrapper.text()).not.toContain('...')
      expect(wrapper.text()).toContain(exactText)
    })

    it('does not truncate short description', () => {
      const shortText = 'Hello World'
      const wrapper = mountNode({
        data: { type: 'addComment', data: { comment: shortText } },
        selected: false
      })
      
      expect(wrapper.text()).not.toContain('...')
      expect(wrapper.text()).toContain(shortText)
    })
  })

  // Test 4: Selection State
  describe('Selection State', () => {
    it('applies selected-node class when selected is true', () => {
      const wrapper = mountNode({
        data: { type: 'trigger', data: {} },
        selected: true
      })
      
      expect(wrapper.find('.selected-node').exists()).toBe(true)
    })

    it('does not apply selected-node class when selected is false', () => {
      const wrapper = mountNode({
        data: { type: 'trigger', data: {} },
        selected: false
      })
      
      expect(wrapper.find('.selected-node').exists()).toBe(false)
    })

    it('has higher elevation when selected', () => {
      const wrapper = mountNode({
        data: { type: 'trigger', data: {} },
        selected: true
      })
      
      // Check that v-card has elevation prop set correctly
      const card = wrapper.findComponent({ name: 'VCard' })
      expect(card.props('elevation')).toBe(8)
    })

    it('has lower elevation when not selected', () => {
      const wrapper = mountNode({
        data: { type: 'trigger', data: {} },
        selected: false
      })
      
      const card = wrapper.findComponent({ name: 'VCard' })
      expect(card.props('elevation')).toBe(2)
    })
  })

  // Test 5: Connector Styling
  describe('Connector Styling', () => {
    it('applies grey background for dateTimeConnector type', () => {
      const wrapper = mountNode({
        data: { type: 'dateTimeConnector', data: { connectorType: 'success' } },
        selected: false
      })
      
      const card = wrapper.findComponent({ name: 'VCard' })
      expect(card.props('color')).toBe('grey-lighten-4')
    })

    it('applies white background for non-connector types', () => {
      const wrapper = mountNode({
        data: { type: 'sendMessage', data: {} },
        selected: false
      })
      
      const card = wrapper.findComponent({ name: 'VCard' })
      expect(card.props('color')).toBe('white')
    })
  })

  // Test 6: Description Content
  describe('Description Content', () => {
    it('shows message text for sendMessage type', () => {
      const wrapper = mountNode({
        data: { 
          type: 'sendMessage', 
          data: { payload: [{ type: 'text', text: 'Hello there!' }] } 
        },
        selected: false
      })
      
      expect(wrapper.text()).toContain('Hello there!')
    })

    it('shows "Attachment Only" when sendMessage has no text', () => {
      const wrapper = mountNode({
        data: { 
          type: 'sendMessage', 
          data: { payload: [{ type: 'attachment', attachment: 'url' }] } 
        },
        selected: false
      })
      
      expect(wrapper.text()).toContain('Attachment Only')
    })

    it('shows comment for addComment type', () => {
      const wrapper = mountNode({
        data: { type: 'addComment', data: { comment: 'My comment' } },
        selected: false
      })
      
      expect(wrapper.text()).toContain('My comment')
    })

    it('shows timezone for dateTime type', () => {
      const wrapper = mountNode({
        data: { type: 'dateTime', data: { timezone: 'UTC' } },
        selected: false
      })
      
      expect(wrapper.text()).toContain('UTC')
    })

    it('shows "Business Hours" when dateTime has no timezone', () => {
      const wrapper = mountNode({
        data: { type: 'dateTime', data: {} },
        selected: false
      })
      
      expect(wrapper.text()).toContain('Business Hours')
    })
  })

  // Test 7: Handle Rendering
  describe('Handle Rendering', () => {
    it('renders both source and target handles', () => {
      const wrapper = mountNode({
        data: { type: 'trigger', data: {} },
        selected: false
      })
      
      const handles = wrapper.findAllComponents(HandleStub)
      expect(handles).toHaveLength(2)
    })
  })

  // Test 8: Edge Cases
  describe('Edge Cases', () => {
    it('handles undefined data.data gracefully', () => {
      const wrapper = mountNode({
        data: { type: 'sendMessage' },
        selected: false
      })
      
      expect(wrapper.exists()).toBe(true)
    })

    it('handles null data.data gracefully', () => {
      const wrapper = mountNode({
        data: { type: 'sendMessage', data: null },
        selected: false
      })
      
      expect(wrapper.exists()).toBe(true)
    })
  })
})

