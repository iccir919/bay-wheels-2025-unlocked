import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export default function TripsByDayChart({ data }) {
  if (!data) return null;

  return (
    <div className="bg-white rounded shadow p-4 h-full">
      <h3 className="text-lg font-semibold mb-2">
        Trips by Day of Week (Member vs Casual)
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 20, bottom: 10, left: 80 }}
          barCategoryGap="15%"
        >
          <XAxis type="number" />
          <YAxis type="category" dataKey="day_name" />
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          <Bar
            dataKey="member_trips"
            name="Members"
            stackId="a"
            fill="#8b5cf6"
            radius={[0, 0, 0, 0]}
            barSize={25}
          />

          <Bar
            dataKey="casual_trips"
            name="Casual"
            stackId="a"
            fill="#c4b5fd"
            radius={[0, 6, 6, 0]}
            barSize={25}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;

  const member = payload.find(p => p.dataKey === "member_trips")?.value || 0;
  const casual = payload.find(p => p.dataKey === "casual_trips")?.value || 0;
  const total = member + casual;

  return (
    <div className="bg-white p-2 rounded shadow text-sm">
      <div className="font-semibold">{label}</div>
      <div>Members: {member.toLocaleString()}</div>
      <div>Casual: {casual.toLocaleString()}</div>
      <div className="text-slate-500 mt-1">
        Casual share: {Math.round((casual / total) * 100)}%
      </div>
    </div>
  );
};