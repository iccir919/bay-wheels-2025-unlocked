import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export default function TripsByMonth({ data }) {
    if (!data) return null;

    return (
        <div className="bg-white rounded p-4 h-full">
            <h3 className="text-lg font-semibold">Trips by Month</h3>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <XAxis dataKey="month_name" />
                    <XAxis />
                    <Tooltip />
                    <Legend />

                    {/* Total */}
                    <Line 
                        type="monotone"
                        dataKey="total_trips"
                        name="Total trips"
                        stroke="#1e40af"
                        width={3}
                        dot={false}
                    />

                    {/* Member */}
                    <Line 
                        type="monotone"
                        dataKey="member_trips"
                        name="Member trips"
                        stroke="#3b82f6"
                        strokeDasharray="4 4"
                        dot={false}
                    />

                    {/* Casual */}
                    <Line 
                        type="monotone"
                        dataKey="casual_trips"
                        name="Casual Trips"
                        stroke="#93c5fd"
                        strokeDasharray="4 4"
                        dot={false}
                    />

                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}