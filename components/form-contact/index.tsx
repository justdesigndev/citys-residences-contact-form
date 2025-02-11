"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useLenis } from "lenis/react"
import { AnimatePresence, motion } from "motion/react"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { Control, useForm } from "react-hook-form"
import { z } from "zod"

import { AnimatedButton } from "@/components/animated-button"
import { DropdownMenuCheckboxes } from "@/components/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { countryPhoneCodes } from "@/lib/constants"
import { FormTranslations } from "@/types"
import { IconLoading } from "../icons"

const getFormSchema = (translations: FormTranslations) =>
  z.object({
    name: z.string().min(1, { message: translations.inputs.name.error }),
    surname: z.string().min(1, { message: translations.inputs.surname.error }),
    countryCode: z.string().min(1, { message: "Country code is required" }),
    phone: z
      .string()
      .min(1, { message: translations.inputs.phone.error })
      .regex(/^\+?[1-9]\d{1,14}$/, { message: translations.inputs.phone.error })
      .refine((val) => /^\+?[0-9]+$/.test(val), { message: translations.inputs.phone.error }),
    email: z.string().email({ message: translations.inputs.email.error }),
    residenceType: z.string().min(1, { message: translations.inputs.residenceType.error }),
    howDidYouHearAboutUs: z.string().min(1, { message: translations.inputs.howDidYouHearAboutUs.error }),
    message: z.string(),
    consent: z.boolean().refine((data) => data === true, { message: translations.inputs.consent.error }),
  })

type FormValues = z.infer<ReturnType<typeof getFormSchema>>

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
        <FormControl>
          <Input
            placeholder={placeholder}
            type={type}
            {...field}
            value={field.value?.toString() ?? ""}
            className={`${commonInputStyles} py-4 px-2 border-bricky-brick-light ${className}`}
            inputMode={name === "phone" ? "tel" : undefined}
            pattern={name === "phone" ? "\\+?[0-9]*" : undefined}
            onChange={(e) => {
              const value = e.target.value
              if (name === "phone") {
                // Allow only numbers and '+' sign
                const formattedValue = value.replace(/[^\d+]/g, "")
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

// const FormSelect = ({
//   name,
//   control,
//   placeholder,
//   options,
// }: {
//   name: keyof FormValues
//   control: Control<FormValues>
//   placeholder: string
//   options: { value: string; label: string }[]
// }) => (
//   <FormField
//     control={control}
//     name={name}
//     render={({ field }) => (
//       <FormItem>
//         <FormControl>
//           <Select onValueChange={field.onChange} value={field.value?.toString() || ""}>
//             <SelectTrigger className="h-11 text-base md:text-sm border border-bricky-brick-light rounded-md text-neutral-950 cursor-pointer px-2 lg:px-4">
//               <SelectValue placeholder={placeholder} />
//             </SelectTrigger>
//             <SelectContent className="text-neutral-950">
//               <SelectGroup>
//                 {options.map((option) => (
//                   <SelectItem
//                     key={option.value}
//                     className="focus:bg-neutral-50 focus:text-neutral-950 cursor-pointer"
//                     value={option.value}
//                   >
//                     {option.label}
//                   </SelectItem>
//                 ))}
//               </SelectGroup>
//             </SelectContent>
//           </Select>
//         </FormControl>
//         <FormMessage />
//       </FormItem>
//     )}
//   />
// )

interface FormErrorMessageProps {
  message?: string
}

const FormErrorMessage = ({ message }: FormErrorMessageProps) => {
  if (!message) return null
  return <span className="font-halenoir text-red-500 text-[0.8rem] mt-2 font-medium">{message}</span>
}

interface FormContactProps {
  translations: FormTranslations
}

export function ContactForm({ translations }: FormContactProps) {
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const lenis = useLenis()
  const t = useTranslations()
  const locale = useLocale()

  const form = useForm<FormValues>({
    resolver: zodResolver(getFormSchema(translations)),
    defaultValues: {
      name: "",
      surname: "",
      countryCode: "+90",
      phone: "",
      email: "",
      residenceType: "",
      howDidYouHearAboutUs: "",
      message: "",
      consent: false,
    },
  })

  // Generic function to get any UTM parameter
  const getUtmParameter = (param: string) => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.get(param) || ""
    }
    return ""
  }

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      try {
        const formData = new FormData()
        // Convert all form values to FormData
        Object.entries(data).forEach(([key, value]) => {
          formData.append(key, value?.toString() ?? "")
        })

        // Add current language to formData
        formData.append("language", locale)

        // Add UTM parameters to formData
        formData.append("utm_source", getUtmParameter("utm_source"))
        formData.append("utm_medium", getUtmParameter("utm_medium"))
        formData.append("utm_campaign", getUtmParameter("utm_campaign"))

        // Add complete URL to formData
        formData.append("url", window.location.href)

        const response = await fetch("https://crm.citysresidences.com/api/lead.php", {
          method: "POST",
          body: formData,
        })

        const result = await response.json()

        if (!response.ok) {
          setMessage({ type: "error", text: result.message || "Failed to submit form" })
          throw new Error(result.message || "Failed to submit form")
        }

        setMessage({ type: "success", text: result.message })
        return result
      } catch (error) {
        console.error("Form submission error:", error)
        throw error
      }
    },
    onSuccess: () => {
      form.reset()
      form.clearErrors()

      // Clear success message after 5 seconds
      setTimeout(() => {
        setMessage(null)
      }, 5000)
    },
    onError: () => {
      // Clear error message after 5 seconds
      setTimeout(() => {
        setMessage(null)
      }, 5000)
    },
  })

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data)
  }

  useEffect(() => {
    lenis?.resize()
  }, [form.formState, lenis])

  const residenceTypeOptions = [
    { id: "1+1", label: "1+1" },
    { id: "2+1", label: "2+1" },
    { id: "3+1", label: "3+1" },
    { id: "4+1", label: "4+1" },
    { id: "5+1", label: "5+1" },
    { id: "6+1", label: "6+1" },
  ]

  const howDidYouHearAboutUsOptions = [
    { id: "arkadas-tavsiyesi", label: translations.inputs.howDidYouHearAboutUs.options["arkadas-tavsiyesi"] },
    { id: "internet", label: translations.inputs.howDidYouHearAboutUs.options.internet },
    { id: "sosyal-medya", label: translations.inputs.howDidYouHearAboutUs.options["sosyal-medya"] },
    { id: "acikhava-reklamlari", label: translations.inputs.howDidYouHearAboutUs.options["acikhava-reklamlari"] },
  ]

  const residenceTypeValue = form.watch("residenceType")
  const howDidYouHearAboutUsValue = form.watch("howDidYouHearAboutUs")

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="font-halenoir space-y-6 lg:space-y-8">
        <div className="flex flex-col lg:grid grid-flow-col gap-6 lg:gap-4 md:grid-cols-2">
          <FormInput control={form.control} name="name" placeholder={translations.inputs.name.placeholder} />
          <FormInput control={form.control} name="surname" placeholder={translations.inputs.surname.placeholder} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-4">
          <div className="grid grid-cols-12 gap-2 items-start col-span-1">
            <div className="col-start-1 col-end-4 row-start-1 row-end-2 z-20">
              <FormField
                control={form.control}
                name="countryCode"
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={"+90"}>
                        <SelectTrigger className="h-9 rounded-none text-neutral-950 cursor-pointer text-base md:text-sm">
                          <SelectValue placeholder={field.value || "ÜLKE KODU"}>{field.value}</SelectValue>
                        </SelectTrigger>
                        <SelectContent className="text-neutral-950">
                          <SelectGroup>
                            {countryPhoneCodes[locale as keyof typeof countryPhoneCodes].map((country, index) => (
                              <SelectItem
                                key={index}
                                className="focus:bg-neutral-50 focus:text-neutral-950 cursor-pointer"
                                value={country.code}
                              >
                                {country.name} ({country.code})
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="col-start-1 col-end-13 row-start-1 row-end-2">
              <FormInput
                className="pl-24"
                control={form.control}
                name="phone"
                type="tel"
                placeholder={translations.inputs.phone.placeholder}
              />
            </div>
          </div>
          <FormInput
            control={form.control}
            name="email"
            type="email"
            placeholder={translations.inputs.email.placeholder}
            className="col-span-1 md:col-span-1"
          />
        </div>
        <div className="flex flex-col lg:grid grid-cols-2 gap-6 lg:gap-4">
          <div>
            <DropdownMenuCheckboxes
              triggerText={
                residenceTypeValue
                  ? residenceTypeValue.split(",").join(", ")
                  : translations.inputs.residenceType.placeholder
              }
              options={residenceTypeOptions}
              onChange={(id, checked) => {
                // Get current value
                const currentValue = form.getValues("residenceType") || ""

                // Convert to array of IDs
                const currentIds = currentValue ? currentValue.split(",") : []

                // Add or remove the ID based on checked state
                const newIds = checked ? [...currentIds, id].filter(Boolean) : currentIds.filter((val) => val !== id)

                // Join back to comma-separated string and update form
                form.setValue("residenceType", newIds.join(","))
              }}
            />
            <FormErrorMessage message={form.formState.errors.residenceType?.message} />
          </div>
          <div>
            <DropdownMenuCheckboxes
              triggerText={
                howDidYouHearAboutUsValue
                  ? howDidYouHearAboutUsValue
                      .split(",")
                      .map((id) => howDidYouHearAboutUsOptions.find((option) => option.id === id)?.label)
                      .join(", ")
                  : translations.inputs.howDidYouHearAboutUs.placeholder
              }
              options={howDidYouHearAboutUsOptions}
              onChange={(id, checked) => {
                // Get current value
                const currentValue = form.getValues("howDidYouHearAboutUs") || ""

                // Convert to array of IDs
                const currentIds = currentValue ? currentValue.split(",") : []

                // Add or remove the ID based on checked state
                const newIds = checked ? [...currentIds, id].filter(Boolean) : currentIds.filter((val) => val !== id)

                // Join back to comma-separated string and update form
                form.setValue("howDidYouHearAboutUs", newIds.join(","))
              }}
            />
            <FormErrorMessage message={form.formState.errors.howDidYouHearAboutUs?.message} />
          </div>
        </div>
        <div className="grid grid-flow-col">
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem className="space-y-0 pt-2">
                <FormLabel className="text-neutral-950 font-normal pl-2 lg:pl-4 leading-none block -mb-8 lg:-mb-8 text-base md:text-sm">
                  {translations.inputs.message.placeholder}
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    className={`${commonInputStyles} min-h-[140px] p-2 pt-8 lg:pt-8 rounded-md border border-bricky-brick-light resize-none`}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div>
          <FormField
            control={form.control}
            name="consent"
            render={({ field }) => (
              <FormItem>
                <div className="flex flex-row gap-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      className="border-neutral-900 data-[state=checked]:bg-neutral-900"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-neutral-950 font-light leading-snug cursor-pointer max-w-[90%]">
                    {t.rich("contact.form.inputs.consent.placeholder", {
                      Clarification: (chunks) => (
                        <a
                          target="_blank"
                          rel="norefferer noopener"
                          href="/pdf/kvkk-aydinlatma-metni.pdf"
                          className="text-neutral-950 underline"
                        >
                          {chunks}
                        </a>
                      ),
                      ExplicitConsent: (chunks) => (
                        <a
                          target="_blank"
                          rel="norefferer noopener"
                          href="/pdf/acik-riza-metni.pdf"
                          className="text-neutral-950 underline"
                        >
                          {chunks}
                        </a>
                      ),
                    })}
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <button type="submit" disabled={mutation.isPending} className="flex relative">
          <AnimatedButton text={translations.submit.default} />
          {mutation.isPending && (
            <span className="absolute top-1/2 -right-4 -translate-y-1/2 translate-x-full flex items-center justify-center w-6 h-6">
              <IconLoading fill="var(--bricky-brick)" />
            </span>
          )}
        </button>
      </form>
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex items-center justify-center py-6 my-4 ${
              message.type === "success" ? "text-green-700" : "text-red-700"
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>
    </Form>
  )
}
