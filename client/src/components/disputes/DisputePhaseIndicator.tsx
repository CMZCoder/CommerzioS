/**
 * DisputePhaseIndicator Component
 * 
 * Visual progress indicator showing the current phase
 * of the 3-phase dispute resolution process.
 */

import { cn } from '@/lib/utils';
import { 
  MessageSquare, 
  Bot, 
  Gavel,
  Check,
  ExternalLink,
  Clock
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type DisputePhase = 
  | 'phase_1' 
  | 'phase_2' 
  | 'phase_3_pending' 
  | 'phase_3_ai' 
  | 'phase_3_external' 
  | 'resolved';

interface DisputePhaseIndicatorProps {
  currentPhase: DisputePhase;
  phase1Deadline?: string | null;
  phase2Deadline?: string | null;
  phase3ReviewDeadline?: string | null;
  className?: string;
}

const PHASES = [
  {
    id: 'phase_1',
    label: 'Direct Negotiation',
    shortLabel: 'Negotiate',
    icon: MessageSquare,
    description: 'Work directly with the other party to find a resolution',
    duration: '7 days',
  },
  {
    id: 'phase_2',
    label: 'AI Mediation',
    shortLabel: 'AI Help',
    icon: Bot,
    description: 'AI analyzes the dispute and offers 3 resolution options',
    duration: '7 days',
  },
  {
    id: 'phase_3',
    label: 'Final Decision',
    shortLabel: 'Decision',
    icon: Gavel,
    description: 'AI makes a binding decision or external resolution is chosen',
    duration: '24 hours review',
  },
];

function getTimeRemaining(deadline: string | null | undefined): string {
  if (!deadline) return '';
  
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diff = deadlineDate.getTime() - now.getTime();
  
  if (diff <= 0) return 'Expired';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  if (days > 0) {
    return `${days}d ${remainingHours}h left`;
  }
  return `${hours}h left`;
}

function getPhaseIndex(phase: DisputePhase): number {
  if (phase === 'phase_1') return 0;
  if (phase === 'phase_2') return 1;
  return 2; // phase_3_*
}

export function DisputePhaseIndicator({
  currentPhase,
  phase1Deadline,
  phase2Deadline,
  phase3ReviewDeadline,
  className,
}: DisputePhaseIndicatorProps) {
  const currentIndex = getPhaseIndex(currentPhase);
  const isResolved = currentPhase === 'resolved' || 
                     currentPhase === 'phase_3_ai' || 
                     currentPhase === 'phase_3_external';

  const getDeadline = (index: number) => {
    if (index === 0) return phase1Deadline;
    if (index === 1) return phase2Deadline;
    return phase3ReviewDeadline;
  };

  return (
    <TooltipProvider>
      <div className={cn('w-full', className)}>
        {/* Phase Steps */}
        <div className="flex items-center justify-between relative">
          {/* Connecting Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted mx-12" />
          <div 
            className="absolute top-5 left-0 h-0.5 bg-primary mx-12 transition-all duration-500"
            style={{ 
              width: isResolved 
                ? 'calc(100% - 6rem)' 
                : `calc(${(currentIndex / 2) * 100}% - ${currentIndex === 0 ? 0 : 3}rem)` 
            }}
          />

          {PHASES.map((phase, index) => {
            const Icon = phase.icon;
            const isCompleted = index < currentIndex || isResolved;
            const isCurrent = index === currentIndex && !isResolved;
            const deadline = getDeadline(index);
            const timeRemaining = isCurrent ? getTimeRemaining(deadline) : '';

            return (
              <Tooltip key={phase.id}>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center z-10 bg-background px-2">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                        isCompleted && 'bg-primary border-primary text-primary-foreground',
                        isCurrent && 'bg-primary/10 border-primary text-primary animate-pulse',
                        !isCompleted && !isCurrent && 'bg-muted border-muted-foreground/30 text-muted-foreground'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={cn(
                        'mt-2 text-xs font-medium text-center',
                        isCurrent && 'text-primary',
                        !isCurrent && !isCompleted && 'text-muted-foreground'
                      )}
                    >
                      {phase.shortLabel}
                    </span>
                    {isCurrent && timeRemaining && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {timeRemaining}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-semibold">{phase.label}</p>
                    <p className="text-xs text-muted-foreground">{phase.description}</p>
                    <p className="text-xs text-muted-foreground">Duration: {phase.duration}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Current Phase Info */}
        {!isResolved && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              {currentPhase === 'phase_1' && (
                <>
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span>
                    <strong>Phase 1:</strong> Make counter-offers to find an agreement
                  </span>
                </>
              )}
              {currentPhase === 'phase_2' && (
                <>
                  <Bot className="w-4 h-4 text-primary" />
                  <span>
                    <strong>Phase 2:</strong> Review AI-suggested options and select one
                  </span>
                </>
              )}
              {currentPhase === 'phase_3_pending' && (
                <>
                  <Gavel className="w-4 h-4 text-primary" />
                  <span>
                    <strong>Phase 3:</strong> Review the AI decision or choose external resolution
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Resolved Status */}
        {isResolved && (
          <div className={cn(
            'mt-4 p-3 rounded-lg flex items-center gap-2 text-sm',
            currentPhase === 'phase_3_external' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
          )}>
            {currentPhase === 'phase_3_external' ? (
              <>
                <ExternalLink className="w-4 h-4" />
                <span>Resolved via external resolution</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Dispute resolved</span>
              </>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
