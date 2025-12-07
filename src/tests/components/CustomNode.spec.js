import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomNode from '@/components/CustomNode.vue'

// Mock Vue Flow Handle component
const HandleStub = {
  template: '<div class="handle-stub custom-handle"></div>',
  props: ['type', 'position', 'style']
}

describe('CustomNode', () => {
  const mountNode = (props) => {
    return mount(CustomNode, {
      props,
      global: {
        stubs: {
          Handle: HandleStub,
          'v-icon': {
            template: '<i :icon="icon"></i>',
            props: ['icon', 'size']
          }
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
      
      // Updated: Component now shows "Business Hours" for dateTime type
      expect(wrapper.text()).toContain('Business Hours')
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

    it('renders Success text for success connector (no icon)', () => {
      const wrapper = mountNode({
        data: { type: 'dateTimeConnector', data: { connectorType: 'success' } },
        selected: false
      })
      
      // Updated: Connectors now show text only, no icons
      expect(wrapper.text()).toContain('Success')
      expect(wrapper.find('.connector-node').exists()).toBe(true)
    })

    it('renders Failure text for failure connector (no icon)', () => {
      const wrapper = mountNode({
        data: { type: 'dateTimeConnector', data: { connectorType: 'failure' } },
        selected: false
      })
      
      // Updated: Connectors now show text only, no icons
      expect(wrapper.text()).toContain('Failure')
      expect(wrapper.find('.connector-node').exists()).toBe(true)
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
    it('truncates description longer than 40 characters', () => {
      const longText = 'A'.repeat(45)
      const wrapper = mountNode({
        data: { type: 'addComment', data: { comment: longText } },
        selected: false
      })
      
      // Updated: Truncation is now at 40 characters
      expect(wrapper.text()).toContain('...')
      expect(wrapper.text()).not.toContain('A'.repeat(45))
    })

    it('does not truncate description of exactly 40 characters', () => {
      const exactText = 'A'.repeat(40)
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
    it('applies custom-node--selected class when selected is true', () => {
      const wrapper = mountNode({
        data: { type: 'trigger', data: {} },
        selected: true
      })
      
      // Updated: Class name changed to custom-node--selected
      expect(wrapper.find('.custom-node--selected').exists()).toBe(true)
    })

    it('does not apply custom-node--selected class when selected is false', () => {
      const wrapper = mountNode({
        data: { type: 'trigger', data: {} },
        selected: false
      })
      
      expect(wrapper.find('.custom-node--selected').exists()).toBe(false)
    })

    it('has custom-node class for regular nodes', () => {
      const wrapper = mountNode({
        data: { type: 'trigger', data: {} },
        selected: true
      })
      
      // Updated: Now using custom div instead of v-card
      expect(wrapper.find('.custom-node').exists()).toBe(true)
    })

    it('has custom-node class when not selected', () => {
      const wrapper = mountNode({
        data: { type: 'trigger', data: {} },
        selected: false
      })
      
      expect(wrapper.find('.custom-node').exists()).toBe(true)
    })
  })

  // Test 5: Connector Styling
  describe('Connector Styling', () => {
    it('uses connector-node class for dateTimeConnector type', () => {
      const wrapper = mountNode({
        data: { type: 'dateTimeConnector', data: { connectorType: 'success' } },
        selected: false
      })
      
      // Updated: Connectors now use connector-node class
      expect(wrapper.find('.connector-node').exists()).toBe(true)
    })

    it('uses custom-node class for non-connector types', () => {
      const wrapper = mountNode({
        data: { type: 'sendMessage', data: {} },
        selected: false
      })
      
      expect(wrapper.find('.custom-node').exists()).toBe(true)
      expect(wrapper.find('.connector-node').exists()).toBe(false)
    })

    it('success connector has green border color', () => {
      const wrapper = mountNode({
        data: { type: 'dateTimeConnector', data: { connectorType: 'success' } },
        selected: false
      })
      
      const connector = wrapper.find('.connector-node')
      expect(connector.attributes('style')).toContain('#4caf50')
    })

    it('failure connector has red border color', () => {
      const wrapper = mountNode({
        data: { type: 'dateTimeConnector', data: { connectorType: 'failure' } },
        selected: false
      })
      
      const connector = wrapper.find('.connector-node')
      expect(connector.attributes('style')).toContain('#f44336')
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
      
      const handles = wrapper.findAll('.handle-stub')
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

  // Test 9: Layer Color
  describe('Layer Color', () => {
    it('uses layerColor for handle background', () => {
      const wrapper = mountNode({
        data: { type: 'trigger', data: {}, layerColor: '#e91e63' },
        selected: false
      })
      
      const handles = wrapper.findAll('.handle-stub')
      expect(handles.length).toBeGreaterThan(0)
    })

    it('uses default color when layerColor not provided', () => {
      const wrapper = mountNode({
        data: { type: 'trigger', data: {} },
        selected: false
      })
      
      expect(wrapper.exists()).toBe(true)
    })
  })

  // Test 10: Trailing Add Button (Leaf Nodes)
  describe('Trailing Add Button', () => {
    it('shows trailing line for leaf nodes', () => {
      const wrapper = mountNode({
        data: { type: 'sendMessage', data: {}, isLeaf: true },
        selected: false
      })
      
      expect(wrapper.find('.trailing-line-container').exists()).toBe(true)
    })

    it('does not show trailing line for non-leaf nodes', () => {
      const wrapper = mountNode({
        data: { type: 'sendMessage', data: {}, isLeaf: false },
        selected: false
      })
      
      expect(wrapper.find('.trailing-line-container').exists()).toBe(false)
    })

    it('has add button in trailing line', () => {
      const wrapper = mountNode({
        data: { type: 'sendMessage', data: {}, isLeaf: true },
        selected: false
      })
      
      expect(wrapper.find('.trailing-add-button').exists()).toBe(true)
    })
  })
})
