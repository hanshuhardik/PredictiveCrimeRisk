import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfo } from "@fortawesome/free-solid-svg-icons";
import {faChartBar} from "@fortawesome/free-solid-svg-icons";
import {faCircleExclamation} from "@fortawesome/free-solid-svg-icons";
import {faFileLines} from "@fortawesome/free-solid-svg-icons";
import {faChartLine} from "@fortawesome/free-solid-svg-icons";
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { faCircle } from '@fortawesome/free-solid-svg-icons';
export default function Dashboard({ stations, districts }) {
  // Calculate statistics
  const calculateStats = () => {
    const stats = {
      totalStations: stations.length,
      avgSafety: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      avgFIRs: 0,
      avgHeinous: 0,
      increasingCount: 0,
      stableCount: 0,
      decreasingCount: 0,
      dataQuality: 0
    };

    if (stations.length === 0) return stats;

    let totalSafety = 0;
    let totalFIRs = 0;
    let totalHeinousPct = 0;
    let trendCounted = 0;

    stations.forEach(s => {
      // Risk level counts
      const risk = s.RISK_LEVEL || 'MEDIUM';
      if (risk === 'CRITICAL') stats.criticalCount++;
      else if (risk === 'HIGH') stats.highCount++;
      else if (risk === 'MEDIUM') stats.mediumCount++;
      else if (risk === 'LOW') stats.lowCount++;

      // Trend counts
      const trendRaw = (s.trend_direction || s.trend || s.trendDirection || '').toString().trim().toUpperCase();
      if (trendRaw === 'INCREASING') { stats.increasingCount++; trendCounted++; }
      else if (trendRaw === 'STABLE') { stats.stableCount++; trendCounted++; }
      else if (trendRaw === 'DECREASING') { stats.decreasingCount++; trendCounted++; }

      // Averages
      if (s.SAFETY_INDEX !== null && !isNaN(s.SAFETY_INDEX)) {
        totalSafety += s.SAFETY_INDEX;
      }
      if (s.FIRs_PER_YEAR !== null && !isNaN(s.FIRs_PER_YEAR)) {
        totalFIRs += s.FIRs_PER_YEAR;
      }
      // Heinous ratio: prefer HEINOUS_FIRs / TOTAL_FIRs, fallback to HEINOUS_RATIO
      if (s.TOTAL_FIRs && s.HEINOUS_FIRs) {
        const ratio = (s.HEINOUS_FIRs / s.TOTAL_FIRs) * 100;
        if (isFinite(ratio)) totalHeinousPct += ratio;
      } else if (s.HEINOUS_RATIO !== null && !isNaN(s.HEINOUS_RATIO)) {
        const ratio = s.HEINOUS_RATIO > 1 ? s.HEINOUS_RATIO : s.HEINOUS_RATIO * 100;
        if (isFinite(ratio)) totalHeinousPct += ratio;
      }
    });

    stats.avgSafety = (totalSafety / stations.length).toFixed(1);
    stats.avgFIRs = (totalFIRs / stations.length).toFixed(1);
    stats.avgHeinous = (totalHeinousPct / stations.length).toFixed(1);

    return stats;
  };

  const stats = calculateStats();

  const StatCard = ({ label, value, icon, color }) => (
    <div className={`bg-gradient-to-br ${color} rounded-lg p-4 shadow-md text-white`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm opacity-90">{label}</div>
          <div className="text-2xl font-bold mt-1">{value}</div>
        </div>
        <div className="text-4xl opacity-30">{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Safety Dashboard</h2>
      
      {stations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 text-lg">No stations to display. Adjust your filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard 
              label="Total Stations" 
              value={stats.totalStations} 
              icon={<FontAwesomeIcon icon={faInfo} />}
              color="from-blue-500 to-blue-600"
            />
            <StatCard 
              label="Avg Safety Index" 
              value={`${stats.avgSafety}/100`}
              icon={<FontAwesomeIcon icon={faChartBar} /> }
              color="from-green-500 to-green-600"
            />
            <StatCard 
              label="Critical Zones" 
              value={`${stats.criticalCount} (${stats.totalStations > 0 ? ((stats.criticalCount/stats.totalStations)*100).toFixed(1) : 0}%)`}
              icon={<FontAwesomeIcon icon={faCircleExclamation} />}
              color="from-red-500 to-red-600"
            />
            <StatCard 
              label="Avg FIRs/Year" 
              value={stats.avgFIRs}
              icon={<FontAwesomeIcon icon={faFileLines} />}
              color="from-orange-500 to-orange-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              label="High Risk Zones" 
              value={`${stats.highCount} (${stats.totalStations > 0 ? ((stats.highCount/stats.totalStations)*100).toFixed(1) : 0}%)`}
              icon={<FontAwesomeIcon icon={faCircle} style={{color: "#ff004c",}} />}
              color="from-amber-500 to-amber-600"
            />
            <StatCard 
              label="Heinous Crime Ratio" 
              value={`${stats.avgHeinous}%`}
              icon={<FontAwesomeIcon icon={faTriangleExclamation} />}
              color="from-pink-500 to-pink-600"
            />
            <StatCard 
              label="Increasing Trend" 
              value={`${stats.increasingCount} (${stats.totalStations > 0 ? ((stats.increasingCount/stats.totalStations)*100).toFixed(1) : 0}%)`}
              icon={<FontAwesomeIcon icon={faChartLine} />}
              color="from-red-400 to-red-500"
            />
          </div>
        </>
      )}
    </div>
  );
}
