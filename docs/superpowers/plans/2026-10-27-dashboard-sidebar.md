# Dashboard Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate dashboard content into sidebar-selected Summary, Manufacturers, and High-price vehicles sections.

**Architecture:** Keep one Django-rendered page and the existing filter query parameters. Use accessible buttons and a small JavaScript handler to show one section at a time; CSS places the sidebar beside the content on wide screens and above it on narrow screens.

**Tech Stack:** Django templates, CSS, JavaScript.

**Spec:** `docs/superpowers/specs/2026-10-27-dashboard-sidebar-design.md`

## Global Constraints

- Keep the year and manufacturer filters available in all sections.
- Keep the existing table data, KPI values, and theme behavior.
- Add no dependencies.
- Keep navigation usable on narrow screens.

## Review Focus

- Initial page load shows Summary and marks it selected.
- Switching sections hides the prior section and updates the selected navigation state.
- Filter links and form submissions preserve the same selected data behavior.
- Keyboard users can reach and activate every section button.
- Narrow screens place the menu above the selected section without horizontal page overflow.

---

### Task 1: Add sidebar navigation and section layout

**Files:**
- Modify: `vehicles/templates/vehicles/index.html`
- Modify: `vehicles/static/vehicles/css/dashboard.css`
- Modify: `vehicles/static/vehicles/js/dashboard.js`

- [x] Group KPIs under Summary, both manufacturer tables under Manufacturers, and the high-price table under High-price vehicles.
- [x] Add sidebar buttons with section targets and accessible selected-state attributes; show Summary by default.
- [x] Add desktop sidebar/content layout and a narrow-screen layout with the menu above the section.
- [x] Add JavaScript to switch visible sections and keep navigation state synchronized.
- [x] Check links, section target names, keyboard activation, responsive rules, and `git diff --check`.
