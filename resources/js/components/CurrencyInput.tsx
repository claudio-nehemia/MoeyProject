import React, { useState, useEffect, useRef } from 'react';

export interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value: number | string | null | undefined;
    onChange: (value: number) => void;
    className?: string;
    placeholder?: string;
    allowDecimal?: boolean;
}

/**
 * Parsing nilai input atau props menjadi angka murni (number).
 * Pintar membedakan desimal standar (e.g. 14466666.67 dari PHP/JS)
 * dan format mata uang lokal Indonesia (e.g. 14.466.666,67 atau 1.000.000).
 */
export function parseCurrencyValue(str: string | number | null | undefined): number {
    if (str === null || str === undefined || str === '') return 0;
    if (typeof str === 'number') return isNaN(str) ? 0 : str;

    const trimmed = str.toString().trim();
    if (!trimmed) return 0;

    // Jika mengandung koma: koma pasti pemisah desimal (format Indonesia)
    if (trimmed.includes(',')) {
        const clean = trimmed.replace(/\./g, '').replace(',', '.');
        const num = parseFloat(clean);
        return isNaN(num) ? 0 : num;
    }

    // Jika mengandung lebih dari satu titik (misal "1.000.000"): titik adalah pemisah ribuan
    const dotCount = (trimmed.match(/\./g) || []).length;
    if (dotCount > 1) {
        const clean = trimmed.replace(/\./g, '');
        const num = parseFloat(clean);
        return isNaN(num) ? 0 : num;
    }

    // Jika mengandung tepat satu titik:
    if (dotCount === 1) {
        const parts = trimmed.split('.');
        // Jika bagian sebelum titik > 3 digit (misal "14466666.67") atau setelah titik bukan 3 digit (misal ".67" atau ".6"):
        // Pasti merupakan desimal float dari database/JSON (bukan ribuan)!
        if (parts[0].length > 3 || parts[1].length !== 3) {
            const num = parseFloat(trimmed);
            return isNaN(num) ? 0 : num;
        } else {
            // Contoh "1.500" atau "250.000" -> titik sebagai pemisah ribuan
            const clean = trimmed.replace(/\./g, '');
            const num = parseFloat(clean);
            return isNaN(num) ? 0 : num;
        }
    }

    const num = parseFloat(trimmed);
    return isNaN(num) ? 0 : num;
}

/**
 * Format angka numerik atau string menjadi format tampilan mata uang bertitik:
 * Contoh:
 * - 14466666.67 -> "14.466.666,67"
 * - 91666.67 -> "91.666,67"
 * - 1000000 -> "1.000.000"
 * - 0 -> "0"
 */
export function formatCurrencyDisplay(val: number | string | null | undefined, allowDecimal = true): string {
    if (val === null || val === undefined || val === '') return '';
    const num = parseCurrencyValue(val);
    if (isNaN(num)) return '';

    // Pisahkan integer dan desimal
    const str = num.toString();
    const parts = str.split('.');
    const intFormatted = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    if (allowDecimal && parts.length > 1 && parts[1]) {
        const dec = parts[1].slice(0, 2);
        return `${intFormatted},${dec}`;
    }
    return intFormatted;
}

export default function CurrencyInput({
    value,
    onChange,
    className = '',
    placeholder = '0',
    allowDecimal = true,
    onBlur,
    ...props
}: CurrencyInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [displayVal, setDisplayVal] = useState<string>(() => formatCurrencyDisplay(value, allowDecimal));

    // Sinkronisasi nilai display jika prop value berubah dari eksternal
    useEffect(() => {
        const currentNum = parseCurrencyValue(displayVal);
        const propNum = parseCurrencyValue(value);
        // Hanya update jika nilai numerik berbeda (mencegah overwrite saat user mengetik desimal koma)
        if (Math.abs(currentNum - propNum) > 0.0001) {
            setDisplayVal(formatCurrencyDisplay(value, allowDecimal));
        }
    }, [value, allowDecimal]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const inputEl = inputRef.current;
        const cursorPos = inputEl?.selectionStart ?? raw.length;

        if (raw === '') {
            setDisplayVal('');
            onChange(0);
            return;
        }

        // Hitung berapa karakter digit/koma yang ada sebelum cursor
        const textBeforeCursor = raw.slice(0, cursorPos);
        const digitsBeforeCursor = textBeforeCursor.replace(/[^\d,]/g, '').length;

        // Bersihkan karakter selain angka, titik, dan koma
        let clean = raw.replace(/[^\d.,]/g, '');

        // Jika user mengetik titik di numpad/keyboard saat ingin desimal
        if (clean.includes('.') && !clean.includes(',')) {
            const dotIdx = clean.lastIndexOf('.');
            const afterDot = clean.slice(dotIdx + 1);
            if (afterDot.length <= 2 && dotIdx === clean.indexOf('.')) {
                clean = clean.slice(0, dotIdx) + ',' + afterDot;
            }
        }

        const parts = clean.split(',');
        const intDigits = parts[0].replace(/\D/g, '');
        const hasComma = clean.includes(',');
        const decDigits = hasComma && parts.length > 1 ? parts[1].replace(/\D/g, '').slice(0, 2) : '';

        const formattedInt = intDigits ? intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : (hasComma ? '0' : '');
        let newDisplay = formattedInt;

        if (hasComma) {
            newDisplay = `${formattedInt},${decDigits}`;
        }

        setDisplayVal(newDisplay);

        const numStr = hasComma ? `${intDigits || '0'}.${decDigits}` : (intDigits || '0');
        const numVal = parseFloat(numStr) || 0;
        onChange(numVal);

        // Kembalikan posisi cursor agar tidak melompat ke ujung input
        requestAnimationFrame(() => {
            if (!inputEl) return;
            let targetPos = 0;
            let count = 0;
            for (let i = 0; i < newDisplay.length; i++) {
                if (/[\d,]/.test(newDisplay[i])) {
                    count++;
                }
                if (count === digitsBeforeCursor) {
                    targetPos = i + 1;
                    break;
                }
            }
            if (count < digitsBeforeCursor) {
                targetPos = newDisplay.length;
            }
            inputEl.setSelectionRange(targetPos, targetPos);
        });
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setDisplayVal(formatCurrencyDisplay(value, allowDecimal));
        if (onBlur) onBlur(e);
    };

    return (
        <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={displayVal}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={className}
            {...props}
        />
    );
}