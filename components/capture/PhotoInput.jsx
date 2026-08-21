import { CameraIcon } from "@/components/ui";

export const PhotoInput = ({ onPhotoSelect, inputRef }) => {
  return (
    <div className="space-y-2">
      <label htmlFor="photo" className="eyebrow block">Your photo</label>
      <input
        ref={inputRef}
        id="photo"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
              onPhotoSelect(evt.target?.result);
            };
            reader.readAsDataURL(file);
          }
        }}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="w-full h-11 bg-surface-2 text-ink rounded-[8px] hover:bg-surface-3 focus:outline-2 focus:outline-offset-2 focus:outline-primary-focus/50 body flex items-center justify-center gap-2"
      >
        <CameraIcon />
        Choose photo
      </button>
    </div>
  );
};
