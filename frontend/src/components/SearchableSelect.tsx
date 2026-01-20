'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with react-select
const CreatableSelect = dynamic(
    () => import('react-select/creatable'),
    { ssr: false, loading: () => <div className="animate-pulse bg-gray-200 h-10 rounded-lg" /> }
) as any;

const Select = dynamic(
    () => import('react-select'),
    { ssr: false, loading: () => <div className="animate-pulse bg-gray-200 h-10 rounded-lg" /> }
) as any;

export interface SelectOption {
    value: string;
    label: string;
}

interface SearchableSelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    isCreatable?: boolean;
    onCreateOption?: (inputValue: string) => void;
    isDisabled?: boolean;
    isClearable?: boolean;
    className?: string;
    error?: boolean;
    formatCreateLabel?: (inputValue: string) => string;
}

// Custom styles for react-select to match the app theme
const customStyles = {
    control: (base: any, state: any) => ({
        ...base,
        backgroundColor: 'white',
        borderColor: state.isFocused ? '#10B981' : '#D1D5DB',
        borderRadius: '0.5rem',
        minHeight: '42px',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : 'none',
        '&:hover': {
            borderColor: '#10B981',
        },
    }),
    menu: (base: any) => ({
        ...base,
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        zIndex: 9999,
    }),
    menuList: (base: any) => ({
        ...base,
        maxHeight: '200px',
    }),
    option: (base: any, state: any) => ({
        ...base,
        backgroundColor: state.isSelected
            ? '#10B981'
            : state.isFocused
                ? '#D1FAE5'
                : 'white',
        color: state.isSelected ? 'white' : '#1F2937',
        cursor: 'pointer',
        '&:active': {
            backgroundColor: '#059669',
        },
    }),
    singleValue: (base: any) => ({
        ...base,
        color: '#1F2937',
    }),
    placeholder: (base: any) => ({
        ...base,
        color: '#9CA3AF',
    }),
    input: (base: any) => ({
        ...base,
        color: '#1F2937',
    }),
    indicatorSeparator: () => ({
        display: 'none',
    }),
    dropdownIndicator: (base: any, state: any) => ({
        ...base,
        color: state.isFocused ? '#10B981' : '#9CA3AF',
        '&:hover': {
            color: '#10B981',
        },
    }),
};

// Error styles
const errorStyles = {
    ...customStyles,
    control: (base: any, state: any) => ({
        ...base,
        backgroundColor: 'white',
        borderColor: '#EF4444',
        borderRadius: '0.5rem',
        minHeight: '42px',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(239, 68, 68, 0.2)' : 'none',
        '&:hover': {
            borderColor: '#DC2626',
        },
    }),
};

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'ค้นหา...',
    isCreatable = true,
    onCreateOption,
    isDisabled = false,
    isClearable = true,
    className = '',
    error = false,
    formatCreateLabel = (inputValue: string) => `➕ เพิ่ม "${inputValue}"`,
}) => {
    const [isLoading, setIsLoading] = useState(false);

    const selectedOption = options.find((opt) => opt.value === value) || null;

    const handleChange = useCallback((newValue: any) => {
        onChange(newValue?.value || '');
    }, [onChange]);

    const handleCreateOption = useCallback(async (inputValue: string) => {
        if (onCreateOption) {
            setIsLoading(true);
            await onCreateOption(inputValue);
            setIsLoading(false);
        }
        onChange(inputValue);
    }, [onCreateOption, onChange]);

    const SelectComponent = isCreatable ? CreatableSelect : Select;
    const styles = error ? errorStyles : customStyles;

    return (
        <div className={className}>
            <SelectComponent
                options={options}
                value={selectedOption}
                onChange={handleChange}
                onCreateOption={isCreatable ? handleCreateOption : undefined}
                placeholder={placeholder}
                isDisabled={isDisabled || isLoading}
                isClearable={isClearable}
                isLoading={isLoading}
                isSearchable
                formatCreateLabel={formatCreateLabel}
                styles={styles}
                noOptionsMessage={() => 'ไม่พบข้อมูล'}
                loadingMessage={() => 'กำลังโหลด...'}
                classNamePrefix="searchable-select"
            />
        </div>
    );
};

export default SearchableSelect;
