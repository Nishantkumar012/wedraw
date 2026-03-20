type InputProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
};

export const Input = ({
  value,
  onChange,
  placeholder,
  type = "text",
}: InputProps) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
    />
  );
};