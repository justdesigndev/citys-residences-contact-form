import Contact from "./contact/page"

export default function Page({ params }: { params: { locale: string } }) {
  return <Contact params={params} />
}
