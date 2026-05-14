import sqlite3
import pandas as pd
from pathlib import Path
import os

# Path to the SQLite database
db_path = Path(__file__).parent / "data" / "vitalsense.db"
export_dir = Path(__file__).parent / "data"

print(f"--- Reading SQLite Database: {db_path.name} ---\n")

try:
    # 1. Connect to the database
    conn = sqlite3.connect(db_path)
    
    # 2. Read 'vital_readings' table
    print("=== LATEST 5 VITAL READINGS ===")
    vitals_df = pd.read_sql_query("SELECT * FROM vital_readings ORDER BY timestamp DESC LIMIT 5", conn)
    
    # Print the DataFrame to console
    if not vitals_df.empty:
        print(vitals_df.to_string(index=False))
    else:
        print("No vital readings found.")
    
    # Export full table to CSV so you can open it in Excel
    vitals_all = pd.read_sql_query("SELECT * FROM vital_readings", conn)
    vitals_csv_path = export_dir / "vital_readings_export.csv"
    vitals_all.to_csv(vitals_csv_path, index=False)
    print(f"\n=> Exported {len(vitals_all)} vital readings to: {vitals_csv_path.name}")
    print("-" * 50)

    # 3. Read 'alert_events' table
    print("\n=== LATEST 5 ALERT EVENTS ===")
    alerts_df = pd.read_sql_query("SELECT * FROM alert_events ORDER BY timestamp DESC LIMIT 5", conn)
    
    # Print the DataFrame to console
    if not alerts_df.empty:
        print(alerts_df.to_string(index=False))
    else:
        print("No alerts found.")
        
    # Export full table to CSV
    alerts_all = pd.read_sql_query("SELECT * FROM alert_events", conn)
    alerts_csv_path = export_dir / "alert_events_export.csv"
    alerts_all.to_csv(alerts_csv_path, index=False)
    print(f"\n=> Exported {len(alerts_all)} alerts to: {alerts_csv_path.name}")

    # 4. Close connection
    conn.close()

except Exception as e:
    print(f"Error reading database: {e}")
