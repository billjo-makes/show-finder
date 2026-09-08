import { Navigate, Route, Routes } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { BrowsePage } from "./pages/BrowsePage";
import { TopStreamingPage } from "./pages/TopStreamingPage";
import { TitleDetailPage } from "./pages/TitleDetailPage";
import { ForYouPage } from "./pages/ForYouPage";
import { WatchlistPage } from "./pages/WatchlistPage";
import { AccountPage } from "./pages/AccountPage";
import { ProfilePickerPage } from "./pages/ProfilePickerPage";
import { ManageProfilesPage } from "./pages/ManageProfilesPage";

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <BrowsePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/title/:mediaType/:id"
          element={
            <ProtectedRoute>
              <TitleDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/top-streaming"
          element={
            <ProtectedRoute>
              <TopStreamingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/for-you"
          element={
            <ProtectedRoute>
              <ForYouPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/watchlist"
          element={
            <ProtectedRoute>
              <WatchlistPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profiles/select"
          element={
            <ProtectedRoute requireProfile={false}>
              <ProfilePickerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profiles"
          element={
            <ProtectedRoute requireProfile={false}>
              <ManageProfilesPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
