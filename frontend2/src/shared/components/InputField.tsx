import type { LucideIcon } from "lucide-react";

type Props = {
  label: string;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  icon?: LucideIcon;
  rightIcon?: LucideIcon;
  type?: string;
  helperText?: string;
};

export const InputField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  icon: Icon,
  rightIcon: RightIcon,
  type = "text",
  helperText,
}: Props) => {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="relative mt-1">
        
        {/* Left Icon */}
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        )}

        {/* Input */}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-200 bg-white 
          pl-10 pr-10 py-2.5 text-sm
          focus:ring-2 focus:ring-primary/30 focus:border-primary
          outline-none transition"
        />

        {/* Right Icon */}
        {RightIcon && (
          <RightIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 cursor-pointer" />
        )}
      </div>

      {/* Helper text */}
      {helperText && (
        <p className="text-xs text-gray-500 mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
};