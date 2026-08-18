const variantStyles = {
  primary:
    "bg-primary text-ink hover:bg-primary-light focus:outline-2 focus:outline-offset-2 focus:outline-primary-focus/50",
  secondary:
    "bg-surface-2 text-ink hover:bg-surface-3 focus:outline-2 focus:outline-offset-2 focus:outline-primary-focus/50",
  tertiary:
    "bg-surface-3 text-ink hover:bg-surface-4 focus:outline-2 focus:outline-offset-2 focus:outline-primary-focus/50",
};

export const Button = ({ variant = "primary", className = "", children, ...props }) => {
  return (
    <button
      className={`rounded-[8px] h-11 px-4 font-medium body transition-colors ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
