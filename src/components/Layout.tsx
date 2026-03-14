import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { Header } from '@/components/Header'

export function Layout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background bg-grid-pattern relative">
        {/* Ambient Glow */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[150px]" />
        </div>

        <AppSidebar />
        <SidebarInset className="bg-transparent z-10 flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto p-4 md:p-8">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
