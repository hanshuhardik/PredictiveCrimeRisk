import os
import logging
from typing import List, Dict, Any
from flask import Flask, jsonify, request, abort
from flask_cors import CORS
import pandas as pd

# Logging Setup

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s in %(module)s: %(message)s')
logger = logging.getLogger(__name__)


# Flask App Initialization

app = Flask(__name__)
CORS(app)  # Allow all origins by default (localhost frontend)

DATA_FILE = os.path.join(os.path.dirname(__file__), 'ps_safety_index.csv')
ENRICHED_FILE = os.path.join(os.path.dirname(__file__), 'ps_safety_index_with_risk.csv')  # optional enriched file
TRENDS_FILE = os.path.join(os.path.dirname(__file__), '..', 'data_pipeline', 'ps_trends.csv')  # optional trends file

_df: pd.DataFrame = pd.DataFrame()

# Columns that may be present and should be returned if available
BASE_COLUMNS = [
    'District_Name', 'UnitName', 'FIRST_YEAR', 'LAST_YEAR', 'YEARS_RECORDED',
    'TOTAL_FIRs', 'HEINOUS_FIRs', 'NON_HEINOUS_FIRs', 'HEINOUS_RATIO', 'FIRs_PER_YEAR',
    'CRIME_VOLUME_SCALED', 'RISK_SCORE_NORM', 'SAFETY_INDEX', 'Latitude_mean', 'Longitude_mean'
]
OPTIONAL_COLUMNS = ['RISK_LEVEL', 'predicted_FIRs_next_year', 'trend_direction']

NORMALIZE_DISTRICT_COL = 'District_norm'
NORMALIZE_UNIT_COL = 'Unit_norm'


# Data Loading


def load_data() -> pd.DataFrame:
    """Load the main CSV (prefer enriched if exists) and prepare normalized columns."""
    file_to_use = DATA_FILE
    if os.path.exists(ENRICHED_FILE):
        logger.info('Using enriched safety file with risk levels: %s', ENRICHED_FILE)
        file_to_use = ENRICHED_FILE
    else:
        logger.info('Enriched file not found; using base file: %s', DATA_FILE)

    if not os.path.exists(file_to_use):
        logger.error('Data file not found at %s', file_to_use)
        raise FileNotFoundError(f'Data file not found: {file_to_use}')

    df = pd.read_csv(file_to_use)

    # Ensure expected columns exist
    missing = [c for c in ['District_Name', 'UnitName', 'SAFETY_INDEX'] if c not in df.columns]
    if missing:
        raise ValueError(f'Missing required columns in CSV: {missing}')

    # Add normalized columns for case-insensitive lookup
    df[NORMALIZE_DISTRICT_COL] = df['District_Name'].astype(str).str.strip().str.lower()
    df[NORMALIZE_UNIT_COL] = df['UnitName'].astype(str).str.strip().str.lower()

    # Attempt to merge trends file if present
    if os.path.exists(TRENDS_FILE):
        try:
            trends_df = pd.read_csv(TRENDS_FILE)
            required_trend_cols = ['District_Name', 'UnitName', 'predicted_FIRs_next_year', 'trend_direction']
            missing_trend = [c for c in required_trend_cols if c not in trends_df.columns]
            if missing_trend:
                logger.warning('Trends file missing columns %s; skipping merge.', missing_trend)
            else:
                logger.info('Merging trends data from %s', TRENDS_FILE)
                df = df.merge(trends_df[required_trend_cols], on=['District_Name', 'UnitName'], how='left')
        except Exception as te:
            logger.exception('Failed merging trends file: %s', te)

    logger.info('Loaded %d rows of safety data.', len(df))
    return df

try:
    _df = load_data()
except Exception as e:
    logger.exception('Failed to load initial data: %s', e)
    _df = pd.DataFrame()  # Keep app running; endpoints will report error

# ----------------------------------
# Helper Functions
# ----------------------------------

def row_to_dict(row: pd.Series) -> Dict[str, Any]:
    """Convert a DataFrame row to dict excluding helper normalization columns."""
    cols = [c for c in BASE_COLUMNS + OPTIONAL_COLUMNS if c in _df.columns]
    data = {c: row.get(c) for c in cols}
    return data


def filter_dataframe(df: pd.DataFrame, district: str = None, min_safety: float = None) -> pd.DataFrame:
    filtered = df
    if district:
        d_norm = district.strip().lower()
        filtered = filtered[filtered[NORMALIZE_DISTRICT_COL] == d_norm]
    if min_safety is not None:
        try:
            min_val = float(min_safety)
            filtered = filtered[filtered['SAFETY_INDEX'] >= min_val]
        except ValueError:
            abort(400, description='Invalid min_safety parameter')
    return filtered


def sort_dataframe(df: pd.DataFrame, sort_by: str, order: str) -> pd.DataFrame:
    if sort_by not in df.columns:
        sort_by = 'SAFETY_INDEX'
    ascending = order == 'asc'
    return df.sort_values(by=sort_by, ascending=ascending)

# ----------------------------------
# Routes
# ----------------------------------
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'Backend is running'})


@app.route('/api/ps', methods=['GET'])
def get_all_ps():
    if _df.empty:
        abort(500, description='Data not loaded')

    district = request.args.get('district')
    min_safety = request.args.get('min_safety')
    limit = request.args.get('limit', '1000')
    sort_by = request.args.get('sort_by', 'SAFETY_INDEX')
    order = request.args.get('order', 'desc')

    try:
        limit_int = int(limit)
    except ValueError:
        abort(400, description='Invalid limit parameter')

    if order not in ['asc', 'desc']:
        abort(400, description='Invalid order parameter')

    filtered = filter_dataframe(_df, district=district, min_safety=min_safety)
    sorted_df = sort_dataframe(filtered, sort_by=sort_by, order=order)

    result_df = sorted_df.head(limit_int)
    data = [row_to_dict(r) for _, r in result_df.iterrows()]
    return jsonify(data)


@app.route('/api/ps/<district_name>', methods=['GET'])
def get_ps_by_district(district_name: str):
    if _df.empty:
        abort(500, description='Data not loaded')
    d_norm = district_name.strip().lower()
    subset = _df[_df[NORMALIZE_DISTRICT_COL] == d_norm]
    if subset.empty:
        abort(404, description='District not found')
    data = [row_to_dict(r) for _, r in subset.iterrows()]
    return jsonify(data)


@app.route('/api/ps/<district_name>/<unit_name>', methods=['GET'])
def get_single_ps(district_name: str, unit_name: str):
    if _df.empty:
        abort(500, description='Data not loaded')
    d_norm = district_name.strip().lower()
    u_norm = unit_name.strip().lower()
    subset = _df[(_df[NORMALIZE_DISTRICT_COL] == d_norm) & (_df[NORMALIZE_UNIT_COL] == u_norm)]
    if subset.empty:
        abort(404, description='Police station not found')
    row = subset.iloc[0]
    return jsonify(row_to_dict(row))


@app.route('/api/districts', methods=['GET'])
def get_district_summary():
    if _df.empty:
        abort(500, description='Data not loaded')

    grp = _df.groupby('District_Name')
    summary_rows: List[Dict[str, Any]] = []
    for district, g in grp:
        data = {
            'District_Name': district,
            'number_of_ps': int(g['UnitName'].nunique()),
            'avg_safety': round(g['SAFETY_INDEX'].mean(), 2) if 'SAFETY_INDEX' in g.columns else None,
            'max_safety': g['SAFETY_INDEX'].max() if 'SAFETY_INDEX' in g.columns else None,
            'min_safety': g['SAFETY_INDEX'].min() if 'SAFETY_INDEX' in g.columns else None,
            'total_firs': int(g['TOTAL_FIRs'].sum()) if 'TOTAL_FIRs' in g.columns else None
        }
        summary_rows.append(data)
    return jsonify(summary_rows)

@app.route('/api/trends', methods=['GET'])
def get_trends():
    """Return trend predictions per station with optional district filter."""
    if _df.empty:
        abort(500, description='Data not loaded')
    district = request.args.get('district')
    subset = _df
    if district:
        d_norm = district.strip().lower()
        subset = subset[subset[NORMALIZE_DISTRICT_COL] == d_norm]
    if 'predicted_FIRs_next_year' not in subset.columns:
        abort(404, description='Trend data not available')
    out_cols = ['District_Name', 'UnitName', 'predicted_FIRs_next_year', 'trend_direction']
    data = [
        {
            'District_Name': r['District_Name'],
            'UnitName': r['UnitName'],
            'predicted_FIRs_next_year': r.get('predicted_FIRs_next_year'),
            'trend_direction': r.get('trend_direction')
        } for _, r in subset[out_cols].iterrows()
    ]
    if not data:
        abort(404, description='No trend rows found')
    return jsonify(data)


# Error Handlers

@app.errorhandler(400)
def bad_request(e):
    return jsonify({'error': 'bad_request', 'message': str(e.description)}), 400

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'not_found', 'message': str(e.description)}), 404

@app.errorhandler(500)
def internal_error(e):
    return jsonify({'error': 'internal_error', 'message': str(e.description)}), 500


# Entry Point

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
