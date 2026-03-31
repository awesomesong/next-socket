"use client";
import { useState } from "react";
import { FieldErrors } from "react-hook-form";
import Select, { SelectInstance, GroupBase, MultiValue, components as rsComponents } from "react-select";
import { formInputLayout } from "@/src/app/components/formLayoutClasses";

type OptionType = { value: string; label: string };

interface SelctProps {
    isOpen?: boolean;
    label: string;
    value?: MultiValue<OptionType>;
    onChange: (value: MultiValue<OptionType> | null) => void;
    options: OptionType[];
    disabled?: boolean;
    selectRef: React.RefObject<SelectInstance<OptionType, true, GroupBase<OptionType>> | null>;
    errors: FieldErrors;
}


const SelectBox: React.FC<SelctProps> = ({
    isOpen,
    label,
    value,
    onChange,
    options,
    disabled,
    selectRef,
}) => {
    const [isTouchDevice] = useState(() =>
        typeof window !== "undefined" &&
        (window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0)
    );

    return (
        <div className="z-[100]">
            <label
                className={formInputLayout.label}
            >
                {label}
            </label>
            {isOpen && (
                <Select<OptionType, true>
                    className="scent-select-container"
                    classNamePrefix="scent-select"
                    classNames={{
                        control: (state) => `
                                !border-none !shadow-none textfield-input-boundary relative
                                after:content-[''] after:absolute after:bottom-[-1px] after:left-0 
                                after:w-full after:h-[2px] after:bg-[#b094e0] dark:after:bg-[#c8b4ff] 
                                after:scale-x-0 after:origin-center after:transition-transform after:duration-300
                                ${state.isFocused ? "after:scale-x-100" : ""}
                            `,
                        menu: () => "scent-select__menu",
                        option: (state) => `
                                scent-select__option 
                                ${state.isFocused ? "scent-select__option--is-focused" : ""} 
                                ${state.isSelected ? "scent-select__option--is-selected" : ""}
                            `,
                        dropdownIndicator: () => "scent-select__dropdown-indicator scent-select__indicator",
                        clearIndicator: () => "scent-select__clear-indicator scent-select__indicator",
                        indicatorSeparator: () => "scent-select__indicator-separator",
                    }}
                    ref={selectRef}
                    isDisabled={disabled}
                    value={value}
                    onChange={onChange}
                    isMulti
                    isSearchable={!isTouchDevice}
                    components={isTouchDevice ? {
                        Input: (props) => <rsComponents.Input {...props} readOnly />,
                    } : undefined}
                    placeholder="멤버를 선택해주세요."
                    options={options}
                    menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                    menuPosition='fixed'
                    menuPlacement='auto'
                    styles={{
                        control: (base) => ({
                            ...base,
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '0',
                            boxShadow: 'none',
                            '&:hover': {
                                border: 'none',
                            },
                            minHeight: '40px',
                            padding: '0',
                            transition: 'all 0.3s ease',
                        }),
                        menu: (base) => ({
                            ...base,
                            backgroundColor: 'var(--color-ivory)',
                            borderRadius: '12px',
                            border: '1px solid var(--color-lavender-border)',
                            boxShadow: '0 10px 25px rgba(45, 32, 64, 0.1)',
                            overflow: 'hidden',
                            zIndex: 1000,
                        }),
                        option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isFocused
                                ? '#e8e0ff'
                                : 'transparent',
                            color: state.isFocused ? '#7c5eb0' : '#2d2040',
                            padding: '10px 15px',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            '&:active': {
                                backgroundColor: 'var(--color-lavender-light)',
                            },
                        }),
                        multiValue: (base) => ({
                            ...base,
                            backgroundColor: 'var(--color-lavender-pale)',
                            borderRadius: '6px',
                            border: '1px solid var(--color-lavender-border)',
                        }),
                        multiValueLabel: (base) => ({
                            ...base,
                            color: 'var(--color-text-primary)',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                        }),
                        multiValueRemove: (base) => ({
                            ...base,
                            color: 'var(--color-lavender)', // Base color for the "X"
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                backgroundColor: 'var(--color-lavender-light)',
                                color: '#2d2040', // Dark text on light background for clear visibility
                            },
                        }),
                        placeholder: (base) => ({
                            ...base,
                            color: 'var(--color-lavender-muted)',
                            opacity: 0.6,
                            fontSize: '0.95rem',
                            fontWeight: '300', // TextField's font-light (300) matching
                        }),
                        input: (base) => ({
                            ...base,
                            color: 'var(--color-text-primary)',
                        }),
                        valueContainer: (base) => ({
                            ...base,
                            padding: '0',
                        }),
                        menuPortal: (base) => ({
                            ...base,
                            zIndex: 1000,
                        }),
                    }}
                />)}
        </div >
    )
}

export default SelectBox;

{/* <Select 
    isDisabled={isLoading}
    placeholder={<div className='text-gray-400'>카테고리를 선택해주세요.</div>}
    name='category'
    menuPortalTarget={document.body} 
    options={options} 
    value={selectedOption}
    onChange={handleChangeSelect}
    theme={(theme) => ({
        ...theme,
        borderRadius: 10,
        colors: {
        ...theme.colors,
        //after select dropdown option
        primary50: "gray",
        //Border and Background dropdown color
        primary: "#CAFFFA",
        //Background hover dropdown color
        primary25: "gray",
        //Background color
        neutral0: "black",
        //Border before select
        neutral20: "#CAFFCA",
        //Hover border
        neutral30: "#82FFE7",
        //No options color
        neutral40: "#CAFFCA",
        //Select color
        neutral50: "#1A1A1A",
        //arrow icon when click select
        neutral60: "#42FFDD",
        //Text color
        neutral80: "#F4FFFD",
        },
    })}
/> */}
