# Flow Chart Builder

A visual flow chart editor built with Vue 3, Vue Flow, and Vuetify. Create, edit, and manage workflow diagrams with an intuitive drag-and-drop interface.

![Vue 3](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js)
![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite)
![Vuetify](https://img.shields.io/badge/Vuetify-3.11-1867C0?logo=vuetify)
![Vitest](https://img.shields.io/badge/Vitest-4.0-6E9F18?logo=vitest)

## Features

- **Visual Flow Editor** - Drag, zoom, and pan through your workflow diagrams
- **Multiple Node Types** - Support for triggers, messages, comments, date/time conditions, and connectors
- **Auto-Layout** - Automatic node positioning using Dagre graph layout algorithm
- **Node Details Drawer** - Edit node properties in a slide-out panel
- **Create New Nodes** - Add nodes via modal dialog with parent selection
- **Undo/Redo** - Full history support with keyboard shortcuts (Ctrl+Z / Ctrl+Y)
- **Keyboard Accessible** - Navigate and edit nodes using keyboard only
- **Responsive Design** - Built with Vuetify's Material Design components
- **CI/CD Pipeline** - Automated testing, linting, and builds with GitHub Actions

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Vue 3](https://vuejs.org/) | Frontend framework with Composition API |
| [Vite](https://vitejs.dev/) | Build tool and dev server |
| [Vue Flow](https://vueflow.dev/) | Flow chart/node-based editor |
| [Vuetify 3](https://vuetifyjs.com/) | Material Design component library |
| [Pinia](https://pinia.vuejs.org/) | State management |
| [Vue Router](https://router.vuejs.org/) | Client-side routing |
| [Dagre](https://github.com/dagrejs/dagre) | Graph layout algorithm |
| [TanStack Query](https://tanstack.com/query) | Data fetching and caching |
| [Vitest](https://vitest.dev/) | Unit testing framework |
| [ESLint](https://eslint.org/) | Code linting |
| [GitHub Actions](https://github.com/features/actions) | CI/CD pipeline |

## Project Structure

```
src/
├── components/
│   ├── CustomNode.vue       # Custom node component for Vue Flow
│   └── CreateNodeModal.vue  # Modal dialog for creating new nodes
├── composables/
│   └── useHistory.js        # Undo/redo history management
├── views/
│   ├── HomeView.vue         # Main view with flow editor
│   └── NodeDrawer.vue       # Slide-out drawer for node details
├── stores/
│   └── flowStore.js         # Pinia store for nodes, edges, and history
├── utils/
│   └── useLayout.js         # Dagre layout utility
├── router/
│   └── index.js             # Vue Router configuration
├── tests/
│   ├── setup.js             # Test configuration and mocks
│   ├── composables/         # Composable tests
│   ├── utils/               # Utility function tests
│   ├── stores/              # Store tests
│   └── components/          # Component tests
├── App.vue                  # Root component
├── main.js                  # Application entry point
└── style.css                # Global styles

.github/
└── workflows/
    └── ci.yml               # GitHub Actions CI/CD pipeline
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd flow-chart

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Testing

The project uses **Vitest** with **Vue Test Utils** for unit testing.

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run tests with coverage report
npm run test:coverage
```

### Test Coverage

| Module | Tests | Coverage Areas |
|--------|-------|----------------|
| `useLayout.js` | 14 | Node creation, edge generation, layout coordinates, order independence |
| `useHistory.js` | 16 | Undo/redo, state management, history limits |
| `flowStore.js` | 12 | State management, CRUD operations, cascading deletions |
| `CustomNode.vue` | 30 | Rendering, icons, truncation, selection states |
| `CreateNodeModal.vue` | 13 | Form validation, submission, parent options |
| `NodeDrawer.vue` | 12 | Route matching, conditional rendering, computed properties |
| `HomeView.vue` | 10 | Loading states, node interactions, modal control |

**Total: 107+ tests**

## Design Decisions

### 1. Auto-Layout with Dagre

Instead of manual node positioning, the app uses **Dagre** to automatically calculate optimal node positions in a top-to-bottom hierarchy. This ensures:
- Consistent visual layout
- No overlapping nodes
- Proper edge routing

```javascript
// Nodes are positioned automatically based on parent-child relationships
dagreGraph.setGraph({ rankdir: 'TB' }) // Top-to-Bottom layout
```

### 2. Two-Pass Node Processing

The layout utility processes nodes in a single pass but handles edges separately to ensure parent nodes exist before creating edges. This prevents crashes when child nodes appear before parents in the data.

### 3. Pinia for State Management

Pinia provides a simple, type-safe store for managing:
- `nodes` - Array of flow nodes
- `edges` - Array of connections between nodes
- Actions for CRUD operations with automatic edge cleanup

### 4. Route-Based Node Editing

Node details are accessed via URL (`/node/:id`), enabling:
- Deep linking to specific nodes
- Browser back/forward navigation
- Bookmarkable node views

### 5. Component Architecture

- **CustomNode** - Renders different node types with appropriate icons and styling
- **CreateNodeModal** - Handles new node creation with validation
- **NodeDrawer** - Provides detailed editing based on node type

### 6. Undo/Redo with History Stack

The app implements a custom history management system:
- State snapshots are captured before each change
- Maximum 50 history states to prevent memory issues
- Deep copying ensures state immutability
- Redo stack clears when new actions are taken

### 7. Keyboard Accessibility

Full keyboard navigation support:
- **Tab** - Navigate between nodes
- **Enter/Space** - Open node details
- **Delete/Backspace** - Delete selected node
- **Escape** - Close drawer
- **Ctrl+Z** - Undo
- **Ctrl+Y / Ctrl+Shift+Z** - Redo

## Node Types

| Type | Icon | Description |
|------|------|-------------|
| `trigger` | ⚡ | Entry point for workflows |
| `sendMessage` | 💬 | Send a message with text/attachments |
| `addComment` | 📝 | Add internal comments |
| `dateTime` | 🕐 | Business hours conditions |
| `dateTimeConnector` | ✓/✗ | Success/failure branches |

## API / Data Format

The app loads flow data from `/public/payload.json`. Each node follows this structure:

```json
{
  "id": "unique-id",
  "parentId": "parent-node-id",  // -1 for root nodes
  "type": "sendMessage",
  "name": "Optional Display Name",
  "data": {
    // Type-specific data
  }
}
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |

## CI/CD Pipeline

The project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that runs on every push and pull request:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Lint     │────▶│    Test     │────▶│    Build    │
│   ESLint    │     │   Vitest    │     │    Vite     │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Pipeline Stages

1. **Lint** - Runs ESLint to check code quality
2. **Test** - Runs all unit tests with coverage report
3. **Build** - Creates production build to verify compilation

### Artifacts

- **Coverage Report** - Uploaded for 30 days
- **Build Output** - Uploaded for 7 days

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
