export const Card = ({ children, className = "", ...props }) => {
  return (
    <div
      data-testid="card"
      className={`bg-surface-1 text-ink border border-hairline rounded-[8px] p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
