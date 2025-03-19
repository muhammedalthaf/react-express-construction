import React, { useEffect } from 'react';
import { 
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
  useLocation,
  useHistory,
  useParams
} from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ThemeProvider from './theme/ThemeProvider';
import { getCurrentUser } from './store/slices/authSlice';
import { AppDispatch, RootState } from './store';

// Import components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Import pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import ConstructionSites from './pages/ConstructionSites';
import SiteDetail from './pages/SiteDetail';
import CreateSite from './pages/CreateSite';
import EditSite from './pages/EditSite';
import Profile from './pages/Profile';
import Unauthorized from './pages/Unauthorized';
import ImageAnnotation from './pages/ImageAnnotation';
import ImageAnnotationView from './pages/ImageAnnotationView';
import UploadDroneImage from './pages/UploadDroneImage';

// AuthWrapper component to check authentication status on app load
const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const history = useHistory();
  const location = useLocation();
  const { token, isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  
  useEffect(() => {
    if (token) {
      dispatch(getCurrentUser());
    } else if (!isAuthenticated && !location.pathname.includes('/login') && !location.pathname.includes('/register')) {
      // Redirect to login if not authenticated and not already on login or register page
      history.push('/login');
    }
  }, [dispatch, token, isAuthenticated, location.pathname, history]);
  
  return <>{children}</>;
};

// Add a new component to handle role-based routing
const AnnotationRoute: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { id } = useParams<{ id: string }>();
  
  // If user is admin, show full annotation component
  if (user?.role === 'admin') {
    return <ImageAnnotation />;
  }
  
  // For all other roles, show read-only view
  return <ImageAnnotationView />;
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthWrapper>
          <Switch>
            {/* Public routes */}
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/unauthorized" component={Unauthorized} />
            
            {/* Protected routes with layout */}
            <Route path="/">
              <ProtectedRoute>
                <Layout>
                  <Switch>
                    <Route exact path="/" component={ConstructionSites} />
                    <Route exact path="/sites" component={ConstructionSites} />
                    <Route exact path="/sites/create" component={CreateSite} />
                    <Route exact path="/sites/:id" component={SiteDetail} />
                    <Route exact path="/sites/:id/edit" component={EditSite} />
                    <Route exact path="/sites/:siteId/upload-image" component={UploadDroneImage} />
                    <Route exact path="/profile" component={Profile} />
                    <Route exact path="/annotate/:id" component={AnnotationRoute} />
                    
                    {/* Admin routes */}
                    <Route exact path="/admin">
                      <ProtectedRoute requiredRole="admin">
                        <Dashboard />
                      </ProtectedRoute>
                    </Route>
                    <Route exact path="/admin/users">
                      <ProtectedRoute requiredRole="admin">
                        <div>User Management</div>
                      </ProtectedRoute>
                    </Route>
                    
                    {/* 404 route */}
                    <Route path="/404" component={NotFound} />
                    <Redirect from="*" to="/404" />
                  </Switch>
                </Layout>
              </ProtectedRoute>
            </Route>
          </Switch>
        </AuthWrapper>
      </Router>
    </ThemeProvider>
  );
}

export default App; 