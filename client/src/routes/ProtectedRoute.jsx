import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles = [] }) {
    const location = useLocation();

    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    // No authentication information
    if (!token || !userData) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location.pathname }}
            />
        );
    }

    let user;

    try {
        user = JSON.parse(userData);
    } catch (error) {
        console.error("Invalid user data:", error);

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location.pathname }}
            />
        );
    }

    // User object must contain a role
    if (!user || !user.role) {
        console.error("Authenticated user has no role");

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location.pathname }}
            />
        );
    }

    // Normalize role
    const userRole = String(user.role).toUpperCase();

    // Check authorization
    if (
        allowedRoles.length > 0 &&
        !allowedRoles.includes(userRole)
    ) {
        switch (userRole) {
            case "STUDENT":
                return <Navigate to="/student" replace />;

            case "INSTRUCTOR":
                return <Navigate to="/instructor" replace />;

            case "ADMIN":
                return <Navigate to="/admin" replace />;

            default:
                localStorage.removeItem("token");
                localStorage.removeItem("user");

                return <Navigate to="/login" replace />;
        }
    }

    return children;
}

export default ProtectedRoute;