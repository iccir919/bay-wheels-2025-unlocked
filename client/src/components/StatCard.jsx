
export default function StatCard({title, value, icon}) {
    return (
        <div className="rounded-xl shadow-lg p-6">
            <div className="fex items-center justify-between mb-2">
                <span className="text-3xl">{icon}</span>
            </div>
            <h3 className="text-sm font-semibold mb-1">{title}</h3>
            <p className="text-3xl font-bold">{value}</p>
        </div>
    )
}