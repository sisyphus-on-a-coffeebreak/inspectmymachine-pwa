// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import RequireAuth, { RequireRole } from "@/components/RequireAuth";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
// import FloatDashboard from "@/pages/FloatDashboard";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import { InspectionCapture } from "@/pages/inspections/InspectionCapture";
import { InspectionDetails } from './pages/inspections/InspectionDetails';
import InspectionsCompleted from "@/pages/InspectionsCompleted";
import { InspectionDashboard } from './pages/inspections/InspectionDashboard';
import { InspectionStudio } from './pages/inspections/InspectionStudio';
import { InspectionSyncCenter } from './pages/inspections/InspectionSyncCenter';
import { InspectionReports } from './pages/inspections/InspectionReports';
import AdminStockyard from "@/pages/AdminStockyard";
import { StockyardDashboard } from './pages/stockyard/StockyardDashboard';
import { CreateComponentMovement } from './pages/stockyard/CreateComponentMovement';
import { StockyardRequestDetails } from './pages/stockyard/StockyardRequestDetails';
import { StockyardScan } from './pages/stockyard/StockyardScan';
import { ComponentLedger } from './pages/stockyard/ComponentLedger';
import { CreateComponent } from './pages/stockyard/CreateComponent';
import { ComponentDetails } from './pages/stockyard/ComponentDetails';
import { EditComponent } from './pages/stockyard/EditComponent';
import { ComponentTransferApproval } from './pages/stockyard/ComponentTransferApproval';
import { ComponentCostAnalysis } from './pages/stockyard/ComponentCostAnalysis';
import { ComponentHealthDashboard } from './pages/stockyard/ComponentHealthDashboard';
import { YardMap } from './pages/stockyard/YardMap';
import { ChecklistView } from './pages/stockyard/ChecklistView';
import { BuyerReadinessBoard } from './pages/stockyard/BuyerReadinessBoard';
import { VehicleTimeline } from './pages/stockyard/VehicleTimeline';
import { ComplianceDocuments } from './pages/stockyard/ComplianceDocuments';
import { TransporterBids } from './pages/stockyard/TransporterBids';
import { ProfitabilityDashboard } from './pages/stockyard/ProfitabilityDashboard';
import { StockyardAlertsDashboard } from './pages/stockyard/StockyardAlertsDashboard';
import { GatePassDashboard } from './pages/gatepass/GatePassDashboard';
import { GatePassDetails } from './pages/gatepass/GatePassDetails';
import { CreateVisitorPass } from './pages/gatepass/CreateVisitorPass';
import { CreateVehicleMovement } from './pages/gatepass/CreateVehicleMovement';
import { GuardRegister } from './pages/gatepass/GuardRegister';
import { GatePassReports } from './pages/gatepass/GatePassReports';
import { PassTemplates } from './pages/gatepass/PassTemplates';
import { VisitorManagement } from './pages/gatepass/VisitorManagement';
import { GatePassCalendar } from './pages/gatepass/GatePassCalendar';
import { PassValidation } from './pages/gatepass/PassValidation';
import { PassApproval } from './pages/gatepass/PassApproval';
import { BulkOperations } from './pages/gatepass/BulkOperations';
import { AlertDashboard } from './pages/alerts/AlertDashboard';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { EmployeeExpenseDashboard } from './pages/expenses/EmployeeExpenseDashboard';
import { ExpenseDetails } from './pages/expenses/ExpenseDetails';
import { CreateExpense } from './pages/expenses/CreateExpense';
import { ExpenseHistory } from './pages/expenses/ExpenseHistory';
import { AssetManagementDashboard } from './pages/expenses/AssetManagementDashboard';
import { ProjectManagementDashboard } from './pages/expenses/ProjectManagementDashboard';
import { CashflowAnalysisDashboard } from './pages/expenses/CashflowAnalysisDashboard';
import { ExpenseApproval } from './pages/expenses/ExpenseApproval';
import { ExpenseReports } from './pages/expenses/ExpenseReports';
import { ReceiptsGallery } from './pages/expenses/ReceiptsGallery';
import { AccountsDashboard } from './pages/expenses/AccountsDashboard';
import UserManagement from './pages/admin/UserManagement';
import { UserDetails } from './pages/admin/UserDetails';
import { UserActivityDashboard } from './pages/admin/UserActivityDashboard';
import { CapabilityMatrix } from './pages/admin/CapabilityMatrix';
import { BulkUserOperations } from './pages/admin/BulkUserOperations';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
      {/* Root redirects to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Public routes */}
      <Route path="/login" element={<Login />} />

      {/* Main Dashboard */}
      <Route
        path="/dashboard"
        element={<AuthenticatedLayout><Dashboard /></AuthenticatedLayout>}
      />

      {/* 🚪 Gate Pass Module - UPDATED */}
      {/* Gate Pass Details - Deep linking (must come before dashboard) */}
      <Route
        path="/app/gate-pass/:id"
        element={<AuthenticatedLayout><GatePassDetails /></AuthenticatedLayout>}
      />
      <Route
        path="/app/gate-pass"
        element={<AuthenticatedLayout><GatePassDashboard /></AuthenticatedLayout>}
      />
      <Route
        path="/app/gate-pass/create-visitor"
        element={<AuthenticatedLayout><CreateVisitorPass /></AuthenticatedLayout>}
      />
      <Route
        path="/app/gate-pass/create-vehicle"
        element={<AuthenticatedLayout><CreateVehicleMovement /></AuthenticatedLayout>}
      />
      <Route
        path="/app/gate-pass/guard-register"
        element={<AuthenticatedLayout><GuardRegister /></AuthenticatedLayout>}
      />
      <Route
        path="/app/gate-pass/reports"
        element={<AuthenticatedLayout><RequireRole roles={["super_admin","admin"]}><GatePassReports /></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/gate-pass/templates"
        element={<AuthenticatedLayout><RequireRole roles={["super_admin","admin"]}><PassTemplates /></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/gate-pass/visitors"
        element={<AuthenticatedLayout><VisitorManagement /></AuthenticatedLayout>}
      />
      <Route
        path="/app/gate-pass/calendar"
        element={<AuthenticatedLayout><GatePassCalendar /></AuthenticatedLayout>}
      />
      <Route
        path="/app/gate-pass/validation"
        element={<AuthenticatedLayout><RequireRole roles={["super_admin","admin","supervisor","guard"]}><PassValidation /></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/gate-pass/approval"
        element={<AuthenticatedLayout><RequireRole roles={["super_admin","admin","supervisor"]}><PassApproval /></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/gate-pass/bulk"
        element={<AuthenticatedLayout><RequireRole roles={["super_admin","admin"]}><BulkOperations /></RequireRole></AuthenticatedLayout>}
      />

      {/* 🎯 Inspections Module - Main Dashboard */}
      <Route
        path="/app/inspections"
        element={<AuthenticatedLayout><InspectionDashboard /></AuthenticatedLayout>}
      />
      <Route
        path="/app/inspections/studio"
        element={<AuthenticatedLayout><RequireRole roles={["super_admin","admin"]}><InspectionStudio /></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/inspections/sync"
        element={<AuthenticatedLayout><InspectionSyncCenter /></AuthenticatedLayout>}
      />

      {/* Inspections - Sub Routes */}
      {/* Inspection Details - Deep linking (must come before capture routes with :id) */}
      <Route 
        path="/app/inspections/:id" 
        element={<AuthenticatedLayout><InspectionDetails /></AuthenticatedLayout>} 
      />
      <Route
        path="/app/inspections/completed"
        element={<AuthenticatedLayout><InspectionsCompleted /></AuthenticatedLayout>}
      />
      <Route
        path="/app/inspections/reports"
        element={<AuthenticatedLayout><InspectionReports /></AuthenticatedLayout>}
      />
      <Route
        path="/app/inspections/new"
        element={<AuthenticatedLayout><InspectionCapture /></AuthenticatedLayout>}
      />
      <Route
        path="/app/inspections/:templateId/capture"
        element={<AuthenticatedLayout><InspectionCapture /></AuthenticatedLayout>}
      />
      <Route
        path="/app/inspections/:templateId/:vehicleId/capture"
        element={<AuthenticatedLayout><InspectionCapture /></AuthenticatedLayout>}
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
        element={<AuthenticatedLayout><ExpenseDetails /></AuthenticatedLayout>}
      />
      <Route
        path="/app/expenses"
        element={<AuthenticatedLayout><EmployeeExpenseDashboard /></AuthenticatedLayout>}
      />
      <Route
        path="/app/expenses/create"
        element={<AuthenticatedLayout><CreateExpense /></AuthenticatedLayout>}
      />
      <Route
        path="/app/expenses/history"
        element={<AuthenticatedLayout><ExpenseHistory /></AuthenticatedLayout>}
      />
      <Route
        path="/app/expenses/assets"
        element={<AuthenticatedLayout><AssetManagementDashboard /></AuthenticatedLayout>}
      />
      <Route
        path="/app/expenses/projects"
        element={<AuthenticatedLayout><ProjectManagementDashboard /></AuthenticatedLayout>}
      />
      <Route
        path="/app/expenses/cashflow"
        element={<AuthenticatedLayout><CashflowAnalysisDashboard /></AuthenticatedLayout>}
      />
      <Route
        path="/app/expenses/approval"
        element={<AuthenticatedLayout><RequireRole roles={['super_admin', 'admin']}><ExpenseApproval /></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/expenses/reports"
        element={<AuthenticatedLayout><RequireRole roles={['super_admin', 'admin']}><ExpenseReports /></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/expenses/accounts"
        element={<AuthenticatedLayout><RequireRole roles={['super_admin', 'admin']}><AccountsDashboard /></RequireRole></AuthenticatedLayout>}
      />

      {/* Aliases to avoid 404s from dashboard quick links */}
      <Route
        path="/app/expenses/analytics"
        element={<AuthenticatedLayout><RequireRole roles={['super_admin', 'admin']}><ExpenseReports /></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/expenses/receipts"
        element={<AuthenticatedLayout><ReceiptsGallery /></AuthenticatedLayout>}
      />

      {/* Float module removed (legacy) */}

      {/* 🚨 Alerts Module */}
      <Route
        path="/app/alerts"
        element={<AuthenticatedLayout><RequireRole roles={['super_admin', 'admin', 'supervisor']}><AlertDashboard /></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/notifications"
        element={<AuthenticatedLayout><NotificationsPage /></AuthenticatedLayout>}
      />

      {/* 🎯 Stockyard Module */}
      <Route
        path="/app/stockyard"
        element={<AuthenticatedLayout><StockyardDashboard /></AuthenticatedLayout>}
      />
      <Route
        path="/app/stockyard/create"
        element={<AuthenticatedLayout><CreateComponentMovement /></AuthenticatedLayout>}
      />
      <Route
        path="/app/stockyard/:id"
        element={<AuthenticatedLayout><StockyardRequestDetails /></AuthenticatedLayout>}
      />
      <Route
        path="/app/stockyard/scan"
        element={<AuthenticatedLayout><StockyardScan /></AuthenticatedLayout>}
      />
      <Route
        path="/app/stockyard/components"
        element={<AuthenticatedLayout><ComponentLedger /></AuthenticatedLayout>}
      />
      <Route
        path="/app/stockyard/components/create"
        element={<AuthenticatedLayout><CreateComponent /></AuthenticatedLayout>}
      />
      <Route
        path="/app/stockyard/components/:type/:id/edit"
        element={<AuthenticatedLayout><EditComponent /></AuthenticatedLayout>}
      />
      <Route
        path="/app/stockyard/components/:type/:id"
        element={<AuthenticatedLayout><ComponentDetails /></AuthenticatedLayout>}
      />
      <Route
        path="/app/stockyard/components/transfers/approvals"
        element={<AuthenticatedLayout><ComponentTransferApproval /></AuthenticatedLayout>}
      />
      <Route
        path="/app/stockyard/components/cost-analysis"
        element={<AuthenticatedLayout><ComponentCostAnalysis /></AuthenticatedLayout>}
      />
      <Route
        path="/app/stockyard/components/health"
        element={<AuthenticatedLayout><ComponentHealthDashboard /></AuthenticatedLayout>}
      />
      <Route
        path="/app/stockyard/yards/:yardId/map"
        element={<AuthenticatedLayout><YardMap /></AuthenticatedLayout>}
      />
      <Route
        path="/app/stockyard/requests/:requestId/checklist"
        element={<AuthenticatedLayout><ChecklistView /></AuthenticatedLayout>}
      />
      <Route
        path="/app/stockyard/buyer-readiness"
        element={<AuthenticatedLayout><BuyerReadinessBoard /></AuthenticatedLayout>}
      />
      <Route
        path="/app/stockyard/vehicles/:vehicleId/timeline"
        element={<AuthenticatedLayout><VehicleTimeline /></AuthenticatedLayout>}
      />
      <Route
        path="/app/stockyard/requests/:requestId/documents"
        element={<AuthenticatedLayout><ComplianceDocuments /></AuthenticatedLayout>}
      />
      <Route
        path="/app/stockyard/requests/:requestId/transporter-bids"
        element={<AuthenticatedLayout><TransporterBids /></AuthenticatedLayout>}
      />
      <Route
        path="/app/stockyard/vehicles/:vehicleId/profitability"
        element={<AuthenticatedLayout><ProfitabilityDashboard /></AuthenticatedLayout>}
      />
      <Route
        path="/app/stockyard/alerts"
        element={<AuthenticatedLayout><StockyardAlertsDashboard /></AuthenticatedLayout>}
      />

      {/* 👥 User Management Module */}
      <Route
        path="/app/admin/users/activity"
        element={<AuthenticatedLayout><RequireRole roles={['super_admin', 'admin']}><UserActivityDashboard /></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/admin/users/capability-matrix"
        element={<AuthenticatedLayout><RequireRole roles={['super_admin', 'admin']}><CapabilityMatrix /></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/admin/users/bulk-operations"
        element={<AuthenticatedLayout><RequireRole roles={['super_admin', 'admin']}><BulkUserOperations /></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/admin/users/:id"
        element={<AuthenticatedLayout><RequireRole roles={['super_admin', 'admin']}><UserDetails /></RequireRole></AuthenticatedLayout>}
      />
      <Route
        path="/app/admin/users"
        element={<AuthenticatedLayout><RequireRole roles={['super_admin', 'admin']}><UserManagement /></RequireRole></AuthenticatedLayout>}
      />

      {/* 404 Catch-all */}
      <Route 
        path="*" 
        element={<NotFound />} 
      />
    </Routes>
    </ErrorBoundary>
  );
}