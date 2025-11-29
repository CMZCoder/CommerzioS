import { describe, it, expect } from "vitest";
import {
  resolveServiceCoordinates,
  calculateDistance,
  buildDirectionsUrl,
} from "./coordinates";

describe("resolveServiceCoordinates", () => {
  it("should return service coordinates when both service and owner have coordinates", () => {
    const service = {
      locationLat: "47.3769",
      locationLng: "8.5417",
      owner: {
        locationLat: 46.2044,
        locationLng: 6.1432,
      },
    };

    const result = resolveServiceCoordinates(service);

    expect(result).toEqual({ lat: 47.3769, lng: 8.5417 });
  });

  it("should return owner coordinates when service has no coordinates", () => {
    const service = {
      locationLat: null,
      locationLng: null,
      owner: {
        locationLat: 46.2044,
        locationLng: 6.1432,
      },
    };

    const result = resolveServiceCoordinates(service);

    expect(result).toEqual({ lat: 46.2044, lng: 6.1432 });
  });

  it("should return null when neither service nor owner have coordinates", () => {
    const service = {
      locationLat: null,
      locationLng: null,
      owner: {
        locationLat: null,
        locationLng: null,
      },
    };

    const result = resolveServiceCoordinates(service);

    expect(result).toBeNull();
  });

  it("should return null for null service", () => {
    expect(resolveServiceCoordinates(null)).toBeNull();
  });

  it("should return null for undefined service", () => {
    expect(resolveServiceCoordinates(undefined)).toBeNull();
  });

  it("should handle service without owner property", () => {
    const service = {
      locationLat: "47.3769",
      locationLng: "8.5417",
    };

    const result = resolveServiceCoordinates(service);

    expect(result).toEqual({ lat: 47.3769, lng: 8.5417 });
  });

  it("should handle invalid coordinate strings", () => {
    const service = {
      locationLat: "invalid",
      locationLng: "invalid",
      owner: {
        locationLat: 46.2044,
        locationLng: 6.1432,
      },
    };

    const result = resolveServiceCoordinates(service);

    // Should fall back to owner coordinates when service coords are invalid
    expect(result).toEqual({ lat: 46.2044, lng: 6.1432 });
  });
});

describe("calculateDistance", () => {
  it("should calculate distance between Zurich and Geneva (~224km)", () => {
    // Zurich coordinates
    const zurichLat = 47.3769;
    const zurichLng = 8.5417;
    // Geneva coordinates
    const genevaLat = 46.2044;
    const genevaLng = 6.1432;

    const distance = calculateDistance(
      zurichLat,
      zurichLng,
      genevaLat,
      genevaLng
    );

    // Expected distance is approximately 224km
    expect(distance).toBeGreaterThan(220);
    expect(distance).toBeLessThan(230);
  });

  it("should return 0 for same coordinates", () => {
    const lat = 47.3769;
    const lng = 8.5417;

    const distance = calculateDistance(lat, lng, lat, lng);

    expect(distance).toBe(0);
  });

  it("should calculate distance between Bern and Basel (~85km)", () => {
    // Bern coordinates
    const bernLat = 46.9481;
    const bernLng = 7.4474;
    // Basel coordinates
    const baselLat = 47.5596;
    const baselLng = 7.5886;

    const distance = calculateDistance(bernLat, bernLng, baselLat, baselLng);

    // Expected distance is approximately 85km
    expect(distance).toBeGreaterThan(65);
    expect(distance).toBeLessThan(75);
  });
});

describe("buildDirectionsUrl", () => {
  it("should build URL with coordinates when destination coordinates are provided", () => {
    const destination = { lat: 47.3769, lng: 8.5417 };

    const url = buildDirectionsUrl(destination);

    expect(url).toBe("https://www.google.com/maps/dir//47.3769,8.5417");
  });

  it("should build URL with text address when no coordinates provided", () => {
    const url = buildDirectionsUrl(null, "Zurich, Switzerland");

    expect(url).toBe(
      "https://www.google.com/maps/dir//Zurich%2C%20Switzerland"
    );
  });

  it("should build URL with origin and destination coordinates", () => {
    const destination = { lat: 46.2044, lng: 6.1432 };
    const origin = { lat: 47.3769, lng: 8.5417 };

    const url = buildDirectionsUrl(destination, undefined, origin);

    expect(url).toBe(
      "https://www.google.com/maps/dir/47.3769,8.5417/46.2044,6.1432"
    );
  });

  it("should return base URL when no destination provided", () => {
    const url = buildDirectionsUrl(null);

    expect(url).toBe("https://www.google.com/maps/dir/");
  });

  it("should prefer coordinates over fallback address", () => {
    const destination = { lat: 47.3769, lng: 8.5417 };

    const url = buildDirectionsUrl(destination, "Some Address");

    expect(url).toBe("https://www.google.com/maps/dir//47.3769,8.5417");
  });
});
