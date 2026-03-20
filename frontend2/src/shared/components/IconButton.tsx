type IconButtonProps = {
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
};

export const IconButton = ({ icon, active, onClick }: IconButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-md border transition
        ${active ? "bg-blue-600 text-white" : "bg-white hover:bg-gray-100"}
      `}
    >
      {icon}
    </button>
  );
};