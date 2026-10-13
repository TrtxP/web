export interface NominatimCityResult {
  display_name: string;
  lat: string;
  lon: string;
}

export const nominatimApi = {
  searchCities: async (query: string): Promise<NominatimCityResult[]> => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`,
    );
    const data = (await response.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
    }>;

    return data.map((item) => ({
      display_name: item.display_name,
      lat: item.lat,
      lon: item.lon,
    }));
  },
};

