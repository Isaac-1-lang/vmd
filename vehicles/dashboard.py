import pandas as pd


NUMERIC_COLUMNS = [
    "year",
    "seating_capacity",
    "kilometers_driven",
    "wholesale_price",
    "selling_price",
    "client_age",
    "estimated_income",
]

CATEGORY_VALUES = {
    "vehicle_condition": {"active", "inactive"},
    "client_gender": {"Male", "Female"},
    "client_continent": {
        "Africa",
        "Asia",
        "Europe",
        "North America",
        "South America",
        "Oceania",
    },
}


def frequency_table(df):
    counts = (
        df["manufacturer"]
        .value_counts()
        .rename_axis("Manufacturer")
        .reset_index(name="Count")
    )
    return counts.to_html(
        classes="table table-bordered table-striped table-sm",
        index=False,
        justify="center",
    )


def load_dataset(csv_path):
    """Load and clean the vehicle dataset."""
    return clean_dataset(pd.read_csv(csv_path))


def convert_columns(df):
    """Convert numeric and date columns to usable types."""
    df = df.copy()
    for column in NUMERIC_COLUMNS:
        df[column] = pd.to_numeric(df[column], errors="coerce")
    df["client_retail_date"] = pd.to_datetime(
        df["client_retail_date"], errors="coerce"
    )
    return df


def remove_invalid_rows(df):
    """Remove rows with invalid values or duplicate records."""
    invalid_numbers = df[NUMERIC_COLUMNS + ["client_retail_date"]].isna().any(axis=1)
    invalid_categories = pd.Series(False, index=df.index)
    for column, allowed_values in CATEGORY_VALUES.items():
        invalid_categories |= ~df[column].isin(allowed_values)

    duplicate_rows = df.duplicated() & ~invalid_numbers & ~invalid_categories
    invalid_rows = invalid_numbers | invalid_categories | duplicate_rows
    return df.loc[~invalid_rows].copy()


def add_dashboard_columns(df):
    """Add the profit and retail year columns used on the dashboard."""
    df = df.copy()
    df["year"] = df["year"].astype(int)
    df["seating_capacity"] = df["seating_capacity"].astype(int)
    df["profit"] = df["selling_price"] - df["wholesale_price"]
    df["retail_year"] = df["client_retail_date"].dt.year
    return df


def clean_dataset(df):
    """Convert, validate, and prepare the dataset for dashboard use."""
    df = convert_columns(df)
    df = remove_invalid_rows(df)
    return add_dashboard_columns(df)


def filter_dashboard_data(df, year=None, manufacturer=None):
    """Apply the selected year and manufacturer filters."""
    if manufacturer:
        df = df[df["manufacturer"] == manufacturer]
    if year:
        df = df[df["retail_year"] == year]
    return df


def get_kpis(df):
    return {
        "transactions": int(len(df)),
        "revenue": int(df["selling_price"].sum()),
        "profit": int(df["profit"].sum()),
    }


def get_manufacturer_rows(df):
    totals = (
        df.groupby("manufacturer", as_index=False)
        .agg(count=("selling_price", "size"), revenue=("selling_price", "sum"))
        .sort_values("count", ascending=False)
    )
    return [
        {
            "label": row["manufacturer"],
            "count": int(row["count"]),
            "revenue": int(row["revenue"]),
        }
        for row in totals.to_dict("records")
    ]


def get_selling_price_by_manufacturer(df):
    totals = (
        df.groupby("manufacturer", as_index=False)["selling_price"]
        .sum()
        .sort_values("selling_price", ascending=False)
    )
    return [
        {
            "manufacturer": row["manufacturer"],
            "selling_price": int(row["selling_price"]),
        }
        for row in totals.to_dict("records")
    ]


def get_high_price_rows(df):
    vehicle_columns = [
        column
        for column in df.columns
        if (not column.startswith("client_") or column == "client_retail_date")
        and column not in {"income_level", "estimated_income"}
    ]
    high_price_cars = df.loc[df["selling_price"] > 5000, vehicle_columns]
    high_price_cars = high_price_cars.sort_values(
        ["manufacturer", "selling_price"], ascending=[True, False]
    ).head(100)
    columns = [column for column in vehicle_columns if column != "manufacturer"]
    groups = []
    for manufacturer, rows in high_price_cars.groupby("manufacturer", sort=False):
        groups.append(
            {
                "manufacturer": manufacturer,
                "rows": rows.drop(columns="manufacturer").to_dict("records"),
            }
        )
    return columns, groups


def build_dashboard(df, year=None, manufacturer=None):
    """Build all values shown by the dashboard."""
    df = filter_dashboard_data(df, year=year, manufacturer=manufacturer)
    if df.empty:
        return {"empty": True}

    high_price_columns, high_price_rows = get_high_price_rows(df)

    return {
        "empty": False,
        "kpis": get_kpis(df),
        "manufacturer_rows": get_manufacturer_rows(df),
        "selling_price_by_manufacturer": get_selling_price_by_manufacturer(df),
        "high_price_columns": high_price_columns,
        "high_price_rows": high_price_rows,
    }
