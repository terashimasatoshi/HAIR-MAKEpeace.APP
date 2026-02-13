'use client';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const STEPS = [
    { id: 'input', label: '基本情報', path: 'counseling/input' },
    { id: 'menu', label: 'メニュー', path: 'counseling/menu' },
    { id: 'plan', label: 'AI提案', path: 'counseling/plan' },
    { id: 'record', label: '施術記録', path: 'treatment/record' },
    { id: 'photos', label: '写真', path: 'treatment/photos' },
    { id: 'complete', label: '完了', path: 'complete' },
];

export function StepNavigation({ customerId }: { customerId: string }) {
    const pathname = usePathname();
    const router = useRouter();

    // Check if we are in a valid step
    const currentStepIndex = STEPS.findIndex(step => pathname.includes(step.path));

    if (currentStepIndex === -1) return null;

    return (
        <div className="w-full bg-white border-b border-gray-100 overflow-x-auto">
            <div className="max-w-md mx-auto px-4 py-3 min-w-[350px]">
                <div className="flex items-center justify-between relative">
                    {/* Progress Bar Background */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-100 -z-10" />

                    {/* Active Progress Bar */}
                    <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary -z-10 transition-all duration-300"
                        style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
                    />

                    {STEPS.map((step, index) => {
                        const isActive = index === currentStepIndex;
                        const isCompleted = index < currentStepIndex;

                        return (
                            <button
                                key={step.id}
                                onClick={() => router.push(`/customers/${customerId}/${step.path}`)}
                                disabled={!isCompleted && !isActive} // Only allow navigating back or to current
                                className={cn(
                                    "flex flex-col items-center gap-1 group focus:outline-none",
                                    (isCompleted || isActive) ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                                )}
                            >
                                <div className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-colors bg-white",
                                    isActive ? "border-primary text-primary" :
                                        isCompleted ? "border-primary bg-primary text-white" : "border-gray-200 text-gray-400"
                                )}>
                                    {isCompleted ? <Check size={12} strokeWidth={3} /> : index + 1}
                                </div>
                                <span className={cn(
                                    "text-[10px] font-medium whitespace-nowrap",
                                    isActive ? "text-primary" : "text-muted-foreground"
                                )}>
                                    {step.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
