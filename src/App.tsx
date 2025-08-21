import { Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import InspectionCapture from "@/pages/InspectionCapture";
import RequireAuth from "@/components/RequireAuth";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/app/inspection/:id/capture"
        element={
          <RequireAuth>
            <InspectionCapture />
          </RequireAuth>
        }
      />
     <Route path="*" element={<Navigate to="/app/float" replace />} />
    </Routes>
  );
}
