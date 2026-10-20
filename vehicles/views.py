# Create your views here.
import pandas as pd

from django.conf import settings
from django.shortcuts import render

from .dashboard import frequency_table


def dashboard_view(request):
    csv_path = (
        settings.BASE_DIR
        / "dummy_data"
        / "vehicles_ml_dataset.csv"
    )

    df = pd.read_csv(csv_path)

    table_html = frequency_table(df)

    return render(
        request,
        "vehicles/index.html",
        {
            "frequency_table": table_html,
        },
    )