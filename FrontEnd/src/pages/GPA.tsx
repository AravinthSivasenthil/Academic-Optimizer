import { useEffect, useState } from "react";
import { api } from "../lib/api";

type Course = {
  id: string;
  name: string;
  code?: string;
  credits: number;
  grade_pct: number | null;
  letter: string | null;
  gpa_points: number | null;
};

type Semester = {
  semester: string;
  gpa: number | null;
  credits: number;
  courses: Course[];
};

type Summary = {
  semesters: Semester[];
  cumulative_gpa: number | null;
  total_credits: number;
};

export default function GPA() {
  const [data, setData] = useState<Summary | null>(null);

  useEffect(() => {
    api.get("/api/gpa/summary").then((r) => setData(r.data));
  }, []);

  if (!data) return <p>Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">GPA Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="text-xs text-slate-500 uppercase">Cumulative GPA</div>
          <div className="text-4xl font-bold text-slate-800 mt-2">
            {data.cumulative_gpa ?? "—"}
          </div>
          <div className="text-xs text-slate-500 mt-1">on a 4.0 scale</div>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="text-xs text-slate-500 uppercase">Total Credits (graded)</div>
          <div className="text-4xl font-bold text-slate-800 mt-2">
            {data.total_credits}
          </div>
        </div>
      </div>

      {data.semesters.map((sem) => (
        <div key={sem.semester} className="bg-white rounded-xl shadow mb-6">
          <div className="p-5 border-b flex justify-between items-center">
            <div>
              <div className="font-semibold text-slate-800">{sem.semester}</div>
              <div className="text-xs text-slate-500">
                {sem.credits} credits
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 uppercase">GPA</div>
              <div className="text-2xl font-bold text-slate-800">
                {sem.gpa ?? "—"}
              </div>
            </div>
          </div>
          <div className="divide-y">
            {sem.courses.map((c) => (
              <div
                key={c.id}
                className="p-4 flex justify-between items-center hover:bg-slate-50"
              >
                <div>
                  <div className="font-medium text-slate-800">
                    {c.code ? `${c.code} — ` : ""}{c.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {c.credits} credits
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-600">
                    {c.grade_pct !== null ? `${c.grade_pct}%` : "—"}
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    {c.letter ?? "—"}{" "}
                    <span className="text-slate-400">
                      ({c.gpa_points ?? "—"})
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
