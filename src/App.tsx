// src/App.tsx
import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { RequireRole } from "@/components/RequireAuth";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import { SkeletonLoader } from './components/ui/SkeletonLoader';
import { cleanupInvalidDrafts } from './lib/inspection-queue';

// Lazy load all page components for better code splitting
const Login = lazy(() => import('./pages/Login'));
const InspectionsCompleted = lazy(() => import('./pages/InspectionsCompleted'));
const InspectionDashboard = lazy(() => import('./pages/inspections/InspectionDashboard').then(m => ({ default: m.InspectionDashboard })));
const InspectionStudio = lazy(() => import('./pages/inspections/InspectionStudio').then(m => ({ default: m.InspectionStudio })));
const InspectionSyncCenter = lazy(() => import('./pages/inspections/InspectionSyncCenter').then(m => ({ default: m.InspectionSyncCenter })));
const InspectionReports = lazy(() => import('./pages/inspections/InspectionReports').then(m => ({ default: m.InspectionReports })));
const TemplateSelectionPage = lazy(() => import('./pages/inspections/TemplateSelectionPage').then(m => ({ default: m.default || m.TemplateSelectionPage })));
const CreateComponentMovement = lazy(() => import('./pages/stockyard/CreateComponentMovement').then(m => ({ default: m.CreateComponentMovement })));
const StockyardRequestDetails = lazy(() => import('./pages/stockyard/StockyardRequestDetails').then(m => ({ default: m.StockyardRequestDetails })));
const StockyardScan = lazy(() => import('./pages/stockyard/StockyardScan').then(m => ({ default: m.StockyardScan })));
const ComponentLedger = lazy(() => import('./pages/stockyard/ComponentLedger').then(m => ({ default: m.ComponentLedger })));
const CreateComponent = lazy(() => import('./pages/stockyard/CreateComponent').then(m => ({ default: m.CreateComponent })));
const ComponentDetails = lazy(() => import('./pages/stockyard/ComponentDetails').then(m => ({ default: m.ComponentDetails })));
const EditComponent = lazy(() => import('./pages/stockyard/EditComponent').then(m => ({ default: m.EditComponent })));
const ComponentTransferApproval = lazy(() => import('./pages/stockyard/ComponentTransferApproval').then(m => ({ default: m.ComponentTransferApproval })));
const ComponentCostAnalysis = lazy(() => import('./pages/stockyard/ComponentCostAnalysis').then(m => ({ default: m.ComponentCostAnalysis })));
const ComponentHealthDashboard = lazy(() => import('./pages/stockyard/ComponentHealthDashboard').then(m => ({ default: m.ComponentHealthDashboard })));
const StockyardAnalytics = lazy(() => import('./pages/stockyard/StockyardAnalytics').then(m => ({ default: m.StockyardAnalytics })));
const YardMap = lazy(() => import('./pages/stockyard/YardMap').then(m => ({ default: m.YardMap })));
const ChecklistView = lazy(() => import('./pages/stockyard/ChecklistView').then(m => ({ default: m.ChecklistView })));
const BuyerReadinessBoard = lazy(() => import('./pages/stockyard/BuyerReadinessBoard').then(m => ({ default: m.BuyerReadinessBoard })));
const VehicleTimeline = lazy(() => import('./pages/stockyard/VehicleTimeline').then(m => ({ default: m.VehicleTimeline })));
const ComplianceDocuments = lazy(() => import('./pages/stockyard/ComplianceDocuments').then(m => ({ default: m.ComplianceDocuments })));
const TransporterBids = lazy(() => import('./pages/stockyard/TransporterBids').then(m => ({ default: m.TransporterBids })));
const ProfitabilityDashboard = lazy(() => import('./pages/stockyard/ProfitabilityDashboard').then(m => ({ default: m.ProfitabilityDashboard })));
const StockyardAlertsDashboard = lazy(() => import('./pages/stockyard/StockyardAlertsDashboard').then(m => ({ default: m.StockyardAlertsDashboard })));
const GatePassDetails = lazy(() => import('./pages/gatepass/GatePassDetails').then(m => ({ default: m.GatePassDetails })));
const CreateGatePass = lazy(() => import('./pages/gatepass/CreateGatePass').then(m => ({ default: m.CreateGatePass })));
const GuardRegister = lazy(() => import('./pages/gatepass/GuardRegister').then(m => ({ default: m.GuardRegister })));
const GatePassReports = lazy(() => import('./pages/gatepass/GatePassReports').then(m => ({ default: m.GatePassReports })));
const PassTemplates = lazy(() => import('./pages/gatepass/PassTemplates').then(m => ({ default: m.PassTemplates })));
const VisitorManagement = lazy(() => import('./pages/gatepass/VisitorManagement').then(m => ({ default: m.VisitorManagement })));
const GatePassCalendar = lazy(() => import('./pages/gatepass/GatePassCalendar').then(m => ({ default: m.GatePassCalendar })));
const QuickValidation = lazy(() => import('./pages/gatepass/QuickValidation').then(m => ({ default: m.QuickValidation })));
const PassApproval = lazy(() => import('./pages/gatepass/PassApproval').then(m => ({ default: m.PassApproval })));
const BulkOperations = lazy(() => import('./pages/gatepass/BulkOperations').then(m => ({ default: m.BulkOperations })));
const UnifiedApprovals = lazy(() => import('./pages/approvals/UnifiedApprovals').then(m => ({ default: m.UnifiedApprovals })));
const AlertDashboard = lazy(() => import('./pages/alerts/AlertDashboard').then(m => ({ default: m.AlertDashboard })));
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const NotificationPreferences = lazy(() => import('./pages/notifications/NotificationPreferences').then(m => ({ default: m.NotificationPreferences })));
const ReportBranding = lazy(() => import('./pages/settings/ReportBranding').then(m => ({ default: m.ReportBrandingPage })));
const SessionManagement = lazy(() => import('./pages/settings/SessionManagement').then(m => ({ default: m.SessionManagement })));
const ExpenseDetails = lazy(() => import('./pages/expenses/ExpenseDetails').then(m => ({ default: m.ExpenseDetails })));
const CreateExpense = lazy(() => import('./pages/expenses/CreateExpense').then(m => ({ default: m.CreateExpense })));
const ExpenseHistory = lazy(() => import('./pages/expenses/ExpenseHistory').then(m => ({ default: m.ExpenseHistory })));
const EmployeeLedger = lazy(() => import('./pages/expenses/EmployeeLedger').then(m => ({ default: m.EmployeeLedger })));
const LedgerReconciliation = lazy(() => import('./pages/expenses/LedgerReconciliation').then(m => ({ default: m.LedgerReconciliation })));
const AdvanceLedgerView = lazy(() => import('./pages/expenses/AdvanceLedgerView').then(m => ({ default: m.AdvanceLedgerView })));
const CategoryWiseDashboard = lazy(() => import('./pages/expenses/CategoryWiseDashboard').then(m => ({ default: m.CategoryWiseDashboard })));
const AssetManagementDashboard = lazy(() => import('./pages/expenses/AssetManagementDashboard').then(m => ({ default: m.AssetManagementDashboard })));
const ProjectManagementDashboard = lazy(() => import('./pages/expenses/ProjectManagementDashboard').then(m => ({ default: m.ProjectManagementDashboard })));
const CashflowAnalysisDashboard = lazy(() => import('./pages/expenses/CashflowAnalysisDashboard').then(m => ({ default: m.CashflowAnalysisDashboard })));
const ExpenseApproval = lazy(() => import('./pages/expenses/ExpenseApproval').then(m => ({ default: m.ExpenseApproval })));
const ExpenseReports = lazy(() => import('./pages/expenses/ExpenseReports').then(m => ({ default: m.ExpenseReports })));
const ExpenseAnalytics = lazy(() => import('./pages/expenses/ExpenseAnalytics').then(m => ({ default: m.ExpenseAnalytics })));
const ReceiptsGallery = lazy(() => import('./pages/expenses/ReceiptsGallery').then(m => ({ default: m.ReceiptsGallery })));
const AccountsDashboard = lazy(() => import('./pages/expenses/AccountsDashboard').then(m => ({ default: m.AccountsDashboard })));
const UserDetails = lazy(() => import('./pages/admin/UserDetails').then(m => ({ default: m.UserDetails })));
const UserActivityDashboard = lazy(() => import('./pages/admin/UserActivityDashboard').then(m => ({ default: m.UserActivityDashboard })));
const CapabilityMatrix = lazy(() => import('./pages/admin/CapabilityMatrix').then(m => ({ default: m.CapabilityMatrix })));
const BulkUserOperations = lazy(() => import('./pages/admin/BulkUserOperations').then(m => ({ default: m.BulkUserOperations })));
const NotFound = lazy(() => import('./pages/NotFound'));
const OfflinePage = lazy(() => import('./pages/Offline'));

// Lazy load heavy modules
const Dashboard = lazy(() => import('./pages/Dashboard'));
const InspectionCapture = lazy(() => import('./pages/inspections/InspectionCapture'));
const InspectionDetails = lazy(() => import('./pages/inspections/InspectionDetails'));
const GatePassDashboard = lazy(() => import('./pages/gatepass/GatePassDashboard').then(module => ({ default: module.GatePassDashboard })));
const EmployeeExpenseDashboard = lazy(() => import('./pages/expenses/EmployeeExpenseDashboard').then(module => ({ default: module.EmployeeExpenseDashboard })));
const StockyardDashboard = lazy(() => import('./pages/stockyard/StockyardDashboard').then(module => ({ default: module.StockyardDashboard })));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const PermissionTemplates = lazy(() => import('./pages/admin/PermissionTemplates'));
const PermissionTesting = lazy(() => import('./pages/admin/PermissionTesting'));
const DataMaskingRules = lazy(() => import('./pages/admin/DataMaskingRules'));
const SecurityDashboard = lazy(() => import('./pages/admin/SecurityDashboard').then(m => ({ default: m.SecurityDashboard })));
const ActivityLogs = lazy(() => import('./pages/admin/ActivityLogs').then(m => ({ default: m.ActivityLogs })));
const PermissionChangeLogs = lazy(() => import('./pages/admin/PermissionChangeLogs').then(m => ({ default: m.PermissionChangeLogs })));
const AuditReports = lazy(() => import('./pages/admin/AuditReports').then(m => ({ default: m.AuditReports })));
const ComplianceDashboard = lazy(() => import('./pages/admin/ComplianceDashboard').then(m => ({ default: m.ComplianceDashboard })));

// Suspense wrapper component
function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<SkeletonLoader variant="page" />}>
      {children}
    </Suspense>
  );
}

export default function App() {
  // Clean up mock templates on app startup
  useEffect(() => {
    cleanupInvalidDrafts().catch(() => {
      // Silently handle cleanup errors
    });
  }, []);

  return (
    <ErrorBoundary>
      <Routes>
      {/* Root redirects to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Public routes */}
      <Route path="/login" element={<LazyPage><Login /></LazyPage>} />
      <Route path="/offline" element={<LazyPage><OfflinePage /></LazyPage>} />

      {/* Main Dashboard */}
      <Route
        path="/dashboard"
        element={<AuthenticatedLayout><LazyPage><Dashboard /></LazyPage></AuthenticatedLayout>}
      />

      {/* 🚪 Gate Pass Module - UPDATED */}
      {/* Gate Pass Details - Deep linking (must come before dashboard) */}
      <Route
        path="/app/gate-pass/:id"
        element={<AuthenticatedLayout><LazyPage><GatePassDetails /></LazyPage></AuthenticatedLayout>}
      />
      <Route
        path="/app/gate-pass"
        element={<AuthenticatedLayout><LazyPage><GatePassDashboard /></LazyPage></AuthenticatedLayout>}
      />
      <Route
        path="/app/gate-pass/create"
        element={<AuthenticatedLayout><LazyPage><CreateGatePass /></LazyPage></AuthenticatedLayout>}
      />
      <Route
        path="/app/gate-pass/create-visitor"
        element={<Navigate to="/app/gate-pass/create?type=visitor" replace />}
      />
      <Route
        path="/app/gate-pass/create-vehicle"
        element={<Navigate to="/app/gate-pass/create?type=outbound" replace />}
      />
      <Route
        path="/app/gate-pass/guard-register"
        element={<AuthenticatedLayout><LazyPage><GuardRegister /></LazyPage></AuthenticatedLayout>}
      />
      <Route
        path="/app/gate-pass/reports"
        element={<AuthenticatedLayout><RequireRole roles={["super_admin","admin"]}><LazyPage><GatePassReports /></LazyPage></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/gate-pass/templates"
        element={<AuthenticatedLayout><RequireRole roles={["super_admin","admin"]}><LazyPage><PassTemplates /></LazyPage></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/gate-pass/visitors"
        element={<AuthenticatedLayout><LazyPage><VisitorManagement /></LazyPage></AuthenticatedLayout>}
      />
      <Route
        path="/app/gate-pass/calendar"
        element={<AuthenticatedLayout><LazyPage><GatePassCalendar /></LazyPage></AuthenticatedLayout>}
      />
      <Route
        path="/app/gate-pass/scan"
        element={<AuthenticatedLayout><RequireRole roles={["super_admin","admin","supervisor","guard"]}><LazyPage><QuickValidation /></LazyPage></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/gate-pass/validation"
        element={<Navigate to="/app/gate-pass/scan" replace />}
      />
      <Route
        path="/app/gate-pass/quick-validation"
        element={<Navigate to="/app/gate-pass/scan" replace />}
      />
      <Route
        path="/app/gate-pass/approval"
        element={<Navigate to="/app/approvals?tab=gate_pass" replace />}
      />
      <Route
        path="/app/gate-pass/bulk"
        element={<AuthenticatedLayout><RequireRole roles={["super_admin","admin"]}><LazyPage><BulkOperations /></LazyPage></RequireRole></AuthenticatedLayout>}
      />

      {/* 🎯 Inspections Module - Main Dashboard */}
      <Route
        path="/app/inspections"
        element={<AuthenticatedLayout><LazyPage><InspectionDashboard /></LazyPage></AuthenticatedLayout>}
      />
      <Route
        path="/app/inspections/studio"
        element={<AuthenticatedLayout><RequireRole roles={["super_admin","admin"]}><LazyPage><InspectionStudio /></LazyPage></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/inspections/sync"
        element={<AuthenticatedLayout><LazyPage><InspectionSyncCenter /></LazyPage></AuthenticatedLayout>}
      />

      {/* Inspections - Sub Routes */}
      {/* Template Selection - Always shown first for new inspections */}
      <Route
        path="/app/inspections/new"
        element={<AuthenticatedLayout><LazyPage><TemplateSelectionPage /></LazyPage></AuthenticatedLayout>}
      />
      {/* Inspection Details - Deep linking (must come before capture routes with :id) */}
      <Route 
        path="/app/inspections/:id" 
        element={<AuthenticatedLayout><LazyPage><InspectionDetails /></LazyPage></AuthenticatedLayout>} 
      />
      <Route
        path="/app/inspections/completed"
        element={<AuthenticatedLayout><LazyPage><InspectionsCompleted /></LazyPage></AuthenticatedLayout>}
      />
      <Route
        path="/app/inspections/reports"
        element={<AuthenticatedLayout><LazyPage><InspectionReports /></LazyPage></AuthenticatedLayout>}
      />
      {/* Capture routes - require templateId */}
      <Route
        path="/app/inspections/:templateId/capture"
        element={<AuthenticatedLayout><LazyPage><InspectionCapture /></LazyPage></AuthenticatedLayout>}
      />
      <Route
        path="/app/inspections/:templateId/:vehicleId/capture"
        element={<AuthenticatedLayout><LazyPage><InspectionCapture /></LazyPage></AuthenticatedLayout>}
      />
      {/* Legacy route redirect */}
      <Route 
        path="/inspections/:id" 
        element={<Navigate to="/app/inspections/:id" replace />} 
      />

      {/* 💰 Expenses Module - Enhanced */}
      {/* Expense Details - Deep linking (must come before other routes) */}
      <Route
        path="/app/expenses/:id"
        element={<AuthenticatedLayout><LazyPage><ExpenseDetails /></LazyPage></AuthenticatedLayout>}
      />
      <Route
        path="/app/expenses"
        element={<AuthenticatedLayout><LazyPage><EmployeeExpenseDashboard /></LazyPage></AuthenticatedLayout>}
      />
      <Route
        path="/app/expenses/create"
        element={<AuthenticatedLayout><LazyPage><CreateExpense /></LazyPage></AuthenticatedLayout>}
      />
      <Route
        path="/app/expenses/history"
        element={<AuthenticatedLayout><LazyPage><ExpenseHistory /></LazyPage></AuthenticatedLayout>}
      />
      <Route
        path="/app/expenses/ledger"
        element={<AuthenticatedLayout><LazyPage><EmployeeLedger /></LazyPage></AuthenticatedLayout>}
      />
      <Route
        path="/app/expenses/reconciliation"
        element={<AuthenticatedLayout><LazyPage><LedgerReconciliation /></LazyPage></AuthenticatedLayout>}
      />
      <Route
        path="/app/expenses/advances/:advanceId/ledger"
        element={<AuthenticatedLayout><LazyPage><AdvanceLedgerView /></LazyPage></AuthenticatedLayout>}
      />
      <Route
        path="/app/expenses/categories"
        element={<Navigate to="/app/expenses/analytics?tab=by-category" replace />}
      />
      <Route
        path="/app/expenses/assets"
        element={<Navigate to="/app/expenses/analytics?tab=assets" replace />}
      />
      <Route
        path="/app/expenses/projects"
        element={<Navigate to="/app/expenses/analytics?tab=by-project" replace />}
      />
      <Route
        path="/app/expenses/cashflow"
        element={<Navigate to="/app/expenses/analytics?tab=cashflow" replace />}
      />
      <Route
        path="/app/expenses/approval"
        element={<Navigate to="/app/approvals?tab=expense" replace />}
      />
      <Route
        path="/app/expenses/reports"
        element={<AuthenticatedLayout><RequireRole roles={['super_admin', 'admin']}><LazyPage><ExpenseReports /></LazyPage></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/expenses/accounts"
        element={<Navigate to="/app/expenses/analytics?tab=by-account" replace />}
      />
      <Route
        path="/app/expenses/reconciliation"
        element={<Navigate to="/app/expenses/analytics?tab=reconciliation" replace />}
      />

      {/* Unified Analytics Page */}
      <Route
        path="/app/expenses/analytics"
        element={<AuthenticatedLayout><RequireRole roles={['super_admin', 'admin']}><LazyPage><ExpenseAnalytics /></LazyPage></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/expenses/receipts"
        element={<AuthenticatedLayout><LazyPage><ReceiptsGallery /></LazyPage></AuthenticatedLayout>}
      />

      {/* Float module removed (legacy) */}

      {/* ✅ Unified Approvals Hub */}
      <Route
        path="/app/approvals"
        element={<AuthenticatedLayout><RequireRole roles={['super_admin', 'admin', 'supervisor']}><LazyPage><UnifiedApprovals /></LazyPage></RequireRole></AuthenticatedLayout>}
      />

      {/* 🚨 Alerts Module */}
      <Route
        path="/app/alerts"
        element={<AuthenticatedLayout><RequireRole roles={['super_admin', 'admin', 'supervisor']}><LazyPage><AlertDashboard /></LazyPage></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/notifications"
        element={<AuthenticatedLayout><LazyPage><NotificationsPage /></LazyPage></AuthenticatedLayout>}
      />
      <Route
        path="/app/notifications/preferences"
        element={<AuthenticatedLayout><LazyPage><NotificationPreferences /></LazyPage></AuthenticatedLayout>}
      />

      {/* ⚙️ Settings */}
      <Route
        path="/app/settings/report-branding"
        element={<AuthenticatedLayout><RequireRole roles={['super_admin', 'admin']}><LazyPage><ReportBranding /></LazyPage></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/settings/sessions"
        element={<AuthenticatedLayout><LazyPage><SessionManagement /></LazyPage></AuthenticatedLayout>}
      />

      {/* 🎯 Stockyard Module */}
      <Route
        path="/app/stockyard"
        element={<AuthenticatedLayout><LazyPage><StockyardDashboard /></LazyPage></AuthenticatedLayout>}
      />
      <Route
        path="/app/stockyard/create"
        element={<AuthenticatedLayout><LazyPage><CreateComponentMovement /></LazyPage></AuthenticatedLayout>}
      />
      <Route
        path="/app/stockyard/scan"
        element={<AuthenticatedLayout><LazyPage><StockyardScan /></LazyPage></AuthenticatedLayout>}
      />
      <Route
        path="/app/stockyard/components"
        element={<AuthenticatedLayout><LazyPage><ComponentLedger /></LazyPage></AuthenticatedLayout>}
      />
      <Route
        path="/app/stockyard/components/create"
        element={<Navigate to="/app/stockyard/components?action=create" replace />}
      />
      <Route
        path="/app/stockyard/components/transfers/approvals"
        element={<Navigate to="/app/approvals?tab=transfer" replace />}
      />
      <Route
        path="/app/stockyard/components/cost-analysis"
        element={<Navigate to="/app/stockyard/analytics?tab=cost" replace />}
      />
      <Route
        path="/app/stockyard/components/health"
        element={<Navigate to="/app/stockyard/analytics?tab=health" replace />}
      />
      <Route
        path="/app/stockyard/components/:type/:id/edit"
        element={<Navigate to="/app/stockyard/components/:id?action=edit" replace />}
      />
      <Route
        path="/app/stockyard/components/:type/:id"
        element={<Navigate to="/app/stockyard/components/:id" replace />}
      />
      <Route
        path="/app/stockyard/components/:id"
        element={<AuthenticatedLayout><LazyPage><ComponentDetails /></LazyPage></AuthenticatedLayout>}
      />
      <Route
        path="/app/stockyard/yards/:yardId/map"
        element={<Navigate to="/app/stockyard/:id?tab=map" replace />}
      />
      <Route
        path="/app/stockyard/:id"
        element={<AuthenticatedLayout><LazyPage><StockyardRequestDetails /></LazyPage></AuthenticatedLayout>}
      />
      <Route
        path="/app/stockyard/requests/:requestId/checklist"
        element={<Navigate to="/app/stockyard/:requestId?tab=checklists" replace />}
      />
      <Route
        path="/app/stockyard/buyer-readiness"
        element={<Navigate to="/app/stockyard?tab=readiness" replace />}
      />
      <Route
        path="/app/stockyard/vehicles/:vehicleId/timeline"
        element={<Navigate to="/app/stockyard/:id?tab=timeline" replace />}
      />
      <Route
        path="/app/stockyard/requests/:requestId/documents"
        element={<Navigate to="/app/stockyard/:requestId?tab=documents" replace />}
      />
      <Route
        path="/app/stockyard/requests/:requestId/transporter-bids"
        element={<Navigate to="/app/stockyard/:requestId?tab=bids" replace />}
      />
      <Route
        path="/app/stockyard/vehicles/:vehicleId/profitability"
        element={<Navigate to="/app/stockyard/analytics?tab=profitability" replace />}
      />
      <Route
        path="/app/stockyard/analytics"
        element={<AuthenticatedLayout><LazyPage><StockyardAnalytics /></LazyPage></AuthenticatedLayout>}
      />
      <Route
        path="/app/stockyard/alerts"
        element={<AuthenticatedLayout><LazyPage><StockyardAlertsDashboard /></LazyPage></AuthenticatedLayout>}
      />

      {/* 👥 User Management Module */}
      <Route
        path="/app/admin/users/activity"
        element={<AuthenticatedLayout><RequireRole roles={['super_admin', 'admin']}><LazyPage><UserActivityDashboard /></LazyPage></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/admin/users/capability-matrix"
        element={<AuthenticatedLayout><RequireRole roles={['super_admin', 'admin']}><LazyPage><CapabilityMatrix /></LazyPage></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/admin/users/bulk-operations"
        element={<AuthenticatedLayout><RequireRole roles={['super_admin', 'admin']}><LazyPage><BulkUserOperations /></LazyPage></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/admin/users/:id"
        element={<AuthenticatedLayout><RequireRole roles={['super_admin', 'admin']}><LazyPage><UserDetails /></LazyPage></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/admin/users"
        element={<AuthenticatedLayout><RequireRole roles={['super_admin', 'admin']}><LazyPage><UserManagement /></LazyPage></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/admin/permission-templates"
        element={<AuthenticatedLayout><RequireRole roles={['super_admin', 'admin']}><LazyPage><PermissionTemplates /></LazyPage></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/admin/permission-testing"
        element={<AuthenticatedLayout><RequireRole roles={['super_admin', 'admin']}><LazyPage><PermissionTesting /></LazyPage></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/admin/data-masking-rules"
        element={<AuthenticatedLayout><RequireRole roles={['super_admin', 'admin']}><LazyPage><DataMaskingRules /></LazyPage></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/admin/security"
        element={<AuthenticatedLayout><RequireRole roles={['super_admin', 'admin']}><LazyPage><SecurityDashboard /></LazyPage></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/admin/activity-logs"
        element={<AuthenticatedLayout><RequireRole roles={['super_admin', 'admin']}><LazyPage><ActivityLogs /></LazyPage></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/admin/permission-logs"
        element={<AuthenticatedLayout><RequireRole roles={['super_admin', 'admin']}><LazyPage><PermissionChangeLogs /></LazyPage></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/admin/audit-reports"
        element={<AuthenticatedLayout><RequireRole roles={['super_admin', 'admin']}><LazyPage><AuditReports /></LazyPage></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/admin/compliance"
        element={<AuthenticatedLayout><RequireRole roles={['super_admin', 'admin']}><LazyPage><ComplianceDashboard /></LazyPage></RequireRole></AuthenticatedLayout>}
      />

      {/* 404 Catch-all */}
      <Route 
        path="*" 
        element={<LazyPage><NotFound /></LazyPage>} 
      />
    </Routes>
    </ErrorBoundary>
  );
}