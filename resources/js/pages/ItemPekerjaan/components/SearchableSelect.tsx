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
    searchPlaceholder = 'Cari...',
    className = 'w-full',
    buttonClassName = '',
    size = 'md',
    required = false,
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dropdownCoords, setDropdownCoords] = useState<{
        top: number;
        left: number;
        width: number;
    }>({ top: 0, left: 0, width: 240 });

    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedOption = useMemo(
        () => options.find((opt) => opt.value.toString() === (value ?? '').toString()),
        [options, value],
    );

    const filteredOptions = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return options;
        return options.filter((opt) => opt.label.toLowerCase().includes(q));
    }, [options, searchQuery]);

    const updatePosition = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setDropdownCoords({
            top: rect.bottom + 4,
            left: rect.left,
            width: Math.max(rect.width, 220),
        });
    };

    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            return;
        }
        updatePosition();
        const timer = setTimeout(() => {
            searchInputRef.current?.focus();
        }, 10);

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
            if (dropdownRef.current && e.target instanceof Node && dropdownRef.current.contains(e.target)) {
                return;
            }
            updatePosition();
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleOutsideClick);
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const handleSelect = (newValue: string) => {
        onChange(newValue);
        setIsOpen(false);
    };

    const sizeStyles =
        size === 'sm'
            ? 'px-2.5 py-1.5 text-xs rounded'
            : 'px-3 py-2.5 text-sm rounded-lg';

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {required && (
                <input
                    type="text"
                    tabIndex={-1}
                    value={value ?? ''}
                    onChange={() => {}}
                    required={required}
                    className="sr-only pointer-events-none absolute inset-0 opacity-0"
                    aria-hidden="true"
                />
            )}
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className={`flex w-full items-center justify-between gap-2 border border-slate-300 bg-white text-left transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 ${sizeStyles} ${buttonClassName}`}
            >
                <span
                    className={`truncate ${
                        selectedOption ? 'font-medium text-slate-800' : 'text-slate-500'
                    }`}
                >
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-purple-600' : ''
                    }`}
                />
            </button>

            {isOpen &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        style={{
                            position: 'fixed',
                            top: `${dropdownCoords.top}px`,
                            left: `${dropdownCoords.left}px`,
                            width: `${dropdownCoords.width}px`,
                            zIndex: 9999,
                        }}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5"
                    >
                        {/* Search Bar Inside Dropdown */}
                        <div className="border-b border-slate-100 bg-slate-50/80 p-2">
                            <div className="relative flex items-center">
                                <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={searchPlaceholder}
                                    className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-7 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery('');
                                            searchInputRef.current?.focus();
                                        }}
                                        className="absolute right-2 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Options List */}
                        <div className="max-h-60 overflow-y-auto py-1">
                            {!searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => handleSelect('')}
                                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-slate-50 ${
                                        !selectedOption
                                            ? 'bg-purple-50/60 font-medium text-purple-700'
                                            : 'text-slate-500'
                                    }`}
                                >
                                    <span>{placeholder}</span>
                                    {!selectedOption && <Check className="h-3.5 w-3.5 text-purple-600" />}
                                </button>
                            )}

                            {filteredOptions.length === 0 ? (
                                <div className="px-3 py-4 text-center text-xs text-slate-400">
                                    Tidak ditemukan hasil untuk "{searchQuery}"
                                </div>
                            ) : (
                                filteredOptions.map((opt) => {
                                    const isSelected =
                                        opt.value.toString() === (value ?? '').toString();
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => handleSelect(opt.value.toString())}
                                            className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-purple-50 ${
                                                isSelected
                                                    ? 'bg-purple-50 font-semibold text-purple-700'
                                                    : 'text-slate-700'
                                            }`}
                                        >
                                            <span className="truncate">{opt.label}</span>
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

