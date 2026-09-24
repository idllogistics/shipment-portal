// Universal links: on a phone these open the Google Maps / Waze app if
// installed, otherwise the website. Locations are free text, so both apps
// resolve them with their own search.
export function googleMapsUrl(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`;
}

export function wazeUrl(address: string) {
  return `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;
}
