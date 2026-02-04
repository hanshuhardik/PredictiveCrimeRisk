"""Trend Forecasting Script
Reads ps_safety_index.csv and (optionally) station-year FIR data if available.
Since the aggregated file has one row per police station, we will simulate a
simple yearly time series using TOTAL_FIRs / YEARS_RECORDED distributed linearly
between FIRST_YEAR and LAST_YEAR. This is a placeholder approach that should be
replaced with actual per-year FIR counts if available.

Generates:
    ps_trends.csv with columns:
        District_Name, UnitName, predicted_FIRs_next_year, trend_direction

Trend logic:
    We fit a simple linear regression on the synthetic yearly FIR counts.
    slope > +threshold  => increasing
    slope < -threshold  => decreasing
    else                => stable

Forecast logic:
    Predicted next year FIRs = last_year_value + slope

Requirements:
    pandas, numpy, scikit-learn
"""
from __future__ import annotations
import os
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'backend', 'ps_safety_index_with_risk.csv')
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), 'ps_trends.csv')
SLOPE_THRESHOLD = 0.5  # heuristic threshold for trend direction


def generate_synthetic_series(row: pd.Series) -> pd.DataFrame:
    """Create a synthetic yearly FIR series for a station.
    Distributes TOTAL_FIRs across YEARS_RECORDED using a simple linear ramp
    based on HEINOUS_RATIO to introduce variation.
    """
    first_year = int(row['FIRST_YEAR'])
    last_year = int(row['LAST_YEAR'])
    total_firs = row.get('TOTAL_FIRs', np.nan)
    years_recorded = int(row.get('YEARS_RECORDED', (last_year - first_year + 1)))
    if years_recorded <= 0 or np.isnan(total_firs):
        return pd.DataFrame(columns=['year', 'firs'])

    years = list(range(first_year, last_year + 1))
    # Base average per year
    avg_per_year = total_firs / years_recorded if years_recorded else 0
    # Introduce gentle trend using heinous ratio
    heinous_ratio = row.get('HEINOUS_RATIO', 0.0) or 0.0
    # Create a ramp around average
    ramp = np.linspace(-heinous_ratio, heinous_ratio, len(years)) * avg_per_year * 0.2
    firs = avg_per_year + ramp
    # Ensure non-negative
    firs = np.maximum(firs, 0)
    return pd.DataFrame({'year': years, 'firs': firs})


def fit_trend_predict(df_station: pd.DataFrame) -> tuple[float, float]:
    """Fit linear regression to yearly firs and return slope & next year prediction."""
    if df_station.empty:
        return 0.0, 0.0
    X = df_station[['year']].values
    y = df_station['firs'].values
    model = LinearRegression()
    model.fit(X, y)
    slope = model.coef_[0]
    next_year = df_station['year'].max() + 1
    predicted = float(model.predict([[next_year]])[0])
    return slope, predicted


def trend_direction(slope: float) -> str:
    if slope > SLOPE_THRESHOLD:
        return 'increasing'
    if slope < -SLOPE_THRESHOLD:
        return 'decreasing'
    return 'stable'


def main():
    if not os.path.exists(DATA_FILE):
        raise FileNotFoundError(f'Data file missing: {DATA_FILE}')
    base_df = pd.read_csv(DATA_FILE)

    results = []
    for _, row in base_df.iterrows():
        series_df = generate_synthetic_series(row)
        slope, predicted = fit_trend_predict(series_df)
        results.append({
            'District_Name': row['District_Name'],
            'UnitName': row['UnitName'],
            'predicted_FIRs_next_year': round(predicted, 2),
            'trend_direction': trend_direction(slope)
        })

    out_df = pd.DataFrame(results)
    out_df.to_csv(OUTPUT_FILE, index=False)
    print(f'Wrote trends to {OUTPUT_FILE} ({len(out_df)} rows)')


if __name__ == '__main__':
    main()
