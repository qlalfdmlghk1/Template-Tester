import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Firebase 로직 전부 빼고 바로 로그인으로 보내기
  return <Navigate to="/login" replace />;
}

export default ProtectedRoute;
