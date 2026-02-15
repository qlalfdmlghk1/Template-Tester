import { useState } from "react";
import type { Filters } from "./wrong-note.type";

export function useWrongNoteFilter() {
  const [filters, setFilters] = useState<Filters>({
    platform: "",
    category: "",
    language: "",
    result: "",
    tag: "",
  });
  const [sortBy, setSortBy] = useState("latest");
  const [searchQuery, setSearchQuery] = useState("");

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSortByChange = (value: string) => {
    setSortBy(value);
  };

  const clearFilters = () => {
    setFilters({
      platform: "",
      category: "",
      language: "",
      result: "",
      tag: "",
    });
    setSearchQuery("");
  };

  const hasActiveFilters = !!(filters.platform || filters.result || filters.tag || searchQuery);

  return {
    filters,
    sortBy,
    searchQuery,
    setSearchQuery,
    handleFilterChange,
    handleSortByChange,
    clearFilters,
    hasActiveFilters,
  };
}
