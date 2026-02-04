import React from 'react';

export default function StationDetailPanel({ station, onClose }) {
  if (!station) return null;

  const getRiskColor = (risk) => {
    const colors = {
      'CRITICAL': 'bg-red-100 text-red-800 border-red-300',
      'HIGH': 'bg-orange-100 text-orange-800 border-orange-300',
      'MEDIUM': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'LOW': 'bg-green-100 text-green-800 border-green-300'
    };
    return colors[risk] || 'bg-slate-100 text-slate-800 border-slate-300';
  };

  const getTrendIcon = (trend) => {
    const icons = {
      'INCREASING': '📈',
      'STABLE': '➡️',
      'DECREASING': '📉'
    };
    return icons[trend] || '➡️';
  };

  const risk = station.RISK_LEVEL || 'MEDIUM';
  const trend = station.trend_direction || 'STABLE';

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{station.UnitName}</h2>
          <p className="text-slate-600 mt-1">📍 {station.District_Name}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 text-2xl"
        >
          ✕
        </button>
      </div>

      {/* Risk Badge */}
      <div className="mb-4">
        <span className={`inline-block px-3 py-1 rounded-full font-semibold border ${getRiskColor(risk)}`}>
          {risk} Risk Level
        </span>
      </div>

      {/* Location */}
      <div className="bg-slate-50 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-slate-800 mb-2">Location</h3>
        <div className="text-sm text-slate-700 space-y-1">
          <p><strong>Coordinates:</strong> {station.Latitude_mean?.toFixed(4)}, {station.Longitude_mean?.toFixed(4)}</p>
          <p><strong>District:</strong> {station.District_Name}</p>
          <p><strong>Unit Type:</strong> {station.UnitName}</p>
        </div>
      </div>

      {/* Safety Metrics */}
      <div className="bg-blue-50 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-slate-800 mb-3">Safety Metrics</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-slate-600">Safety Index</p>
            <p className="text-xl font-bold text-blue-600">{parseFloat(station.SAFETY_INDEX || 0).toFixed(1)}/100</p>
          </div>
          <div>
            <p className="text-xs text-slate-600">FIRs per Year</p>
            <p className="text-xl font-bold text-orange-600">{parseFloat(station.FIRs_PER_YEAR || 0).toFixed(1)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600">Crime Volume</p>
            <p className="text-lg font-bold text-slate-700">{Math.round(station.TOTAL_FIRs || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600">Data Quality</p>
            <p className="text-lg font-bold text-green-600">{((station.data_quality || 0.95) * 100).toFixed(0)}%</p>
          </div>
        </div>
      </div>

      {/* Crime Analysis */}
      <div className="bg-red-50 rounded-lg p-4 mb-4">
  <h3 className="font-semibold text-slate-800 mb-3">Crime Analysis</h3>

  <div className="space-y-2 text-sm">
    <div className="flex justify-between">
      <span className="text-slate-700">Heinous Crimes:</span>
      <span className="font-semibold">
        {Math.round(station.HEINOUS_FIRs || 0)} (
        {(parseFloat(station.HEINOUS_RATIO || 0) * 100).toFixed(1)}%)
      </span>
    </div>

    <div className="flex justify-between">
      <span className="text-slate-700">Non-Heinous Crimes:</span>
      <span className="font-semibold">
        {Math.round(station.NON_HEINOUS_FIRs || 0)}
      </span>
    </div>

    <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
      <div
        className="bg-red-600 h-2 rounded-full"
        style={{
          width: `${Math.min((station.HEINOUS_RATIO || 0) * 100, 100)}%`,
        }}
      />
    </div>
  </div>
</div>


      {/* Trend Analysis */}
      <div className="bg-purple-50 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-slate-800 mb-3">Trend Analysis</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getTrendIcon(trend)}</span>
            <div>
              <p className="text-xs text-slate-600">Crime Trend</p>
              <p className="font-semibold text-slate-800">{trend}</p>
            </div>
          </div>
          {station.predicted_FIRs_next_year && (
            <div className="text-sm text-slate-700 mt-3">
              <p><strong>2024 Forecast:</strong> {parseFloat(station.predicted_FIRs_next_year).toFixed(1)} FIRs</p>
            </div>
          )}
        </div>
      </div>

      {/* Historical Data */}
      <div className="bg-slate-50 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-slate-800 mb-3">Historical Data</h3>
        <div className="text-sm text-slate-700 space-y-1">
          <p><strong>First Year Recorded:</strong> {station.FIRST_YEAR || 'N/A'}</p>
          <p><strong>Last Year Recorded:</strong> {station.LAST_YEAR || 'N/A'}</p>
          <p><strong>Years Covered:</strong> {station.YEARS_RECORDED || 'N/A'}</p>
          <p><strong>Total FIRs (All Years):</strong> {Math.round(station.TOTAL_FIRs || 0)}</p>
        </div>
      </div>

      {/* Risk Score */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-lg p-4">
        <p className="text-xs opacity-90">Overall Risk Score</p>
        <div className="flex items-center justify-between mt-2">
          <p className="text-3xl font-bold">{(parseFloat(station.RISK_SCORE_NORM || 0) * 100).toFixed(0)}</p>
          <p className="text-xs opacity-75">Normalized (0-100)</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 grid grid-cols-2 gap-2">
        <button className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition">
          View on Map
        </button>
        <button className="bg-slate-200 hover:bg-slate-300 text-slate-800 py-2 rounded-lg font-semibold transition">
          Similar Stations
        </button>
      </div>
    </div>
  );
}
