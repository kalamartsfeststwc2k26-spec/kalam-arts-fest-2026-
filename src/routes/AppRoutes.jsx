import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppShell from '../layout/AppShell';
import HomePage from '../pages/HomePage';
import { EventsPage, EventDetailPage } from '../pages/EventsPages';
import LeaderboardPage from '../pages/LeaderboardPage';
import ResultsPage from '../pages/ResultsPage';
import { TeamsPage, TeamDetailPage } from '../pages/TeamsPages';
import AnnouncementsPage from '../pages/AnnouncementsPage';
import SchedulePage from '../pages/SchedulePage';
import SearchPage from '../pages/SearchPage';
import CommitteePage from '../pages/CommitteePage';
import ContactPage from '../pages/ContactPage';
import AboutPage from '../pages/AboutPage';
import RulesPage from '../pages/RulesPage';
import { AdminLoginPage, AdminDashboardPage } from '../pages/AdminPages';
import NotFoundPage from '../pages/NotFoundPage';

const router = createBrowserRouter([{ element: <AppShell />, children: [
  { path: '/', element: <HomePage /> },
  { path: '/events', element: <EventsPage /> },
  { path: '/leaderboard', element: <LeaderboardPage /> },
  { path: '/results', element: <ResultsPage /> },
  { path: '/teams', element: <TeamsPage /> },
  { path: '/announcements', element: <AnnouncementsPage /> },
  { path: '/schedule', element: <SchedulePage /> },
  { path: '/search', element: <SearchPage /> },
  { path: '/committee', element: <CommitteePage /> },
  { path: '/contact', element: <ContactPage /> },
  { path: '/about', element: <AboutPage /> },
  { path: '/events/:id', element: <EventDetailPage /> },
  { path: '/teams/:id', element: <TeamDetailPage /> },
  { path: '/rules', element: <RulesPage /> },
  { path: '/admin/login', element: <AdminLoginPage /> },
  { path: '/admin/dashboard', element: <AdminDashboardPage /> },
  { path: '*', element: <NotFoundPage /> },
]}]);
export default function AppRoutes() { return <RouterProvider router={router} />; }
