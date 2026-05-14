/**
 * useVitalSigns — Real-time WebSocket hook for live vital sign data.
 *
 * Opens a WebSocket to ws://localhost:8000/ws/vitals and manages:
 *   - "history" message: initializes chart data (last 60 readings)
 *   - "vitals" message: appends to state, trims to last 120 readings
 *   - "alert" message: triggers anomaly alert UI state
 *   - Auto-reconnects after 3s on connection drop
 *
 * Exports: { vitals, history, latestReading, activeAlert, isConnected, clearAlert }
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000/ws/vitals';
const MAX_HISTORY = 120;
const RECONNECT_DELAY = 3000;

export default function useVitalSigns() {
  const [vitals, setVitals] = useState(null);          // Latest single reading
  const [history, setHistory] = useState([]);            // Array of recent readings
  const [activeAlert, setActiveAlert] = useState(null);  // Current alert or null
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const pingTimer = useRef(null);

  const clearAlert = useCallback(() => setActiveAlert(null), []);

  const connect = useCallback(() => {
    // Cleanup previous
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log('[VitalSense WS] Connected');

        // Start ping/keepalive every 30s
        pingTimer.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          switch (msg.type) {
            case 'history':
              // Initialize chart with historical readings
              if (msg.data?.readings) {
                setHistory(msg.data.readings.slice(-MAX_HISTORY));
                if (msg.data.readings.length > 0) {
                  setVitals(msg.data.readings[msg.data.readings.length - 1]);
                }
              }
              break;

            case 'vitals':
              // Append new reading
              const reading = msg.data;
              setVitals(reading);
              setHistory(prev => {
                const updated = [...prev, reading];
                return updated.slice(-MAX_HISTORY);
              });
              // Auto-clear alert when reading is normal
              if (!reading.anomaly_active) {
                setActiveAlert(null);
              }
              break;

            case 'alert':
              // Trigger anomaly alert
              setActiveAlert(msg.data);
              break;

            case 'heartbeat':
              // Connection alive — no action needed
              break;

            default:
              break;
          }
        } catch (err) {
          console.warn('[VitalSense WS] Parse error:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        clearInterval(pingTimer.current);
        console.log('[VitalSense WS] Disconnected — reconnecting in 3s...');

        // Auto-reconnect
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
      };

      ws.onerror = (err) => {
        console.warn('[VitalSense WS] Error:', err);
        ws.close();
      };
    } catch (err) {
      console.warn('[VitalSense WS] Connection failed:', err);
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      clearTimeout(reconnectTimer.current);
      clearInterval(pingTimer.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    vitals,           // Latest reading object (or null)
    history,          // Array of last 120 readings
    latestReading: vitals,
    activeAlert,      // Current alert or null
    isConnected,      // Boolean connection status
    clearAlert,       // Function to dismiss alert
  };
}
