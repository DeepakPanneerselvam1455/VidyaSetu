

import React from 'react';
// FIX: Update imports for react-router-dom v6 compatibility.
// Fix: Splitting imports between react-router and react-router-dom to resolve module export errors.
import { Routes, Route, Navigate } from 'react-router-dom';
import { HashRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import Dashboard from './pages/Dashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentMyCourses from './pages/student/StudentMyCourses';
import StudentQuizList from './pages/student/StudentQuizList';
import StudentQuizView from './pages/student/StudentQuizView';
import StudentProgress from './pages/student/StudentProgress';
import MentorDashboard from './pages/mentor/MentorDashboard';
import MentorCourseManagement from './pages/mentor/MentorCourseManagement';
import MentorCourseDetail from './pages/mentor/MentorCourseDetail';
import MentorStudentProgress from './pages/mentor/MentorStudentProgress';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUserManagement from './pages/admin/AdminUserManagement';
import AdminCreateUser from './pages/admin/AdminCreateUser';
import AdminCourseAnalytics from './pages/admin/AdminCourseAnalytics';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import AdminContentModeration from './pages/admin/AdminContentModeration';
import AdminSecurity from './pages/admin/AdminSecurity';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import MentorAddCourse from './pages/mentor/MentorAddCourse';
import MentorGenerateQuiz from './pages/mentor/MentorGenerateQuiz';
import MentorEditQuiz from './pages/mentor/MentorEditQuiz';
import AdminStudentProgress from './pages/admin/AdminStudentProgress';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
};

const AppRoutes: React.FC = () => {
    const { user } = useAuth();

    return (
        // FIX: Replaced Switch with Routes for react-router-dom v6.
        <Routes>
            {/* FIX: Replaced children with the element prop for react-router-dom v6. */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            {/* FIX: Removed 'exact' prop and switched to 'element' prop for react-router-dom v6. */}
            <Route 
                path="/" 
                element={
                    <ProtectedRoute>
                        <Layout>
                            <Dashboard />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            
            {/* User-specific common routes */}
            <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />


            {/* Student Routes */}
            <Route path="/student/my-courses" element={<ProtectedRoute roles={['student']}><Layout><StudentMyCourses /></Layout></ProtectedRoute>} />
            <Route path="/student/quizzes" element={<ProtectedRoute roles={['student']}><Layout><StudentQuizList /></Layout></ProtectedRoute>} />
            <Route path="/student/quiz/:quizId" element={<ProtectedRoute roles={['student']}><Layout><StudentQuizView /></Layout></ProtectedRoute>} />
            <Route path="/student/progress" element={<ProtectedRoute roles={['student']}><Layout><StudentProgress /></Layout></ProtectedRoute>} />
            {/* FIX: Removed 'exact' prop for react-router-dom v6. */}
            <Route path="/student" element={<ProtectedRoute roles={['student']}><Layout><StudentDashboard /></Layout></ProtectedRoute>} />
            
            {/* "Mentor" is now "Instructor" in the UI */}
            <Route path="/mentor/courses" element={<ProtectedRoute roles={['mentor']}><Layout><MentorCourseManagement /></Layout></ProtectedRoute>} />
            <Route path="/mentor/course/:courseId" element={<ProtectedRoute roles={['mentor']}><Layout><MentorCourseDetail /></Layout></ProtectedRoute>} />
            <Route path="/mentor/add-course" element={<ProtectedRoute roles={['mentor']}><Layout><MentorAddCourse /></Layout></ProtectedRoute>} />
            <Route path="/mentor/generate-quiz" element={<ProtectedRoute roles={['mentor']}><Layout><MentorGenerateQuiz /></Layout></ProtectedRoute>} />
            <Route path="/mentor/quiz/:quizId/edit" element={<ProtectedRoute roles={['mentor']}><Layout><MentorEditQuiz /></Layout></ProtectedRoute>} />
            <Route path="/mentor/progress" element={<ProtectedRoute roles={['mentor']}><Layout><MentorStudentProgress /></Layout></ProtectedRoute>} />
            {/* FIX: Removed 'exact' prop for react-router-dom v6. */}
            <Route path="/mentor" element={<ProtectedRoute roles={['mentor']}><Layout><MentorDashboard /></Layout></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin/users/create" element={<ProtectedRoute roles={['admin']}><Layout><AdminCreateUser /></Layout></ProtectedRoute>} />
            {/* FIX: Removed 'exact' prop for react-router-dom v6. */}
            <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><Layout><AdminUserManagement /></Layout></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute roles={['admin']}><Layout><AdminCourseAnalytics /></Layout></ProtectedRoute>} />
            <Route path="/admin/progress" element={<ProtectedRoute roles={['admin']}><Layout><AdminStudentProgress /></Layout></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute roles={['admin']}><Layout><AdminReports /></Layout></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute roles={['admin']}><Layout><AdminSettings /></Layout></ProtectedRoute>} />
            <Route path="/admin/moderation" element={<ProtectedRoute roles={['admin']}><Layout><AdminContentModeration /></Layout></ProtectedRoute>} />
            <Route path="/admin/security" element={<ProtectedRoute roles={['admin']}><Layout><AdminSecurity /></Layout></ProtectedRoute>} />
            {/* FIX: Removed 'exact' prop for react-router-dom v6. */}
            <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Layout><AdminDashboard /></Layout></ProtectedRoute>} />

            {/* FIX: Replaced Redirect with Navigate for react-router-dom v6. */}
            <Route path="*" element={<Navigate to={user ? '/' : '/login'} />} />
        </Routes>
    );
}


export default App;