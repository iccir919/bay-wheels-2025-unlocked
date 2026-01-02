import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export default function TripsByMonthBikeTypeChart({ data }) {
    if (!data) return null;

    return (
        <div className="bg-white rounded shadow p-4 h-full">
            <h3 className="text-lg font-semibold">Trips by Month - Bike Type</h3>

            <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                    data={data}
                    barCategoryGap="20%"
                >
                    <XAxis dataKey="month_name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />

                    <Bar
                        dataKey="classic_trips"
                        name="Classic Bike"
                        fill="#1e40af"
                        radius={[4, 4, 0, 0]}
                    />

                    <Bar
                        dataKey="electric_trips"
                        name="Electric Bike"
                        fill="#93c5fd"
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}