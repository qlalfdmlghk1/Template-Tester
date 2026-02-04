import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children: _children }: ProtectedRouteProps) {
  return <Navigate to="/login" replace />;
}

export default ProtectedRoute;
