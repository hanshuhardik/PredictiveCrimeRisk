import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export default function TopStationsChart({ stations, viewType = 'dangerous' }) {
  const data = useMemo(() => {
    let sorted = [...stations];

    if (viewType === 'dangerous') {
      sorted.sort((a, b) => (b.FIRs_PER_YEAR || 0) - (a.FIRs_PER_YEAR || 0));
    } else {
      sorted.sort((a, b) => (b.SAFETY_INDEX || 0) - (a.SAFETY_INDEX || 0));
    }

    return sorted.slice(0, 10).map((s, idx) => ({
      rank: idx + 1,
      name: s.UnitName.length > 22 ? `${s.UnitName.substring(0, 22)}...` : s.UnitName,
      fullName: s.UnitName,
      district: s.District_Name,
      firs: parseFloat(s.FIRs_PER_YEAR || 0).toFixed(1),
      safety: parseFloat(s.SAFETY_INDEX || 0).toFixed(1),
      riskLevel: (s.RISK_LEVEL || 'MEDIUM').toUpperCase()
    }));
  }, [stations, viewType]);

  const getRiskColor = (risk) => {
    const colors = {
      'CRITICAL': '#dc2626',
      'HIGH': '#f97316',
      'MEDIUM': '#eab308',
      'LOW': '#16a34a'
    };
    return colors[risk] || '#999';
  };

  const legendPayload = useMemo(() => {
    if (viewType === 'dangerous') {
      return [
        { value: 'CRITICAL', type: 'square', color: '#dc2626' },
        { value: 'HIGH', type: 'square', color: '#f97316' },
        { value: 'MEDIUM', type: 'square', color: '#eab308' },
        { value: 'LOW', type: 'square', color: '#16a34a' },
      ];
    }
    return [
      { value: 'Safety Index (higher is safer)', type: 'square', color: '#10b981' }
    ];
  }, [viewType]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded shadow text-xs">
          <p className="font-semibold">{item.fullName}</p>
          <p>District: {item.district}</p>
          <p>Risk Level: {item.riskLevel}</p>
          <p>FIRs/Year: {item.firs}</p>
          <p>Safety Index: {item.safety}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-slate-800">
        Top 10 {viewType === 'dangerous' ? 'Most Dangerous' : 'Safest'} Stations
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend payload={legendPayload} />
          {viewType === 'dangerous' ? (
            <Bar dataKey="firs" name="FIRs per Year">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getRiskColor(entry.riskLevel)} />
              ))}
            </Bar>
          ) : (
            <Bar dataKey="safety" fill="#10b981" name="Safety Index" />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
