# Minimal Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the dashboard while keeping a manufacturer frequency table visible at the top without scrolling.

**Architecture:** Reuse the existing Django dashboard view, template, CSS, and Chart.js setup. Replace the multi-tab interface with one concise overview, place a filtered frequency table first, and retain a few complementary sales visuals.

**Tech Stack:** Django templates, Python/pandas, CSS, JavaScript, Chart.js.

**Spec:** `docs/superpowers/specs/2026-10-27-minimal-dashboard-design.md`

## Global Constraints
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
- [x] Keep monthly performance, fuel mix, annual results, and a short manufacturer revenue table as the supporting visuals.
- [x] Remove JavaScript tab/panel handling that is no longer used while preserving chart rendering and theme switching.
- [x] Guard the monthly chart's optional total label so the removed label cannot stop chart rendering.
- [x] Remove styles used only by the deleted tabs and detail sections.
- [x] Preserve the no-results state and responsive layout.

### Task 3: Review the rendered dashboard

**Files:**
- Review: `vehicles/templates/vehicles/index.html`
- Review: `vehicles/static/vehicles/css/dashboard.css`
- Review: `vehicles/static/vehicles/js/dashboard.js`

- [x] Inspect the page structure and check that manufacturer frequency precedes KPIs and charts.
- [x] Check for dangling chart selectors, panel references, and tab-specific code after removing sections.
- [x] No project checks were run because testing was not requested.
