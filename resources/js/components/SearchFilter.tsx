import { useState } from 'react';

interface FilterOption {
    value: string | number;
    label: string;
}

interface SearchFilterProps {
    onSearch: (query: string) => void;
    onFilterChange?: (filterKey: string, value: string) => void;
    filters?: {
        [key: string]: {
            label: string;
            options: FilterOption[];
        };
    };
    searchPlaceholder?: string;
}

export default function SearchFilter({
    onSearch,
    onFilterChange,
    filters = {},
    searchPlaceholder = "Search...",
}: SearchFilterProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilters, setActiveFilters] = useState<{ [key: string]: string }>({});

    const handleSearch = (value: string) => {
        setSearchQuery(value);
        onSearch(value);
    };

    const handleFilterChange = (filterKey: string, value: string) => {
        const newFilters = { ...activeFilters, [filterKey]: value };
        setActiveFilters(newFilters);
        onFilterChange?.(filterKey, value);
    };

    const clearFilters = () => {
        setSearchQuery("");
        setActiveFilters({});
        onSearch("");
        Object.keys(filters).forEach((key) => {
            onFilterChange?.(key, "");
        });
    };

    const hasActiveFilters = searchQuery || Object.values(activeFilters).some((v) => v);

    return (
        <div className="bg-white rounded-lg border border-stone-200 p-3.5 space-y-3 mb-4">
            {/* Search Input */}
            <div className="relative">
                <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-stone-50"
                />
                {searchQuery && (
                    <button
                        onClick={() => handleSearch("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                )}
            </div>

            {/* Filters */}
            {Object.keys(filters).length > 0 && (
                <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(filters).map(([filterKey, filterConfig]) => (
                            <div key={filterKey} className="flex-1 min-w-[200px]">
                                <label className="block text-xs font-semibold text-stone-700 mb-1">
                                    {filterConfig.label}
                                </label>
                                <select
                                    value={activeFilters[filterKey] || ""}
                                    onChange={(e) =>
                                        handleFilterChange(filterKey, e.target.value)
                                    }
                                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-stone-50"
                                >
                                    <option value="">All {filterConfig.label}</option>
                                    {filterConfig.options.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>

                    {/* Clear Filters Button */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-xs text-stone-600 hover:text-stone-900 underline flex items-center gap-1"
                        >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            Clear filters
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
