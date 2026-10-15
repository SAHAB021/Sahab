import { AppProvider } from '@/contexts/AppContext';
import PasswordRecovery from '@/components/PasswordRecovery';
import { SiteContentProvider } from '@/contexts/SiteContentContext';
import { DeliveryProvider } from '@/admin/DeliveryContext';
import { NotificationProvider } from '@/admin/NotificationContext';
import { RenewalProvider } from '@/admin/RenewalContext';
import { CustomerProvider } from '@/customer/CustomerContext';
import { RentalProvider } from '@/rental/RentalContext';
import { QuotationProvider } from '@/quotation/QuotationContext';
import { ContractProvider } from '@/contract/ContractContext';
import { ProjectProvider } from '@/project/ProjectContext';
import CustomerApp from '@/customer/CustomerApp';

/** Customer portal with its data providers. Loaded on demand so public visitors never download it. */
export default function CustomerRoot() {
  return (
    <AppProvider>
      <SiteContentProvider>
      <RentalProvider>
        <QuotationProvider>
          <ContractProvider>
            <ProjectProvider>
              <CustomerProvider>
                <DeliveryProvider>
                  <NotificationProvider>
                    <RenewalProvider>
                      <CustomerApp />
                    </RenewalProvider>
                  </NotificationProvider>
                </DeliveryProvider>
              </CustomerProvider>
            </ProjectProvider>
          </ContractProvider>
        </QuotationProvider>
      </RentalProvider>
      </SiteContentProvider>
      <PasswordRecovery />
    </AppProvider>
  );
}
