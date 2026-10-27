# Minimal Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all graphs and keep the dashboard focused on manufacturer tables and KPI summaries.

**Architecture:** Reuse the existing Django dashboard view, template, and CSS. Render a filtered frequency table, KPI summary, and manufacturer revenue table without chart libraries or generated graph data.

**Tech Stack:** Django templates, Python/pandas, CSS, JavaScript.

**Spec:** `docs/superpowers/specs/2026-10-27-minimal-dashboard-design.md`

## Global Constraints
- Remove all graphs, chart data generation, and chart library references.
- Keep existing year and manufacturer filtering.
- Put manufacturer and transaction count at the top, immediately visible.
- Do not change dataset calculations or add dependencies.
- Preserve theme styling and empty-filter behavior.

## Review Focus
- No matching rows: preserve the current empty state and reset link.
- Year or make filter active: manufacturer frequency reflects the selected scope.
- Narrow screens: keep the frequency table readable and allow horizontal overflow where needed.
- Existing hash links: remove navigation that points at panels no longer rendered.

---

### Task 1: Make a filtered frequency table the first dashboard section

**Files:**
- Modify: `vehicles/views.py`
- Modify: `vehicles/dashboard.py`
- Modify: `vehicles/templates/vehicles/index.html`
- Modify: `vehicles/static/vehicles/css/dashboard.css`

- [x] Derive manufacturer counts from the selected year and expose the frequency table.
- [x] Move the manufacturer and count table directly below the filter bar, ahead of KPI cards and charts.
- [x] Style it as a compact responsive table, with a bounded height so it is visible immediately and doesn't dominate the page.

### Task 2: Reduce the page to one concise overview

**Files:**
- Modify: `vehicles/templates/vehicles/index.html`
- Modify: `vehicles/static/vehicles/css/dashboard.css`
- Modify: `vehicles/static/vehicles/js/dashboard.js`

- [x] Remove tab navigation and detail-heavy Vehicles, Clients, Sales, and Statistics panels.
- [x] Keep three KPI cards: transactions, revenue, and profit.
- [x] Keep the manufacturer revenue table as the supporting detail.
- [x] Remove chart rendering JavaScript while preserving theme switching.
- [x] Remove chart library, chart markup, and graph-only styles.
- [x] Remove graph data generation from the dashboard view and builder.
- [x] Remove styles used only by deleted detail sections.
- [x] Preserve the no-results state and responsive layout.

### Task 3: Review the rendered dashboard

**Files:**
- Review: `vehicles/templates/vehicles/index.html`
- Review: `vehicles/static/vehicles/css/dashboard.css`
- Review: `vehicles/static/vehicles/js/dashboard.js`

- [x] Inspect the page structure and check that manufacturer frequency precedes KPIs and tables.
- [x] Check that no graph markup, library references, or graph data output remains.
- [x] No project checks were run because testing was not requested.
