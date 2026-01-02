import { useState } from "react";

export default function TopHighlights({ stations, routes, roundTrips, highlight, onSelect }) {
    const [tab, setTab] = useState("stations");

    const topStations = stations.slice(0, 7);
    const topRoutes = routes.slice(0, 7);
    const topRoundTrips = roundTrips.slice(0, 7);

    let items = [];
    if (tab === "stations") items = topStations;
    if (tab === "routes") items = topRoutes;
    if (tab === "roundTrips") items = topRoundTrips;

    return (
        <div className="bg-white rounded-xl p-3 shadow h-full flex flex-col">
            {/* Header */}
            <div className="mb-3">
                <h3 className="font-semibold text-slate-700">
                    Most Common
                </h3>
                <p className="text-xs text-slate-500">
                    Click an item to highlight it on the map
                </p>
            </div>
            
            {/* Tabs */}
            <div className="flex mb-3 space-x-2">
                <TabButton label="Stations" active={tab === "stations"} onClick={() => setTab("stations")} />
                <TabButton label="Routes" active={tab === "routes"} onClick={() => setTab("routes")} />
                <TabButton label="Round Trips" active={tab === "roundTrips"} onClick={() => setTab("roundTrips")} />
            </div>

            {/* List */}
            <ul>
                {items.map((item, index) => {
                    let id;
                    let label;
                    let subLabel;
                    let clickType;

                    if (tab === "routes") {
                        id = `${item.s1_id}-${item.s2_id}`;
                        label = `${item.s1_name} ↔ ${item.s2_name}`;
                        subLabel = `${item.total_trips.toLocaleString()} trips`;
                        clickType="route";
                    } else {
                        // stations + round trips
                        id = item.station_id;
                        label = item.name
                        clickType = "station";

                        if (tab === "roundTrips") {
                            subLabel = `${item.round_trips.toLocaleString()} round trips`;
                        } else {
                            subLabel = `${item.total_trips.toLocaleString()} trips`;
                        }
                    }

                    const isActive =
                        highlight.type === clickType && highlight.id === id;
                    
                    const rank = index + 1;

                    return (
                        <li
                            key={id}
                            onClick={() => onSelect(clickType, id)}
                            className={`cursor-pointer p-2 rounded transition flex items-start gap-3
                                ${isActive ? "bg-blue-100 font-semibold" : "hover:bg-slate-100"}
                            `}
                        >
                            {/* Rank */ }
                            <div className="flex-shrink-0 w-5 text-xs text-slate-400 font-mono text-right">
                                {rank}
                            </div>

                            {/* Content */ }
                            <div className="text-sm">
                                <div className="font-medium">{label}</div>
                                <div className="text-slate-500">{subLabel}</div>
                            </div>
                        </li>
                    );


                })}
            </ul>


        </div>
    )
}

function TabButton({ label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1 rounded font-medium transition ${
                active
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
        >
            {label}
        </button>
    )
}