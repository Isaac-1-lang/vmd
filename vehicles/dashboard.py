import calendar
from functools import lru_cache

import numpy as np
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

VALID_VALUES = {
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

MONTHS = list(calendar.month_abbr)[1:]
WEEKDAYS = list(calendar.day_abbr)

AGE_BINS = [19, 29, 39, 49, 59, 70]
AGE_LABELS = ["20-29", "30-39", "40-49", "50-59", "60-70"]

KM_BINS = [0, 50_000, 100_000, 150_000, 200_000, 250_000, 300_000]
KM_LABELS = ["0-50k", "50-100k", "100-150k", "150-200k", "200-250k", "250-300k"]

INCOME_BINS = [999, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000]
INCOME_LABELS = [
    "1.00-1.25k",
    "1.25-1.50k",
    "1.50-1.75k",
    "1.75-2.00k",
    "2.00-2.25k",
    "2.25-2.50k",
    "2.50-2.75k",
    "2.75-3.00k",
]


def frequency_table(df):
    manufacturer_counts = (
        df["manufacturer"]
        .value_counts()
        .reset_index()
    )

    manufacturer_counts.columns = [
        "Manufacturer",
        "Count",
    ]

    return manufacturer_counts.to_html(
        classes="table table-bordered table-striped table-sm",
        index=False,
        justify="center",
    )


# ---------------------------------------------------------------------------
# Loading & cleaning
# ---------------------------------------------------------------------------

def load_dataset(csv_path):
    """Read and clean the CSV, re-using the cached result until the file changes."""
    return _load_cached(str(csv_path), csv_path.stat().st_mtime)


@lru_cache(maxsize=2)
def _load_cached(csv_path, _mtime):
    raw = pd.read_csv(csv_path)
    clean, quality = clean_dataset(raw)
    return raw, clean, quality


def clean_dataset(raw):
    """Coerce types, drop malformed rows and add the derived analysis columns."""
    df = raw.copy()
    removed = {}

    for column in NUMERIC_COLUMNS:
        df[column] = pd.to_numeric(df[column], errors="coerce")
    df["client_retail_date"] = pd.to_datetime(
        df["client_retail_date"], errors="coerce"
    )

    bad_numeric = df[NUMERIC_COLUMNS + ["client_retail_date"]].isna().any(axis=1)
    removed["Non-numeric / missing values"] = int(bad_numeric.sum())

    bad_category = pd.Series(False, index=df.index)
    for column, allowed in VALID_VALUES.items():
        bad_category |= ~df[column].isin(allowed)
    removed["Invalid category values"] = int((bad_category & ~bad_numeric).sum())

    duplicated = df.duplicated() & ~bad_numeric & ~bad_category
    removed["Duplicate rows"] = int(duplicated.sum())

    df = df[~(bad_numeric | bad_category | duplicated)].copy()

    df["year"] = df["year"].astype(int)
    df["seating_capacity"] = df["seating_capacity"].astype(int)
    df["profit"] = df["selling_price"] - df["wholesale_price"]
    df["margin_pct"] = df["profit"] / df["selling_price"] * 100
    df["retail_year"] = df["client_retail_date"].dt.year
    df["retail_month"] = df["client_retail_date"].dt.month
    df["retail_period"] = df["client_retail_date"].dt.to_period("M")
    df["weekday"] = df["client_retail_date"].dt.dayofweek
    df["age_group"] = pd.cut(df["client_age"], AGE_BINS, labels=AGE_LABELS)
    df["km_band"] = pd.cut(df["kilometers_driven"], KM_BINS, labels=KM_LABELS)
    df["income_band"] = pd.cut(
        df["estimated_income"], INCOME_BINS, labels=INCOME_LABELS
    )

    raw_columns = list(raw.columns)
    quality = {
        "raw_rows": int(len(raw)),
        "clean_rows": int(len(df)),
        "removed_rows": int(len(raw) - len(df)),
        "removed_reasons": [
            {"reason": reason, "rows": rows}
            for reason, rows in removed.items()
        ],
        "columns": [
            {
                "name": column,
                "dtype": str(raw[column].dtype),
                "missing": int(raw[column].isna().sum()),
                "unique": int(raw[column].nunique()),
                "constant": bool(raw[column].nunique() <= 1),
            }
            for column in raw_columns
        ],
        "column_count": len(raw_columns),
        "constant_columns": [
            column for column in raw_columns if raw[column].nunique() <= 1
        ],
    }
    return df, quality


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _to_python(value):
    """Convert numpy / pandas scalars so the context is JSON serialisable."""
    if isinstance(value, dict):
        return {str(k): _to_python(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_to_python(v) for v in value]
    if isinstance(value, np.integer):
        return int(value)
    if isinstance(value, np.floating):
        return None if np.isnan(value) else float(value)
    if isinstance(value, float) and np.isnan(value):
        return None
    return value


def _round(series, digits=1):
    return [round(float(v), digits) for v in series]


def _grouped(df, column, order=None):
    """Count, revenue, profit and averages for every value of ``column``."""
    grouped = df.groupby(column, observed=False).agg(
        count=("selling_price", "size"),
        revenue=("selling_price", "sum"),
        cost=("wholesale_price", "sum"),
        profit=("profit", "sum"),
        avg_price=("selling_price", "mean"),
        avg_wholesale=("wholesale_price", "mean"),
        avg_margin=("margin_pct", "mean"),
    )
    if order is not None:
        grouped = grouped.reindex(order, fill_value=0)
    else:
        grouped = grouped.sort_values("count", ascending=False)
    grouped = grouped.fillna(0)
    total = grouped["count"].sum() or 1
    top_revenue = grouped["revenue"].max() or 1
    return {
        "labels": [str(label) for label in grouped.index],
        "count": [int(v) for v in grouped["count"]],
        "share": _round(grouped["count"] / total * 100),
        "revenue": [int(v) for v in grouped["revenue"]],
        "cost": [int(v) for v in grouped["cost"]],
        "profit": [int(v) for v in grouped["profit"]],
        "avg_price": _round(grouped["avg_price"], 0),
        "avg_wholesale": _round(grouped["avg_wholesale"], 0),
        "avg_margin": _round(grouped["avg_margin"]),
        "revenue_share": _round(grouped["revenue"] / (grouped["revenue"].sum() or 1) * 100),
        "rel_revenue": _round(grouped["revenue"] / top_revenue * 100),
        "rel_count": _round(grouped["count"] / (grouped["count"].max() or 1) * 100),
    }


def _rows(group):
    """Turn a ``_grouped`` dict into a list of row dicts for templates."""
    keys = [k for k in group if k != "labels"]
    return [
        {"label": label, **{k: group[k][i] for k in keys}}
        for i, label in enumerate(group["labels"])
    ]


def _histogram(series, bins=12):
    counts, edges = np.histogram(series.dropna(), bins=bins)
    labels = [f"{edges[i]:,.0f}-{edges[i + 1]:,.0f}" for i in range(len(counts))]
    return {"labels": labels, "count": [int(c) for c in counts]}


def _pct_change(current, previous):
    if not previous:
        return None
    return round((current - previous) / previous * 100, 1)


# ---------------------------------------------------------------------------
# Dashboard builder
# ---------------------------------------------------------------------------

def build_dashboard(clean, quality, year=None, manufacturer=None):
    """Compute every statistic the dashboard shows for the selected filters."""
    scoped = clean
    if manufacturer:
        scoped = scoped[scoped["manufacturer"] == manufacturer]
    df = scoped[scoped["retail_year"] == year] if year else scoped

    if df.empty:
        return {"empty": True}

    revenue = int(df["selling_price"].sum())
    cost = int(df["wholesale_price"].sum())
    profit = int(df["profit"].sum())

    previous_revenue = None
    if year:
        previous = scoped[scoped["retail_year"] == year - 1]
        previous_revenue = int(previous["selling_price"].sum()) if len(previous) else None

    kpis = {
        "transactions": int(len(df)),
        "revenue": revenue,
        "cost": cost,
        "profit": profit,
        "margin": round(profit / revenue * 100, 1) if revenue else 0,
        "avg_price": round(float(df["selling_price"].mean())),
        "median_price": round(float(df["selling_price"].median())),
        "avg_profit": round(float(df["profit"].mean())),
        "avg_wholesale": round(float(df["wholesale_price"].mean())),
        "avg_km": round(float(df["kilometers_driven"].mean())),
        "avg_age": round(float(df["client_age"].mean()), 1),
        "avg_income": round(float(df["estimated_income"].mean())),
        "countries": int(df["client_country"].nunique()),
        "professions": int(df["client_profession"].nunique()),
        "colors": int(df["color"].nunique()),
        "active_share": round(
            float((df["vehicle_condition"] == "active").mean() * 100), 1
        ),
        "revenue_change": _pct_change(revenue, previous_revenue),
        "revenue_delta": revenue - previous_revenue if previous_revenue else None,
        "date_from": df["client_retail_date"].min().strftime("%d %b %Y"),
        "date_to": df["client_retail_date"].max().strftime("%d %b %Y"),
    }

    # --- time ---------------------------------------------------------------
    by_month = _grouped(df, "retail_month", order=range(1, 13))
    by_month["labels"] = MONTHS

    timeline = df.groupby("retail_period").agg(
        revenue=("selling_price", "sum"),
        cost=("wholesale_price", "sum"),
        profit=("profit", "sum"),
        count=("selling_price", "size"),
    )
    timeline_data = {
        "labels": [p.strftime("%b %Y") for p in timeline.index],
        "revenue": [int(v) for v in timeline["revenue"]],
        "cost": [int(v) for v in timeline["cost"]],
        "profit": [int(v) for v in timeline["profit"]],
        "count": [int(v) for v in timeline["count"]],
    }

    by_year = _grouped(scoped, "retail_year", order=sorted(clean["retail_year"].unique()))
    by_weekday = _grouped(df, "weekday", order=range(7))
    by_weekday["labels"] = WEEKDAYS

    # --- vehicles -----------------------------------------------------------
    by_manufacturer = _grouped(df, "manufacturer")
    by_body = _grouped(df, "body_type")
    by_fuel = _grouped(df, "fuel_type")
    by_engine = _grouped(df, "engine_type")
    by_transmission = _grouped(df, "transmission")
    by_condition = _grouped(df, "vehicle_condition")
    by_seats = _grouped(df, "seating_capacity", order=sorted(clean["seating_capacity"].unique()))
    by_model_year = _grouped(df, "year", order=sorted(clean["year"].unique()))
    by_km = _grouped(df, "km_band", order=KM_LABELS)
    top_colors = _grouped(df, "color")
    top_colors = {k: v[:10] for k, v in top_colors.items()}

    engine_transmission = pd.crosstab(df["engine_type"], df["transmission"])
    engine_transmission_data = {
        "labels": [str(i) for i in engine_transmission.index],
        "series": [
            {"label": str(col), "data": [int(v) for v in engine_transmission[col]]}
            for col in engine_transmission.columns
        ],
    }

    fuel_engine = pd.crosstab(df["engine_type"], df["fuel_type"])

    make_body = df.pivot_table(
        index="manufacturer",
        columns="body_type",
        values="selling_price",
        aggfunc="sum",
        fill_value=0,
        observed=False,
    )
    make_body_count = pd.crosstab(df["manufacturer"], df["body_type"])

    sample = df.sample(min(len(df), 700), random_state=42)
    scatter = [
        {"x": round(float(km) / 1000, 1), "y": int(price), "make": make}
        for km, price, make in zip(
            sample["kilometers_driven"], sample["selling_price"], sample["manufacturer"]
        )
    ]

    # --- clients ------------------------------------------------------------
    by_gender = _grouped(df, "client_gender")
    by_continent = _grouped(df, "client_continent")
    by_age_group = _grouped(df, "age_group", order=AGE_LABELS)
    by_income = _grouped(df, "income_band", order=INCOME_LABELS)
    age_gender = pd.crosstab(df["age_group"], df["client_gender"]).reindex(
        AGE_LABELS, fill_value=0
    )
    continent_income = (
        df.groupby("client_continent")["estimated_income"].mean().sort_values(ascending=False)
    )

    top_countries = _rows(_grouped(df, "client_country"))[:10]
    top_professions = _rows(_grouped(df, "client_profession"))[:10]

    # --- sales --------------------------------------------------------------
    by_season = _grouped(df, "season")
    margin_hist = _histogram(df["margin_pct"], bins=10)
    margin_hist["labels"] = [label + "%" for label in margin_hist["labels"]]
    price_hist = _histogram(df["selling_price"], bins=10)
    profit_hist = _histogram(df["profit"], bins=12)

    segments = (
        df.groupby(["manufacturer", "body_type"])
        .agg(
            count=("profit", "size"),
            revenue=("selling_price", "sum"),
            profit=("profit", "sum"),
            avg_margin=("margin_pct", "mean"),
        )
        .sort_values("profit", ascending=False)
        .head(10)
        .reset_index()
    )
    top_segments = [
        {
            "manufacturer": row.manufacturer,
            "body_type": row.body_type,
            "count": int(row.count),
            "revenue": int(row.revenue),
            "profit": int(row.profit),
            "avg_margin": round(float(row.avg_margin), 1),
        }
        for row in segments.itertuples()
    ]

    # --- statistics ---------------------------------------------------------
    stat_columns = NUMERIC_COLUMNS + ["profit", "margin_pct"]
    described = df[stat_columns].describe().T
    described["skew"] = df[stat_columns].skew()
    described["median"] = df[stat_columns].median()
    describe_rows = [
        {
            "column": column,
            "count": int(row["count"]),
            "mean": round(float(row["mean"]), 2),
            "std": round(float(row["std"]), 2),
            "min": round(float(row["min"]), 2),
            "q1": round(float(row["25%"]), 2),
            "median": round(float(row["median"]), 2),
            "q3": round(float(row["75%"]), 2),
            "max": round(float(row["max"]), 2),
            "skew": round(float(row["skew"]), 3),
        }
        for column, row in described.iterrows()
    ]

    corr = df[stat_columns].corr().round(2)
    correlation = {
        "labels": stat_columns,
        "matrix": [[float(v) for v in row] for row in corr.values],
    }

    recent = df.sort_values("client_retail_date", ascending=False).head(12)
    recent_rows = [
        {
            "date": row.client_retail_date.strftime("%d %b %Y"),
            "client": row.client_name,
            "country": row.client_country,
            "vehicle": f"{row.manufacturer} {row.body_type}",
            "model_year": int(row.year),
            "fuel": row.fuel_type,
            "price": int(row.selling_price),
            "profit": int(row.profit),
        }
        for row in recent.itertuples()
    ]

    # --- headline insights --------------------------------------------------
    best_month = int(np.argmax(by_month["revenue"]))
    top_make = by_manufacturer["labels"][int(np.argmax(by_manufacturer["revenue"]))]
    top_body = by_body["labels"][int(np.argmax(by_body["revenue"]))]
    best_margin_season = by_season["labels"][int(np.argmax(by_season["avg_margin"]))]
    top_continent = by_continent["labels"][int(np.argmax(by_continent["revenue"]))]
    insights = [
        {"label": "Best month", "value": MONTHS[best_month],
         "note": f"${by_month['revenue'][best_month]:,} revenue"},
        {"label": "Top manufacturer", "value": top_make,
         "note": f"{by_manufacturer['share'][by_manufacturer['labels'].index(top_make)]}% of sales"},
        {"label": "Top body type", "value": top_body,
         "note": f"${by_body['revenue'][by_body['labels'].index(top_body)]:,} revenue"},
        {"label": "Top continent", "value": top_continent,
         "note": f"{by_continent['count'][by_continent['labels'].index(top_continent)]:,} buyers"},
        {"label": "Best-margin season", "value": best_margin_season.replace("_", " ").title(),
         "note": f"{by_season['avg_margin'][by_season['labels'].index(best_margin_season)]}% avg margin"},
    ]

    charts = {
        "by_month": by_month,
        "timeline": timeline_data,
        "by_year": by_year,
        "by_weekday": by_weekday,
        "by_manufacturer": by_manufacturer,
        "by_body": by_body,
        "by_fuel": by_fuel,
        "by_engine": by_engine,
        "by_transmission": by_transmission,
        "by_condition": by_condition,
        "by_seats": by_seats,
        "by_model_year": by_model_year,
        "by_km": by_km,
        "top_colors": top_colors,
        "engine_transmission": engine_transmission_data,
        "fuel_engine": {
            "rows": [str(i) for i in fuel_engine.index],
            "cols": [str(c) for c in fuel_engine.columns],
            "matrix": fuel_engine.values.tolist(),
        },
        "make_body": {
            "rows": [str(i) for i in make_body.index],
            "cols": [str(c) for c in make_body.columns],
            "matrix": make_body.values.tolist(),
            "counts": make_body_count.reindex(
                index=make_body.index, columns=make_body.columns, fill_value=0
            ).values.tolist(),
        },
        "scatter": scatter,
        "by_gender": by_gender,
        "by_continent": by_continent,
        "by_age_group": by_age_group,
        "by_income": by_income,
        "age_gender": {
            "labels": AGE_LABELS,
            "series": [
                {"label": str(col), "data": [int(v) for v in age_gender[col]]}
                for col in age_gender.columns
            ],
        },
        "continent_income": {
            "labels": [str(i) for i in continent_income.index],
            "values": _round(continent_income, 0),
        },
        "by_season": by_season,
        "margin_hist": margin_hist,
        "price_hist": price_hist,
        "profit_hist": profit_hist,
        "correlation": correlation,
    }

    return _to_python({
        "empty": False,
        "kpis": kpis,
        "insights": insights,
        "charts": charts,
        "manufacturer_rows": _rows(by_manufacturer),
        "body_rows": _rows(by_body),
        "fuel_rows": _rows(by_fuel),
        "season_rows": _rows(by_season),
        "transmission_rows": _rows(by_transmission),
        "condition_rows": _rows(by_condition),
        "gender_rows": _rows(by_gender),
        "color_rows": _rows(top_colors),
        "continent_rows": _rows(by_continent),
        "top_countries": top_countries,
        "top_professions": top_professions,
        "top_segments": top_segments,
        "describe_rows": describe_rows,
        "recent_rows": recent_rows,
        "quality": quality,
    })
