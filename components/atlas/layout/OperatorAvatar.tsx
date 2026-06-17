"use client";

type OperatorAvatarProps = {
  avatar?: string;
  onUpload?: (file?: File | null) => void | Promise<void>;
};

export default function OperatorAvatar({ avatar = "", onUpload }: OperatorAvatarProps) {
  return (
    <label
      title="Carica foto profilo"
      className="relative flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-amber-200/30 bg-amber-300/10 text-sm font-black text-amber-50 shadow-[0_0_24px_rgba(251,191,36,0.12)] transition-all hover:border-amber-200/60 hover:bg-amber-300/20"
    >
      {avatar ? (
        <img src={avatar} alt="Foto profilo" className="h-full w-full object-cover" />
      ) : (
        <span>GP</span>
      )}
      {!avatar && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-slate-950 bg-cyan-400 text-[11px] font-black text-slate-950">
          +
        </span>
      )}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          void onUpload?.(event.target.files?.[0]);
          event.currentTarget.value = "";
        }}
      />
    </label>
  );
}
