type EditButtonProps = {
  editMode: boolean;
  onClick: () => void;
};

export default function EditButton({ editMode, onClick }: EditButtonProps) {
  return (
    <button
      className={`map-edit-button${editMode ? " is-on" : ""}`}
      onClick={onClick}
    >
      Edit Map {editMode ? "ON" : "OFF"}
    </button>
  );
}
