# High-price vehicle table design

## Intent
Add a readable table of vehicles with a selling price above 5000, excluding customer details.

## Proposed behavior
Filter the current dashboard result set by `selling_price > 5000`, after the active retail-year and manufacturer filters. Show every remaining source field: manufacturer, model year, color, body type, engine type, transmission, fuel type, seating capacity, kilometers driven, vehicle condition, wholesale price, selling price, retail date, and season. Do not display client name, age, gender, continent, country, income, or profession. Keep the table horizontally scrollable for narrow screens.

## Approaches
- Show every non-customer source field (recommended): complete vehicle and sale context, with horizontal scrolling as the tradeoff.
- Show a shorter set of vehicle and price fields: less scrolling, but omits requested columns and sale context.

## Constraints
Use the current Django/pandas dashboard flow and styling. Preserve existing year/manufacturer filters and the graph-free dashboard. No new dependencies.
