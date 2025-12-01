import { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  User, 
  Info, 
  PlusCircle, 
  Clock,
  Check,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isComplete: boolean;
  action?: {
    label: string;
    href: string;
  };
  tips?: string[];
}

interface ServiceProviderOnboardingProps {
  onClose?: () => void;
  className?: string;
}

/**
 * ServiceProviderOnboarding - Step-by-step guide for new service providers
 * Helps vendors complete their profile and create their first service
 */
export function ServiceProviderOnboarding({ onClose, className }: ServiceProviderOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [, navigate] = useLocation();
  const { user } = useUser();

  // Calculate completion status for each step
  const hasCompletedProfile = Boolean(
    user?.firstName && 
    user?.lastName && 
    user?.phoneNumber
  );
  
  // For demo purposes - in reality would check if user has any services
  const hasCreatedService = false;

  const steps: OnboardingStep[] = [
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Add your contact information so customers can reach you easily.',
      icon: User,
      isComplete: hasCompletedProfile,
      action: {
        label: 'Edit Profile',
        href: '/profile',
      },
      tips: [
        'Add a professional profile photo',
        'Include your phone number for direct contact',
        'Verify your email address',
      ],
    },
    {
      id: 'learn',
      title: 'How Listings Work',
      description: 'Learn about creating and managing your service listings.',
      icon: Info,
      isComplete: false,
      tips: [
        'Services are visible for 14 days and can be renewed',
        'Add up to 5 high-quality images',
        'Use clear descriptions with relevant keywords',
        'Set competitive prices based on your local market',
      ],
    },
    {
      id: 'create',
      title: 'Create Your First Service',
      description: 'List your services and start getting customers.',
      icon: PlusCircle,
      isComplete: hasCreatedService,
      action: {
        label: 'Create Service',
        href: '/create-service',
      },
      tips: [
        'Choose the right category for visibility',
        'Write a compelling title and description',
        'Add your service locations',
        'Include pricing information',
      ],
    },
    {
      id: 'availability',
      title: 'Set Your Availability',
      description: 'Configure your working hours and manage bookings.',
      icon: Clock,
      isComplete: false,
      action: {
        label: 'Set Availability',
        href: '/vendor/settings',
      },
      tips: [
        'Set your regular working hours',
        'Block off holidays and personal time',
        'Enable or disable instant booking',
        'Set booking notice requirements',
      ],
    },
  ];

  const completedSteps = steps.filter(s => s.isComplete).length;
  const progress = (completedSteps / steps.length) * 100;
  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAction = () => {
    if (currentStepData.action) {
      navigate(currentStepData.action.href);
      onClose?.();
    }
  };

  return (
    <Card className={cn('w-full max-w-2xl', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Welcome to Commerzio!</CardTitle>
            <CardDescription className="mt-1">
              Complete these steps to start offering your services
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Skip for now
            </Button>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{completedSteps} of {steps.length} completed</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step indicators */}
        <div className="flex justify-center gap-2">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(index)}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                index === currentStep
                  ? 'bg-primary text-primary-foreground'
                  : step.isComplete
                  ? 'bg-green-100 text-green-600'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {step.isComplete ? (
                <Check className="h-5 w-5" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </button>
          ))}
        </div>

        {/* Current step content */}
        <div className="bg-muted/50 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-3 rounded-full',
              currentStepData.isComplete ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'
            )}>
              <currentStepData.icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                {currentStepData.title}
                {currentStepData.isComplete && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Complete
                  </span>
                )}
              </h3>
              <p className="text-sm text-muted-foreground">
                {currentStepData.description}
              </p>
            </div>
          </div>

          {/* Tips */}
          {currentStepData.tips && currentStepData.tips.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Tips:</h4>
              <ul className="space-y-1.5">
                {currentStepData.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action button */}
          {currentStepData.action && (
            <Button onClick={handleAction} className="w-full mt-4">
              {currentStepData.action.label}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={currentStep === steps.length - 1}
        >
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
