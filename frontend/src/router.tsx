import { createBrowserRouter, Outlet } from 'react-router-dom';
import App from './App';
import WhyChooseUs from './pages/WhyChooseUs';
import AboutUs from './pages/AboutUs';
import MyOrders from './pages/MyOrders';
import Cart from './pages/Cart';
import OutletMenu from './pages/OutletMenu';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Addresses from './pages/Addresses';
import SupportTicketPage from './pages/SupportTicket';
import FaqsPage from './pages/Faqs';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
import LoginModal from './components/LoginModal';
import SwiggyFloatingCart from './components/SwiggyFloatingCart';

const Layout = () => (
  <ThemeProvider>
    <AuthProvider>
      <CartProvider>
        <OrderProvider>
          <Outlet />
          <SwiggyFloatingCart />
          <LoginModal />
        </OrderProvider>
      </CartProvider>
    </AuthProvider>
  </ThemeProvider>
);

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <App />,
      },
      {
        path: '/why-choose-us',
        element: <WhyChooseUs />,
      },
      {
        path: '/about-us',
        element: <AboutUs />,
      },
      {
        path: '/my-orders',
        element: <MyOrders />,
      },
      {
        path: '/cart',
        element: <Cart />,
      },
      {
        path: '/outlet/:outletId',
        element: <OutletMenu />,
      },
      {
        path: '/admin',
        element: <AdminDashboard />,
      },
      {
        path: '/profile',
        element: <Profile />,
      },
      {
        path: '/addresses',
        element: <Addresses />,
      },
      {
        path: '/support',
        element: <SupportTicketPage />,
      },
      {
        path: '/raise-ticket',
        element: <SupportTicketPage />,
      },
      {
        path: '/faqs',
        element: <FaqsPage />,
      },
    ],
  },
]);
