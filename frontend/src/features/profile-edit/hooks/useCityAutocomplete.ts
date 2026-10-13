import { useState, useEffect } from "react";
import { nominatimApi } from "../../../shared/api/nominatimApi.ts";
import type { CitySuggestion } from "../model/types.ts";

export function useCityAutocomplete(
  initialCity = "",
  currentProfileCity = "",
) {
  const [citySearch, setCitySearch] = useState(initialCity);
  const [prevInitialCity, setPrevInitialCity] = useState(initialCity);
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  if (initialCity !== prevInitialCity) {
    setPrevInitialCity(initialCity);
    setCitySearch(initialCity);
  }

  const displayedSuggestions =
    citySearch.length < 3 || citySearch === currentProfileCity ? [] : suggestions;

  useEffect(() => {
    if (citySearch.length < 3 || citySearch === currentProfileCity) {
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const cities = await nominatimApi.searchCities(citySearch);
        setSuggestions(cities);
      } catch (error) {
        console.error("Error fetching cities:", error);
      } finally {
        setIsSearching(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [citySearch, currentProfileCity]);

  const selectCity = (suggestion: CitySuggestion) => {
    setCitySearch(suggestion.display_name);
    setSuggestions([]);
  };

  const clearSuggestions = () => {
    setSuggestions([]);
  };

  return {
    citySearch,
    setCitySearch,
    suggestions: displayedSuggestions,
    isSearching,
    selectCity,
    clearSuggestions,
  };
}
