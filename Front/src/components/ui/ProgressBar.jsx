
function ProgressBar({
  value = 0,
  showLabel = true,
  label = "Progress",
  className = "",
}) {
  const progress = Number.isFinite(Number(value))
    ? Math.min(100, Math.max(0, Number(value)))
    : 0;

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-sm text-gray-600">
            {label}
          </span>

          <span className="text-sm font-semibold text-gray-900">
            {progress}%
          </span>
        </div>
      )}

      <div
        className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
