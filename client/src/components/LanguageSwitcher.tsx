/**
 * Language Switcher Component
 * 
 * Allows users to switch between supported languages.
 * Persists selection to localStorage.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Check } from "lucide-react";
import { supportedLanguages, changeLanguage, getCurrentLanguage } from "@/i18n";

export function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const currentLang = getCurrentLanguage();
    const currentLanguage = supportedLanguages.find(l => l.code === currentLang) || supportedLanguages[0];

    const handleLanguageChange = async (langCode: string) => {
        await changeLanguage(langCode);
        setIsOpen(false);
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 px-2"
                >
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">{currentLanguage.name}</span>
                    <span className="sm:hidden">{currentLanguage.code.toUpperCase()}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {supportedLanguages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className="flex items-center justify-between cursor-pointer"
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{lang.flag}</span>
                            <span>{lang.name}</span>
                        </div>
                        {currentLang === lang.code && (
                            <Check className="h-4 w-4 text-primary" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/**
 * Compact language switcher for footer/mobile
 */
export function LanguageSwitcherCompact() {
    const { i18n } = useTranslation();
    const currentLang = getCurrentLanguage();

    return (
        <div className="flex items-center gap-1">
            {supportedLanguages.map((lang) => (
                <Button
                    key={lang.code}
                    variant={currentLang === lang.code ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 w-8 p-0 text-xs"
                    onClick={() => changeLanguage(lang.code)}
                >
                    {lang.code.toUpperCase()}
                </Button>
            ))}
        </div>
    );
}
