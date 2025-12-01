/**
 * ServiceProviderOnboarding Component
 * 
 * Step-by-step wizard for new service providers:
 * 1. Complete profile (photo, bio, contact)
 * 2. How listings work
 * 3. Create first service (guided)
 * 4. Set availability
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  User, 
  FileText, 
  PlusCircle, 
  Calendar,
  Check,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface ServiceProviderOnboardingProps {
  onComplete?: () => void;
  onSkip?: () => void;
  className?: string;
}

type OnboardingStep = 'profile' | 'how-it-works' | 'create-service' | 'availability';

const STEPS: { id: OnboardingStep; title: string; description: string; icon: typeof User }[] = [
  {
    id: 'profile',
    title: 'Complete Your Profile',
    description: 'Add your photo, bio, and contact details',
    icon: User,
  },
  {
    id: 'how-it-works',
    title: 'How Listings Work',
    description: 'Learn how to create and manage service listings',
    icon: FileText,
  },
  {
    id: 'create-service',
    title: 'Create Your First Service',
    description: 'Add your first service to start receiving bookings',
    icon: PlusCircle,
  },
  {
    id: 'availability',
    title: 'Set Your Availability',
    description: 'Configure when you\'re available for bookings',
    icon: Calendar,
  },
];

export function ServiceProviderOnboarding({ 
  onComplete, 
  onSkip, 
  className 
}: ServiceProviderOnboardingProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('profile');
  const [completedSteps, setCompletedSteps] = useState<Set<OnboardingStep>>(new Set());
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Profile form state
  const [profileData, setProfileData] = useState({
    bio: '',
    phone: user?.phone || '',
  });

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
  const progress = ((completedSteps.size) / STEPS.length) * 100;

  const handleNextStep = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentStepIndex + 1].id);
    } else {
      onComplete?.();
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1].id);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'profile':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                  {user?.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Profile" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0"
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">About You</Label>
              <Textarea
                id="bio"
                placeholder="Tell potential customers about yourself, your experience, and what makes your services special..."
                value={profileData.bio}
                onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+41 XX XXX XX XX"
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>
        );

      case 'how-it-works':
        return (
          <div className="space-y-6">
            <div className="grid gap-4">
              <div className="flex gap-4 items-start p-4 bg-muted/50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Create Your Service Listing</h4>
                  <p className="text-sm text-muted-foreground">
                    Add photos, description, pricing, and location for your service
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-4 bg-muted/50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Customers Find You</h4>
                  <p className="text-sm text-muted-foreground">
                    Your service appears in search results based on category and location
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-4 bg-muted/50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Receive Bookings</h4>
                  <p className="text-sm text-muted-foreground">
                    Accept, decline, or propose alternative times for booking requests
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-4 bg-muted/50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  4
                </div>
                <div>
                  <h4 className="font-medium">Grow Your Business</h4>
                  <p className="text-sm text-muted-foreground">
                    Build reputation through reviews and earn points for referrals
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'create-service':
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <PlusCircle className="w-8 h-8 text-primary" />
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Ready to Create Your First Service?</h4>
              <p className="text-sm text-muted-foreground">
                Click "Create Service" to open the service creation form where you can add all the details about your offering.
              </p>
            </div>

            <Button className="w-full" size="lg">
              <PlusCircle className="mr-2 h-5 w-5" />
              Create Service
            </Button>

            <p className="text-xs text-muted-foreground">
              Don't worry, you can always edit your service later or create more services.
            </p>
          </div>
        );

      case 'availability':
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Set Your Availability</h4>
              <p className="text-sm text-muted-foreground">
                Configure your working hours and blocked times so customers know when they can book you.
              </p>
            </div>

            <div className="grid grid-cols-7 gap-1 p-4 bg-muted/50 rounded-lg">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                <div
                  key={index}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
                    index < 5 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {day}
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full" size="lg">
              <Calendar className="mr-2 h-5 w-5" />
              Configure Availability
            </Button>

            <p className="text-xs text-muted-foreground">
              You can customize your availability in your vendor settings at any time.
            </p>
          </div>
        );
    }
  };

  return (
    <Card className={cn('w-full max-w-lg mx-auto', className)}>
      <CardHeader>
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-muted-foreground">
            Step {currentStepIndex + 1} of {STEPS.length}
          </span>
          {onSkip && (
            <Button variant="ghost" size="sm" onClick={onSkip}>
              Skip for now
            </Button>
          )}
        </div>
        
        <Progress value={progress} className="h-2 mb-4" />
        
        {/* Step indicators */}
        <div className="flex justify-between mb-6">
          {STEPS.map((step, index) => {
            const isCompleted = completedSteps.has(step.id);
            const isCurrent = step.id === currentStep;
            
            return (
              <div 
                key={step.id}
                className={cn(
                  'flex flex-col items-center gap-1 flex-1',
                  isCurrent ? 'text-primary' : isCompleted ? 'text-green-500' : 'text-muted-foreground'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    isCurrent ? 'bg-primary text-primary-foreground' : 
                    isCompleted ? 'bg-green-500 text-white' : 'bg-muted'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <step.icon className="w-4 h-4" />
                  )}
                </div>
                <span className="text-xs text-center hidden sm:block">{step.title}</span>
              </div>
            );
          })}
        </div>

        <CardTitle>{STEPS[currentStepIndex].title}</CardTitle>
        <CardDescription>{STEPS[currentStepIndex].description}</CardDescription>
      </CardHeader>

      <CardContent>
        {renderStepContent()}

        <div className="flex gap-3 mt-6">
          {currentStepIndex > 0 && (
            <Button variant="outline" onClick={handlePrevStep} className="flex-1">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          
          <Button onClick={handleNextStep} className="flex-1">
            {currentStepIndex === STEPS.length - 1 ? (
              <>
                Complete
                <Check className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ServiceProviderOnboarding;
