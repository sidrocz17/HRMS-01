const cards = [
  {
    label: "Employees",
    value: 20,
    bg: "bg-[#f5a623]",
    textColor: "text-[#7a4f00]",
    valueColor: "text-[#3d2700]",
    icon: (
      <svg className="w-12 h-12 opacity-80" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    ),
    trend: "+13%",
    trendUp: true,
    sub: "vs last month",
  },
  {
    label: "Leaves",
    value: 10,
    bg: "bg-[#1a2240]",
    textColor: "text-blue-300",
    valueColor: "text-white",
    icon: (
      <svg className="w-12 h-12 opacity-80" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
      </svg>
    ),
    trend: "-3",
    trendUp: false,
    sub: "pending approvals",
  },
  {
    label: "Payroll",
    value: 7,
    bg: "bg-[#2d7d3a]",
    textColor: "text-green-300",
    valueColor: "text-white",
    icon: (
      <svg className="w-12 h-12 opacity-80" fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
      </svg>
    ),
    trend: "Processed",
    trendUp: true,
    sub: "this cycle",
  },
];

export default function DashboardCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`${card.bg} rounded-2xl shadow-lg overflow-hidden cursor-pointer group hover:scale-[1.02] hover:shadow-xl transition-all duration-200`}
        >
          <div className="p-6 flex items-center justify-between">
            {/* Left: Number + Label */}
            <div className="flex flex-col gap-1">
              <span className={`text-5xl font-bold ${card.valueColor} leading-none`}>
                {card.value}
              </span>
              <span className={`text-base font-semibold ${card.textColor} mt-1`}>
                {card.label}
              </span>
              <div className="flex items-center gap-1.5 mt-2">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    card.trendUp
                      ? "bg-white/20 text-white"
                      : "bg-white/20 text-white"
                  }`}
                >
                  {card.trend}
                </span>
                <span className={`text-xs ${card.textColor} opacity-80`}>{card.sub}</span>
              </div>
            </div>

            {/* Right: Icon */}
            <div className={`${card.valueColor} opacity-70 group-hover:opacity-90 group-hover:scale-110 transition-all duration-200`}>
              {card.icon}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="bg-black/10 px-6 py-2.5 flex items-center justify-between">
            <span className={`text-xs font-medium ${card.textColor} opacity-80`}>View Details</span>
            <svg className={`w-4 h-4 ${card.textColor} opacity-80`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}
