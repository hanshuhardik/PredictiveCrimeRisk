import React from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

export default function TrendDistributionChart({ stations }) {
  const calculateTrendDistribution = () => {
    const distribution = {
      INCREASING: 0,
      STABLE: 0,
      DECREASING: 0
    };

    let counted = 0;
    stations.forEach(s => {
      const trend = (s.trend_direction || s.trend || s.trendDirection || '').toString().trim().toUpperCase();
      if (distribution.hasOwnProperty(trend)) {
        distribution[trend]++;
        counted++;
      }
      // Unknown trends are ignored so they don't bias toward STABLE
    });

    const denom = counted > 0 ? counted : 1; // avoid divide by zero

    return Object.entries(distribution).map(([name, value]) => ({
      name: `${name} (${value})`,
      value: value,
      percentage: ((value / denom) * 100).toFixed(1)
    }));
  };

  const COLORS = {
    INCREASING: '#dc2626',  // red
    STABLE: '#3b82f6',       // blue
    DECREASING: '#16a34a'    // green
  };

  const data = calculateTrendDistribution();

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 rounded shadow text-sm">
          <p className="font-semibold">{payload[0].payload.name.split(' (')[0]}</p>
          <p>Count: {payload[0].value}</p>
          <p>Percentage: {payload[0].payload.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-slate-800">Crime Trend Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percentage }) => `${name.split(' (')[0]}: ${percentage}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            <Cell fill={COLORS.INCREASING} />
            <Cell fill={COLORS.STABLE} />
            <Cell fill={COLORS.DECREASING} />
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
