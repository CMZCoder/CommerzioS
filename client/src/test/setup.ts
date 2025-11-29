import "@testing-library/jest-dom";

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverMock;

// Mock Google Maps API
const googleMock = {
  maps: {
    Map: class {
      setCenter() {}
      setZoom() {}
      fitBounds() {}
      addListener() {
        return { remove: () => {} };
      }
    },
    Marker: class {
      setMap() {}
      setPosition() {}
      addListener() {
        return { remove: () => {} };
      }
    },
    InfoWindow: class {
      open() {}
      close() {}
      setContent() {}
    },
    DirectionsService: class {
      route(
        _request: unknown,
        callback: (result: unknown, status: string) => void
      ) {
        callback(null, "OK");
      }
    },
    DirectionsRenderer: class {
      setMap() {}
      setDirections() {}
    },
    LatLng: class {
      private _lat: number;
      private _lng: number;
      constructor(lat: number, lng: number) {
        this._lat = lat;
        this._lng = lng;
      }
      lat() {
        return this._lat;
      }
      lng() {
        return this._lng;
      }
    },
    LatLngBounds: class {
      extend() {
        return this;
      }
      getCenter() {
        return { lat: () => 0, lng: () => 0 };
      }
    },
    places: {
      Autocomplete: class {
        addListener() {
          return { remove: () => {} };
        }
        getPlace() {
          return {};
        }
      },
      AutocompleteService: class {
        getPlacePredictions(
          _request: unknown,
          callback: (predictions: unknown[]) => void
        ) {
          callback([]);
        }
      },
      PlacesService: class {
        getDetails(
          _request: unknown,
          callback: (place: unknown, status: string) => void
        ) {
          callback({}, "OK");
        }
      },
    },
    Geocoder: class {
      geocode(_request: unknown, callback: (results: unknown[]) => void) {
        callback([]);
      }
    },
    event: {
      addListener: () => ({ remove: () => {} }),
      removeListener: () => {},
      clearListeners: () => {},
    },
    TravelMode: {
      DRIVING: "DRIVING",
      WALKING: "WALKING",
      BICYCLING: "BICYCLING",
      TRANSIT: "TRANSIT",
    },
    DirectionsStatus: {
      OK: "OK",
      NOT_FOUND: "NOT_FOUND",
      ZERO_RESULTS: "ZERO_RESULTS",
    },
  },
};

(window as unknown as { google: typeof googleMock }).google = googleMock;
