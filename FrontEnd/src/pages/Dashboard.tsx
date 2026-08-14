import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

type Deadline = {
  id: string;
  title: string;
  due_date: string;
  completed: boolean;
};

type GpaData = {
  cumulative_gpa: number | null;
  total_credits: number;
};

export default function Dashboard() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [gpa, setGpa] = useState<GpaData | null>(null);

  useEffect(() => {
    api.get("/api/deadlines").then((r) => setDeadlines(r.data));
    api.get("/api/gpa/summary").then((r) => setGpa(r.data));
  }, []);

  const upcoming = deadlines.filter((d) => !d.completed).slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="text-xs text-slate-500 uppercase">Cumulative GPA</div>
          <div className="text-4xl font-bold text-slate-800 mt-2">
            {gpa?.cumulative_gpa ?? "—"}
          </div>
          <Link
            to="/gpa"
            className="text-sm text-slate-500 hover:underline mt-2 inline-block"
          >
            View details →
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="text-xs text-slate-500 uppercase">Credits Earned</div>
          <div className="text-4xl font-bold text-slate-800 mt-2">
            {gpa?.total_credits ?? 0}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow">
        <div className="p-5 border-b flex justify-between items-center">
          <h2 className="font-semibold text-slate-800">Upcoming Deadlines</h2>
          <Link to="/deadlines" className="text-sm text-slate-500 hover:underline">
            See all →
          </Link>
        </div>
        <div className="divide-y">
          {upcoming.length === 0 && (
            <p className="p-6 text-slate-500 text-sm">No upcoming deadlines.</p>
          )}
          {upcoming.map((d) => (
            <div key={d.id} className="p-4">
              <div className="font-medium text-slate-800">{d.title}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {new Date(d.due_date).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}