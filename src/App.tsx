// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import RequireAuth, { RequireRole } from "@/components/RequireAuth";
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
import AdminStockyard from "@/pages/AdminStockyard";
import { StockyardDashboard } from './pages/stockyard/StockyardDashboard';
import { CreateStockyardRequest } from './pages/stockyard/CreateStockyardRequest';
import { StockyardRequestDetails } from './pages/stockyard/StockyardRequestDetails';
import { StockyardScan } from './pages/stockyard/StockyardScan';
import { ComponentLedger } from './pages/stockyard/ComponentLedger';
import { CreateComponent } from './pages/stockyard/CreateComponent';
import { ComponentDetails } from './pages/stockyard/ComponentDetails';
import { EditComponent } from './pages/stockyard/EditComponent';
import { ComponentTransferApproval } from './pages/stockyard/ComponentTransferApproval';
import { ComponentCostAnalysis } from './pages/stockyard/ComponentCostAnalysis';
import { ComponentHealthDashboard } from './pages/stockyard/ComponentHealthDashboard';
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
        element={<RequireAuth><Dashboard /></RequireAuth>}
      />

      {/* 🚪 Gate Pass Module - UPDATED */}
      {/* Gate Pass Details - Deep linking (must come before dashboard) */}
      <Route
        path="/app/gate-pass/:id"
        element={<RequireAuth><GatePassDetails /></RequireAuth>}
      />
      <Route
        path="/app/gate-pass"
        element={<RequireAuth><GatePassDashboard /></RequireAuth>}
      />
      <Route
        path="/app/gate-pass/create-visitor"
        element={<RequireAuth><CreateVisitorPass /></RequireAuth>}
      />
      <Route
        path="/app/gate-pass/create-vehicle"
        element={<RequireAuth><CreateVehicleMovement /></RequireAuth>}
      />
      <Route
        path="/app/gate-pass/guard-register"
        element={<RequireAuth><GuardRegister /></RequireAuth>}
      />
      <Route
        path="/app/gate-pass/reports"
        element={<RequireRole roles={["super_admin","admin"]}><GatePassReports /></RequireRole>}
      />
      <Route
        path="/app/gate-pass/templates"
        element={<RequireRole roles={["super_admin","admin"]}><PassTemplates /></RequireRole>}
      />
      <Route
        path="/app/gate-pass/visitors"
        element={<RequireAuth><VisitorManagement /></RequireAuth>}
      />
      <Route
        path="/app/gate-pass/calendar"
        element={<RequireAuth><GatePassCalendar /></RequireAuth>}
      />
      <Route
        path="/app/gate-pass/validation"
        element={<RequireRole roles={["super_admin","admin","supervisor","guard"]}><PassValidation /></RequireRole>}
      />
      <Route
        path="/app/gate-pass/approval"
        element={<RequireRole roles={["super_admin","admin","supervisor"]}><PassApproval /></RequireRole>}
      />
      <Route
        path="/app/gate-pass/bulk"
        element={<RequireRole roles={["super_admin","admin"]}><BulkOperations /></RequireRole>}
      />

      {/* 🎯 Inspections Module - Main Dashboard */}
      <Route
        path="/app/inspections"
        element={<RequireAuth><InspectionDashboard /></RequireAuth>}
      />
      <Route
        path="/app/inspections/studio"
        element={<RequireRole roles={["super_admin","admin"]}><InspectionStudio /></RequireRole>}
      />
      <Route
        path="/app/inspections/sync"
        element={<RequireAuth><InspectionSyncCenter /></RequireAuth>}
      />

      {/* Inspections - Sub Routes */}
      {/* Inspection Details - Deep linking (must come before capture routes with :id) */}
      <Route 
        path="/app/inspections/:id" 
        element={<RequireAuth><InspectionDetails /></RequireAuth>} 
      />
      <Route
        path="/app/inspections/completed"
        element={<RequireAuth><InspectionsCompleted /></RequireAuth>}
      />
      <Route
        path="/app/inspections/new"
        element={<RequireAuth><InspectionCapture /></RequireAuth>}
      />
      <Route
        path="/app/inspections/:templateId/capture"
        element={<RequireAuth><InspectionCapture /></RequireAuth>}
      />
      <Route
        path="/app/inspections/:templateId/:vehicleId/capture"
        element={<RequireAuth><InspectionCapture /></RequireAuth>}
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
        element={<RequireAuth><ExpenseDetails /></RequireAuth>}
      />
      <Route
        path="/app/expenses"
        element={<RequireAuth><EmployeeExpenseDashboard /></RequireAuth>}
      />
      <Route
        path="/app/expenses/create"
        element={<RequireAuth><CreateExpense /></RequireAuth>}
      />
      <Route
        path="/app/expenses/history"
        element={<RequireAuth><ExpenseHistory /></RequireAuth>}
      />
      <Route
        path="/app/expenses/assets"
        element={<RequireAuth><AssetManagementDashboard /></RequireAuth>}
      />
      <Route
        path="/app/expenses/projects"
        element={<RequireAuth><ProjectManagementDashboard /></RequireAuth>}
      />
      <Route
        path="/app/expenses/cashflow"
        element={<RequireAuth><CashflowAnalysisDashboard /></RequireAuth>}
      />
      <Route
        path="/app/expenses/approval"
        element={<RequireAuth><RequireRole roles={['super_admin', 'admin']}><ExpenseApproval /></RequireRole></RequireAuth>}
      />
      <Route
        path="/app/expenses/reports"
        element={<RequireAuth><RequireRole roles={['super_admin', 'admin']}><ExpenseReports /></RequireRole></RequireAuth>}
      />
      <Route
        path="/app/expenses/accounts"
        element={<RequireAuth><RequireRole roles={['super_admin', 'admin']}><AccountsDashboard /></RequireRole></RequireAuth>}
      />

      {/* Aliases to avoid 404s from dashboard quick links */}
      <Route
        path="/app/expenses/analytics"
        element={<RequireAuth><RequireRole roles={['super_admin', 'admin']}><ExpenseReports /></RequireRole></RequireAuth>}
      />
      <Route
        path="/app/expenses/receipts"
        element={<RequireAuth><ReceiptsGallery /></RequireAuth>}
      />

      {/* Float module removed (legacy) */}

      {/* 🚨 Alerts Module */}
      <Route
        path="/app/alerts"
        element={<RequireAuth><RequireRole roles={['super_admin', 'admin', 'supervisor']}><AlertDashboard /></RequireRole></RequireAuth>}
      />
      <Route
        path="/app/notifications"
        element={<RequireAuth><NotificationsPage /></RequireAuth>}
      />

      {/* 🎯 Stockyard Module */}
      <Route
        path="/app/stockyard"
        element={<RequireAuth><StockyardDashboard /></RequireAuth>}
      />
      <Route
        path="/app/stockyard/create"
        element={<RequireAuth><CreateStockyardRequest /></RequireAuth>}
      />
      <Route
        path="/app/stockyard/:id"
        element={<RequireAuth><StockyardRequestDetails /></RequireAuth>}
      />
      <Route
        path="/app/stockyard/scan"
        element={<RequireAuth><StockyardScan /></RequireAuth>}
      />
      <Route
        path="/app/stockyard/components"
        element={<RequireAuth><ComponentLedger /></RequireAuth>}
      />
      <Route
        path="/app/stockyard/components/create"
        element={<RequireAuth><CreateComponent /></RequireAuth>}
      />
      <Route
        path="/app/stockyard/components/:type/:id/edit"
        element={<RequireAuth><EditComponent /></RequireAuth>}
      />
      <Route
        path="/app/stockyard/components/:type/:id"
        element={<RequireAuth><ComponentDetails /></RequireAuth>}
      />
      <Route
        path="/app/stockyard/components/transfers/approvals"
        element={<RequireAuth><ComponentTransferApproval /></RequireAuth>}
      />
      <Route
        path="/app/stockyard/components/cost-analysis"
        element={<RequireAuth><ComponentCostAnalysis /></RequireAuth>}
      />
      <Route
        path="/app/stockyard/components/health"
        element={<RequireAuth><ComponentHealthDashboard /></RequireAuth>}
      />

      {/* 👥 User Management Module */}
      <Route
        path="/app/admin/users/activity"
        element={<RequireAuth><RequireRole roles={['super_admin', 'admin']}><UserActivityDashboard /></RequireRole></RequireAuth>}
      />
      <Route
        path="/app/admin/users/capability-matrix"
        element={<RequireAuth><RequireRole roles={['super_admin', 'admin']}><CapabilityMatrix /></RequireRole></RequireAuth>}
      />
      <Route
        path="/app/admin/users/bulk-operations"
        element={<RequireAuth><RequireRole roles={['super_admin', 'admin']}><BulkUserOperations /></RequireRole></RequireAuth>}
      />
      <Route
        path="/app/admin/users/:id"
        element={<RequireAuth><RequireRole roles={['super_admin', 'admin']}><UserDetails /></RequireRole></RequireAuth>}
      />
      <Route
        path="/app/admin/users"
        element={<RequireAuth><RequireRole roles={['super_admin', 'admin']}><UserManagement /></RequireRole></RequireAuth>}
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