# VitalSense (SmartWatch VitalSign)

VitalSense is a full-stack, real-time health monitoring and anomaly detection system for smartwatch vital signs. The project consists of a high-performance Python/FastAPI backend and a highly interactive, animated React frontend. 

The application generates realistic vital sign data, applies Machine Learning to detect clinical anomalies (like Tachycardia, Hypoxia, etc.), and streams the results in real-time to a modern dashboard interface.

---

## 🚀 What We Have Done in This Project

1. **Synthetic Data Generation Engine**: Built a robust data generator using random walks to simulate realistic, gradually drifting vital signs and periodically inject critical medical anomalies.
2. **Machine Learning Pipeline**: Trained and deployed scikit-learn models:
   - **RandomForestClassifier**: Classifies patient states into `NORMAL`, `WARNING`, or `CRITICAL` based on clinical thresholds and rolling features.
   - **IsolationForest (Outlier Analysis)**: Performs robust outlier analysis and anomaly detection to identify underlying abnormal patterns in multi-dimensional vital sign data.
3. **Real-Time FastAPI Backend**: Implemented a scalable REST API and WebSocket server to continuously stream health data, compute rolling metrics, and dispatch alerts instantly.
4. **Interactive 3D & Animated Frontend**: Developed a premium-looking landing page and dashboard preview using React. It features Framer Motion for scroll-linked animations and Three.js for 3D visual representations.
5. **Real-time Dashboard Hook**: Created a custom `useVitalSigns` React hook to manage WebSocket lifecycles, handle data buffering, and auto-reconnect.

---

## 📊 Parameters and Data

The backend dynamically generates and monitors key physiological parameters. The data incorporates small Gaussian steps (random walk) for realistic variation.

### Core Vital Sign Parameters
| Parameter | Description | Normal Range (Simulated) |
| :--- | :--- | :--- |
| **`heart_rate`** | Heart beats per minute (bpm) | 58 - 100 bpm |
| **`spo2`** | Blood oxygen saturation (%) | 95.0 - 99.5 % |
| **`temperature`** | Body temperature (°C) | 36.1 - 37.2 °C |
| **`systolic_bp`** | Systolic blood pressure (mmHg) | 110 - 130 mmHg |
| **`diastolic_bp`** | Diastolic blood pressure (mmHg)| 70 - 85 mmHg |
| **`respiratory_rate`**| Breaths per minute | 12 - 20 breaths/min |

### Derived Features (For ML Models)
To capture temporal context, the ML models use rolling window features:
- `hr_rolling_mean_10`: 10-tick rolling average of Heart Rate.
- `hr_rolling_std_10`: 10-tick rolling standard deviation of Heart Rate.
- `spo2_rolling_min_5`: 5-tick rolling minimum of SpO2.

### Injected Anomalies
The system periodically injects specific clinical anomalies to test the ML models and UI alerts:
1. **TACHYCARDIA**: Heart rate spikes to 128-155 bpm.
2. **HYPOXIA**: SpO2 drops to 88-93%.
3. **FEVER**: Temperature rises to 38.5-39.8 °C.
4. **HYPERTENSION**: Systolic BP jumps to 155-175 mmHg.

---

## 💻 Frontend Technology Stack

The user interface was built to look premium, "sexy", and highly interactive, demonstrating advanced web development techniques.

- **Framework**: React 19 + Vite (Ultra-fast HMR and build times).
- **Styling**: Vanilla CSS / Tailwind utilities (`clsx`, `tailwind-merge`) with a dark, modern aesthetic (cyan and green ambient glows).
- **Animations**: **Framer Motion** for staggering, layout transitions, and high-end scroll-triggered animations.
- **3D Rendering**: **Three.js** via `@react-three/fiber` and `@react-three/drei` for rendering dynamic 3D elements in the browser.
- **Real-Time Data**: Native WebSockets for low-latency vital sign streaming directly to the React state via the `useVitalSigns` hook.
- **API Fetching**: `axios` for fetching historical data and ML analytics reports from the backend.
- **Icons**: `lucide-react` for clean, modern SVG iconography.

---

## 🛠️ How to Run the Project

### 1. Run the Backend (FastAPI + ML)
```bash
cd vitalsense-backend
python -m venv venv
venv\Scripts\activate      # On Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
*(On first run, the backend will automatically generate 5000 synthetic records and train the ML models).*

### 2. Run the Frontend (React + Vite)
Open a new terminal window:
```bash
cd SmartWatch_Vitalsign
npm install
npm run dev
```

Navigate to `http://localhost:5173` to view the interactive VitalSense dashboard.



run cmd:
if (-not (Test-Path venv)) { python -m venv venv }; .\venv\Scripts\python.exe -m pip install -r requirements.txt; .\venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000