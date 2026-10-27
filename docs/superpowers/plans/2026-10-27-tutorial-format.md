# Tutorial-Style Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Django dashboard code and styling resemble the supplied tutorial while retaining existing behavior.

**Architecture:** Keep data cleaning and filtering in small functions in `dashboard.py`, with a short Django view. Use Bootstrap's sidebar and scrollable-content layout in the template, retaining the current sections and custom theme behavior with minimal custom CSS.

**Tech Stack:** Django, pandas, Bootstrap 5.3, HTML, CSS, JavaScript.

**Spec:** `docs/superpowers/specs/2026-10-27-tutorial-format-design.md`

## Global Constraints

- Keep existing filters, KPIs, tables, and theme behavior.
- Keep all source CSV fields in the high-price table.
- Continue using Django and pandas; add no chart library or unrelated setup steps.

## Review Focus

- Year and manufacturer filters continue to scope the same data.
- Sidebar targets match section IDs and remain keyboard accessible.
- Bootstrap assets load, and the page remains usable on narrow screens.
- High-price rows still include every CSV column and exclude only internal dashboard columns.

---

### Task 1: Align dashboard functions and page structure with the tutorial

**Files:**
- Modify: `vehicles/dashboard.py`
- Modify: `vehicles/views.py`
- Modify: `vehicles/templates/vehicles/index.html`
- Modify: `vehicles/static/vehicles/css/dashboard.css`
- Modify: `vehicles/static/vehicles/js/dashboard.js`

- [x] Keep dashboard functions short and focused on cleaning, filtering, counts, totals, KPIs, and high-price rows.
- [x] Keep `dashboard_view` focused on reading filters and rendering the template.
- [x] Use Bootstrap's sidebar, scrollspy, scrollable content, and card/table classes while retaining all current sections and filters.
- [x] Retain only custom CSS and JavaScript needed for the existing themes and responsive layout.
- [x] Check that template links, Bootstrap references, data keys, and section IDs match; run `git diff --check`.
