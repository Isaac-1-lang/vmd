# Minimal dashboard design

## Intent
Reduce visual and informational clutter so users can read the vehicle sales dashboard at a glance.

## Goals
- Keep the existing year and manufacturer filters.
- Put a manufacturer frequency table at the top of the dashboard, visible immediately without scrolling.
- Retain a small number of useful charts and tables after the leading table.
- Remove redundant KPI cards and detail-heavy statistical views.

## Non-goals
- Changing the underlying dataset, calculations, or filtering behavior.
- Reworking the dashboard's visual theme or navigation design.

## Approaches
- Keep all tabs and trim every tab: preserves deep dives but leaves a multi-section dashboard.
- Use one concise overview with a leading manufacturer frequency table (selected): gives the requested table immediate prominence while retaining a few useful sales visuals.

## Proposed design
Use a single overview. Place a compact manufacturer frequency table directly beneath the page title and filters, before KPIs or charts. Include manufacturer and transaction count, with descending frequency order. Follow it with three KPIs (transactions, revenue, and profit), a monthly sales trend, and only a small number of complementary summary charts/tables. Remove the other tabs and their dense statistical views from the dashboard interface. Keep empty-filter messaging and theme styling intact.

## Constraints and implementation calls
Reuse current template, CSS, JavaScript, and server-provided data. Avoid changing data calculations or installing dependencies. This is a small UI-only change.
