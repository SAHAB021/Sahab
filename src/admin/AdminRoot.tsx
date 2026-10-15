import { AppProvider } from '@/contexts/AppContext';
import PasswordRecovery from '@/components/PasswordRecovery';
import { SiteContentProvider } from '@/contexts/SiteContentContext';
import { CatalogProvider } from '@/catalog/CatalogContext';
import { AdminProvider } from '@/admin/AdminContext';
import { EmployeeProvider } from '@/admin/EmployeeContext';
import { EquipmentUnitProvider } from '@/admin/EquipmentUnitContext';
import { AllocationProvider } from '@/admin/AllocationContext';
import { DeliveryProvider } from '@/admin/DeliveryContext';
import { NotificationProvider } from '@/admin/NotificationContext';
import { RenewalProvider } from '@/admin/RenewalContext';
import { RentalProvider } from '@/rental/RentalContext';
import { QuotationProvider } from '@/quotation/QuotationContext';
import { ContractProvider } from '@/contract/ContractContext';
import { PurchaseOrderProvider } from '@/purchase-orders/PurchaseOrderContext';
import { RentalOperationProvider } from '@/rental-operations/RentalOperationContext';
import { ProjectProvider } from '@/project/ProjectContext';
import { ServicesProvider } from '@/services/ServicesContext';
import AdminRouter from '@/admin/AdminRouter';

/** Admin dashboard with all its data providers. Loaded on demand so public visitors never download it. */
export default function AdminRoot() {
  return (
    <AppProvider>
      <SiteContentProvider>
      <RentalProvider>
        <QuotationProvider>
          <PurchaseOrderProvider>
            <ContractProvider>
              <RentalOperationProvider>
              <ProjectProvider>
                <ServicesProvider>
                  <CatalogProvider>
                  <AdminProvider>
                  <EmployeeProvider>
                    <EquipmentUnitProvider>
                      <AllocationProvider>
                        <DeliveryProvider>
                          <NotificationProvider>
                            <RenewalProvider>
                              <AdminRouter />
                            </RenewalProvider>
                          </NotificationProvider>
                        </DeliveryProvider>
                      </AllocationProvider>
                    </EquipmentUnitProvider>
                  </EmployeeProvider>
                </AdminProvider>
                  </CatalogProvider>
                </ServicesProvider>
              </ProjectProvider>
              </RentalOperationProvider>
            </ContractProvider>
          </PurchaseOrderProvider>
        </QuotationProvider>
      </RentalProvider>
      </SiteContentProvider>
      <PasswordRecovery />
    </AppProvider>
  );
}
