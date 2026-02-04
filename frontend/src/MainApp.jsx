import React, { useState, useEffect, useMemo } from 'react';
import MapView from './MapView';
import Dashboard from './components/Dashboard';
import RiskDistributionChart from './components/RiskDistributionChart';
import TrendDistributionChart from './components/TrendDistributionChart';
import TopStationsChart from './components/TopStationsChart';
import FilterSidebar from './components/FilterSidebar';
import StationDetailPanel from './components/StationDetailPanel';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapLocationDot } from "@fortawesome/free-solid-svg-icons";
import { faMap } from "@fortawesome/free-solid-svg-icons";  
import { faMagnifyingGlassChart } from "@fortawesome/free-solid-svg-icons";
import { faGrip } from "@fortawesome/free-solid-svg-icons";
const API_BASE = 'http://localhost:5000';

export default function MainApp() {
  const [allStations, setAllStations] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [activeTab, setActiveTab] = useState('map'); // map, dashboard, analytics
  const [dashboardDistrict, setDashboardDistrict] = useState('');
  const [analyticsDistrict, setAnalyticsDistrict] = useState('');
  const [mapExpanded, setMapExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all stations on mount
  useEffect(() => {
    const fetchAllStations = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(`${API_BASE}/api/ps?limit=2000`);
        if (!resp.ok) throw new Error('Failed to fetch stations');
        const data = await resp.json();
        const stations = Array.isArray(data) ? data : [];
        setAllStations(stations);
        setFilteredStations(stations);
      } catch (e) {
        setError(e.message);
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAllStations();
  }, []);

  const handleFilter = (filtered) => {
    setFilteredStations(Array.isArray(filtered) ? filtered : allStations);
  };

  const districtOptions = useMemo(() => {
    return [...new Set(allStations.map(s => s.District_Name).filter(Boolean))].sort();
  }, [allStations]);

  const dashboardStations = useMemo(() => {
    if (!dashboardDistrict) return filteredStations;
    return filteredStations.filter(s => s.District_Name === dashboardDistrict);
  }, [dashboardDistrict, filteredStations]);

  const analyticsStations = useMemo(() => {
    if (!analyticsDistrict) return filteredStations;
    return filteredStations.filter(s => s.District_Name === analyticsDistrict);
  }, [analyticsDistrict, filteredStations]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Loading Safety Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-red-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <p className="text-red-600 font-semibold text-lg mb-2">❌ Error Loading Data</p>
          <p className="text-slate-700">{error}</p>
          <p className="text-sm text-slate-500 mt-4">Make sure the backend server is running on localhost:5000</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold"> 
                <FontAwesomeIcon icon={faMapLocationDot} />
                  Karnataka Traveler Safety Map</h1>
              <p className="text-emerald-100 text-sm">Geospatial Safety Analytics Platform</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">{filteredStations.length} Stations</p>
              <p className="text-emerald-100 text-sm">Showing filtered results</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto flex gap-4 px-4">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-3 font-semibold transition ${
              activeTab === 'map'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <FontAwesomeIcon icon={faMap} /> Map View
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-3 font-semibold transition ${
              activeTab === 'dashboard'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <FontAwesomeIcon icon={faGrip} /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-3 font-semibold transition ${
              activeTab === 'analytics'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <FontAwesomeIcon icon={faMagnifyingGlassChart} /> Analytics
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {activeTab === 'map' && (
          <div className="flex-1 flex gap-4 p-4">
            {/* Map */}
            <div className={`relative ${mapExpanded ? 'flex-1' : 'flex-1'}`}>
              <MapView stations={filteredStations} onStationClick={setSelectedStation} />
              <button
                onClick={() => setMapExpanded(!mapExpanded)}
                className="absolute bottom-4 right-4 z-20 bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-700 shadow-lg rounded px-4 py-2 text-xs font-semibold"
              >
                {mapExpanded ? 'Minimize Map' : 'Maximize Map'}
              </button>
            </div>

            {/* Right Sidebar - Filters & Details */}
            {!mapExpanded && (
              <div className="w-80 flex flex-col gap-4">
                {selectedStation ? (
                  <div className="flex-1 min-h-0">
                    <StationDetailPanel
                      station={selectedStation}
                      onClose={() => setSelectedStation(null)}
                    />
                  </div>
                ) : (
                  <div className="flex-1 min-h-0">
                    <FilterSidebar
                      stations={allStations}
                      onFilter={handleFilter}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-slate-700">District:</label>
                <select
                  value={dashboardDistrict}
                  onChange={(e) => setDashboardDistrict(e.target.value)}
                  className="border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Districts</option>
                  {districtOptions.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {dashboardDistrict && (
                  <button
                    onClick={() => setDashboardDistrict('')}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>

              <Dashboard stations={dashboardStations} districts={[]} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RiskDistributionChart stations={dashboardStations} />
                <TrendDistributionChart stations={dashboardStations} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-slate-700">District:</label>
                <select
                  value={analyticsDistrict}
                  onChange={(e) => setAnalyticsDistrict(e.target.value)}
                  className="border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Districts</option>
                  {districtOptions.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {analyticsDistrict && (
                  <button
                    onClick={() => setAnalyticsDistrict('')}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6">
                <TopStationsChart stations={analyticsStations} viewType="dangerous" />
                <TopStationsChart stations={analyticsStations} viewType="safest" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
