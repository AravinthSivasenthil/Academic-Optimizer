import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [status, setStatus] = useState("checking...");

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/health`)
      .then((res) => setStatus(JSON.stringify(res.data)))
      .catch((err) => setStatus("error: " + err.message));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="p-8 bg-white rounded-xl shadow">
        <h1 className="text-2xl font-bold text-slate-800">
          Academic Optimizer
        </h1>
        <p className="text-slate-600 mt-2">Backend status: {status}</p>
      </div>
    </div>
  );
}

export default App;
