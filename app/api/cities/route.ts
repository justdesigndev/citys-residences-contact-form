import { NextRequest, NextResponse } from "next/server"
import { State } from "country-state-city"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const countryCode = searchParams.get("countryCode")

  if (!countryCode || typeof countryCode !== "string") {
    return NextResponse.json({ error: "Invalid country code" }, { status: 400 })
  }

  try {
    const states = State.getStatesOfCountry(countryCode)
    return NextResponse.json(states)
  } catch (error) {
    console.error("Error fetching states:", error)
    return NextResponse.json({ error: "Failed to fetch states" }, { status: 500 })
  }
}
