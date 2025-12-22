"use client"

import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { UseFormReturn } from "react-hook-form"
import { useLocale } from "next-intl"

import { PhoneInput } from "./phone-input"

export interface InternationalPhoneInputProps {
  form: UseFormReturn<any> // eslint-disable-line @typescript-eslint/no-explicit-any
  searchPlaceholder: string
}

export function InternationalPhoneInputComponent({ form, searchPlaceholder }: InternationalPhoneInputProps) {
  const locale = useLocale()

  return (
    <FormField
      control={form.control}
      name='phone'
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <PhoneInput
              locale={locale}
              searchPlaceholder={searchPlaceholder}
              value={field.value}
              onChange={(phone, countryCode) => {
                field.onChange(phone)
                form.setValue("countryCode", countryCode, {
                  shouldValidate: true,
                  shouldDirty: true,
                  shouldTouch: true,
                })
              }}
              phoneInputRef={field.ref}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
