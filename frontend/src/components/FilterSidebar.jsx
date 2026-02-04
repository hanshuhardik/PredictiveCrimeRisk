import React, { useState, useMemo } from 'react';

export default function FilterSidebar({ stations, onFilter }) {
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedPS, setSelectedPS] = useState(null);
  const [riskFilter, setRiskFilter] = useState({
    CRITICAL: true,
    HIGH: true,
    MEDIUM: true,
    LOW: true
  });

  const [trendFilter, setTrendFilter] = useState({
    INCREASING: true,
    STABLE: true,
    DECREASING: true
  });

  const [safetyRange, setSafetyRange] = useState([0, 100]);
  const [firsRange, setFirsRange] = useState([0, 500]);

  // Get unique districts and PS
  const districts = useMemo(() => {
    const unique = [...new Set(stations.map(s => s.District_Name))].sort();
    return unique.filter(d => d);
  }, [stations]);

  const psInDistrict = useMemo(() => {
    if (!selectedDistrict) return [];
    return [...new Set(
      stations
        .filter(s => s.District_Name === selectedDistrict)
        .map(s => s.UnitName)
    )].sort().filter(p => p);
  }, [selectedDistrict, stations]);

  const handleRiskChange = (level) => {
    const newFilter = { ...riskFilter, [level]: !riskFilter[level] };
    setRiskFilter(newFilter);
    applyFilters(newFilter, trendFilter, safetyRange, firsRange, selectedDistrict, selectedPS);
  };

  const handleTrendChange = (trend) => {
    const newFilter = { ...trendFilter, [trend]: !trendFilter[trend] };
    setTrendFilter(newFilter);
    applyFilters(riskFilter, newFilter, safetyRange, firsRange, selectedDistrict, selectedPS);
  };

  const handleDistrictChange = (e) => {
    const district = e.target.value || null;
    setSelectedDistrict(district);
    setSelectedPS(null); // Reset PS when changing district
    applyFilters(riskFilter, trendFilter, safetyRange, firsRange, district, null);
  };

  const handlePSChange = (e) => {
    const ps = e.target.value || null;
    setSelectedPS(ps);
    applyFilters(riskFilter, trendFilter, safetyRange, firsRange, selectedDistrict, ps);
  };

  const handleSafetyChange = (e) => {
    const newRange = [parseFloat(e.target.value), safetyRange[1]];
    if (newRange[0] <= newRange[1]) {
      setSafetyRange(newRange);
      applyFilters(riskFilter, trendFilter, newRange, firsRange, selectedDistrict, selectedPS);
    }
  };

  const handleSafetyMaxChange = (e) => {
    const newRange = [safetyRange[0], parseFloat(e.target.value)];
    if (newRange[0] <= newRange[1]) {
      setSafetyRange(newRange);
      applyFilters(riskFilter, trendFilter, newRange, firsRange, selectedDistrict, selectedPS);
    }
  };

  const handleFirsChange = (e) => {
    const newRange = [parseFloat(e.target.value), firsRange[1]];
    if (newRange[0] <= newRange[1]) {
      setFirsRange(newRange);
      applyFilters(riskFilter, trendFilter, safetyRange, newRange, selectedDistrict, selectedPS);
    }
  };

  const handleFirsMaxChange = (e) => {
    const newRange = [firsRange[0], parseFloat(e.target.value)];
    if (newRange[0] <= newRange[1]) {
      setFirsRange(newRange);
      applyFilters(riskFilter, trendFilter, safetyRange, newRange, selectedDistrict, selectedPS);
    }
  };

  const applyFilters = (riskF, trendF, safetyR, firsR, district, ps) => {
    const activeRiskLevels = Object.keys(riskF).filter(k => riskF[k]);
    const activeTrends = Object.keys(trendF).filter(k => trendF[k]);

    const filtered = stations.filter(s => {
      const risk = (s.RISK_LEVEL || 'MEDIUM').toUpperCase();
      const trend = (s.trend_direction || 'STABLE').toUpperCase();
      const safety = Number.isFinite(parseFloat(s.SAFETY_INDEX)) ? parseFloat(s.SAFETY_INDEX) : 0;
      const firs = Number.isFinite(parseFloat(s.FIRs_PER_YEAR)) ? parseFloat(s.FIRs_PER_YEAR) : 0;

      // Check all filters (if none selected, include all)
      const passRisk = activeRiskLevels.length === 0 || activeRiskLevels.includes(risk);
      const passTrend = activeTrends.length === 0 || activeTrends.includes(trend);
      const passSafety = safety >= safetyR[0] && safety <= safetyR[1];
      const passFirs = firs >= firsR[0] && firs <= firsR[1];
      const passDistrict = !district || s.District_Name === district;
      const passPS = !ps || s.UnitName === ps;

      return passRisk && passTrend && passSafety && passFirs && passDistrict && passPS;
    });

    onFilter(filtered);
  };

  const resetFilters = () => {
    const defaultRisk = { CRITICAL: true, HIGH: true, MEDIUM: true, LOW: true };
    const defaultTrend = { INCREASING: true, STABLE: true, DECREASING: true };
    setRiskFilter(defaultRisk);
    setTrendFilter(defaultTrend);
    setSafetyRange([0, 100]);
    setFirsRange([0, 500]);
    setSelectedDistrict(null);
    setSelectedPS(null);
    applyFilters(defaultRisk, defaultTrend, [0, 100], [0, 500], null, null);
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-md max-h-[600px] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Filters</h3>
        <button
          onClick={resetFilters}
          className="text-xs bg-slate-200 hover:bg-slate-300 px-2 py-1 rounded"
        >
          Reset
        </button>
      </div>

      {/* District Dropdown */}
      <div className="mb-5">
        <label className="font-semibold text-sm text-slate-700 mb-2 block">Select District</label>
        <select
          value={selectedDistrict || ''}
          onChange={handleDistrictChange}
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Districts</option>
          {districts.map(district => (
            <option key={district} value={district}>
              {district} ({stations.filter(s => s.District_Name === district).length})
            </option>
          ))}
        </select>
      </div>

      {/* PS Dropdown */}
      {selectedDistrict && (
        <div className="mb-5">
          <label className="font-semibold text-sm text-slate-700 mb-2 block">Select Police Station</label>
          <select
            value={selectedPS || ''}
            onChange={handlePSChange}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All PS in {selectedDistrict} ({psInDistrict.length})</option>
            {psInDistrict.map(ps => (
              <option key={ps} value={ps}>
                {ps} ({stations.filter(s => s.UnitName === ps).length})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Risk Level Filter */}
      <div className="mb-5">
        <h4 className="font-semibold text-sm text-slate-700 mb-2">Risk Level</h4>
        <div className="space-y-2">
          {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(level => (
            <label key={level} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={riskFilter[level]}
                onChange={() => handleRiskChange(level)}
                className="rounded"
              />
              <span className={`text-sm font-medium w-16`}>
                {level}
              </span>
              <span className="text-xs text-slate-500">
                ({stations.filter(s => (s.RISK_LEVEL || 'MEDIUM') === level).length})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Trend Filter */}
      <div className="mb-5">
        <h4 className="font-semibold text-sm text-slate-700 mb-2">Crime Trend</h4>
        <div className="space-y-2">
          {['INCREASING', 'STABLE', 'DECREASING'].map(trend => (
            <label key={trend} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={trendFilter[trend]}
                onChange={() => handleTrendChange(trend)}
                className="rounded"
              />
              <span className="text-sm font-medium">
                {trend === 'INCREASING' && '📈'}
                {trend === 'STABLE' && '➡️'}
                {trend === 'DECREASING' && '📉'}
                {' ' + trend}
              </span>
              <span className="text-xs text-slate-500">
                ({stations.filter(s => (s.trend_direction || 'STABLE') === trend).length})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Safety Range Slider */}
      <div className="mb-5">
        <h4 className="font-semibold text-sm text-slate-700 mb-2">
          Safety Index Range: {safetyRange[0].toFixed(0)} - {safetyRange[1].toFixed(0)}
        </h4>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-slate-600">Min:</label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={safetyRange[0]}
              onChange={handleSafetyChange}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">Max:</label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={safetyRange[1]}
              onChange={handleSafetyMaxChange}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* FIRs Range Slider */}
      <div className="mb-5">
        <h4 className="font-semibold text-sm text-slate-700 mb-2">
          FIRs/Year Range: {firsRange[0].toFixed(0)} - {firsRange[1].toFixed(0)}
        </h4>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-slate-600">Min:</label>
            <input
              type="range"
              min="0"
              max="500"
              step="5"
              value={firsRange[0]}
              onChange={handleFirsChange}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">Max:</label>
            <input
              type="range"
              min="0"
              max="500"
              step="5"
              value={firsRange[1]}
              onChange={handleFirsMaxChange}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Filter Stats */}
      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-slate-700 mt-5">
        <p>
          <strong>Total Stations:</strong> {stations.length}
        </p>
        {(selectedDistrict || selectedPS) && (
          <p className="text-xs text-slate-600 mt-1">
            {selectedDistrict && `📍 ${selectedDistrict}`}
            {selectedPS && ` • ${selectedPS}`}
          </p>
        )}
      </div>
    </div>
  );
}
