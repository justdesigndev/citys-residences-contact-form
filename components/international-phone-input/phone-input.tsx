import React, { useEffect, useRef } from "react"
import { defaultCountries, parseCountry, usePhoneInput } from "react-international-phone"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PhoneInputProps {
  value: string
  onChange: (phone: string) => void
  phoneInputRef?: React.Ref<HTMLInputElement>
}

export const PhoneInput: React.FC<PhoneInputProps> = ({ value, onChange, phoneInputRef }) => {
  const phoneInput = usePhoneInput({
    defaultCountry: "tr",
    disableDialCodeAndPrefix: true,
    value,
    onChange: (data: { phone: string }) => {
      onChange(data.phone)
    },
  })

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (phoneInput.inputRef && inputRef.current) {
      phoneInput.inputRef.current = inputRef.current
    }
  }, [inputRef, phoneInput.inputRef])

  const countryOptions = (
    <>
      {defaultCountries.map((c) => {
        return (
          <SelectItem
            className="focus:bg-neutral-50 focus:text-neutral-950 cursor-pointer px-4 py-2 font-halenoir text-base md:text-sm"
            key={parseCountry(c).dialCode.toString()}
            value={parseCountry(c).dialCode.toString()}
          >
            {`${parseCountry(c).name.toString()} (+${parseCountry(c).dialCode.toString()})`}
            {/* {parseCountry(c).dialCode.toString()} */}
          </SelectItem>
        )
      })}
    </>
  )

  return (
    <div className="flex items-center gap-2">
      <Select
        onValueChange={(value) => {
          const selectedCountry = defaultCountries.find((c) => c[2] === value)
          if (selectedCountry) {
            phoneInput.setCountry(selectedCountry[1].toLowerCase())
          }
        }}
        value={phoneInput.country.dialCode.toString()}
      >
        <SelectTrigger className="w-24 h-10 rounded-md text-bricky-brick font-medium cursor-pointer text-base md:text-sm border border-bricky-brick-light">
          <SelectValue placeholder="Code">+{phoneInput.country.dialCode}</SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-white text-neutral-950 border border-bricky-brick-light rounded-md z-50">
          <SelectGroup>
            {countryOptions}
            {/* <SelectItem
              className="focus:bg-neutral-50 focus:text-neutral-950 cursor-pointer px-4 py-2 font-halenoir text-base md:text-sm"
              value={"90"}
            >
              90
            </SelectItem> */}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Input
        className="h-10 border border-bricky-brick-light rounded-md"
        placeholder={phoneInput.country.format?.toString().replace(/\S/g, "X") || "XXXXXXXXXX"}
        type="tel"
        value={phoneInput.inputValue}
        onChange={phoneInput.handlePhoneValueChange}
        ref={phoneInputRef}
        name="phone"
        autoComplete="tel"
      />
    </div>
  )
}
