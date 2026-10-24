
const statusStyles = {
  Completed: "bg-emerald-50 text-emerald-700",
  Pending: "bg-amber-50 text-amber-700",
  "In progress": "bg-blue-50 text-blue-700",
};

export default function StatusBadge({ status }) {
  const styles =
    statusStyles[status] || "bg-slate-100 text-slate-600";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles}`}
    >
      {status}
    </span>
  );
}
