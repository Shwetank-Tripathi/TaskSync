import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // If user is authenticated, redirect to dashboard
  // user will be truthy (user object) if authenticated, false if not, null while loading
  if (user && !loading) {
    return <Navigate to="/rooms" />;
  }

  // Show the page immediately while auth check happens in background
  // This allows login page to render without waiting for API call
  return children;
};

export default PublicRoute;
