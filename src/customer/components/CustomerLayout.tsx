import { Home, Building2, Package, HardHat, FileText, PenTool, Bell, Settings, LogOut, Menu, X, Truck, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useCustomer } from '../CustomerContext';
import type { CustomerView } from '../types';
import NotificationBell from '@/admin/components/NotificationBell';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { lang, dir } = useApp();
  const { user, logout, view, setView } = useCustomer();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: { id: CustomerView; labelAr: string; labelEn: string; icon: typeof Home; badge?: number }[] = [
    { id: 'overview', labelAr: 'الرئيسية', labelEn: 'Overview', icon: Home },
    { id: 'company', labelAr: 'بيانات الشركة', labelEn: 'Company', icon: Building2 },
    { id: 'rental-requests', labelAr: 'طلبات التأجير', labelEn: 'Rental Requests', icon: Package },
    { id: 'project-requests', labelAr: 'طلبات المشاريع', labelEn: 'Project Requests', icon: HardHat },
    { id: 'quotations', labelAr: 'عروض الأسعار', labelEn: 'Quotations', icon: FileText },
    { id: 'contracts', labelAr: 'العقود', labelEn: 'Contracts', icon: PenTool },
    { id: 'renewals', labelAr: 'تجديد العقود', labelEn: 'Renewals', icon: RefreshCw },
    { id: 'deliveries', labelAr: 'التسليم والاستلام', labelEn: 'Deliveries', icon: Truck },
    { id: 'notifications', labelAr: 'الإشعارات', labelEn: 'Notifications', icon: Bell },
    { id: 'settings', labelAr: 'الإعدادات', labelEn: 'Settings', icon: Settings },
  ];

  const handleNav = (v: CustomerView) => {
    setView(v);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-base flex" dir={dir}>
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-elevated border-e border-base sticky top-0 h-screen">
        <div className="p-5 border-b border-base">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="" aria-hidden="true" className="w-10 h-10 object-contain shrink-0 rounded-lg" />
            <div>
              <div className="text-sm font-black text-base-primary">SAHAB</div>
              <div className="text-xs text-base-muted">{lang === 'ar' ? 'حساب العميل' : 'Customer Account'}</div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-base">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-yellow-accent/10 border border-yellow-accent/20 flex items-center justify-center">
              <span className="text-sm font-bold text-yellow-accent">{user?.fullName?.charAt(0) || 'U'}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-base-primary truncate">{user?.fullName || '—'}</div>
              <div className="text-xs text-base-muted truncate">{user?.email || '—'}</div>
            </div>
            {user && (
              <NotificationBell recipientId={user.id} recipientType="customer" onNavigate={(link) => setView(link as CustomerView)} />
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  active
                    ? 'bg-yellow-accent/10 text-yellow-accent border border-yellow-accent/30'
                    : 'text-base-muted hover:text-base-primary hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon size={18} />
                <span className="flex-1 text-start">{lang === 'ar' ? item.labelAr : item.labelEn}</span>
                {item.badge ? (
                  <span className="px-1.5 py-0.5 rounded-md bg-yellow-accent text-black text-xs font-bold">{item.badge}</span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-base">
          <button onClick={() => logout()} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors">
            <LogOut size={18} />
            {lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}
          </button>
          <a href="#home" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-base-muted hover:text-yellow-accent transition-colors">
            <Home size={18} />
            {lang === 'ar' ? 'العودة للموقع' : 'Back to Site'}
          </a>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-elevated border-b border-base">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="" aria-hidden="true" className="w-8 h-8 object-contain shrink-0 rounded-lg" />
            <span className="text-sm font-black text-base-primary">SAHAB</span>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} aria-label={lang === 'ar' ? 'القائمة' : 'Menu'} aria-expanded={mobileOpen} className="p-2 rounded-lg border border-base text-base-muted">
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          {user && (
            <NotificationBell recipientId={user.id} recipientType="customer" onNavigate={(link) => setView(link as CustomerView)} />
          )}
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 animate-fade-in" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute top-14 ltr:left-0 rtl:right-0 w-64 bg-elevated border border-base shadow-xl h-[calc(100vh-3.5rem)] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-base">
              <div className="text-sm font-semibold text-base-primary">{user?.fullName}</div>
              <div className="text-xs text-base-muted">{user?.email}</div>
            </div>
            <nav className="p-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = view === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      active ? 'bg-yellow-accent/10 text-yellow-accent' : 'text-base-muted hover:text-base-primary'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="flex-1 text-start">{lang === 'ar' ? item.labelAr : item.labelEn}</span>
                    {item.badge ? <span className="px-1.5 py-0.5 rounded-md bg-yellow-accent text-black text-xs font-bold">{item.badge}</span> : null}
                  </button>
                );
              })}
              <button onClick={() => logout()} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-500/10">
                <LogOut size={18} />
                {lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
