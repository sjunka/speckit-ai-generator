const variantStyles = {
  success: "bg-success text-ink",
  pending: "bg-primary text-ink",
  failed: "bg-surface-3 text-ink",
};

export const StatusBadge = ({ variant = "pending", className = "", children, ...props }) => {
  return (
    <div
      data-testid="status-badge"
      className={`inline-block rounded-[4px] px-2 py-1 text-xs font-medium ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
