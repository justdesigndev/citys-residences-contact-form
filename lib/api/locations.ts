"use server"

import { Country, State, ICountry, IState } from "country-state-city"

export async function fetchCountries(): Promise<ICountry[]> {
  try {
    const countries = Country.getAllCountries()
    return countries
  } catch (error) {
    console.error("Error fetching countries:", error)
    return []
  }
}

export async function fetchStates(countryCode: string): Promise<IState[]> {
  try {
    // Ensure countryCode is valid before calling the library
    if (!countryCode || typeof countryCode !== "string") {
      console.warn("Invalid country code provided to fetchStates")
      return []
    }

    const states = State.getStatesOfCountry(countryCode)
    return states
  } catch (error) {
    console.error("Error fetching states:", error)
    return []
  }
}
