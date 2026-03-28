import { CounselingProvider } from '@/contexts/CounselingContext';

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CounselingProvider>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </CounselingProvider>
  );
}
