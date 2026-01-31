# FlowSight Frontend

AI-powered workflow intelligence platform — Connect tools, visualize workflow, detect bottlenecks.

## Tech Stack

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** for styling
- Centralized design variables in `src/styles/variables.css`

## Project Structure

```
src/
├── assets/           # Icons, images
├── components/
│   ├── layout/       # Navbar, Sidebar, AppLayout
│   ├── connections/  # Connection cards, canvas (Tab 1)
│   ├── flow/         # Branch cards, hover panel, Flow canvas (Tab 2)
│   ├── ai-insights/  # Chat, recommendations (Tab 3)
│   └── shared/       # Button, Badge, Avatar, StatusIndicator
├── pages/            # ConnectionsPage, FlowPage, AIInsightsPage
├── hooks/            # useConnections, useFlowData, useHoverPanel, useAIQuery
├── services/         # api.ts, mockData.ts
├── types/            # TypeScript interfaces
├── styles/
│   ├── variables.css # Centralized design tokens
│   ├── index.css     # Global styles
│   └── components/   # Component-specific styles
└── utils/            # Helpers
```

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build
```

## Tabs

1. **Connections** — Connect GitHub, Jira, Slack, etc.
2. **Flow** — Branch network visualization with hover details
3. **AI Insights** — Chat interface and recommendations
