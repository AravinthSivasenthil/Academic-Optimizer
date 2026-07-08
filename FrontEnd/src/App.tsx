import { BrowserRouter, Routes, Route, Link, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-6">
            <Link to="/" className="font-bold text-slate-800">
              Academic Optimizer
            </Link>
            <nav className="flex gap-4 text-sm">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  isActive ? "text-slate-900 font-semibold" : "text-slate-500"
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/courses"
                className={({ isActive }) =>
                  isActive ? "text-slate-900 font-semibold" : "text-slate-500"
                }
              >
                Courses
              </NavLink>
            </nav>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-6 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/courses" element={<Courses />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;