import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PdfTemplateProvider } from "@/contexts/PdfTemplateContext";

// Eagerly loaded (initial landing + auth)
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

// Lazy loaded routes
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Customers = lazy(() => import("./pages/Customers"));
const Invoices = lazy(() => import("./pages/Invoices"));
const Recurring = lazy(() => import("./pages/Recurring"));
const CreateInvoice = lazy(() => import("./pages/CreateInvoice"));
const EditInvoice = lazy(() => import("./pages/EditInvoice"));
const InvoicePreview = lazy(() => import("./pages/InvoicePreview"));
const Settings = lazy(() => import("./pages/Settings"));
const Products = lazy(() => import("./pages/Products"));
const AddProduct = lazy(() => import("./pages/AddProduct"));
const PdfTemplateEditor = lazy(() => import("./pages/PdfTemplateEditor"));
const Admin = lazy(() => import("./pages/Admin"));
const Profile = lazy(() => import("./pages/Profile"));
const PerformanceTracker = lazy(() => import("./pages/PerformanceTracker"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ShareInvoice = lazy(() => import("./pages/ShareInvoice"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <PdfTemplateProvider>
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/share/:id" element={<ShareInvoice />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/invoices/new" element={<ProtectedRoute><CreateInvoice /></ProtectedRoute>} />
                  <Route path="/invoices/:id" element={<ProtectedRoute><InvoicePreview /></ProtectedRoute>} />
                  <Route path="/invoices/:id/edit" element={<ProtectedRoute><EditInvoice /></ProtectedRoute>} />
                  <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
                  <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
                  <Route path="/recurring" element={<ProtectedRoute><Recurring /></ProtectedRoute>} />
                  <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
                  <Route path="/products/new" element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                  <Route path="/admin/pdf-editor" element={<ProtectedRoute><PdfTemplateEditor /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/admin/performance" element={<ProtectedRoute><PerformanceTracker /></ProtectedRoute>} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </PdfTemplateProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
