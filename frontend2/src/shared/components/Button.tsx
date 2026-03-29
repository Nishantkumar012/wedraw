type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  disabled?: boolean;
};

export const Button = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  fullWidth,
  disabled,
}: ButtonProps) => {
  const base = "rounded-md font-medium transition";

  const variants = {
    primary: "bg-primary text-white hover:bg-orange-700",
    secondary: "bg-gray-200 text-black hover:bg-gray-300",
    ghost: "bg-transparent hover:bg-gray-100",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };

  const sizes = {
    sm: "px-2 py-1 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${
        fullWidth ? "w-full" : ""
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
};