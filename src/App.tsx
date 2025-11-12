// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import RequireAuth, { RequireRole } from "@/components/RequireAuth";
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
import { GatePassDashboard } from './pages/gatepass/GatePassDashboard';
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
import { EmployeeExpenseDashboard } from './pages/expenses/EmployeeExpenseDashboard';
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
import NotFound from './pages/NotFound';

export default function App() {
  return (
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
      <Route 
        path="/inspections/:id" 
        element={<RequireAuth><InspectionDetails /></RequireAuth>} 
      />
      <Route 
        path="/app/inspections/:id" 
        element={<RequireAuth><InspectionDetails /></RequireAuth>} 
      />

      {/* 💰 Expenses Module - Enhanced */}
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

      {/* 👥 User Management Module */}
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
  );
}