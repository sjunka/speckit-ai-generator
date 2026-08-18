export const TextInput = ({
  placeholder,
  disabled,
  className = "",
  ...props
}) => {
  return (
    <input
      type="text"
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full h-11 px-3 rounded-[8px] bg-surface-1 text-ink border border-hairline focus:outline-2 focus:outline-offset-2 focus:outline-primary-focus/50 disabled:opacity-50 disabled:cursor-not-allowed body ${className}`}
      {...props}
    />
  );
};
