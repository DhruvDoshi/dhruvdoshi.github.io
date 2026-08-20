const visitedPlaces = [
  { lat: 43.6532, lng: -79.3832, city: 'Toronto', country: 'Canada' },
  { lat: 19.076, lng: 72.8777, city: 'Mumbai', country: 'India' },
  { lat: 23.0225, lng: 72.5714, city: 'Ahmedabad', country: 'India' },
  { lat: 28.6139, lng: 77.209, city: 'Delhi', country: 'India' },
  { lat: 1.3521, lng: 103.8198, city: 'Singapore', country: 'Singapore' },
  { lat: 25.2048, lng: 55.2708, city: 'Dubai', country: 'United Arab Emirates' },
];

export const countryCount = new Set(visitedPlaces.map(({ country }) => country)).size;

export default visitedPlaces;
