import React from 'react';
import { Check, ChevronRight } from 'lucide-react';

export type WorkflowStepNumber = 1 | 2 | 3;

interface WorkflowStepperProps {
  currentStep: WorkflowStepNumber;
  onStepClick?: (step: WorkflowStepNumber) => void;
}

export function WorkflowStepper({ currentStep, onStepClick }: WorkflowStepperProps) {
  const steps: { id: WorkflowStepNumber; label: string; shortLabel: string }[] = [
    { id: 1, label: '1. Select Home Size', shortLabel: '1. Home Size' },
    { id: 2, label: '2. Refine Items & Boxes', shortLabel: '2. Items & Boxes' },
    { id: 3, label: '3. Verify Fit & Lock Rates', shortLabel: '3. Lock Rates' },
  ];

  return (
    <nav
      aria-label="Workflow progress"
      className="h-8 border-b border-[#1F242F] bg-[#0A0C10] px-3 sm:px-6 flex items-center justify-between sm:justify-center gap-2 sm:gap-6 text-xs select-none shrink-0 z-20"
    >
      {steps.map((step, idx) => {
        const isActive = currentStep === step.id;
        const isPast = currentStep > step.id;

        return (
          <React.Fragment key={step.id}>
            <button
              type="button"
              onClick={() => onStepClick && onStepClick(step.id)}
              className={`flex items-center gap-1.5 transition-colors group focus:outline-none ${
                isActive
                  ? 'text-zinc-100 font-semibold'
                  : isPast
                  ? 'text-zinc-300 hover:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono tabular-nums transition-colors ${
                  isActive
                    ? 'bg-[#0066FF] text-white shadow-sm'
                    : isPast
                    ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                    : 'bg-[#161922] text-zinc-500 border border-[#1F242F]'
                }`}
              >
                {isPast ? <Check className="w-2.5 h-2.5" strokeWidth={2.5} /> : step.id}
              </span>

              <span className="hidden sm:inline font-sans text-xs tracking-tight">
                {step.label.replace(/^\d+\.\s*/, '')}
              </span>
              <span className="inline sm:hidden font-sans text-[11px] tracking-tight">
                {step.shortLabel.replace(/^\d+\.\s*/, '')}
              </span>
            </button>

            {idx < steps.length - 1 && (
              <ChevronRight className="w-3 h-3 text-zinc-700 shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
