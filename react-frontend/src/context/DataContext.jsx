/**
 * @module DataContext
 * @description Central data provider for LittleCam.
 *
 * Loads 11 pre-computed JSON files from /public/data/ on mount.
 * These files are generated offline by the Python pipeline
 * (process_data.py → enhance_data.py) and contain clustered
 * hotspots, enforcement worklists, patrol routes, risk forecasts,
 * and operational briefs.
 *
 * Architecture: Static JSON → Context → All pages.
 * No live backend. No database. Pure decision-support prototype.
 *
 * JSON files loaded:
 *   hotspots, worklist, deployment, simulation, summary, trends,
 *   patrol_routes, risk_forecast, repeat_hotspots, sensitive_zones, daily_brief
 */
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const DataContext = createContext();

/**
 * Hook to access the pre-computed LittleCam dataset.
 * @returns {{ data: Object, loading: boolean, error: string|null }}
 */
export const useData = () => useContext(DataContext);

/**
 * Provider that fetches all 11 JSON data files on mount and exposes
 * them to the component tree via React context.
 * @param {{ children: React.ReactNode }} props
 */
export const DataProvider = ({ children }) => {
  const [data, setData] = useState({
    hotspots: [],
    worklist: [],
    deployment: {},
    simulation: [],
    summary: {},
    trends: {},
    patrol_routes: {},
    risk_forecast: {},
    repeat_hotspots: {},
    sensitive_zones: {},
    daily_brief: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    /** @async Fetches all JSON files in parallel via Promise.all */
    const loadData = async () => {
      try {
        const files = [
          'hotspots', 'worklist', 'deployment', 'simulation', 'summary', 'trends',
          'patrol_routes', 'risk_forecast', 'repeat_hotspots', 'sensitive_zones', 'daily_brief'
        ];
        
        const promises = files.map(f => 
          fetch(`/data/${f}.json`).then(r => {
            if (!r.ok) throw new Error(`Failed to load ${f}.json`);
            return r.json();
          })
        );
        
        const results = await Promise.all(promises);
        const newData = {};
        files.forEach((f, i) => {
          newData[f] = results[i];
        });
        
        setData(newData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  /** Memoize context value to prevent unnecessary consumer re-renders. */
  const contextValue = useMemo(() => ({ data, loading, error }), [data, loading, error]);

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

