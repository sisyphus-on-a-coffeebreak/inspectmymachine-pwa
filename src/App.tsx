import { Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "@/components/RequireAuth";
import FloatDashboard from "@/pages/FloatDashboard";
import Login from "@/pages/Login";
import InspectionCapture from "@/pages/InspectionCapture";
import InspectionDetails from "@/pages/InspectionDetails";
import InspectionsCompleted from "@/pages/InspectionsCompleted";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      {/* Completed inspections list */}
      <Route
        path="/inspections/completed"
        element={
          <RequireAuth>
            <InspectionsCompleted />
          </RequireAuth>
        }
      />

      {/* Inspection details */}
      <Route
        path="/inspections/:id"
        element={
          <RequireAuth>
            <InspectionDetails />
          </RequireAuth>
        }
      />

      {/* Capture — keep existing path and add a shorter alias */}
      <Route
        path="/app/inspection/:id/capture"
        element={
          <RequireAuth>
            <InspectionCapture />
          </RequireAuth>
        }
      />
      <Route
        path="/capture/:id"
        element={
          <RequireAuth>
            <InspectionCapture />
          </RequireAuth>
        }
      />

      {/* Float dashboard */}
      <Route
        path="/app/float"
        element={
          <RequireAuth>
            <FloatDashboard />
          </RequireAuth>
        }
      />

      <Route path="*" element={<div style={{ padding: 16 }}>Not found</div>} />
    </Routes>
  );
}
