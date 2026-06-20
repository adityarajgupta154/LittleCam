<div align="center">
  <h1>LittleCam</h1>
  <p><b>AI Parking Enforcement Intelligence</b></p>
  <p><i>A decision-support prototype built for the Flipkart × Gridlock Hackathon 2.0</i></p>
  <p>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/Frontend-React-blue?style=flat-square&logo=react" alt="React"></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind"></a>
    <a href="https://developers.google.com/maps"><img src="https://img.shields.io/badge/Maps-Google%20Maps%20API-4285F4?style=flat-square&logo=googlemaps" alt="Google Maps"></a>
    <a href="https://python.org"><img src="https://img.shields.io/badge/Pipeline-Python-3776AB?style=flat-square&logo=python" alt="Python"></a>
  </p>
</div>

---

## 🎯 Chosen Vertical & Persona

**Vertical:** Smart City Mobility & Traffic Management  
**Persona:** Bengaluru Traffic Police (Parking Enforcement Division)

## 🚨 Problem Statement

Current parking enforcement in Bengaluru faces severe challenges:
- **Reactive Patrol System**: Officers respond to ad-hoc complaints rather than anticipating congestion.
- **Unknown Congestion Impact**: Not all parking violations are equal. A car blocking an arterial road causes significantly more gridlock than a scooter in a residential lane, yet both often receive equal enforcement priority.
- **Inefficient Resource Allocation**: With limited towing vehicles and officers, authorities cannot patrol everywhere.
- **Lack of Predictive Insights**: Authorities struggle to forecast where the *next* wave of violations will occur, making proactive deployment impossible.

## 💡 Our Approach & Logic

**LittleCam** is an AI-powered parking intelligence platform that helps the Bengaluru Traffic Police transform raw parking violation data into actionable enforcement decisions. 

Instead of relying on random patrols, LittleCam automatically identifies illegal parking concentration zones, computes a sophisticated congestion impact score, forecasts future risks, and generates a data-driven officer deployment optimization plan.

## ⚙️ How the Solution Works (End-to-End)

1. **Data Pipeline**: Raw parking violation data (mocked CSVs for this prototype) is ingested by a Python data processing script.
2. **Impact Scoring & Clustering**: The Python script uses DBSCAN clustering to group violations into hotspots. It then calculates an **Impact Score (0-100)** based on violation density, proximity to landmarks (metro stations/hubs), peak hour behavior, and vehicle severity.
3. **Risk Forecasting**: Offline statistical trend analysis is used to predict future hotspot risks by day and time.
4. **Dashboard Intelligence**: Pre-computed JSON data is loaded into the React frontend, rendering interactive heatmaps, hotspot severity analytics, and Google Maps layers.
5. **Enforcement Plan**: The AI generates an actionable "Patrol Route Optimization" plan, explicitly telling the police *where to go*, *when to be there*, and *how many officers to deploy* to maximize congestion reduction.

## 🛠️ Tech Stack

**Frontend:**
- React 18+ (Vite)
- Tailwind CSS
- Framer Motion (Animations)
- Lucide React (Icons)
- Recharts (Data Visualization)
- `@react-google-maps/api` (Google Maps Integration)

**Data Processing Pipeline (Offline):**
- Python 3.10+
- Pandas / Numpy
- Scikit-Learn (Clustering)

## 🚀 Setup & Installation Instructions

This project is fully self-contained. The frontend fetches pre-computed data from its own `public/data/` directory. No database setup is required.

```bash
# 1. Clone the repository
git clone https://github.com/adityarajgupta154/LittleCam.git

# 2. Navigate to the frontend directory
cd LittleCam/react-frontend

# 3. Install NPM dependencies
npm install

# 4. Create your local environment file for Google Maps
cp .env.example .env.local
# Open .env.local and add your VITE_GOOGLE_MAPS_API_KEY

# 5. Start the development server
npm run dev
```

The application will be running at `http://localhost:5173`.

## ⚠️ Assumptions & Prototype Constraints

As a hackathon prototype, the following architectural assumptions were made:
- **Static Pre-processed Data**: The application consumes static JSON files rather than connecting to a live database. This ensures high performance, zero downtime, and stability during judging presentations.
- **No Live Backend**: The Python data processing pipeline (`scripts/process_data.py`) was run locally to generate the datasets. There is no active Node.js/Python server running alongside the React app.
- **Offline ML-Inspired Forecasting**: The predictive insights and impact scoring algorithms are executed entirely offline, with the results hardcoded into the JSON files for frontend visualization.

## 📝 Hackathon Disclaimer

*This is a decision-support prototype built for hackathon evaluation. It is designed to demonstrate the user experience and logical flow of an AI-powered traffic enforcement dashboard. It is not currently connected to live ASTraM camera feeds or live police GPS tracking.*
