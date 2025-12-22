import React, { useEffect, useMemo, useRef } from "react"
import { defaultCountries, parseCountry, usePhoneInput } from "react-international-phone"

import { Input } from "@/components/ui/input"
import { Combobox, ComboboxOption } from "@/components/ui/combobox"

interface PhoneInputProps {
  locale?: string
  searchPlaceholder?: string
  value: string
  onChange: (phone: string, countryCode: string) => void
  phoneInputRef?: React.Ref<HTMLInputElement>
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  locale,
  searchPlaceholder,
  value,
  onChange,
  phoneInputRef,
}) => {
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

  // Parse all countries and sort them alphabetically
  const parsedCountries = useMemo(() => {
    return defaultCountries.map((c) => parseCountry(c)).sort((a, b) => a.name.localeCompare(b.name))
  }, [])

  const regionNames = useMemo(() => {
    if (!locale) return null

    try {
      return new Intl.DisplayNames([locale], { type: "region" })
    } catch {
      return null
    }
  }, [locale])

  const getLocalizedCountryName = (iso2: string, fallback: string) => {
    const standardIso = iso2?.toUpperCase() ?? iso2
    const localized = regionNames?.of(standardIso)
    return localized || fallback
  }

  // Find Turkey and create priority option
  const turkeyCountry = useMemo(() => {
    return parsedCountries.find((c) => c.iso2 === "tr")
  }, [parsedCountries])

  // Create a label for a country (used for both display and as value for filtering)
  const getCountryLabel = (country: { iso2: string; name: string; dialCode: string | number }) => {
    const name = getLocalizedCountryName(country.iso2, country.name)
    return `${name} (+${country.dialCode})`
  }

  const turkeyOption: ComboboxOption | undefined = turkeyCountry
    ? {
        value: getCountryLabel(turkeyCountry),
        label: getCountryLabel(turkeyCountry),
      }
    : undefined

  // Create country options excluding Turkey
  const countryOptions: ComboboxOption[] = useMemo(() => {
    return parsedCountries
      .filter((c) => c.iso2 !== "tr")
      .map((country) => ({
        value: getCountryLabel(country),
        label: getCountryLabel(country),
      }))
  }, [parsedCountries, regionNames])

  // Get current country's label for the combobox value
  const currentCountryLabel = useMemo(() => {
    const current = parsedCountries.find((c) => c.iso2 === phoneInput.country.iso2)
    return current ? getCountryLabel(current) : ""
  }, [parsedCountries, phoneInput.country.iso2, regionNames])

  // Find country by label to get iso2 code
  const findCountryByLabel = (label: string) => {
    return parsedCountries.find((c) => getCountryLabel(c) === label)
  }

  return (
    <div className='flex items-center gap-2'>
      <Combobox
        options={countryOptions}
        priorityOptions={turkeyOption ? [turkeyOption] : []}
        value={currentCountryLabel}
        onValueChange={(selectedLabel) => {
          if (selectedLabel) {
            const country = findCountryByLabel(selectedLabel)
            if (country) {
              phoneInput.setCountry(country.iso2)
              // Update country code when country changes
              setTimeout(() => {
                const dialCode = phoneInput.country.dialCode.toString()
                const cleanPhone = cleanPhoneNumber(phoneInput.inputValue, dialCode)
                onChange(cleanPhone, dialCode)
              }, 0)
            }
          }
        }}
        placeholder='Code'
        searchPlaceholder={searchPlaceholder ?? "Search country..."}
        emptyMessage='No country found.'
        triggerClassName='w-24 h-10 rounded-md text-bricky-brick font-medium cursor-pointer text-base md:text-sm border border-bricky-brick-light'
        contentClassName='border-bricky-brick-light max-h-[300px] min-w-[280px]'
        itemClassName='text-base md:text-sm cursor-pointer hover:bg-bricky-brick-light hover:text-black focus:bg-bricky-brick-light focus:text-black'
        displayValue={`+${phoneInput.country.dialCode}`}
      />
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
