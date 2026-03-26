import DashboardCards from "../components/DashboardCards";

const recentActivity = [
  { name: "Riya Sharma", action: "Applied for Casual Leave", time: "2 min ago", avatar: "RS", color: "bg-purple-200 text-purple-800" },
  { name: "Arjun Mehta", action: "Completed Onboarding", time: "1 hr ago", avatar: "AM", color: "bg-blue-200 text-blue-800" },
  { name: "Pooja Nair", action: "Submitted Resignation", time: "3 hr ago", avatar: "PN", color: "bg-red-200 text-red-800" },
  { name: "Kiran Das", action: "Payroll Processed", time: "Yesterday", avatar: "KD", color: "bg-green-200 text-green-800" },
  { name: "Sneha Rao", action: "Updated Profile", time: "Yesterday", avatar: "SR", color: "bg-amber-200 text-amber-800" },
];

const upcomingHolidays = [
  { name: "Holi", date: "Mar 25, 2026", day: "Wednesday", color: "bg-pink-100 border-pink-300 text-pink-700" },
  { name: "Good Friday", date: "Apr 3, 2026", day: "Friday", color: "bg-indigo-100 border-indigo-300 text-indigo-700" },
  { name: "Eid ul-Fitr", date: "Apr 10, 2026", day: "Friday", color: "bg-green-100 border-green-300 text-green-700" },
];

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-12">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Welcome back, Aman. Here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Mon, 16 March 2026
          </div>
        </div>

        {/* Summary Cards */}
        <DashboardCards />

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">Recent Activity</h2>
              <button className="text-xs text-[#1a2240] font-medium hover:underline">View all</button>
            </div>
            <ul className="space-y-3">
              {recentActivity.map((item, i) => (
                <li key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${item.color}`}>
                    {item.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 truncate">{item.action}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{item.time}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Upcoming Holidays + Quick Stats */}
          <div className="flex flex-col gap-6">
            {/* Holidays */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-800">Upcoming Holidays</h2>
                <button className="text-xs text-[#1a2240] font-medium hover:underline">View all</button>
              </div>
              <ul className="space-y-2.5">
                {upcomingHolidays.map((h, i) => (
                  <li key={i} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${h.color}`}>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 opacity-70" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-semibold">{h.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium opacity-90">{h.date}</p>
                      <p className="text-xs opacity-60">{h.day}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Quick Stats</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Present Today", value: "17", icon: "✓", color: "text-green-600 bg-green-50" },
                  { label: "On Leave", value: "3", icon: "–", color: "text-amber-600 bg-amber-50" },
                  { label: "New Joiners", value: "2", icon: "+", color: "text-blue-600 bg-blue-50" },
                  { label: "Open Positions", value: "5", icon: "○", color: "text-purple-600 bg-purple-50" },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${s.color}`}>
                      {s.icon}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-800 leading-none">{s.value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
