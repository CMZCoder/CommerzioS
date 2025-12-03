import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-100 rounded-full blur-3xl opacity-50" />
      </div>
      
      <div className="relative text-center max-w-lg mx-auto">
        {/* 404 Visual */}
        <div className="mb-8">
          <div className="text-[150px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary/20 to-violet-500/20 leading-none select-none">
            404
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Page Not Found
        </h1>
        
        <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
          Oops! The page you are looking for does not exist or has been moved. 
          Let us get you back on track.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button size="lg" className="gap-2 w-full sm:w-auto">
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <Button 
            size="lg" 
            variant="outline" 
            className="gap-2 w-full sm:w-auto"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-sm text-muted-foreground mb-4">
            Looking for something specific?
          </p>
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <Search className="w-4 h-4" />
              Search Services
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
