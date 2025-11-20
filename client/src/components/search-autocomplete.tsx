import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchResult {
  id: string;
  title: string;
  category: string;
  price: string;
  priceUnit: string;
}

export function SearchAutocomplete() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const abortController = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/services/search?q=${encodeURIComponent(query)}&limit=5`,
          { signal: abortController.signal }
        );
        
        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }
        
        const data = await response.json();
        setResults(data);
        setIsOpen(data.length > 0);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error("Search error:", error);
          setResults([]);
          setIsOpen(false);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
      setIsLoading(false);
    };
  }, [query]);

  const handleSelect = (serviceId: string) => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    setLocation(`/service/${serviceId}`);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md" data-testid="search-autocomplete">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search services..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          className="pl-10 pr-10"
          data-testid="input-search"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-y-auto">
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result.id)}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b last:border-b-0 transition-colors"
              data-testid={`search-result-${result.id}`}
            >
              <div className="font-medium text-sm">{result.title}</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                <span>{result.category}</span>
                <span>•</span>
                <span className="font-semibold text-primary">CHF {result.price}/{result.priceUnit}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
