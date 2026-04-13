import { DashboardNav } from './dashboard-nav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <DashboardNav />
      <div className="flex-1">{children}</div>
    </div>
  )
}
