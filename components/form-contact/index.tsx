"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ICountry, IState } from "country-state-city"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useLocale } from "next-intl"
import React, { useCallback, useEffect, useMemo, useRef } from "react"
import { Control, useForm } from "react-hook-form"
import { z } from "zod"

import { AnimatedButton } from "@/components/animated-button"
import { ConsentCheckboxes } from "@/components/consent-checkboxes"
import { DropdownMenuCheckboxesRef, DropdownMenuCheckboxesResidences } from "@/components/dropdown-menu-residences"
import { IconCheck, IconLoading } from "@/components/icons"
import { InternationalPhoneInputComponent } from "@/components/international-phone-input"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Combobox, ComboboxOption } from "@/components/ui/combobox"
import { Textarea } from "@/components/ui/textarea"
import { submitContactForm } from "@/lib/api/submit-contact-form"
import { isPhoneValid } from "@/lib/utils"
import { FormTranslations } from "@/types"

const getFormSchema = (translations: FormTranslations) =>
  z
    .object({
      name: z.string().min(2, { message: translations.inputs.name.errors.required }),
      surname: z.string().min(2, { message: translations.inputs.surname.errors.required }),
      countryCode: z.string(),
      phone: z.string(),
      email: z
        .string()
        .min(1, { message: translations.inputs.email.errors.required })
        .email({ message: translations.inputs.email.errors.email }),
      country: z.string().min(1, { message: translations.inputs.country.errors.required }),
      city: z.string().min(1, { message: translations.inputs.city.errors.required }),
      residenceType: z.string().min(1, { message: translations.inputs.residenceType.errors.required }),
      howDidYouHearAboutUs: z.string().min(1, { message: translations.inputs.howDidYouHearAboutUs.errors.required }),
      message: z.string(),
      consent: z.boolean().refine((data) => data === true, { message: translations.inputs.consent.errors.required }),
      consentElectronicMessage: z.boolean().refine((data) => data === true, {
        message: translations.inputs.consentElectronicMessage.errors.required,
      }),
      consentSms: z.boolean(),
      consentEmail: z.boolean(),
      consentPhone: z.boolean(),
    })
    .refine(
      (data) => {
        return isPhoneValid(data.phone, data.countryCode)
      },
      {
        message: translations.inputs.phone.errors.required,
        path: ["phone"],
      }
    )
    .refine(
      (data) => {
        if (data.consentElectronicMessage) {
          return data.consentSms || data.consentEmail || data.consentPhone
        }
        return true
      },
      {
        message: translations.inputs.consentElectronicMessage.errors.required,
        path: ["consentElectronicMessage"],
      }
    )

export type FormValues = z.infer<ReturnType<typeof getFormSchema>>

const commonInputStyles =
  "bg-transparent border-b border-bricky-brick rounded-none px-0 transition-colors duration-300 ease-in-out"

interface FormInputProps {
  name: keyof FormValues
  control: Control<FormValues>
  placeholder: string
  type?: string
  className?: string
}

const FormInput = ({ name, control, placeholder, type = "text", className }: FormInputProps) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem>
        <FormLabel className='text-neutral-950 font-normal leading-none block text-base md:text-sm'>
          {placeholder}
        </FormLabel>
        <FormControl>
          <Input
            placeholder={placeholder}
            type={type}
            {...field}
            value={field.value?.toString() ?? ""}
            className={`${commonInputStyles} h-10 px-2 lg:px-4 border border-bricky-brick-light rounded-md ${className}`}
            onChange={(e) => {
              const value = e.target.value
              if (name === "name" || name === "surname") {
                // Allow letters including Turkish characters
                const formattedValue = value.replace(/[^a-zA-ZğĞıİöÖüÜşŞçÇ\s]/g, "")
                field.onChange(formattedValue)
              } else {
                field.onChange(value)
              }
            }}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
)

interface UseFormMessage {
  message: { type: "success" | "error"; text: string } | null
  showMessage: (type: "success" | "error", text: string) => void
  clearMessage: () => void
}

const useFormMessage = (timeout = 5000): UseFormMessage => {
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null)

  const clearMessage = useCallback(() => setMessage(null), [])

  const showMessage = useCallback(
    (type: "success" | "error", text: string) => {
      setMessage({ type, text })
      setTimeout(clearMessage, timeout)
    },
    [timeout, clearMessage]
  )

  return { message, showMessage, clearMessage }
}

interface FormContactProps {
  translations: FormTranslations
  countries: ICountry[]
}

export function ContactForm({ translations, countries }: FormContactProps) {
  const { showMessage } = useFormMessage()
  const locale = useLocale()
  const [successDialog, setSuccessDialog] = React.useState(false)

  const residenceTypeDropdownRef = useRef<DropdownMenuCheckboxesRef>(null)

  const resetDropdowns = () => {
    residenceTypeDropdownRef.current?.reset()
  }

  // Helper to get localized country name
  const getLocalizedCountryName = useCallback(
    (code: string, name: string) => {
      try {
        const regionNames = new Intl.DisplayNames([locale], { type: "region" })
        return regionNames.of(code) || name
      } catch {
        return name
      }
    },
    [locale]
  )

  // Sort countries by localized name
  const sortedCountries = useMemo(() => {
    return [...countries].sort((a, b) => {
      const nameA = getLocalizedCountryName(a.isoCode, a.name)
      const nameB = getLocalizedCountryName(b.isoCode, b.name)
      return nameA.localeCompare(nameB, locale)
    })
  }, [countries, getLocalizedCountryName, locale])

  const form = useForm<FormValues>({
    resolver: zodResolver(getFormSchema(translations)),
    defaultValues: {
      name: "",
      surname: "",
      countryCode: "90", // Default to Turkey country code
      phone: "",
      email: "",
      country: "",
      city: "",
      residenceType: "",
      howDidYouHearAboutUs: "",
      message: "",
      consent: false,
      consentElectronicMessage: false,
      consentSms: false,
      consentEmail: false,
      consentPhone: false,
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  })

  const residenceTypeValue = form.watch("residenceType")

  // Track selected country code for API calls
  const [selectedCountryCode, setSelectedCountryCode] = React.useState<string>("")

  // Fetch states/cities using React Query
  const { data: statesData = [], isLoading: isLoadingCities } = useQuery<IState[]>({
    queryKey: ["states", selectedCountryCode],
    queryFn: async () => {
      const response = await fetch(`/api/cities?countryCode=${selectedCountryCode}`)
      if (!response.ok) {
        throw new Error("Failed to fetch states")
      }
      return response.json()
    },
    enabled: !!selectedCountryCode,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })

  // Sort states/cities alphabetically
  const sortedCities = useMemo(() => {
    return [...statesData].sort((a, b) => a.name.localeCompare(b.name, locale))
  }, [statesData, locale])

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const result = await submitContactForm(data, locale)
      return result
    },
    onSuccess: (result) => {
      if (result.success) {
        resetDropdowns()
        form.reset()
        form.clearErrors()
        setSuccessDialog(true)
      } else {
        showMessage("error", result.message)
      }
    },
    onError: (error: unknown) => {
      console.error("Form submission error:", error)

      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch")) {
          showMessage("error", "Network error occurred")
        } else {
          showMessage("error", error.message)
        }
      } else {
        showMessage("error", "An unexpected error occurred")
      }

      // Clear error message after 5 seconds
      setTimeout(() => {
        showMessage("error", "")
      }, 5000)
    },
  })

  const residenceTypeOptions = useMemo(
    () => [
      { id: "1+1", label: "1+1" },
      { id: "2+1", label: "2+1" },
      { id: "3+1", label: "3+1" },
      { id: "4+1", label: "4+1" },
      { id: "5+1", label: "5+1" },
      { id: "6+1", label: "6+1" },
    ],
    []
  )

  const handleResidenceType = useCallback(
    (id: string, checked: boolean) => {
      const option = residenceTypeOptions.find((opt) => opt.id === id)
      if (!option) return

      const currentValue = form.getValues("residenceType") || ""
      const currentLabels = currentValue ? currentValue.split(",") : []
      const newLabels = checked
        ? [...currentLabels, option.label].filter(Boolean)
        : currentLabels.filter((label) => label !== option.label)

      form.setValue("residenceType", newLabels.join(","), {
        shouldValidate: false,
      })

      form.trigger("residenceType")
    },
    [form, residenceTypeOptions]
  )

  useEffect(() => {
    form.register("phone", {
      onChange: () => form.trigger("phone"), // Validate phone on change
    })
    form.register("email", {
      onChange: () => form.trigger("email"), // Validate email on change
    })
  }, [form])

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
          className='font-halenoir space-y-6'
          noValidate
        >
          <div className='flex flex-col lg:grid grid-flow-col gap-6 lg:gap-4 md:grid-cols-2'>
            <FormInput control={form.control} name='name' placeholder={`${translations.inputs.name.placeholder}*`} />
            <FormInput
              control={form.control}
              name='surname'
              placeholder={`${translations.inputs.surname.placeholder}*`}
            />
          </div>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-4'>
            <div className='col-span-1 flex flex-col gap-1'>
              <FormLabel
                className='text-neutral-950 font-normal leading-none block text-base md:text-sm'
                htmlFor='phone'
              >
                {`${locale === "tr" ? "Telefon Numarası" : "Telephone Number"}*`}
              </FormLabel>
              <InternationalPhoneInputComponent form={form} />
              {/* Hidden field to ensure countryCode is properly tracked by react-hook-form */}
              <FormField
                control={form.control}
                name='countryCode'
                render={({ field }) => <input type='hidden' {...field} />}
              />
            </div>
            <div className='col-span-1'>
              <FormInput
                control={form.control}
                name='email'
                type='email'
                placeholder={`${locale === "tr" ? "E-Posta" : "Email"}*`}
                className='col-span-1 md:col-span-1'
              />
            </div>
          </div>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-4'>
            <div className='space-y-1'>
              <FormField
                control={form.control}
                name='country'
                render={({ field }) => {
                  // Find Turkey and separate it as priority option
                  const turkeyCountry = sortedCountries.find((country) => country.isoCode === "TR")
                  const turkeyOption: ComboboxOption | undefined = turkeyCountry
                    ? {
                        value: getLocalizedCountryName(turkeyCountry.isoCode, turkeyCountry.name),
                        label: getLocalizedCountryName(turkeyCountry.isoCode, turkeyCountry.name),
                      }
                    : undefined

                  // Convert countries to ComboboxOption format, excluding Turkey
                  const countryOptions: ComboboxOption[] = sortedCountries
                    .filter((country) => country.isoCode !== "TR")
                    .map((country) => ({
                      value: getLocalizedCountryName(country.isoCode, country.name),
                      label: getLocalizedCountryName(country.isoCode, country.name),
                    }))

                  return (
                    <FormItem>
                      {/* <FormLabel className='text-neutral-950 font-normal leading-none block text-base md:text-sm'>
                        {`${translations.inputs.country.placeholder}*`}
                      </FormLabel> */}
                      <FormControl>
                        <Combobox
                          options={countryOptions}
                          priorityOptions={turkeyOption ? [turkeyOption] : []}
                          value={field.value}
                          onValueChange={(value) => {
                            // Find the country to get its code (check both priority and regular options)
                            const country = sortedCountries.find(
                              (c) => getLocalizedCountryName(c.isoCode, c.name) === value
                            )
                            if (country) {
                              setSelectedCountryCode(country.isoCode)
                            }
                            field.onChange(value)
                            form.setValue("city", "") // Reset city when country changes
                          }}
                          placeholder={`${translations.inputs.country.placeholder}*`}
                          searchPlaceholder={translations.inputs.country.placeholder || "Search country..."}
                          emptyMessage='No country found.'
                          triggerClassName='h-10 w-full border border-bricky-brick-light px-2 lg:px-4 rounded-md text-base md:text-sm'
                          contentClassName='border-bricky-brick-light max-h-[300px]'
                          itemClassName='text-base md:text-sm cursor-pointer hover:bg-bricky-brick-light hover:text-black focus:bg-bricky-brick-light focus:text-black'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </div>
            <div className='space-y-1'>
              <FormField
                control={form.control}
                name='city'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!selectedCountryCode || isLoadingCities}
                      >
                        <SelectTrigger className='h-10 w-full border border-bricky-brick-light px-2 lg:px-4 rounded-md text-base md:text-sm disabled:opacity-50'>
                          <SelectValue
                            placeholder={
                              isLoadingCities ? translations.loading : `${translations.inputs.city.placeholder}*`
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className='w-[var(--radix-select-trigger-width)] border-bricky-brick-light max-h-[300px]'>
                          {sortedCities.map((city) => (
                            <SelectItem
                              key={city.name.toString()}
                              value={city.name.toString()}
                              className='text-base md:text-sm cursor-pointer hover:bg-bricky-brick-light hover:text-black focus:bg-bricky-brick-light focus:text-black'
                            >
                              {city.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <div className='flex flex-col lg:grid grid-cols-2 gap-6 lg:gap-4'>
            <div className='space-y-1'>
              <FormField
                control={form.control}
                name='residenceType'
                render={() => (
                  <FormItem>
                    <FormControl>
                      <DropdownMenuCheckboxesResidences
                        placeholder={`${translations.inputs.residenceType.placeholder}*`}
                        selectedItems={residenceTypeValue !== "" ? residenceTypeValue.split(",") : []}
                        options={residenceTypeOptions}
                        onChange={(id, checked) => {
                          handleResidenceType(id, checked)
                        }}
                        ref={residenceTypeDropdownRef}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='space-y-1'>
              <FormField
                control={form.control}
                name='howDidYouHearAboutUs'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className='h-10 w-full border border-bricky-brick-light px-2 lg:px-4 rounded-md text-base md:text-sm'>
                          <SelectValue placeholder={`${translations.inputs.howDidYouHearAboutUs.placeholder}*`} />
                        </SelectTrigger>
                        <SelectContent className='w-[var(--radix-select-trigger-width)] border-bricky-brick-light'>
                          {Object.entries(translations.inputs.howDidYouHearAboutUs.options).map(([key, label]) => (
                            <SelectItem
                              key={key}
                              value={label}
                              className='text-base md:text-sm cursor-pointer hover:bg-bricky-brick-light hover:text-black focus:bg-bricky-brick-light focus:text-black'
                            >
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <div className='grid grid-flow-col'>
            <FormField
              control={form.control}
              name='message'
              render={({ field }) => (
                <FormItem className='space-y-1 pt-2'>
                  <FormLabel className='text-neutral-950 font-normal leading-none block text-base md:text-sm'>
                    {translations.inputs.message.placeholder}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className={`${commonInputStyles} min-h-[100px] p-3 rounded-md border border-bricky-brick-light resize-none`}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <ConsentCheckboxes form={form} control={form.control} />
          <button type='submit' disabled={mutation.isPending} className='flex relative'>
            <AnimatedButton text={translations.submit.default} />
            {mutation.isPending && (
              <span className='absolute top-1/2 -right-4 -translate-y-1/2 translate-x-full flex items-center justify-center w-6 h-6'>
                <IconLoading fill='var(--bricky-brick)' />
              </span>
            )}
          </button>
        </form>
      </Form>
      <Dialog open={successDialog} onOpenChange={setSuccessDialog}>
        <DialogContent className='font-halenoir flex flex-col items-center justify-center py-8'>
          <DialogHeader>
            <DialogTitle className='text-neutral-950 font-medium leading-none text-base lg:text-2xl flex flex-col items-center gap-2 text-center mb-2'>
              <div className='w-9 h-9 flex items-center justify-center'>
                <IconCheck />
              </div>
              {translations.messages.successDialog.title}
            </DialogTitle>
            <DialogDescription className='text-neutral-950 font-normal leading-none block text-sm lg:text-base text-center pb-10'>
              {translations.messages.successDialog.description}
            </DialogDescription>
            <DialogClose asChild>
              <button className='text-neutral-950 underline text-sm lg:text-base' type='button'>
                {translations.messages.successDialog.button}
              </button>
            </DialogClose>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  )
}
