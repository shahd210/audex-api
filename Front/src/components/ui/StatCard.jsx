
export default function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>

        {Icon && (
          <div className={`rounded-xl p-2.5 ${color}`}>
            <Icon size={20} />
          </div>
        )}
      </div>

      <p className="mt-5 text-3xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}
