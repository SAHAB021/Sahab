import { lazy, Suspense, useEffect, useState } from 'react';
import { AppProvider } from '@/contexts/AppContext';
import { SiteContentProvider } from '@/contexts/SiteContentContext';
import { CatalogProvider } from '@/catalog/CatalogContext';
import { RentalProvider } from '@/rental/RentalContext';
import { ServicesProvider } from '@/services/ServicesContext';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import EquipmentCategorySection from '@/components/EquipmentCategorySection';
import ContractingSection from '@/components/ContractingSection';
import WhySahab from '@/components/WhySahab';
import RentalProcess from '@/components/RentalProcess';
import ServicesSection from '@/services/components/ServicesSection';
import Company from '@/components/Company';
import CTA from '@/components/CTA';
import LegalSection from '@/components/LegalSection';
import Footer from '@/components/Footer';
import FloatingActions from '@/components/FloatingActions';
import CustomerGate from '@/components/CustomerGate';
import { useAnchorScroll, useCinematicEffects } from '@/hooks/useCinematicEffects';

type RouteType = 'public' | 'catalog' | 'services' | 'admin' | 'customer' | 'legal' | 'project-request';

const AdminRoot = lazy(() => import('@/admin/AdminRoot'));
const CustomerRoot = lazy(() => import('@/customer/CustomerRoot'));
const CatalogRouter = lazy(() => import('@/catalog/CatalogRouter'));
const ServicesRouter = lazy(() => import('@/services/ServicesRouter'));
const LegalPageView = lazy(() => import('@/components/LegalPageView'));

function RouteLoading() {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-yellow-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function getRouteType(): RouteType {
  const hash = window.location.hash;
  if (hash.startsWith('#/admin')) return 'admin';
  if (hash.startsWith('#/account')) return 'customer';
  if (hash.startsWith('#/catalog')) return 'catalog';
  if (hash.startsWith('#/services')) return 'services';
  if (hash.startsWith('#/legal/')) return 'legal';
  if (hash.startsWith('#/services/project-request')) return 'project-request';
  return 'public';
}

function useRouteType() {
  const [routeType, setRouteType] = useState<RouteType>(getRouteType);
  useEffect(() => {
    const onHashChange = () => setRouteType(getRouteType());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  return routeType;
}

function App() {
  const routeType = useRouteType();
  useCinematicEffects();
  useAnchorScroll();

  if (routeType === 'admin') {
    return (
      <Suspense fallback={<RouteLoading />}>
        <AdminRoot />
      </Suspense>
    );
  }

  if (routeType === 'customer') {
    return (
      <Suspense fallback={<RouteLoading />}>
        <CustomerRoot />
      </Suspense>
    );
  }

  if (routeType === 'catalog') {
    return (
      <AppProvider>
        <SiteContentProvider>
        <RentalProvider>
        <CatalogProvider>
          <div className="min-h-screen bg-base">
            <Header />
            <main><Suspense fallback={<RouteLoading />}><CatalogRouter /></Suspense></main>
            <Footer />
            <FloatingActions />
            <CustomerGate />
          </div>
        </CatalogProvider>
        </RentalProvider>
        </SiteContentProvider>
      </AppProvider>
    );
  }

  if (routeType === 'services' || routeType === 'project-request') {
    return (
      <AppProvider>
        <SiteContentProvider>
        <ServicesProvider>
          <div className="min-h-screen bg-base">
            <Header />
            <main><Suspense fallback={<RouteLoading />}><ServicesRouter /></Suspense></main>
            <Footer />
            <FloatingActions />
            <CustomerGate />
          </div>
        </ServicesProvider>
        </SiteContentProvider>
      </AppProvider>
    );
  }

  if (routeType === 'legal') {
    return (
      <AppProvider>
        <SiteContentProvider>
          <Suspense fallback={<RouteLoading />}><LegalRoute /></Suspense>
        </SiteContentProvider>
      </AppProvider>
    );
  }

  return (
    <AppProvider>
      <SiteContentProvider>
      <RentalProvider>
      <CatalogProvider>
        <div className="min-h-screen bg-base">
          <Header />
          <main>
            <Hero />
            <EquipmentCategorySection />
            <ContractingSection />
            <ServicesSection />
            <WhySahab />
            <RentalProcess />
            <Company />
            <CTA />
            <LegalSection />
          </main>
          <Footer />
          <FloatingActions />
            <CustomerGate />
        </div>
      </CatalogProvider>
      </RentalProvider>
      </SiteContentProvider>
    </AppProvider>
  );
}

/** Follows the hash so moving between legal pages (privacy → terms) updates without a refresh. */
function LegalRoute() {
  const read = () => decodeURIComponent(window.location.hash.replace('#/legal/', '').split(/[?#]/)[0]);
  const [pageId, setPageId] = useState(read);
  useEffect(() => {
    const onHash = () => {
      setPageId(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return <LegalPageView key={pageId} pageId={pageId} />;
}

export default App;
