// components/employee/StatusBadge.jsx
export default function StatusBadge({ status }) {
  const config = {
    Active: {
      dot:  "bg-emerald-400",
      pill: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    },
    Inactive: {
      dot:  "bg-red-400",
      pill: "bg-red-50 text-red-600 ring-1 ring-red-200",
    },
    Pending: {
      dot:  "bg-amber-400",
      pill: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    },
  };

  const style = config[status] || config["Inactive"];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}
