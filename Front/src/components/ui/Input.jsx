
function Input({
  label,
  error,
  hint,
  id,
  className = "",
  ...props
}) {
  const inputId = id || props.name;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}

      <input
        id={inputId}
        className={`
          w-full rounded-lg border bg-white px-3 py-2
          text-sm text-gray-900 outline-none transition
          placeholder:text-gray-400
          focus:border-blue-500 focus:ring-2
          focus:ring-blue-100
          disabled:cursor-not-allowed disabled:bg-gray-100
          ${error ? "border-red-500" : "border-gray-300"}
          ${className}
        `}
        aria-invalid={Boolean(error)}
        {...props}
      />

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {!error && hint && (
        <p className="text-sm text-gray-500">{hint}</p>
      )}
    </div>
  );
}

export default Input;
