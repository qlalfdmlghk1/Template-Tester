import { Navigate } from "react-router-dom";

export default function IndexPage() {
  return <Navigate to="/wrong-notes" replace />;
}
