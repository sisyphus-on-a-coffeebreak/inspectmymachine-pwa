// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "@/components/RequireAuth";
import FloatDashboard from "@/pages/FloatDashboard";
import Login from "@/pages/Login";
import InspectionCapture from "@/pages/InspectionCapture";
import InspectionDetails from "@/pages/InspectionDetails";
import InspectionsCompleted from "@/pages/InspectionsCompleted";
import InspectionsNew from "@/pages/InspectionsNew";

export const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/inspections/:id" element={<InspectionDetails />} />
      <Route path="/app/inspections/new" element={<RequireAuth><InspectionsNew /></RequireAuth>} />
      <Route
        path="/app/float"
        element={
          <RequireAuth>
            <FloatDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/app/inspection/:id/capture"
        element={
          <RequireAuth>
            <InspectionCapture />
          </RequireAuth>
        }
      />
      <Route
        path="/app/inspections/completed"
        element={
          <RequireAuth>
            <InspectionsCompleted />
          </RequireAuth>
        }
      />
      <Route path="*" element={<div style={{ padding: 16 }}>Not found</div>} />
    </Routes>
  );
};

export default App;  // ✅ force a default export
