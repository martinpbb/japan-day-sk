export const workshopAvailabilityUrl = 'https://api.japanday.sk/api/workshops/availability';

let availabilityPromise;

export function getWorkshopAvailability() {
  if (!availabilityPromise) {
    const request = fetch(workshopAvailabilityUrl)
      .then(response => {
        if (!response.ok) throw new Error('Workshop availability request failed');
        return response.json();
      })
      .then(result => {
        if (!result?.ok || !Array.isArray(result.data?.workshops)) throw new Error('Invalid workshop availability response');
        return result.data.workshops;
      });
    const requestWithCatch = request.catch(error => {
      if (availabilityPromise === requestWithCatch) availabilityPromise = undefined;
      throw error;
    });
    availabilityPromise = requestWithCatch;
  }
  return availabilityPromise;
}
