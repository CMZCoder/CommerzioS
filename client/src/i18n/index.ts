/**
 * i18n Configuration
 * 
 * Internationalization setup for the Swiss marketplace.
 * Supports: German (de), French (fr), Italian (it), English (en)
 * 
 * Uses i18next with React integration.
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translations
import deTranslations from "./locales/de.json";
import frTranslations from "./locales/fr.json";
import itTranslations from "./locales/it.json";
import enTranslations from "./locales/en.json";

// Base resources
const resources = {
    de: { translation: deTranslations },
    fr: { translation: frTranslations },
    it: { translation: itTranslations },
    en: { translation: enTranslations },
};

// Initialize i18n
i18n
    .use(LanguageDetector) // Detect user language
    .use(initReactI18next) // Pass to React
    .init({
        resources,
        fallbackLng: "de", // Default to German (Swiss primary language)
        supportedLngs: ["de", "fr", "it", "en"],

        // Language detection options
        detection: {
            order: ["localStorage", "navigator", "htmlTag"],
            caches: ["localStorage"],
            lookupLocalStorage: "commerzio_language",
        },

        interpolation: {
            escapeValue: false, // React already escapes
        },

        // Namespaces for organizing translations
        ns: ["translation"],
        defaultNS: "translation",

        // Debug mode (disable in production)
        debug: process.env.NODE_ENV === "development",
    });

export default i18n;

// Helper to get current language
export function getCurrentLanguage(): string {
    return i18n.language || "de";
}

// Helper to change language
export function changeLanguage(lng: string): Promise<void> {
    return i18n.changeLanguage(lng);
}

// Get all supported languages
export const supportedLanguages = [
    { code: "de", name: "Deutsch", flag: "🇨🇭" },
    { code: "fr", name: "Français", flag: "🇨🇭" },
    { code: "it", name: "Italiano", flag: "🇨🇭" },
    { code: "en", name: "English", flag: "🇬🇧" },
];
