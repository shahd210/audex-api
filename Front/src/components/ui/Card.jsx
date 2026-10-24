
function Card({
  children,
  title,
  description,
  action,
  className = "",
}) {
  return (
    <section
      className={`
        rounded-xl border border-gray-200
        bg-white p-5 shadow-sm
        ${className}
      `}
    >
      {(title || description || action) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-gray-900">
                {title}
              </h3>
            )}

            {description && (
              <p className="mt-1 text-sm text-gray-500">
                {description}
              </p>
            )}
          </div>

          {action && <div>{action}</div>}
        </div>
      )}

      {children}
    </section>
  );
}

export default Card;
