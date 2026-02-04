import React from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

export default function RiskDistributionChart({ stations }) {
  const calculateRiskDistribution = () => {
    const distribution = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0
    };

    stations.forEach(s => {
      const risk = s.RISK_LEVEL || 'MEDIUM';
      if (distribution.hasOwnProperty(risk)) {
        distribution[risk]++;
      } else {
        distribution['MEDIUM']++;
      }
    });

    return Object.entries(distribution).map(([name, value]) => ({
      name: `${name} (${value})`,
      value: value,
      percentage: ((value / stations.length) * 100).toFixed(1)
    }));
  };

  const COLORS = {
    CRITICAL: '#dc2626', // red
    HIGH: '#f97316',      // orange
    MEDIUM: '#eab308',    // yellow
    LOW: '#16a34a'        // green
  };

  const data = calculateRiskDistribution();

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
      <h3 className="text-lg font-semibold mb-4 text-slate-800">Risk Level Distribution</h3>
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
            <Cell fill={COLORS.CRITICAL} />
            <Cell fill={COLORS.HIGH} />
            <Cell fill={COLORS.MEDIUM} />
            <Cell fill={COLORS.LOW} />
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
