"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NumberInputProps {
    value: number | "";
    onChange: (value: number) => void;
    maxDecimals?: number;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    min?: number;
    max?: number;
}

/**
 * Format a number to Vietnamese locale: 1.234.567,890
 * - Thousands separator: .
 * - Decimal separator: ,
 */
function formatNumber(num: number, maxDecimals: number): string {
    if (num === 0) return "0";

    const parts = num.toFixed(maxDecimals).split(".");
    // Remove trailing zeros from decimal part
    let intPart = parts[0];
    let decPart = parts[1] ? parts[1].replace(/0+$/, "") : "";

    // Add thousands separators to integer part
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    return decPart ? `${intPart},${decPart}` : intPart;
}

/**
 * Parse a Vietnamese-formatted number string back to a number
 */
function parseFormattedNumber(str: string): number {
    // Remove thousands separators (dots) and replace decimal comma with dot
    const cleaned = str.replace(/\./g, "").replace(",", ".");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

export function NumberInput({
    value,
    onChange,
    maxDecimals = 3,
    placeholder,
    className,
    disabled,
    min,
    max,
}: NumberInputProps) {
    const [displayValue, setDisplayValue] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // When value changes externally (and not focused), update display
    useEffect(() => {
        if (!isFocused) {
            if (value === "" || value === 0) {
                setDisplayValue("");
            } else {
                setDisplayValue(formatNumber(value, maxDecimals));
            }
        }
    }, [value, isFocused, maxDecimals]);

    const handleFocus = () => {
        setIsFocused(true);
        // On focus, show raw editable value with comma as decimal
        if (value !== "" && value !== 0) {
            const parts = value.toString().split(".");
            let decPart = parts[1] ? parts[1].replace(/0+$/, "") : "";
            const display = decPart ? `${parts[0]},${decPart}` : parts[0];
            setDisplayValue(display);
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
        const num = parseFormattedNumber(displayValue);
        // Round to maxDecimals
        let rounded = Math.round(num * Math.pow(10, maxDecimals)) / Math.pow(10, maxDecimals);

        // Apply min/max
        if (min !== undefined && rounded < min) rounded = min;
        if (max !== undefined && rounded > max) rounded = max;

        onChange(rounded);
        if (rounded === 0) {
            setDisplayValue("");
        } else {
            setDisplayValue(formatNumber(rounded, maxDecimals));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let raw = e.target.value;

        // Allow only digits, comma (decimal), and minus
        raw = raw.replace(/[^0-9,\-]/g, "");

        // Only one comma allowed
        const commaCount = (raw.match(/,/g) || []).length;
        if (commaCount > 1) return;

        // Limit decimal places
        if (raw.includes(",")) {
            const [intPart, decPart] = raw.split(",");
            if (decPart && decPart.length > maxDecimals) return;
            raw = `${intPart},${decPart || ""}`;
        }

        setDisplayValue(raw);

        // Parse and notify parent
        let num = parseFormattedNumber(raw);

        // Don't enforce max while typing (might be intermediate) but we can check if it's completely invalid
        // Actually best to only enforce on blur for max, but min 0 is common

        onChange(num);
    };

    return (
        <Input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={cn("text-right", className)}
            disabled={disabled}
        />
    );
}
