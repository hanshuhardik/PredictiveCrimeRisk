import React, { useState, useMemo } from 'react';

export default function SearchBox({ stations, onSelect }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = useMemo(() => {
    if (searchTerm.length < 2) return [];

    const term = searchTerm.toLowerCase();
    const unique = new Map();

    // Search by station name
    stations.forEach(s => {
      if (s.UnitName.toLowerCase().includes(term)) {
        const key = s.UnitName;
        if (!unique.has(key)) {
          unique.set(key, {
            type: 'station',
            name: s.UnitName,
            district: s.District_Name,
            station: s
          });
        }
      }
    });

    // Search by district
    stations.forEach(s => {
      if (s.District_Name.toLowerCase().includes(term)) {
        const key = s.District_Name;
        if (!unique.has(key)) {
          unique.set(key, {
            type: 'district',
            name: s.District_Name,
            stationCount: stations.filter(st => st.District_Name === s.District_Name).length
          });
        }
      }
    });

    return Array.from(unique.values()).slice(0, 8);
  }, [searchTerm, stations]);

  const handleSelect = (suggestion) => {
    onSelect(suggestion);
    setSearchTerm('');
    setShowSuggestions(false);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          type="text"
          placeholder="Search station or district..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              setShowSuggestions(false);
            }}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-50">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(suggestion)}
              className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-slate-100 last:border-b-0 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-slate-800">{suggestion.name}</div>
                  {suggestion.type === 'station' ? (
                    <div className="text-xs text-slate-500">
                      📍 {suggestion.district}
                      {suggestion.station.RISK_LEVEL && (
                        <span className="ml-2 px-2 py-1 bg-slate-200 rounded">
                          {suggestion.station.RISK_LEVEL}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500">
                      🗺️ {suggestion.stationCount} stations
                    </div>
                  )}
                </div>
                <div className="text-lg">
                  {suggestion.type === 'station' ? '🔍' : '📍'}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showSuggestions && searchTerm.length > 0 && suggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg p-4 text-center text-slate-500">
          No results found for "{searchTerm}"
        </div>
      )}
    </div>
  );
}
