# Dashboard sidebar design

## Intent
Separate the dashboard tables into focused sections that are easy to reach from a sidebar.

## Proposed layout
Use same-page sidebar navigation with three sections: **Summary** shows the KPI cards; **Manufacturers** shows the manufacturer frequency and revenue tables; **High-price vehicles** shows the vehicle table filtered to selling prices above 5000. Only the selected section is displayed. Keep the year and manufacturer filters available across sections, and preserve the current table contents and theme behavior.

## Approaches
- Same-page section switching (recommended): no new routes or data requests, and the current filters continue to scope the tables; requires a small JavaScript navigation handler.
- Separate server-rendered pages: makes each section URL-addressable, but adds routing and repeated page state for a simple dashboard.

## Constraints
Use the existing Django template, CSS, and JavaScript. Add no dependencies. Keep responsive behavior usable on narrow screens, where the sidebar may collapse above the selected section.
