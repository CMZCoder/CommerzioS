export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="py-20 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto space-y-4 animate-pulse">
            <div className="h-12 bg-muted rounded-lg w-2/3 mx-auto"></div>
            <div className="h-6 bg-muted rounded-lg w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>

      <div className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-8 animate-pulse">
                <div className="w-16 h-16 bg-muted rounded-2xl mb-6"></div>
                <div className="h-6 bg-muted rounded mb-3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
