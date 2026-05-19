"use client";

type Props = {
  input: string;
  siteSearch: string;
  setSiteSearch: (value: string) => void;
  site: string;
  setSite: (value: string) => void;
  setRegion: (value: string) => void;
  setEntity: (value: string) => void;
  setCity: (value: string) => void;
  setSiteId: (value: number | null) => void;
  filteredSites: any[];
  placeholder?: string;
};

export default function SiteSearchDropdown({
  input,
  siteSearch,
  setSiteSearch,
  site,
  setSite,
  setRegion,
  setEntity,
  setCity,
  setSiteId,
  filteredSites,
  placeholder = "Cerca sede...",
}: Props) {
  return (
    <div className="relative">
      <input
        className={`w-full ${input}`}
        placeholder={placeholder}
        value={siteSearch}
        onChange={(e) => {
          setSiteSearch(e.target.value);
          setSite("");
          setRegion("");
          setEntity("");
          setCity("");
          setSiteId(null);
        }}
      />

      {siteSearch && !site && (
        <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 shadow-xl">
          {filteredSites.length === 0 && (
            <div className="p-4 text-sm text-slate-400">
              Nessuna sede trovata
            </div>
          )}

          {filteredSites.map((s) => (
            <button
              key={s.id}
              type="button"
              className="block w-full border-b border-white/10 p-4 text-left text-white hover:bg-white/10"
              onClick={() => {
                setSite(s.name);
                setSiteSearch(s.name);
                setRegion(s.region || "");
                setEntity(s.entity || "");
                setCity(s.city || "");
                setSiteId(s.id || null);
              }}
            >
              <div className="font-black">{s.name}</div>
              <div className="text-xs text-slate-400">
                {s.city || "Città n/d"} · {s.entity || "Ente n/d"}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}