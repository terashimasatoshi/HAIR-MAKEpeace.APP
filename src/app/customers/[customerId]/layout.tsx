import { CounselingProvider } from "@/contexts/CounselingContext";
import { StepNavigation } from "@/components/counseling/StepNavigation";

export default async function CustomerLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ customerId: string }>;
}) {
    const { customerId } = await params;
    return (
        <CounselingProvider customerId={customerId}>
            <div className="flex flex-col min-h-screen">
                <StepNavigation customerId={customerId} />
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </CounselingProvider>
    );
}
