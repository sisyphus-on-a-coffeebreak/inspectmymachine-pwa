import { Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "@/components/RequireAuth";
import FloatDashboard from "@/pages/FloatDashboard";
import InspectionCapture from "@/pages/InspectionCapture";
import Login from "@/pages/Login";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/app/float"
        element={<RequireAuth><FloatDashboard /></RequireAuth>}
      />
      <Route
        path="/app/inspection/:id/capture"
        element={<RequireAuth><InspectionCapture /></RequireAuth>}
      />
      <Route path="*" element={<div style={{padding:16}}>Not found</div>} />
    </Routes>
  );
}
