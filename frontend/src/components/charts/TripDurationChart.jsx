import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function TripDurationChart({ data }) {
    if (!data) return null;

    return (
        <div className="bg-white rounded shadow p-4 h-full">
            <h3 className="font-semibold mb-4">Trip Duration Distribution</h3>

            <ResponsiveContainer width="100%" height={260}>
                <BarChart layout="vertical" data={data}>
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="duration_bucket" />
                    <Tooltip />
                    <Legend />

                    <Bar 
                        dataKey="member_trips"
                        name="Members"
                        fill="#8b5cf6"
                        radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                        dataKey="casual_trips"
                        name="Casual"
                        fill="#c4b5fd"
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}