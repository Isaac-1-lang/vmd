# Tutorial-style dashboard design

## Intent
Bring the current dashboard's code structure and page styling closer to the supplied Django tutorial.

## Proposed changes
Use small, plainly named functions in `dashboard.py` for loading, cleaning, grouping, and formatting the data. Keep the Django view short and focused on filters plus rendering. Restructure the template around the tutorial's Bootstrap sidebar and scrollable content layout, and use Bootstrap components/classes for the tables and cards with only small project-specific CSS additions.

Keep the existing year and manufacturer filters, KPI summary, manufacturer frequency table, manufacturer revenue tables, high-price vehicle table, and theme behavior. Use the tutorial as a format reference; do not copy its project setup instructions or replace the current dataset and sections with its one-table example.

## Approaches
- Adopt the tutorial's Bootstrap layout and simple function boundaries while preserving current dashboard behavior (recommended): keeps the app recognizable while matching the reference structure.
- Replace the current dashboard with the tutorial's minimal example: less code, but removes the requested tables, KPIs, filters, and theme switching.

## Constraints
Continue using Django and pandas. Add no chart library or unrelated setup steps. Keep all CSV source columns in the high-price table, as requested.
