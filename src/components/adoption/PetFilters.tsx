import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FilterPill } from "@/components/FilterPill";
import { REGIONS } from "@/lib/regions";

export type PetSpeciesFilter = "todos" | "filhotes" | "gato" | "cao";

interface PetFiltersProps {
  filter: PetSpeciesFilter;
  onFilterChange: (f: PetSpeciesFilter) => void;
  region: string;
  onRegionChange: (r: string) => void;
  searchTerm: string;
  onSearchChange: (s: string) => void;
}

const FILTER_OPTIONS: [PetSpeciesFilter, string][] = [
  ["todos", "Todos os Pets"],
  ["filhotes", "Filhotes"],
  ["gato", "Gatos"],
  ["cao", "Cães"],
];

export function PetFilters({
  filter,
  onFilterChange,
  region,
  onRegionChange,
  searchTerm,
  onSearchChange,
}: PetFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search Input & Region Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou características (ex: Mel, dócil, porte pequeno)..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>

        <select
          value={region}
          onChange={(e) => onRegionChange(e.target.value)}
          className="h-10 rounded-md border border-primary/40 bg-card px-3 text-sm font-medium"
          aria-label="Região do DF"
        >
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r === "Todas" ? "Todas as Regiões do DF" : r}
            </option>
          ))}
        </select>
      </div>

      {/* Species Filter Pills */}
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
        {FILTER_OPTIONS.map(([k, label]) => (
          <FilterPill key={k} active={filter === k} onClick={() => onFilterChange(k)}>
            {label}
          </FilterPill>
        ))}
      </div>
    </div>
  );
}
