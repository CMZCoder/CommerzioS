import * as React from "react";
import { useState } from "react";
import { Link } from "wouter";
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  ArrowLeft,
  Briefcase,
  Image,
  MapPin,
  DollarSign,
  User,
  Calendar,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tips: string[];
  actionLabel: string;
  actionHref?: string;
  isComplete?: boolean;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: "profile",
    title: "Complete Your Profile",
    description: "Add your name, photo, and contact details to build trust with customers.",
    icon: <User className="h-6 w-6" />,
    tips: [
      "Use a professional profile photo",
      "Add your business name if applicable",
      "Verify your email and phone number",
    ],
    actionLabel: "Edit Profile",
    actionHref: "/profile",
  },
  {
    id: "service",
    title: "Create Your First Service",
    description: "List your service with a clear title and detailed description.",
    icon: <Briefcase className="h-6 w-6" />,
    tips: [
      "Choose the most relevant category",
      "Write a compelling description",
      "Highlight what makes you unique",
    ],
    actionLabel: "Create Service",
    actionHref: "/post-service",
  },
  {
    id: "images",
    title: "Add High-Quality Images",
    description: "Upload photos that showcase your work and expertise.",
    icon: <Image className="h-6 w-6" />,
    tips: [
      "Use clear, well-lit photos",
      "Show examples of your work",
      "Include before/after photos if relevant",
    ],
    actionLabel: "Add Images",
    actionHref: "/my-services",
  },
  {
    id: "pricing",
    title: "Set Your Pricing",
    description: "Define clear pricing options for your services.",
    icon: <DollarSign className="h-6 w-6" />,
    tips: [
      "Research competitor pricing",
      "Offer multiple pricing tiers",
      "Be transparent about what's included",
    ],
    actionLabel: "Set Prices",
    actionHref: "/my-services",
  },
  {
    id: "location",
    title: "Define Service Areas",
    description: "Specify where you offer your services.",
    icon: <MapPin className="h-6 w-6" />,
    tips: [
      "List all cities/regions you serve",
      "Mention if you offer remote services",
      "Be specific about travel limitations",
    ],
    actionLabel: "Set Locations",
    actionHref: "/my-services",
  },
  {
    id: "availability",
    title: "Configure Availability",
    description: "Set your working hours and booking preferences.",
    icon: <Calendar className="h-6 w-6" />,
    tips: [
      "Keep your calendar up to date",
      "Set realistic response times",
      "Block off vacation days in advance",
    ],
    actionLabel: "Set Availability",
    actionHref: "/vendor-calendar",
  },
];

interface ServiceProviderOnboardingProps {
  completedSteps?: string[];
  onComplete?: () => void;
  onDismiss?: () => void;
}

export function ServiceProviderOnboarding({
  completedSteps = [],
  onComplete,
  onDismiss,
}: ServiceProviderOnboardingProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  const stepsWithStatus = onboardingSteps.map(step => ({
    ...step,
    isComplete: completedSteps.includes(step.id),
  }));
  
  const completedCount = stepsWithStatus.filter(s => s.isComplete).length;
  const progress = (completedCount / stepsWithStatus.length) * 100;
  const currentStep = stepsWithStatus[currentStepIndex];
  const isAllComplete = completedCount === stepsWithStatus.length;

  const goToNext = () => {
    if (currentStepIndex < stepsWithStatus.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  if (isAllComplete) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-green-800">
                You're All Set!
              </h3>
              <p className="text-green-600 mt-1">
                Your profile is complete. Start attracting customers!
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={onComplete} variant="default">
                View Dashboard
              </Button>
              <Button onClick={onDismiss} variant="outline">
                Dismiss
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Get Started as a Service Provider
            </CardTitle>
            <CardDescription>
              Complete these steps to maximize your visibility
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{completedCount}/{stepsWithStatus.length} complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Step indicators */}
        <div className="flex justify-between mb-6">
          {stepsWithStatus.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStepIndex(index)}
              className={cn(
                "flex flex-col items-center gap-1 transition-all",
                index === currentStepIndex && "scale-110"
              )}
            >
              <div
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
                  step.isComplete 
                    ? "bg-green-100 text-green-600" 
                    : index === currentStepIndex
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {step.isComplete ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Current step content */}
        <div className="bg-muted/30 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className={cn(
              "h-12 w-12 rounded-lg flex items-center justify-center shrink-0",
              currentStep.isComplete ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
            )}>
              {currentStep.icon}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                {currentStep.title}
                {currentStep.isComplete && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </h4>
              <p className="text-muted-foreground mt-1">
                {currentStep.description}
              </p>
              
              <div className="mt-4">
                <h5 className="text-sm font-medium mb-2">Tips:</h5>
                <ul className="space-y-1">
                  {currentStep.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Circle className="h-2 w-2 mt-1.5 fill-current" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-6 flex gap-3">
                {currentStep.actionHref ? (
                  <Link href={currentStep.actionHref}>
                    <Button>
                      {currentStep.actionLabel}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                ) : (
                  <Button>
                    {currentStep.actionLabel}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={goToPrevious}
            disabled={currentStepIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={goToNext}
            disabled={currentStepIndex === stepsWithStatus.length - 1}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ServiceProviderOnboarding;
