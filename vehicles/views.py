# Create your views here.
from django.conf import settings
from django.shortcuts import render

from .dashboard import build_dashboard, frequency_table, load_dataset


def dashboard_view(request):
    csv_path = (
        settings.BASE_DIR
        / "dummy_data"
        / "vehicles_ml_dataset.csv"
    )

    raw, clean, quality = load_dataset(csv_path)

    years = sorted(int(y) for y in clean["retail_year"].unique())
    manufacturers = sorted(clean["manufacturer"].unique())

    try:
        year = int(request.GET.get("year", ""))
    except ValueError:
        year = None
    if year not in years:
        year = None

    manufacturer = request.GET.get("make") or None
    if manufacturer not in manufacturers:
        manufacturer = None

    data = build_dashboard(clean, quality, year=year, manufacturer=manufacturer)

    return render(
        request,
        "vehicles/index.html",
        {
            "data": data,
            "charts": data.get("charts", {}),
            "years": years,
            "manufacturers": manufacturers,
            "selected_year": year,
            "selected_make": manufacturer,
            "frequency_table": frequency_table(clean),
        },
    )
