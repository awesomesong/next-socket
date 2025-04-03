"use client";
import { FieldErrors } from "react-hook-form";
import Select, { SelectInstance, GroupBase } from "react-select";
import React, { forwardRef, useRef } from "react";

interface SelctProps {
    isOpen?: boolean;
    label: string;
    value?: Record<string, any>;
    onChange: (value: Record<string, any>) => void;
    options: Record<string, any>[];
    disabled?: boolean;
    selectRef: any;
    errors: FieldErrors;
}


const SelectBox:React.FC<SelctProps> = ({
    isOpen,
    label,
    value,
    onChange,
    options,
    disabled,
    selectRef,
}) => {
  return (
    <div className="z-[100]">
        <label
            className="
                block
                text-sm
                font-medium
                leading-6
            "
        >
            {label}
        </label>
        <div className="mt-2">
        {isOpen && (
            <Select 
                className="my-react-select-container"
                classNamePrefix="my-react-select"
                ref={selectRef}
                isDisabled={disabled}
                value={value}
                onChange={onChange}
                isMulti
                options={options}
                menuPortalTarget={document.body} 
                menuPosition='fixed'
                menuPlacement='auto'
                styles={{
                    menuPortal: (base) => ({
                        ...base,
                        zIndex: 9999,
                        color: 'black',
                    }),
                }}
            />)}
        </div>
    </div>
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
