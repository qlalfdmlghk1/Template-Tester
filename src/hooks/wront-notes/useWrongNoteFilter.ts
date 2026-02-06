import type { Filters } from "@/types/wrong-notes.types";
import { useMemo, useState } from "react";

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

  const clearFilters = () => {
    setFilters({
      platform: "",
      category: "",
      language: "",
      result: "",
      tag: "",
    });
    setSearchQuery("");
    setSortBy("latest");
  };

  const handleSortByChange = (value: string) => {
    setSortBy(value);
  };

  const hasActiveFilters = useMemo(() => {
    return (
      !!filters.platform || !!filters.result || !!filters.tag || !!searchQuery
    );
  }, [filters.platform, filters.result, filters.tag, searchQuery]);

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
