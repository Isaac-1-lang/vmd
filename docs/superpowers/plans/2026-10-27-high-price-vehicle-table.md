# High-price Vehicle Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a table of vehicles with `selling_price > 5000`, including every non-customer source field.

**Architecture:** Filter rows inside the existing `build_dashboard` scope after year and manufacturer filtering. Return the selected columns as template rows and render them in a horizontally scrollable dashboard table.

**Tech Stack:** Django templates, Python, pandas, CSS.

**Spec:** `docs/superpowers/specs/2026-10-27-high-price-vehicle-table-design.md`

## Global Constraints

- Exclude all customer fields.
- Filter strictly by `selling_price > 5000`.
- Respect active year and manufacturer filters.
- Keep the table horizontally scrollable on narrow screens.
- Add no dependencies.

## Review Focus

- A selling price exactly equal to 5000 is excluded.
- Active filters scope the high-price rows.
- Customer fields are absent from rendered rows and headers.
- No matching high-price rows produces an empty table body without breaking the dashboard.

---

### Task 1: Return and render high-price vehicle rows

**Files:**
- Modify: `vehicles/dashboard.py`
- Modify: `vehicles/templates/vehicles/index.html`

- [x] Add `high_price_rows` to the non-empty `build_dashboard` result using the already filtered `df` and `selling_price > 5000`.
- [x] Include these fields in the table: `manufacturer`, `year`, `color`, `body_type`, `engine_type`, `transmission`, `fuel_type`, `seating_capacity`, `kilometers_driven`, `vehicle_condition`, `wholesale_price`, `selling_price`, `client_retail_date`, `season`.
- [x] Keep customer columns out and render all selected fields with readable table headers and existing number/date formatting where available.
- [x] Place the table in the existing dashboard flow and use the existing horizontally scrollable table wrapper.
- [x] Review the diff and search the new table markup to confirm there are no customer fields or graph elements.
