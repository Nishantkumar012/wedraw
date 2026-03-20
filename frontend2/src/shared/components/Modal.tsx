type ModalProps = {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
};

export const Modal = ({ children, isOpen, onClose }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white p-6 rounded-xl w-96 relative shadow-lg">
        
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500"
        >
          ✖
        </button>

        {children}
      </div>
    </div>
  );
};