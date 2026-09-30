import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
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

const LETTER_ORDER = [
  "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F",
];

export default function Analytics() {
  const [data, setData] = useState<Summary | null>(null);

  useEffect(() => {
    api.get("/api/gpa/summary").then((r) => setData(r.data));
  }, []);

  if (!data) return <p>Loading...</p>;

  // GPA trend line data
  const trend = data.semesters
    .filter((s) => s.gpa !== null)
    .map((s) => ({ semester: s.semester, gpa: s.gpa }));

  // Grade distribution
  const letterCounts: Record<string, number> = {};
  for (const s of data.semesters) {
    for (const c of s.courses) {
      if (c.letter) {
        letterCounts[c.letter] = (letterCounts[c.letter] || 0) + 1;
      }
    }
  }
  const distribution = LETTER_ORDER
    .filter((l) => letterCounts[l])
    .map((l) => ({ letter: l, count: letterCounts[l] }));

  const allCourses = data.semesters.flatMap((s) => s.courses);
  const trendCount = trend.length;
  const bestCourse = allCourses
    .filter((c) => c.grade_pct !== null)
    .sort((a, b) => b.grade_pct! - a.grade_pct!)[0];
  const worstCourse = allCourses
    .filter((c) => c.grade_pct !== null)
    .sort((a, b) => a.grade_pct! - b.grade_pct!)[0];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-5">
          <div className="text-xs text-slate-500 uppercase">Cumulative GPA</div>
          <div className="text-3xl font-bold text-slate-800 mt-1">
            {data.cumulative_gpa ?? "—"}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <div className="text-xs text-slate-500 uppercase">Best Course</div>
          <div className="text-lg font-semibold text-slate-800 mt-1">
            {bestCourse
              ? `${bestCourse.code ? bestCourse.code + " — " : ""}${bestCourse.name}`
              : "—"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {bestCourse ? `${bestCourse.grade_pct}%` : ""}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <div className="text-xs text-slate-500 uppercase">Weakest Course</div>
          <div className="text-lg font-semibold text-slate-800 mt-1">
            {worstCourse
              ? `${worstCourse.code ? worstCourse.code + " — " : ""}${worstCourse.name}`
              : "—"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {worstCourse ? `${worstCourse.grade_pct}%` : ""}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="font-semibold text-slate-800 mb-4">
          GPA Trend by Semester
        </h2>
        {trendCount < 2 ? (
          <p className="text-sm text-slate-500">
            Need at least 2 semesters of graded courses to show a trend.
          </p>
        ) : (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="semester" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 4]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="gpa"
                  stroke="#1e293b"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-semibold text-slate-800 mb-4">
          Grade Distribution
        </h2>
        {distribution.length === 0 ? (
          <p className="text-sm text-slate-500">No graded courses yet.</p>
        ) : (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="letter" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1e293b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}