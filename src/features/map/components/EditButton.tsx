type EditButtonProps = {
  editMode: boolean;
  onClick: () => void;
  disabled?: boolean;
};

export default function EditButton({
  editMode,
  onClick,
  disabled = false,
}: EditButtonProps) {
  return (
    <button
      className={`map-edit-button${editMode ? " is-on" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      Edit Map {editMode ? "ON" : "OFF"}
    </button>
  );
}
