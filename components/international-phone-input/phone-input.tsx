import React, { useEffect, useRef } from "react"
import { defaultCountries, parseCountry, usePhoneInput } from "react-international-phone"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PhoneInputProps {
  value: string
  onChange: (phone: string, countryCode: string) => void
  phoneInputRef?: React.Ref<HTMLInputElement>
}

export const PhoneInput: React.FC<PhoneInputProps> = ({ value, onChange, phoneInputRef }) => {
  const cleanPhoneNumber = (phone: string, dialCode: string): string => {
    // Remove the country code and + prefix from the phone number
    if (phone.startsWith(`+${dialCode}`)) {
      return phone.substring(`+${dialCode}`.length)
    } else if (phone.startsWith(dialCode)) {
      return phone.substring(dialCode.length)
    }
    return phone
  }

  const phoneInput = usePhoneInput({
    defaultCountry: "tr",
    disableDialCodeAndPrefix: true,
    value,
    onChange: (data: { phone: string }) => {
      // Get country code without + prefix
      const dialCode = phoneInput.country.dialCode.toString()
      const cleanPhone = cleanPhoneNumber(data.phone, dialCode)
      onChange(cleanPhone, dialCode)
    },
  })

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (phoneInput.inputRef && inputRef.current) {
      phoneInput.inputRef.current = inputRef.current
    }
  }, [inputRef, phoneInput.inputRef])

  // Set initial country code
  useEffect(() => {
    const dialCode = phoneInput.country.dialCode.toString()
    const cleanPhone = cleanPhoneNumber(phoneInput.inputValue, dialCode)
    onChange(cleanPhone, dialCode)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const countryOptions = (
    <>
      {defaultCountries.map((c) => {
        const country = parseCountry(c)
        return (
          <SelectItem
            className='focus:bg-neutral-50 focus:text-neutral-950 cursor-pointer px-4 py-2 font-halenoir text-base md:text-sm'
            key={country.iso2}
            value={country.iso2}
          >
            {`${country.name} (+${country.dialCode})`}
            {/* {country.dialCode} */}
          </SelectItem>
        )
      })}
    </>
  )

  return (
    <div className='flex items-center gap-2'>
      <Select
        onValueChange={(value) => {
          if (value) {
            phoneInput.setCountry(value)
            // Update country code when country changes
            setTimeout(() => {
              const dialCode = phoneInput.country.dialCode.toString()
              const cleanPhone = cleanPhoneNumber(phoneInput.inputValue, dialCode)
              onChange(cleanPhone, dialCode)
            }, 0)
          }
        }}
        value={phoneInput.country.iso2}
      >
        <SelectTrigger className='w-24 h-10 rounded-md text-bricky-brick font-medium cursor-pointer text-base md:text-sm border border-bricky-brick-light'>
          <SelectValue placeholder='Code'>+{phoneInput.country.dialCode}</SelectValue>
        </SelectTrigger>
        <SelectContent className='bg-white text-neutral-950 border border-bricky-brick-light rounded-md z-50'>
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
        className='h-10 border border-bricky-brick-light rounded-md'
        placeholder={phoneInput.country.format?.toString().replace(/\S/g, "X") || "XXXXXXXXXX"}
        type='tel'
        value={phoneInput.inputValue}
        onChange={phoneInput.handlePhoneValueChange}
        ref={phoneInputRef}
        name='phone'
        autoComplete='tel'
      />
    </div>
  )
}
