// 📄 File: src/App.jsx

import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./pages/auth/context/AuthContext";

// 🔐 Guards
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRouteGuard from "./routes/AdminRouteGuard";
import FeatureGuard from "./components/FeatureAccess/FeatureGuard";

// 🔑 Feature Keys
import { FEATURE_KEYS } from "./components/FeatureAccess/featureKeyConfig";

// Public Pages
import Login from "./pages/auth/Login";
import BusinessSignup from "./pages/auth/BusinessSignup";
import PendingApproval from "./pages/auth/PendingApproval";
import NoAccess from "./pages/NoAccess";

// Layout
import AppLayout from "./components/layout/AppLayout";

// Workspaces
import CrmWorkspacePage from "./pages/Workspaces/CrmWorkspacePage";
import CatalogWorkspacePage from "./pages/Workspaces/CatalogWorkspacePage";
import CampaignWorkspacePage from "./pages/Workspaces/CampaignWorkspacePage";
import AdminWorkspacePage from "./pages/Workspaces/AdminWorkspacePage";
import FlowBuilderWorkspace from "./pages/Workspaces/FlowBuilderWorkspace";
import InsightsWorkspacePage from "./pages/Workspaces/InsightsWorkspacePage";
import MessagingWorkspacePage from "./pages/Workspaces/MessagingWorkspacePage";
import AutomationWorkspace from "./pages/Workspaces/AutomationWorkspace";

// CRM
import Contacts from "./pages/Contacts/Contacts";
import Tags from "./pages/Tags/Tags";
import Reminders from "./pages/Reminders/Reminders";
import NotesWrapper from "./pages/Notes/NotesWrapper";
import LeadTimeline from "./pages/CTATimeline/LeadTimeline";

// Catalog
import ProductCatalog from "./pages/Businesses/ProductCatalog";
import ProductForm from "./pages/Businesses/ProductForm";
import CatalogDashboard from "./pages/Businesses/CatalogDashboard";
import BusinessApprovals from "./pages/Businesses/BusinessApprovals";

// Campaigns
import CampaignList from "./pages/Campaigns/CampaignList";
import CampaignSendLogs from "./pages/Campaigns/CampaignSendLogs";
import CampaignCreateSingle from "./pages/Campaigns/CampaignCreateSingle";
import CampaignDashboard from "./pages/Campaigns/Analytics/CampaignDashboard";
import CTAManagement from "./pages/CTAManagement/CTAManagement";
import ImageCampaignPage from "./pages/Campaigns/ImageCampaignPage";
import ImageCampaignDetailPage from "./pages/Campaigns/ImageCampaignDetailPage";
import ImageCampaignEditPage from "./pages/Campaigns/ImageCampaignEditPage";
import AssignContactsPage from "./pages/Campaigns/AssignContactsPage";
import RecipientsListPage from "./pages/Campaigns/components/RecipientsListPage";
import CampaignBuilderPage from "./pages/Campaigns/CampaignBuilderPage";
import TemplateCampaignList from "./pages/Campaigns/TemplateCampaignList";
import CampaignWizard from "./pages/Campaigns/CampaignWizard";
import ImageCampaignListPage from "./pages/Campaigns/ImageCampaignListPage";
// Messaging
import SendMessagePage from "./pages/Messaging/SendMessagePage";
import SendTextMessagePage from "./pages/WhatsAppMessageEngine/SendTextMessagePage";
import SendTemplateMessagePage from "./pages/WhatsAppMessageEngine/SendTemplateMessagePage";
import DirectMessageHistory from "./pages/ReportingModule/DirectMessageHistory";

// Admin Tools
import FeatureToggles from "./pages/admin/FeatureAccess/FeatureToggles";
import PlanManager from "./pages/admin/PlanManager";
import UserPermissionsPage from "./pages/UserPermissions/UserPermissions";

// Dev Tools / Tracking
import CTATester from "./pages/DevTools/CTATester";
import FailedWebhookLogs from "./pages/Tracking/FailedWebhookLogs";
import WebhookSettings from "./pages/Tracking/WebhookSettings";
import TrackingViewer from "./pages/Tracking/TrackingViewer";
import TrackingLogDetail from "./pages/Tracking/TrackingLogDetail";

// Flow Builder
import CTAFlowVisualBuilder from "./pages/CTAFlowVisualBuilder/CTAFlowVisualBuilder";
import PublishedFlowView from "./pages/CTAFlowVisualBuilder/PublishedFlowView";
import CTAFlowManager from "./pages/CTAFlowVisualBuilder/CTAFlowManager";
import FlowAnalyticsDashboard from "./pages/FlowAnalytics/FlowAnalyticsDashboard";

// Inbox & Automation (now mapped)
import InboxWrapper from "./pages/Inbox/InboxWrapper";
import AutoReplyBuilder from "./pages/AutoReplyBuilder/AutoReplyBuilder";
import AutoReplyFlowManager from "./pages/AutoReplyBuilder/AutoReplyFlowManager";

// Misc
import ProfileCompletion from "./pages/Businesses/ProfileCompletion";
import UpgradePlanPage from "./pages/Plans/UpgradePlanPage";
import WhatsAppSettings from "./pages/WhatsAppSettings/WhatsAppSettings";
import FeatureTogglePage from "./pages/FeatureAccess/FeatureTogglePage";
import PreviewTest from "./pages/PreviewTest";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<BusinessSignup />} />
        <Route path="/pending-approval" element={<PendingApproval />} />
        <Route path="/no-access" element={<NoAccess />} />

        {/* Protected App Routes */}
        <Route
          path="/app/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Feature-Gated Workspaces */}
          <Route
            path="crm"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.CRM}>
                <CrmWorkspacePage />
              </FeatureGuard>
            }
          />
          <Route
            path="catalog"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.Catalog}>
                <CatalogWorkspacePage />
              </FeatureGuard>
            }
          />
          <Route
            path="campaigns"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.Campaigns}>
                <CampaignWorkspacePage />
              </FeatureGuard>
            }
          />
          <Route
            path="cta-flow"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.CTAFlow}>
                <FlowBuilderWorkspace />
              </FeatureGuard>
            }
          />
          <Route
            path="insights"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.CRMInsights}>
                <InsightsWorkspacePage />
              </FeatureGuard>
            }
          />
          <Route
            path="messaging"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.Messaging}>
                <MessagingWorkspacePage />
              </FeatureGuard>
            }
          />
          <Route
            path="automation"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.Automation}>
                <AutomationWorkspace />
              </FeatureGuard>
            }
          />
          <Route
            path="admin"
            element={
              <AdminRouteGuard>
                <AdminWorkspacePage />
              </AdminRouteGuard>
            }
          />

          {/* Subroutes with Optional FeatureGuards */}
          <Route
            path="catalog/products"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.Catalog}>
                <ProductCatalog />
              </FeatureGuard>
            }
          />
          <Route
            path="catalog/form"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.AddProduct}>
                <ProductForm />
              </FeatureGuard>
            }
          />
          <Route
            path="catalog/insights"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.CatalogInsights}>
                <CatalogDashboard />
              </FeatureGuard>
            }
          />

          <Route
            path="campaigns/list"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.Campaigns}>
                <CampaignList />
              </FeatureGuard>
            }
          />
          <Route
            path="campaigns/template-single"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.Campaigns}>
                <CampaignCreateSingle />
              </FeatureGuard>
            }
          />
          <Route
            path="campaigns/cta-management"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.Campaigns}>
                <CTAManagement />
              </FeatureGuard>
            }
          />
          <Route
            path="campaigns/create-image-campaign"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.Campaigns}>
                <ImageCampaignPage />
              </FeatureGuard>
            }
          />
          <Route
            path="campaigns/image-campaigns/:id"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.Campaigns}>
                <ImageCampaignDetailPage />
              </FeatureGuard>
            }
          />
          <Route
            path="campaigns/image-campaigns/:id/edit"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.Campaigns}>
                <ImageCampaignEditPage />
              </FeatureGuard>
            }
          />
          <Route
            path="campaigns/image-campaigns/assign-contacts/:id"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.Campaigns}>
                <AssignContactsPage />
              </FeatureGuard>
            }
          />
          <Route
            path="campaigns/image-campaigns/assigned-contacts/:id"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.Campaigns}>
                <RecipientsListPage />
              </FeatureGuard>
            }
          />
          <Route
            path="campaigns/template-campaign-builder"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.Campaigns}>
                <CampaignBuilderPage />
              </FeatureGuard>
            }
          />
          <Route
            path="campaigns/template-campaigns-list"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.Campaigns}>
                <TemplateCampaignList />
              </FeatureGuard>
            }
          />
          <Route
            path="campaigns/CampaignWizard"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.Campaigns}>
                <CampaignWizard />
              </FeatureGuard>
            }
          />

          <Route
            path="campaigns/dashboard/:campaignId"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.Campaigns}>
                <CampaignDashboard />
              </FeatureGuard>
            }
          />
          <Route
            path="campaigns/dashboard/:campaignId"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.Campaigns}>
                <CampaignDashboard />
              </FeatureGuard>
            }
          />
          <Route
            path="campaigns/logs/:campaignId"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.Campaigns}>
                <CampaignSendLogs />
              </FeatureGuard>
            }
          />
          <Route
            path="campaigns/ImageCampaignListPage"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.Campaigns}>
                <ImageCampaignListPage />
              </FeatureGuard>
            }
          />
          {/* Messaging Inbox & Automation */}
          <Route
            path="messaging/inboxwarpper"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.Messaging}>
                <InboxWrapper />
              </FeatureGuard>
            }
          />

          <Route
            path="messaging/auto-reply-flows"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.Messaging}>
                <AutoReplyFlowManager />
              </FeatureGuard>
            }
          />

          <Route
            path="messaging/whatsapp-message"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.Messaging}>
                <SendMessagePage />
              </FeatureGuard>
            }
          />
          <Route
            path="messaging/send-direct-text"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.Messaging}>
                <SendTextMessagePage />
              </FeatureGuard>
            }
          />
          <Route
            path="messaging/send-template-simple"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.Messaging}>
                <SendTemplateMessagePage />
              </FeatureGuard>
            }
          />
          <Route
            path="messaging/reporting/direct-message-history"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.Messaging}>
                <DirectMessageHistory />
              </FeatureGuard>
            }
          />

          {/* Remaining Routes (No feature guard needed) */}
          <Route path="crm/contacts" element={<Contacts />} />
          <Route path="crm/tags" element={<Tags />} />
          <Route path="crm/reminders" element={<Reminders />} />
          <Route
            path="crm/contacts/:contactId/notes"
            element={<NotesWrapper />}
          />
          <Route
            path="crm/contacts/:contactId/timeline"
            element={<LeadTimeline />}
          />
          <Route path="crm/timeline" element={<LeadTimeline />} />
          <Route path="admin/approvals" element={<BusinessApprovals />} />
          <Route path="admin/features" element={<FeatureToggles />} />
          <Route path="admin/plans" element={<PlanManager />} />
          <Route
            path="admin/user-permissions"
            element={<UserPermissionsPage />}
          />
          <Route
            path="WhatsAppSettings/whatsapp-settings"
            element={<WhatsAppSettings />}
          />
          <Route path="tracking/logs" element={<TrackingViewer />} />
          <Route path="tracking/logs/:id" element={<TrackingLogDetail />} />
          <Route path="devtools/cta-tester" element={<CTATester />} />
          <Route path="webhooks/failed" element={<FailedWebhookLogs />} />
          <Route path="webhooks/settings" element={<WebhookSettings />} />
          <Route path="upgrade" element={<UpgradePlanPage />} />
          <Route path="feature-access" element={<FeatureTogglePage />} />
          <Route path="profile-completion" element={<ProfileCompletion />} />
          <Route path="preview-test" element={<PreviewTest />} />

          {/* Flow Builder – add these if you want direct URL access */}
          <Route
            path="cta-flow/visual-builder"
            element={<CTAFlowVisualBuilder />}
          />

          <Route
            path="cta-flow/published-view"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.FlowInsights}>
                <PublishedFlowView />
              </FeatureGuard>
            }
          />

          <Route
            path="cta-flow/flow-manager"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.FlowInsights}>
                <CTAFlowManager />
              </FeatureGuard>
            }
          />

          <Route
            path="campaigns/FlowAnalyticsDashboard"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.FlowInsights}>
                <FlowAnalyticsDashboard />
              </FeatureGuard>
            }
          />
          {/*Automation */}
          <Route
            path="automation/auto-reply-builder"
            element={
              <FeatureGuard featureKey={FEATURE_KEYS.Automation}>
                <AutoReplyBuilder />
              </FeatureGuard>
            }
          />
        </Route>
      </Routes>

      {/* Toasts */}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
        toastStyle={{
          borderRadius: "12px",
          padding: "10px 16px",
          fontSize: "14px",
        }}
      />
    </AuthProvider>
  );
}

export default App;

// import { Routes, Route, Navigate } from "react-router-dom";
// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import { AuthProvider } from "./pages/auth/context/AuthContext";

// // 🔐 Guards
// import ProtectedRoute from "./routes/ProtectedRoute";
// import AdminRouteGuard from "./routes/AdminRouteGuard";
// import FeatureGuard from "./components/FeatureAccess/FeatureGuard";

// // 🔑 Feature Keys
// import { FEATURE_KEYS } from "./components/FeatureAccess/featureKeyConfig";

// // Public Pages
// import Login from "./pages/auth/Login";
// import BusinessSignup from "./pages/auth/BusinessSignup";
// import PendingApproval from "./pages/auth/PendingApproval";
// import NoAccess from "./pages/NoAccess";

// // Layout
// import AppLayout from "./components/layout/AppLayout";

// // Workspaces
// import CrmWorkspacePage from "./pages/Workspaces/CrmWorkspacePage";
// import CatalogWorkspacePage from "./pages/Workspaces/CatalogWorkspacePage";
// import CampaignWorkspacePage from "./pages/Workspaces/CampaignWorkspacePage";
// import AdminWorkspacePage from "./pages/Workspaces/AdminWorkspacePage";
// import FlowBuilderWorkspace from "./pages/Workspaces/FlowBuilderWorkspace";
// import InsightsWorkspacePage from "./pages/Workspaces/InsightsWorkspacePage";
// import MessagingWorkspacePage from "./pages/Workspaces/MessagingWorkspacePage";

// // CRM
// import Contacts from "./pages/Contacts/Contacts";
// import Tags from "./pages/Tags/Tags";
// import Reminders from "./pages/Reminders/Reminders";
// import NotesWrapper from "./pages/Notes/NotesWrapper";
// import LeadTimeline from "./pages/CTATimeline/LeadTimeline";

// // Catalog
// import ProductCatalog from "./pages/Businesses/ProductCatalog";
// import ProductForm from "./pages/Businesses/ProductForm";
// import CatalogDashboard from "./pages/Businesses/CatalogDashboard";
// import BusinessApprovals from "./pages/Businesses/BusinessApprovals";

// // Campaigns
// import CampaignList from "./pages/Campaigns/CampaignList";
// import CampaignSendLogs from "./pages/Campaigns/CampaignSendLogs";
// import CampaignCreateSingle from "./pages/Campaigns/CampaignCreateSingle";
// import CampaignDashboard from "./pages/Campaigns/Analytics/CampaignDashboard";
// import CTAManagement from "./pages/CTAManagement/CTAManagement";
// import ImageCampaignPage from "./pages/Campaigns/ImageCampaignPage";
// import ImageCampaignDetailPage from "./pages/Campaigns/ImageCampaignDetailPage";
// import ImageCampaignEditPage from "./pages/Campaigns/ImageCampaignEditPage";
// import AssignContactsPage from "./pages/Campaigns/AssignContactsPage";
// import RecipientsListPage from "./pages/Campaigns/components/RecipientsListPage";
// import CampaignBuilderPage from "./pages/Campaigns/CampaignBuilderPage";
// import TemplateCampaignList from "./pages/Campaigns/TemplateCampaignList";
// import CampaignWizard from "./pages/Campaigns/CampaignWizard";

// // Messaging
// import SendMessagePage from "./pages/Messaging/SendMessagePage";
// import SendTextMessagePage from "./pages/WhatsAppMessageEngine/SendTextMessagePage";
// import SendTemplateMessagePage from "./pages/WhatsAppMessageEngine/SendTemplateMessagePage";
// import DirectMessageHistory from "./pages/ReportingModule/DirectMessageHistory";
// // Admin Tools
// import FeatureToggles from "./pages/admin/FeatureAccess/FeatureToggles";
// import PlanManager from "./pages/admin/PlanManager";
// import UserPermissionsPage from "./pages/UserPermissions/UserPermissions";

// // Dev Tools / Tracking
// import CTATester from "./pages/DevTools/CTATester";
// import FailedWebhookLogs from "./pages/Tracking/FailedWebhookLogs";
// import WebhookSettings from "./pages/Tracking/WebhookSettings";
// import TrackingViewer from "./pages/Tracking/TrackingViewer";
// import TrackingLogDetail from "./pages/Tracking/TrackingLogDetail";

// // Flow Builder
// import CTAFlowVisualBuilder from "./pages/CTAFlowVisualBuilder/CTAFlowVisualBuilder";
// import PublishedFlowView from "./pages/CTAFlowVisualBuilder/PublishedFlowView";
// import CTAFlowManager from "./pages/CTAFlowVisualBuilder/CTAFlowManager";
// import FlowAnalyticsDashboard from "./pages/FlowAnalytics/FlowAnalyticsDashboard";

// // Inbox & Automation
// import InboxWrapper from "./pages/Inbox/InboxWrapper";
// import AutoReplyBuilder from "./pages/AutoReplyBuilder/AutoReplyBuilder";
// import AutoReplyFlowManager from "./pages/AutoReplyBuilder/AutoReplyFlowManager";

// // Misc
// import ProfileCompletion from "./pages/Businesses/ProfileCompletion";
// import UpgradePlanPage from "./pages/Plans/UpgradePlanPage";
// import WhatsAppSettings from "./pages/WhatsAppSettings/WhatsAppSettings";
// import FeatureTogglePage from "./pages/FeatureAccess/FeatureTogglePage";
// import PreviewTest from "./pages/PreviewTest";

// function App() {
//   return (
//     <AuthProvider>
//       <Routes>
//         {/* Public Routes */}
//         <Route path="/" element={<Navigate to="/login" replace />} />
//         <Route path="/login" element={<Login />} />
//         <Route path="/signup" element={<BusinessSignup />} />
//         <Route path="/pending-approval" element={<PendingApproval />} />
//         <Route path="/no-access" element={<NoAccess />} />

//         {/* Protected App Routes */}
//         <Route
//           path="/app/*"
//           element={
//             <ProtectedRoute>
//               <AppLayout />
//             </ProtectedRoute>
//           }
//         >
//           {/* Feature-Gated Workspaces */}
//           <Route
//             path="crm"
//             element={
//               <FeatureGuard featureKey={FEATURE_KEYS.CRM}>
//                 <CrmWorkspacePage />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="catalog"
//             element={
//               <FeatureGuard featureKey={FEATURE_KEYS.Catalog}>
//                 <CatalogWorkspacePage />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="campaigns"
//             element={
//               <FeatureGuard featureKey={FEATURE_KEYS.Campaigns}>
//                 <CampaignWorkspacePage />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="cta-flow"
//             element={
//               <FeatureGuard featureKey={FEATURE_KEYS.CTAFlow}>
//                 <FlowBuilderWorkspace />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="insights"
//             element={
//               <FeatureGuard featureKey={FEATURE_KEYS.CRMInsights}>
//                 <InsightsWorkspacePage />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="messaging"
//             element={
//               <FeatureGuard featureKey={FEATURE_KEYS.Messaging}>
//                 <MessagingWorkspacePage />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="admin"
//             element={
//               <AdminRouteGuard>
//                 <AdminWorkspacePage />
//               </AdminRouteGuard>
//             }
//           />

//           {/* Subroutes with Optional FeatureGuards */}
//           <Route
//             path="catalog/products"
//             element={
//               <FeatureGuard featureKey={FEATURE_KEYS.Catalog}>
//                 <ProductCatalog />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="catalog/form"
//             element={
//               <FeatureGuard featureKey={FEATURE_KEYS.AddProduct}>
//                 <ProductForm />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="catalog/insights"
//             element={
//               <FeatureGuard featureKey={FEATURE_KEYS.CatalogInsights}>
//                 <CatalogDashboard />
//               </FeatureGuard>
//             }
//           />

//           <Route
//             path="campaigns/list"
//             element={
//               <FeatureGuard featureKey={FEATURE_KEYS.Campaigns}>
//                 <CampaignList />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="campaigns/template-single"
//             element={
//               <FeatureGuard featureKey={FEATURE_KEYS.Campaigns}>
//                 <CampaignCreateSingle />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="campaigns/cta-management"
//             element={
//               <FeatureGuard featureKey={FEATURE_KEYS.Campaigns}>
//                 <CTAManagement />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="campaigns/create-image-campaign"
//             element={
//               <FeatureGuard featureKey={FEATURE_KEYS.Campaigns}>
//                 <ImageCampaignPage />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="campaigns/image-campaigns/:id"
//             element={
//               <FeatureGuard featureKey={FEATURE_KEYS.Campaigns}>
//                 <ImageCampaignDetailPage />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="campaigns/image-campaigns/:id/edit"
//             element={
//               <FeatureGuard featureKey={FEATURE_KEYS.Campaigns}>
//                 <ImageCampaignEditPage />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="campaigns/image-campaigns/assign-contacts/:id"
//             element={
//               <FeatureGuard featureKey={FEATURE_KEYS.Campaigns}>
//                 <AssignContactsPage />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="campaigns/image-campaigns/assigned-contacts/:id"
//             element={
//               <FeatureGuard featureKey={FEATURE_KEYS.Campaigns}>
//                 <RecipientsListPage />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="campaigns/template-campaign-builder"
//             element={
//               <FeatureGuard featureKey={FEATURE_KEYS.Campaigns}>
//                 <CampaignBuilderPage />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="campaigns/template-campaigns-list"
//             element={
//               <FeatureGuard featureKey={FEATURE_KEYS.Campaigns}>
//                 <TemplateCampaignList />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="campaigns/CampaignWizard"
//             element={
//               <FeatureGuard featureKey={FEATURE_KEYS.Campaigns}>
//                 <CampaignWizard />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="campaigns/FlowAnalyticsDashboard"
//             element={
//               <FeatureGuard featureKey={FEATURE_KEYS.FlowInsights}>
//                 <FlowAnalyticsDashboard />
//               </FeatureGuard>
//             }
//           />

//           <Route
//             path="messaging/whatsapp-message"
//             element={
//               <FeatureGuard featureKey={FEATURE_KEYS.Messaging}>
//                 <SendMessagePage />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="messaging/send-direct-text"
//             element={
//               <FeatureGuard featureKey={FEATURE_KEYS.Messaging}>
//                 <SendTextMessagePage />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="messaging/send-template-simple"
//             element={
//               <FeatureGuard featureKey={FEATURE_KEYS.Messaging}>
//                 <SendTemplateMessagePage />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="messaging/reporting/direct-message-history"
//             element={
//               <FeatureGuard featureKey={FEATURE_KEYS.Messaging}>
//                 <DirectMessageHistory />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="messaging/inbox"
//             element={
//               <FeatureGuard featureKey={FEATURE_KEYS.Messaging}>
//                 <InboxWrapper />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="messaging/auto-reply-builder"
//             element={
//               <FeatureGuard featureKey={FEATURE_KEYS.Messaging}>
//                 <AutoReplyBuilder />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="messaging/auto-reply-flows"
//             element={
//               <FeatureGuard featureKey={FEATURE_KEYS.Messaging}>
//                 <AutoReplyFlowManager />
//               </FeatureGuard>
//             }
//           />

//           {/* Remaining Routes (No feature guard needed) */}
//           <Route path="crm/contacts" element={<Contacts />} />
//           <Route path="crm/tags" element={<Tags />} />
//           <Route path="crm/reminders" element={<Reminders />} />
//           <Route
//             path="crm/contacts/:contactId/notes"
//             element={<NotesWrapper />}
//           />
//           <Route
//             path="crm/contacts/:contactId/timeline"
//             element={<LeadTimeline />}
//           />
//           <Route path="crm/timeline" element={<LeadTimeline />} />
//           <Route path="admin/approvals" element={<BusinessApprovals />} />
//           <Route path="admin/features" element={<FeatureToggles />} />
//           <Route path="admin/plans" element={<PlanManager />} />
//           <Route
//             path="admin/user-permissions"
//             element={<UserPermissionsPage />}
//           />
//           <Route
//             path="WhatsAppSettings/whatsapp-settings"
//             element={<WhatsAppSettings />}
//           />
//           <Route path="tracking/logs" element={<TrackingViewer />} />
//           <Route path="tracking/logs/:id" element={<TrackingLogDetail />} />
//           <Route path="devtools/cta-tester" element={<CTATester />} />
//           <Route path="webhooks/failed" element={<FailedWebhookLogs />} />
//           <Route path="webhooks/settings" element={<WebhookSettings />} />
//           <Route path="upgrade" element={<UpgradePlanPage />} />
//           <Route path="feature-access" element={<FeatureTogglePage />} />
//           <Route path="profile-completion" element={<ProfileCompletion />} />
//           <Route path="preview-test" element={<PreviewTest />} />
//         </Route>
//       </Routes>

//       {/* Toasts */}
//       <ToastContainer
//         position="top-right"
//         autoClose={4000}
//         hideProgressBar={false}
//         newestOnTop
//         closeOnClick
//         pauseOnHover
//         draggable
//         theme="colored"
//         toastStyle={{
//           borderRadius: "12px",
//           padding: "10px 16px",
//           fontSize: "14px",
//         }}
//       />
//     </AuthProvider>
//   );
// }

// export default App;

// import { Routes, Route, Navigate } from "react-router-dom";
// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import { AuthProvider } from "./pages/auth/context/AuthContext";

// // 🔐 Dynamic Feature Access Guard
// import FeatureGuard from "./components/FeatureAccess/FeatureGuard";

// // Public Pages
// import Login from "./pages/auth/Login";
// import BusinessSignup from "./pages/auth/BusinessSignup";
// import PendingApproval from "./pages/auth/PendingApproval";
// import NoAccess from "./pages/NoAccess";

// // Layouts & Protection
// import AppLayout from "./components/layout/AppLayout";
// import ProtectedRoute from "./routes/ProtectedRoute";
// import AdminRouteGuard from "./routes/AdminRouteGuard";

// // Workspaces
// import CrmWorkspacePage from "./pages/Workspaces/CrmWorkspacePage";
// import CatalogWorkspacePage from "./pages/Workspaces/CatalogWorkspacePage";
// import CampaignWorkspacePage from "./pages/Workspaces/CampaignWorkspacePage";
// import AdminWorkspacePage from "./pages/Workspaces/AdminWorkspacePage";
// import FlowBuilderWorkspace from "./pages/Workspaces/FlowBuilderWorkspace";
// import InsightsWorkspacePage from "./pages/Workspaces/InsightsWorkspacePage";
// import MessagingWorkspacePage from "./pages/Workspaces/MessagingWorkspacePage";

// // CRM
// import Contacts from "./pages/Contacts/Contacts";
// import Tags from "./pages/Tags/Tags";
// import Reminders from "./pages/Reminders/Reminders";
// import NotesWrapper from "./pages/Notes/NotesWrapper";
// import LeadTimeline from "./pages/CTATimeline/LeadTimeline";

// // Catalog
// import ProductCatalog from "./pages/Businesses/ProductCatalog";
// import ProductForm from "./pages/Businesses/ProductForm";
// import CatalogDashboard from "./pages/Businesses/CatalogDashboard";
// import BusinessApprovals from "./pages/Businesses/BusinessApprovals";

// // Campaigns
// import CampaignList from "./pages/Campaigns/CampaignList";
// import CampaignSendLogs from "./pages/Campaigns/CampaignSendLogs";
// import CampaignCreateSingle from "./pages/Campaigns/CampaignCreateSingle";
// import CampaignDashboard from "./pages/Campaigns/Analytics/CampaignDashboard";
// import CTAManagement from "./pages/CTAManagement/CTAManagement";
// import ImageCampaignListPage from "./pages/Campaigns/ImageCampaignListPage";
// import ImageCampaignPage from "./pages/Campaigns/ImageCampaignPage";
// import ImageCampaignDetailPage from "./pages/Campaigns/ImageCampaignDetailPage";
// import ImageCampaignEditPage from "./pages/Campaigns/ImageCampaignEditPage";
// import AssignContactsPage from "./pages/Campaigns/AssignContactsPage";
// import RecipientsListPage from "./pages/Campaigns/components/RecipientsListPage";
// import CampaignBuilderPage from "./pages/Campaigns/CampaignBuilderPage";
// import TemplateCampaignList from "./pages/Campaigns/TemplateCampaignList";
// import CampaignWizard from "./pages/Campaigns/CampaignWizard";

// // Messaging
// import SendMessagePage from "./pages/Messaging/SendMessagePage";
// import SendTextMessagePage from "./pages/WhatsAppMessageEngine/SendTextMessagePage";
// import SendTemplateMessagePage from "./pages/WhatsAppMessageEngine/SendTemplateMessagePage";

// // Admin Tools
// import FeatureToggles from "./pages/admin/FeatureAccess/FeatureToggles";
// import PlanManager from "./pages/admin/PlanManager";
// import UserPermissionsPage from "./pages/UserPermissions/UserPermissions";

// // Developer Tools
// import CTATester from "./pages/DevTools/CTATester";
// import FailedWebhookLogs from "./pages/Tracking/FailedWebhookLogs";
// import WebhookSettings from "./pages/Tracking/WebhookSettings";

// // Flow Builder
// import CTAFlowVisualBuilder from "./pages/CTAFlowVisualBuilder/CTAFlowVisualBuilder";
// import PublishedFlowView from "./pages/CTAFlowVisualBuilder/PublishedFlowView";
// import CTAFlowManager from "./pages/CTAFlowVisualBuilder/CTAFlowManager";
// import FlowAnalyticsDashboard from "./pages/FlowAnalytics/FlowAnalyticsDashboard";

// // Inbox & Automation
// import InboxWrapper from "./pages/Inbox/InboxWrapper";
// import AutoReplyBuilder from "./pages/AutoReplyBuilder/AutoReplyBuilder";
// import AutoReplyFlowManager from "./pages/AutoReplyBuilder/AutoReplyFlowManager";

// // Tracking
// import TrackingViewer from "./pages/Tracking/TrackingViewer";
// import TrackingLogDetail from "./pages/Tracking/TrackingLogDetail";

// // Misc
// import ProfileCompletion from "./pages/Businesses/ProfileCompletion";
// import UpgradePlanPage from "./pages/Plans/UpgradePlanPage";
// import WhatsAppSettings from "./pages/WhatsAppSettings/WhatsAppSettings";
// import PreviewTest from "./pages/PreviewTest";

// // ✅ NEW Feature Toggle Page
// import FeatureTogglePage from "./pages/FeatureAccess/FeatureTogglePage";

// function App() {
//   return (
//     <AuthProvider>
//       <Routes>
//         <Route path="/" element={<Navigate to="/login" replace />} />
//         <Route path="/login" element={<Login />} />
//         <Route path="/signup" element={<BusinessSignup />} />
//         <Route path="/pending-approval" element={<PendingApproval />} />
//         <Route path="/no-access" element={<NoAccess />} />

//         <Route
//           path="/app/*"
//           element={
//             <ProtectedRoute>
//               <AppLayout />
//             </ProtectedRoute>
//           }
//         >
//           {/* Workspaces */}
//           <Route
//             path="crm"
//             element={
//               <FeatureGuard featureKey="CRM">
//                 <CrmWorkspacePage />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="catalog"
//             element={
//               <FeatureGuard featureKey="Catalog">
//                 <CatalogWorkspacePage />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="campaigns"
//             element={
//               <FeatureGuard featureKey="Campaigns">
//                 <CampaignWorkspacePage />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="cta-flow"
//             element={
//               <FeatureGuard featureKey="CTAFlow">
//                 <FlowBuilderWorkspace />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="insights"
//             element={
//               <FeatureGuard featureKey="CRMInsights">
//                 <InsightsWorkspacePage />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="messaging"
//             element={
//               <FeatureGuard featureKey="Messaging">
//                 <MessagingWorkspacePage />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="admin"
//             element={
//               <AdminRouteGuard>
//                 <AdminWorkspacePage />
//               </AdminRouteGuard>
//             }
//           />

//           {/* CRM */}
//           <Route path="crm/contacts" element={<Contacts />} />
//           <Route path="crm/tags" element={<Tags />} />
//           <Route path="crm/reminders" element={<Reminders />} />
//           <Route
//             path="crm/contacts/:contactId/notes"
//             element={<NotesWrapper />}
//           />
//           <Route
//             path="crm/contacts/:contactId/timeline"
//             element={<LeadTimeline />}
//           />
//           <Route path="crm/timeline" element={<LeadTimeline />} />

//           {/* Catalog */}
//           <Route
//             path="catalog/products"
//             element={
//               <FeatureGuard featureKey="Catalog">
//                 <ProductCatalog />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="catalog/form"
//             element={
//               <FeatureGuard featureKey="Catalog">
//                 <ProductForm />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="catalog/insights"
//             element={
//               <FeatureGuard featureKey="CatalogInsights">
//                 <CatalogDashboard />
//               </FeatureGuard>
//             }
//           />

//           {/* Campaigns */}
//           <Route
//             path="campaigns/list"
//             element={
//               <FeatureGuard featureKey="Campaigns">
//                 <CampaignList />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="campaigns/logs/:campaignId"
//             element={<CampaignSendLogs />}
//           />
//           <Route
//             path="campaigns/template-single"
//             element={
//               <FeatureGuard featureKey="Campaigns">
//                 <CampaignCreateSingle />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="campaigns/dashboard/:campaignId"
//             element={<CampaignDashboard />}
//           />
//           <Route
//             path="campaigns/cta-management"
//             element={
//               <FeatureGuard featureKey="Campaigns">
//                 <CTAManagement />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="campaigns/create-image-campaign"
//             element={
//               <FeatureGuard featureKey="Campaigns">
//                 <ImageCampaignPage />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="campaigns/image-campaigns/:id"
//             element={
//               <FeatureGuard featureKey="Campaigns">
//                 <ImageCampaignDetailPage />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="campaigns/image-campaigns/:id/edit"
//             element={
//               <FeatureGuard featureKey="Campaigns">
//                 <ImageCampaignEditPage />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="campaigns/image-campaigns/assign-contacts/:id"
//             element={
//               <FeatureGuard featureKey="Campaigns">
//                 <AssignContactsPage />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="campaigns/image-campaigns/assigned-contacts/:id"
//             element={
//               <FeatureGuard featureKey="Campaigns">
//                 <RecipientsListPage />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="campaigns/template-campaign-builder"
//             element={
//               <FeatureGuard featureKey="Campaigns">
//                 <CampaignBuilderPage />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="campaigns/template-campaigns-list"
//             element={
//               <FeatureGuard featureKey="Campaigns">
//                 <TemplateCampaignList />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="campaigns/CampaignWizard"
//             element={
//               <FeatureGuard featureKey="Campaigns">
//                 <CampaignWizard />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="campaigns/FlowAnalyticsDashboard"
//             element={
//               <FeatureGuard featureKey="FlowInsights">
//                 <FlowAnalyticsDashboard />
//               </FeatureGuard>
//             }
//           />
//           <Route path="campaigns/inboxwarpper" element={<InboxWrapper />} />

//           {/* Messaging */}
//           <Route
//             path="messaging/whatsapp-message"
//             element={
//               <FeatureGuard featureKey="Messaging">
//                 <SendMessagePage />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="messaging/send-direct-text"
//             element={
//               <FeatureGuard featureKey="Messaging">
//                 <SendTextMessagePage />
//               </FeatureGuard>
//             }
//           />
//           <Route
//             path="messaging/send-template-simple"
//             element={
//               <FeatureGuard featureKey="Messaging">
//                 <SendTemplateMessagePage />
//               </FeatureGuard>
//             }
//           />

//           {/* Flow Builder */}
//           <Route path="cta-flow-builder" element={<CTAFlowVisualBuilder />} />
//           <Route
//             path="visual-flow-builder/create"
//             element={<CTAFlowVisualBuilder />}
//           />
//           <Route path="visual-flow-manage" element={<CTAFlowManager />} />
//           <Route path="published-flow/view" element={<PublishedFlowView />} />

//           {/* Automation */}
//           <Route
//             path="automation/auto-reply-builder"
//             element={<AutoReplyBuilder />}
//           />
//           <Route
//             path="automation/auto-reply-flows"
//             element={<AutoReplyFlowManager />}
//           />

//           {/* Admin Tools */}
//           <Route path="admin/approvals" element={<BusinessApprovals />} />
//           <Route path="admin/features" element={<FeatureToggles />} />
//           <Route path="admin/plans" element={<PlanManager />} />
//           <Route
//             path="admin/user-permissions"
//             element={<UserPermissionsPage />}
//           />
//           <Route
//             path="WhatsAppSettings/whatsapp-settings"
//             element={<WhatsAppSettings />}
//           />

//           {/* Tracking */}
//           <Route path="tracking/logs" element={<TrackingViewer />} />
//           <Route path="tracking/logs/:id" element={<TrackingLogDetail />} />

//           {/* Developer Tools */}
//           <Route path="devtools/cta-tester" element={<CTATester />} />
//           <Route path="webhooks/failed" element={<FailedWebhookLogs />} />
//           <Route path="webhooks/settings" element={<WebhookSettings />} />

//           {/* Utilities */}
//           <Route path="upgrade" element={<UpgradePlanPage />} />
//           <Route path="feature-access" element={<FeatureTogglePage />} />
//           <Route path="profile-completion" element={<ProfileCompletion />} />
//           <Route path="preview-test" element={<PreviewTest />} />
//         </Route>
//       </Routes>

//       <ToastContainer
//         position="top-right"
//         autoClose={4000}
//         hideProgressBar={false}
//         newestOnTop
//         closeOnClick
//         pauseOnHover
//         draggable
//         theme="colored"
//         toastStyle={{
//           borderRadius: "12px",
//           padding: "10px 16px",
//           fontSize: "14px",
//         }}
//       />
//     </AuthProvider>
//   );
// }

// export default App;
