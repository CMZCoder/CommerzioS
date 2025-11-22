export interface AddressValidationResult {
  isValid: boolean;
  formattedAddress?: string;
  city?: string;
  postalCode?: string;
  canton?: string;
  message?: string;
}

export async function validateSwissAddress(address: string): Promise<AddressValidationResult> {
  if (!address || address.trim().length === 0) {
    return {
      isValid: false,
      message: "Address is required",
    };
  }

  const swissKeywords = [
    "Switzerland", "Schweiz", "Suisse", "Svizzera", "CH-",
    "Zürich", "Zurich", "Geneva", "Genève", "Basel", "Bern", "Berne",
    "Lausanne", "Lucerne", "Luzern", "St. Gallen", "Sankt Gallen"
  ];
  
  const addressLower = address.toLowerCase();
  const hasSwissKeyword = swissKeywords.some(keyword => 
    addressLower.includes(keyword.toLowerCase())
  );

  const swissPostalCodePattern = /\b\d{4}\b/;
  const hasSwissPostalCode = swissPostalCodePattern.test(address);

  if (!hasSwissKeyword && !hasSwissPostalCode) {
    return {
      isValid: false,
      message: "Only Swiss addresses are accepted. Please include a Swiss city, postal code, or 'Switzerland'.",
    };
  }

  return {
    isValid: true,
    formattedAddress: address,
    message: "Address appears to be in Switzerland",
  };
}

export async function validateMultipleSwissAddresses(addresses: string[]): Promise<{
  allValid: boolean;
  results: AddressValidationResult[];
  invalidAddresses: string[];
}> {
  const results = await Promise.all(
    addresses.map(addr => validateSwissAddress(addr))
  );

  const invalidAddresses = addresses.filter((_, index) => !results[index].isValid);

  return {
    allValid: results.every(r => r.isValid),
    results,
    invalidAddresses,
  };
}
