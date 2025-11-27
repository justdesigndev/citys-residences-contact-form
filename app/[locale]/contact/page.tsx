import { getTranslations } from "next-intl/server"
import Image from "next/image"

import { ContactForm } from "@/components/form-contact"
import { Logo } from "@/components/icons"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { fetchCountries } from "@/lib/api/locations"
import { FormTranslations } from "@/types"

export default async function Contact({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "contact" })
  const countries = await fetchCountries()

  const formTranslations: FormTranslations = {
    inputs: {
      name: {
        placeholder: t("form.inputs.name.placeholder"),
        errors: { required: t("form.inputs.name.errors.required") },
      },
      surname: {
        placeholder: t("form.inputs.surname.placeholder"),
        errors: { required: t("form.inputs.surname.errors.required") },
      },
      phone: {
        placeholder: t("form.inputs.phone.placeholder"),
        errors: {
          min: t("form.inputs.phone.errors.min"),
          max: t("form.inputs.phone.errors.max"),
          required: t("form.inputs.phone.errors.required"),
        },
      },
      email: {
        placeholder: t("form.inputs.email.placeholder"),
        errors: {
          required: t("form.inputs.email.errors.required"),
          email: t("form.inputs.email.errors.email"),
        },
      },
      country: {
        placeholder: t("form.inputs.country.placeholder"),
        errors: {
          required: t("form.inputs.country.errors.required"),
        },
      },
      city: {
        placeholder: t("form.inputs.city.placeholder"),
        errors: {
          required: t("form.inputs.city.errors.required"),
        },
      },
      residenceType: {
        placeholder: t("form.inputs.residenceType.placeholder"),
        errors: {
          required: t("form.inputs.residenceType.errors.required"),
        },
      },
      howDidYouHearAboutUs: {
        placeholder: t("form.inputs.howDidYouHearAboutUs.placeholder"),
        errors: {
          required: t("form.inputs.howDidYouHearAboutUs.errors.required"),
        },
        options: {
          reference: t("form.inputs.howDidYouHearAboutUs.options.reference"),
          projectVisit: t("form.inputs.howDidYouHearAboutUs.options.projectVisit"),
          internetSocialMedia: t("form.inputs.howDidYouHearAboutUs.options.internetSocialMedia"),
          billboard: t("form.inputs.howDidYouHearAboutUs.options.billboard"),
          newspaperMagazine: t("form.inputs.howDidYouHearAboutUs.options.newspaperMagazine"),
        },
      },
      message: { placeholder: t("form.inputs.message.placeholder") },
      consent: {
        placeholder: t("form.inputs.consent.placeholder"),
        errors: {
          required: t("form.inputs.consent.errors.required"),
        },
      },
      consentElectronicMessage: {
        placeholder: t("form.inputs.consentElectronicMessage.placeholder"),
        errors: {
          required: t("form.inputs.consentElectronicMessage.errors.required"),
        },
      },
      consentSms: {
        placeholder: t("form.inputs.consentSms.placeholder"),
      },
      consentEmail: {
        placeholder: t("form.inputs.consentEmail.placeholder"),
      },
      consentPhone: {
        placeholder: t("form.inputs.consentPhone.placeholder"),
      },
    },
    submit: {
      default: t("form.submit.default"),
      sending: t("form.submit.sending"),
    },
    loading: t("form.loading"),
    messages: {
      error: t("form.messages.error"),
      success: t("form.messages.success"),
      successDialog: {
        title: t("form.messages.successDialog.title"),
        description: t("form.messages.successDialog.description"),
        button: t("form.messages.successDialog.button"),
      },
    },
  }

  // const video = (
  //   <Video
  //     primaryVideoUrl="https://player.vimeo.com/progressive_redirect/playback/1050026684/rendition/1080p/file.mp4?loc=external&log_user=0&signature=fda1ef0d723ecd6a77745792fc70643e9bc8e0cce3e4b8e3cf266d25613fb891"
  //     autoPlay
  //     loop
  //     muted
  //     playsInline
  //     className="w-full h-full object-cover"
  //   />
  // )

  return (
    <div className='flex flex-col xl:grid grid-cols-2'>
      <div className='px-4 lg:px-12 relative xl:fixed top-0 left-0 w-full bg-white z-10'>
        <div className='flex items-center justify-between xl:border-b border-bricky-brick-light py-4 xl:py-3'>
          <div className='opacity-0 pointer-events-none'>
            <LocaleSwitcher theme='dark' />
          </div>
          <div className='w-28 md:w-36'>
            <Logo fill='var(--bricky-brick)' />
          </div>
          <div>
            <LocaleSwitcher theme='dark' />
          </div>
        </div>
      </div>
      <div className='col-span-1 xl:h-screen flex flex-col'>
        <div className='flex flex-col items-center justify-center xl:items-start gap-6 lg:gap-8 px-4 lg:px-12 pb-8 lg:pb-0 xl:mt-40 pt-6 lg:pt-0'>
          <div className='xl:hidden col-span-1 -mx-4 lg:-mx-12 py-4 lg:py-8 px-4 lg:px-64 xl:px-32 flex items-center justify-center'>
            {locale === "tr" ? (
              <Image src='/img/yasama-sanati.png' alt='Contact Form Image' width={1500} height={1500} />
            ) : (
              <div className='w-full h-full flex items-center justify-center px-8 xl:px-20'>
                <Image src='/img/art-of-living.png' alt='Contact Form Image' width={1500} height={1500} />
              </div>
            )}
          </div>
          <h2 className='text-neutral-900 text-base lg:text-sm font-normal font-halenoir text-left lg:text-center xl:text-left leading-normal'>
            {t.rich("description", {
              br: () => <br className='hidden lg:block' />,
            })}
          </h2>
          <div className='lg:px-12 xl:px-0 pb-0 xl:pb-24'>
            <ContactForm translations={formTranslations} countries={countries} />
          </div>
        </div>
      </div>
      <div className='col-span-1 fixed top-0 right-0 w-1/2 h-full hidden xl:flex items-center px-16'>
        {locale === "tr" ? (
          <Image src='/img/yasama-sanati.png' alt='Contact Form Image' width={1500} height={1500} />
        ) : (
          <div className='w-full h-full flex items-center justify-center px-20'>
            <Image src='/img/art-of-living.png' alt='Contact Form Image' width={1500} height={1500} />
          </div>
        )}
      </div>
    </div>
  )
}
