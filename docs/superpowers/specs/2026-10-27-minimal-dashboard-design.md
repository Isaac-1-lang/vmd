# Minimal dashboard design

## Intent
Reduce visual and informational clutter so users can read the vehicle sales dashboard at a glance.

## Goals
- Keep the existing year and manufacturer filters.
- Put a manufacturer frequency table at the top of the dashboard, visible immediately without scrolling.
- Remove every graph from the dashboard.
- Remove redundant KPI cards and detail-heavy statistical views.

## Non-goals
- Changing the underlying dataset, calculations, or filtering behavior.
- Reworking the dashboard's visual theme or navigation design.

## Approaches
- Keep all tabs and trim every tab: preserves deep dives but leaves a multi-section dashboard.
- Use a graph-free overview with manufacturer frequency and revenue tables: keeps useful sales information in readable tabular form.

## Proposed design
Use a single graph-free overview. Place a compact manufacturer frequency table directly beneath the page title and filters, before the KPI cards. Include manufacturer and transaction count, with descending frequency order. Follow it with three KPIs (transactions, revenue, and profit) and a short manufacturer revenue table. Remove all graph elements, chart libraries, chart data generation, other tabs, and dense statistical views from the dashboard. Keep empty-filter messaging and theme styling intact.

## Constraints and implementation calls
Reuse the current template, CSS, and JavaScript. Keep only calculations needed by the two tables and KPI cards. No chart dependencies are needed. This is a small dashboard cleanup.
