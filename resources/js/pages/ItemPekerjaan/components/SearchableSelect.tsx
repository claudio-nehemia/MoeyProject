import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface SearchableOption {
    value: string | number;
    label: string;
}

interface SearchableSelectProps {
    value: string | number;
    onChange: (value: string) => void;
    options: SearchableOption[];
    placeholder?: string;
    searchPlaceholder?: string;
    className?: string;
    buttonClassName?: string;
    size?: 'sm' | 'md';
    required?: boolean;
}

export default function SearchableSelect({
    value,
    onChange,
    options,
    placeholder = '-- Pilih --',
    searchPlaceholder = 'Ketik untuk mencari...',
    className = 'w-full',
    buttonClassName = '',
    size = 'md',
    required = false,
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
    const [dropdownCoords, setDropdownCoords] = useState<{
        top: number;
        left: number;
        width: number;
        openUpward: boolean;
    }>({ top: 0, left: 0, width: 240, openUpward: false });

    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

    // Always sort options alphabetically (A-Z)
    const sortedOptions = useMemo(() => {
        return [...options].sort((a, b) =>
            String(a.label ?? '')
                .trim()
                .localeCompare(String(b.label ?? '').trim(), 'id', {
                    sensitivity: 'base',
                    numeric: true,
                }),
        );
    }, [options]);

    const selectedOption = useMemo(
        () =>
            sortedOptions.find(
                (opt) => opt.value.toString() === (value ?? '').toString(),
            ),
        [sortedOptions, value],
    );

    // Filter options based on search query (maintaining A-Z sort)
    const filteredOptions = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return sortedOptions;
        return sortedOptions.filter((opt) =>
            String(opt.label ?? '')
                .toLowerCase()
                .includes(q),
        );
    }, [sortedOptions, searchQuery]);

    useEffect(() => {
        setHighlightedIndex(0);
    }, [searchQuery, isOpen]);

    useEffect(() => {
        if (isOpen && optionRefs.current[highlightedIndex]) {
            optionRefs.current[highlightedIndex]?.scrollIntoView({
                block: 'nearest',
            });
        }
    }, [highlightedIndex, isOpen]);

    const updatePosition = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const estimatedHeight = 280;
        const openUpward = spaceBelow < estimatedHeight && rect.top > spaceBelow;

        setDropdownCoords({
            top: openUpward ? rect.top - 4 : rect.bottom + 4,
            left: rect.left,
            width: Math.max(rect.width, 240),
            openUpward,
        });
    };

    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            return;
        }
        updatePosition();

        const handleOutsideClick = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                containerRef.current &&
                !containerRef.current.contains(target) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(target)
            ) {
                setIsOpen(false);
            }
        };

        const handleScrollOrResize = (e: Event) => {
            if (
                dropdownRef.current &&
                e.target instanceof Node &&
                dropdownRef.current.contains(e.target)
            ) {
                return;
            }
            updatePosition();
        };

        document.addEventListener('mousedown', handleOutsideClick);
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [isOpen]);

    const handleSelect = (newValue: string) => {
        onChange(newValue);
        setSearchQuery('');
        setIsOpen(false);
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!isOpen) {
                setIsOpen(true);
                return;
            }
            setHighlightedIndex((prev) =>
                filteredOptions.length > 0
                    ? (prev + 1) % filteredOptions.length
                    : 0,
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (!isOpen) {
                setIsOpen(true);
                return;
            }
            setHighlightedIndex((prev) =>
                filteredOptions.length > 0
                    ? (prev - 1 + filteredOptions.length) %
                      filteredOptions.length
                    : 0,
            );
        } else if (e.key === 'Enter') {
            if (isOpen) {
                e.preventDefault();
                if (filteredOptions[highlightedIndex]) {
                    handleSelect(
                        filteredOptions[highlightedIndex].value.toString(),
                    );
                }
            }
        } else if (e.key === 'Escape') {
            if (isOpen) {
                e.preventDefault();
                setIsOpen(false);
                inputRef.current?.blur();
            }
        }
    };

    const renderHighlightedLabel = (label: string, query: string) => {
        const q = query.trim();
        if (!q) return <span>{label}</span>;

        const lowerLabel = label.toLowerCase();
        const lowerQuery = q.toLowerCase();
        const matchIndex = lowerLabel.indexOf(lowerQuery);

        if (matchIndex === -1) return <span>{label}</span>;

        const before = label.slice(0, matchIndex);
        const match = label.slice(matchIndex, matchIndex + q.length);
        const after = label.slice(matchIndex + q.length);

        return (
            <span>
                {before}
                <mark className="rounded bg-purple-100 px-0.5 font-bold text-purple-800">
                    {match}
                </mark>
                {after}
            </span>
        );
    };

    const sizeStyles =
        size === 'sm'
            ? 'py-1.5 pl-8 pr-14 text-xs rounded-lg'
            : 'py-2.5 pl-9 pr-16 text-sm rounded-lg';

    const displayValue = isOpen
        ? searchQuery
        : selectedOption
          ? selectedOption.label
          : '';

    const displayPlaceholder = isOpen
        ? selectedOption
            ? `${selectedOption.label} (${searchPlaceholder.toLowerCase()})`
            : searchPlaceholder || placeholder
        : placeholder;

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {required && (
                <input
                    type="text"
                    tabIndex={-1}
                    value={value ?? ''}
                    onChange={() => {}}
                    required={required}
                    className="pointer-events-none sr-only absolute inset-0 opacity-0"
                    aria-hidden="true"
                />
            )}

            {/* Direct Search Combobox Input */}
            <div className="relative flex items-center">
                <Search
                    className={`pointer-events-none absolute left-2.5 ${
                        size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
                    } ${isOpen ? 'text-purple-600' : 'text-slate-400'}`}
                />
                <input
                    ref={inputRef}
                    type="text"
                    value={displayValue}
                    placeholder={displayPlaceholder}
                    onFocus={() => {
                        setIsOpen(true);
                    }}
                    onClick={() => {
                        if (!isOpen) setIsOpen(true);
                    }}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }}
                    onKeyDown={handleInputKeyDown}
                    className={`w-full border bg-white text-left transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 ${
                        isOpen
                            ? 'border-purple-500 ring-2 ring-purple-500/20 text-slate-900 placeholder-slate-400'
                            : selectedOption
                              ? 'border-slate-300 font-medium text-slate-800'
                              : 'border-slate-300 text-slate-700 placeholder-slate-500'
                    } ${sizeStyles} ${buttonClassName}`}
                />

                <div className="absolute right-1.5 flex items-center gap-0.5">
                    {(searchQuery || (!isOpen && selectedOption)) && (
                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (searchQuery) {
                                    setSearchQuery('');
                                    inputRef.current?.focus();
                                } else {
                                    onChange('');
                                    setSearchQuery('');
                                    setIsOpen(true);
                                    inputRef.current?.focus();
                                }
                            }}
                            title={searchQuery ? 'Hapus pencarian' : 'Reset pilihan'}
                            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                    <button
                        type="button"
                        tabIndex={-1}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen((prev) => {
                                const next = !prev;
                                if (next) {
                                    setTimeout(() => inputRef.current?.focus(), 0);
                                }
                                return next;
                            });
                        }}
                        className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    >
                        <ChevronDown
                            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                                isOpen ? 'rotate-180 text-purple-600' : ''
                            }`}
                        />
                    </button>
                </div>
            </div>

            {isOpen &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        style={{
                            position: 'fixed',
                            top: dropdownCoords.openUpward
                                ? undefined
                                : `${dropdownCoords.top}px`,
                            bottom: dropdownCoords.openUpward
                                ? `${window.innerHeight - dropdownCoords.top}px`
                                : undefined,
                            left: `${dropdownCoords.left}px`,
                            width: `${dropdownCoords.width}px`,
                            zIndex: 9999,
                        }}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5"
                    >
                        {/* Info Header: Sort A-Z & Count */}
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/90 px-3 py-1.5 text-[11px] text-slate-500">
                            <span className="font-medium">
                                {searchQuery.trim()
                                    ? `Hasil pencarian "${searchQuery.trim()}"`
                                    : 'Daftar Pilihan (Urut A–Z)'}
                            </span>
                            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                                {filteredOptions.length} item
                            </span>
                        </div>

                        {/* Options List */}
                        <div className="max-h-60 overflow-y-auto py-1">
                            {filteredOptions.length === 0 ? (
                                <div className="px-3 py-5 text-center text-xs text-slate-400">
                                    Tidak ditemukan hasil untuk "
                                    <span className="font-medium text-slate-600">
                                        {searchQuery}
                                    </span>
                                    "
                                </div>
                            ) : (
                                filteredOptions.map((opt, idx) => {
                                    const isSelected =
                                        opt.value.toString() ===
                                        (value ?? '').toString();
                                    const isHighlighted =
                                        idx === highlightedIndex;
                                    return (
                                        <button
                                            key={opt.value}
                                            ref={(el) => {
                                                optionRefs.current[idx] = el;
                                            }}
                                            type="button"
                                            onMouseEnter={() =>
                                                setHighlightedIndex(idx)
                                            }
                                            onClick={() =>
                                                handleSelect(
                                                    opt.value.toString(),
                                                )
                                            }
                                            className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors ${
                                                isSelected
                                                    ? 'bg-purple-50 font-semibold text-purple-700'
                                                    : isHighlighted
                                                      ? 'bg-purple-50/60 text-slate-900'
                                                      : 'text-slate-700 hover:bg-purple-50/50'
                                            }`}
                                        >
                                            <span className="truncate">
                                                {renderHighlightedLabel(
                                                    String(opt.label ?? ''),
                                                    searchQuery,
                                                )}
                                            </span>
                                            {isSelected && (
                                                <Check className="h-3.5 w-3.5 shrink-0 text-purple-600" />
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}
