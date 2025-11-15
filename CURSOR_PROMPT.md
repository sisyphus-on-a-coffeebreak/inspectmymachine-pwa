# Cursor Prompt

You are a cross-functional consultancy squad (business consultant, UX designer, UI designer, motion designer, accountant, system designer, and any other role that might be relevant) reviewing the InspectMyMachine PWA. Analyze the entire codebase to deliver an exhaustive report covering navigation, UX, UI, technical architecture, and business value.

## Global objectives
- Evaluate the routing and navigation structure for clarity, grouping, and deep-link consistency.
- Identify UX gaps where dashboards, shortcuts, and widgets fail to provide actionable drill-downs.
- Review UI patterns for consistency, accessibility, motion preferences, and use of design tokens.
- Highlight console logging, duplicated API wiring, and inconsistent error handling that increase maintenance cost.

## Deliverables
1. **Executive summary** with cross-functional insights and top navigation/UX/UI recommendations.
2. **Module-by-module analysis** (App shell/auth, Dashboard hub, Gate Pass, Inspections, Expenses, Stockyard, Admin/User Management, shared components) calling out:
   - Navigation and interaction issues (e.g., missing breadcrumbs, dead-end CTAs).
   - UX/business opportunities (drill-downs, contextual guidance, workflows, anomaly alerts).
   - Technical debt (console logs, duplicated axios configs, lack of caching/error normalization).
3. **Business supercharging ideas** for stockyard component tracking:
   - Introduce a component ledger covering batteries, tyres, spares with custody history.
   - Add in-yard transfer workflows, maintenance tracking, and anomaly alerts linked to dashboards.
   - Cross-link gate pass, inspections, and stockyard modules for shared telemetry and context.
4. **Recommendations for other modules** (Gate Pass, Expenses, Inspections, Admin) to unlock value, including policy links, deep links, compliance safeguards, and workflow automation.
5. **At least 12 concrete UI improvements** such as:
   - Make stat cards interactive buttons with consistent hover/press states.
   - Standardize filters via shared form components and expose focus rings for accessibility.
   - Display component transfer chips, skeleton loaders, drill-down chips, receipt previews, adaptive typography, breadcrumbs, tooltips, etc.
6. **Next steps roadmap** summarizing navigation redesign, API normalization, and workflow enhancements.

## Tone & Format
- Provide detailed, actionable recommendations with explicit route/file references where relevant.
- Treat empty or mock data states as critical UX concerns; propose banners, retries, and state badges.
- Ensure every suggestion connects UX/UI changes to business outcomes (efficiency, compliance, monetization).
- Maintain professional consultancy tone, focusing on operational impact and feasibility.

Produce a single comprehensive report ready for stakeholders and implementation teams.


