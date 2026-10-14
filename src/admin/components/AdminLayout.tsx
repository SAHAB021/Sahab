import { LayoutDashboard, Package, Tags, Building2, ArrowLeft, Home, ClipboardList, FileText, PenTool, HardHat, Users, ShieldCheck, ScrollText, Boxes, Warehouse, Shuffle, CalendarClock, Truck, Bell, Settings, RefreshCw, LogOut, Inbox, PackageCheck, KeyRound, LayoutTemplate } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAdmin } from '../AdminContext';
import { useEmployee } from '../EmployeeContext';
import type { AdminView } from '../types';
import type { PermissionModule } from '../employee-types';
import NotificationBell from './NotificationBell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { lang, dir } = useApp();
  const { view, setView, models, categories, brands } = useAdmin();
  const { currentEmployee, currentRole, can, signOut } = useEmployee();

  type NavItem = {
    id: AdminView;
    labelAr: string;
    labelEn: string;
    icon: typeof LayoutDashboard;
    module?: PermissionModule;
  };

  const navItems: NavItem[] = [
    { id: 'dashboard', labelAr: 'لوحة التحكم', labelEn: 'Dashboard', icon: LayoutDashboard },
    { id: 'requests-center', labelAr: 'الطلبات', labelEn: 'Requests Center', icon: Inbox, module: 'rental_requests' },
    { id: 'equipment', labelAr: 'إدارة المعدات', labelEn: 'Equipment', icon: Package, module: 'equipment' },
    { id: 'equipment-units', labelAr: 'الوحدات الفعلية', labelEn: 'Actual Units', icon: Boxes, module: 'equipment' },
    { id: 'equipment-sources', labelAr: 'مصادر المعدات', labelEn: 'Equipment Sources', icon: Warehouse, module: 'equipment' },
    { id: 'allocations', labelAr: 'تخصيص المعدات', labelEn: 'Allocations', icon: Shuffle, module: 'rental_requests' },
    { id: 'deliveries', labelAr: 'التسليم والاستلام', labelEn: 'Deliveries & Returns', icon: Truck, module: 'rental_requests' },
    { id: 'unit-availability', labelAr: 'توفر الوحدات', labelEn: 'Unit Availability', icon: CalendarClock, module: 'equipment' },
    { id: 'categories', labelAr: 'الفئات', labelEn: 'Categories', icon: Tags, module: 'categories' },
    { id: 'brands', labelAr: 'الماركات', labelEn: 'Brands', icon: Building2, module: 'brands' },
    { id: 'rental-requests', labelAr: 'طلبات التأجير', labelEn: 'Rental Requests', icon: ClipboardList, module: 'rental_requests' },
    { id: 'quotations', labelAr: 'عروض الأسعار', labelEn: 'Quotations', icon: FileText, module: 'quotations' },
    { id: 'purchase-orders', labelAr: 'أوامر الشراء', labelEn: 'Purchase Orders', icon: PackageCheck, module: 'contracts' },
    { id: 'contracts', labelAr: 'العقود', labelEn: 'Contracts', icon: PenTool, module: 'contracts' },
    { id: 'rental-operations', labelAr: 'التأجير والتشغيل', labelEn: 'Rental Operations', icon: KeyRound, module: 'rental_requests' },
    { id: 'renewals', labelAr: 'تجديد العقود', labelEn: 'Contract Renewals', icon: RefreshCw, module: 'contracts' },
    { id: 'projects', labelAr: 'طلبات المشاريع', labelEn: 'Project Requests', icon: HardHat, module: 'projects' },
    { id: 'service-requests', labelAr: 'طلبات الخدمات', labelEn: 'Service Requests', icon: ClipboardList, module: 'projects' },
    { id: 'employees', labelAr: 'الموظفون', labelEn: 'Employees', icon: Users, module: 'employees' },
    { id: 'roles-permissions', labelAr: 'الأدوار والصلاحيات', labelEn: 'Roles & Permissions', icon: ShieldCheck, module: 'employees' },
    { id: 'audit-log', labelAr: 'سجل التدقيق', labelEn: 'Audit Log', icon: ScrollText, module: 'employees' },
    { id: 'admin-notifications', labelAr: 'الإشعارات', labelEn: 'Notifications', icon: Bell },
    { id: 'notification-settings', labelAr: 'إعدادات الإشعارات', labelEn: 'Notification Settings', icon: Settings },
    { id: 'site-content', labelAr: 'إدارة المحتوى', labelEn: 'Content Management', icon: LayoutTemplate, module: 'categories' },
  ];

  const visibleItems = navItems.filter((item) => {
    if (!item.module) return true;
    return can(item.module, 'view');
  });

  const publishedCount = models.filter((m) => m.published).length;
  const hiddenCount = models.length - publishedCount;

  return (
    <div className="min-h-screen bg-base flex" dir={dir}>
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-elevated border-e border-base sticky top-0 h-screen">
        <div className="p-5 border-b border-base">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="" aria-hidden="true" className="w-10 h-10 object-contain shrink-0" />
            <div>
              <div className="text-sm font-black text-base-primary">SAHAB Admin</div>
              <div className="text-xs text-base-muted">{lang === 'ar' ? 'إدارة المعدات' : 'Equipment Management'}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                  active
                    ? 'bg-yellow-accent/10 text-yellow-accent border border-yellow-accent/30'
                    : 'text-base-muted hover:text-base-primary hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon size={18} />
                {lang === 'ar' ? item.labelAr : item.labelEn}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-base space-y-2">
          {/* Current user */}
          {currentEmployee && (
            <div className="px-4 py-2 rounded-lg bg-black/5 dark:bg-white/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-yellow-accent/10 border border-yellow-accent/20 flex items-center justify-center text-xs font-bold text-yellow-accent">
                  {currentEmployee.fullName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-base-primary truncate">{currentEmployee.fullName}</div>
                  <div className="text-xs text-base-muted truncate">{currentRole ? (lang === 'ar' ? currentRole.nameAr : currentRole.nameEn) : '—'}</div>
                </div>
                {currentEmployee && (
                  <NotificationBell recipientId={currentEmployee.id} recipientType="employee" onNavigate={(link) => setView(link as AdminView)} />
                )}
              </div>
            </div>
          )}
          <div className="px-4 py-2 text-xs text-base-muted">
            <div className="flex justify-between mb-1"><span>{lang === 'ar' ? 'المعدات' : 'Models'}</span><span className="font-bold text-base-primary">{models.length}</span></div>
            <div className="flex justify-between mb-1"><span>{lang === 'ar' ? 'منشور' : 'Published'}</span><span className="font-bold text-green-500">{publishedCount}</span></div>
            <div className="flex justify-between mb-1"><span>{lang === 'ar' ? 'مخفي' : 'Hidden'}</span><span className="font-bold text-orange-500">{hiddenCount}</span></div>
            <div className="flex justify-between mb-1"><span>{lang === 'ar' ? 'الفئات' : 'Categories'}</span><span className="font-bold text-base-primary">{categories.length}</span></div>
            <div className="flex justify-between"><span>{lang === 'ar' ? 'الماركات' : 'Brands'}</span><span className="font-bold text-base-primary">{brands.length}</span></div>
          </div>
          <a href="#home" className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-base-muted hover:text-yellow-accent transition-colors">
            <Home size={16} />
            {lang === 'ar' ? 'العودة للموقع' : 'Back to Site'}
          </a>
          <button onClick={() => signOut()} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors">
            <LogOut size={16} />
            {lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-elevated border-b border-base">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="" aria-hidden="true" className="w-8 h-8 object-contain shrink-0" />
            <span className="text-sm font-black text-base-primary">SAHAB Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="#home" className="flex items-center gap-1 text-sm text-base-muted hover:text-yellow-accent">
              <ArrowLeft size={16} className={dir === 'rtl' ? 'rotate-180' : ''} />
              {lang === 'ar' ? 'الموقع' : 'Site'}
            </a>
            {currentEmployee && (
              <NotificationBell recipientId={currentEmployee.id} recipientType="employee" onNavigate={(link) => setView(link as AdminView)} />
            )}
          </div>
        </div>
        <div className="flex border-t border-base overflow-x-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex-1 min-w-[60px] flex flex-col items-center gap-1 py-2.5 text-xs font-semibold transition-colors ${
                  active ? 'text-yellow-accent' : 'text-base-muted'
                }`}
              >
                <Icon size={18} />
                {lang === 'ar' ? item.labelAr : item.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 pt-36 md:pt-8 overflow-x-hidden min-w-0">
        {children}
      </main>
    </div>
  );
}
