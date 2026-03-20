import { ReactNode } from 'react';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <AppHeader />
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
