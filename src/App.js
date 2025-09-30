// 📄 File: src/App.jsx

import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Auth provider (server-authoritative session/claims)
import { AuthProvider } from "./app/providers/AuthProvider";

// 🔐 Guards
import ProtectedRoute from "./app/routes/guards/ProtectedRoute";
import AdminRouteGuard from "./app/routes/guards/AdminRouteGuard";
import FeatureGuard from "./app/routes/guards/FeatureGuard";

// 🔑 Permission Keys (codes)
import { FK } from "./capabilities/featureKeys";

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
import InsightsWorkspacePage from "./pages/Workspaces/InsightsWorkspacePage";
import MessagingWorkspacePage from "./pages/Workspaces/MessagingWorkspacePage";
import AutomationWorkspace from "./pages/Workspaces/AutomationWorkspace";
import InboxWorkspace from "./pages/Workspaces/InboxWorkspace";

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
import SendTextMessagePage from "./pages/WhatsAppMessageEngine/SendContentFreeTextMessage";
import SendTemplateMessagePage from "./pages/WhatsAppMessageEngine/SendTemplateMessagePage";
import DirectMessageHistory from "./pages/ReportingModule/DirectMessageHistory";

// Admin Tools
import FeatureToggles from "./pages/admin/FeatureAccess/FeatureToggles";
import UserPermissionsPage from "./pages/UserPermissions/UserPermissions";
import PlanManagement from "./pages/admin/FeatureAccess/PlanManagement";

// Dev Tools / Tracking
import CTATester from "./pages/DevTools/CTATester";
import FailedWebhookLogs from "./pages/Tracking/FailedWebhookLogs";
import WebhookSettings from "./pages/Tracking/WebhookSettings";
import TrackingViewer from "./pages/Tracking/TrackingViewer";
import TrackingLogDetail from "./pages/Tracking/TrackingLogDetail";

// Flow Builder
import CTAFlowVisualBuilder from "./pages/CTAFlowVisualBuilder/CTAFlowVisualBuilder";

import CTAFlowManager from "./pages/CTAFlowVisualBuilder/CTAFlowManager";
import FlowAnalyticsDashboard from "./pages/FlowAnalytics/FlowAnalyticsDashboard";

// Inbox & Automation
import InboxWrapper from "./pages/Inbox/InboxWrapper";
import AutoReplyBuilder from "./pages/AutoReplyBuilder/AutoReplyBuilder";

// Misc
import ProfileCompletion from "./pages/Businesses/ProfileCompletion";
import UpgradePlanPage from "./pages/Plans/UpgradePlanPage";
import WhatsAppSettings from "./pages/WhatsAppSettings/WhatsAppSettings";
import FeatureTogglePage from "./pages/FeatureAccess/FeatureTogglePage";
import PreviewTest from "./pages/PreviewTest";
import DashboardWorkspace from "./pages/Workspaces/DashboardWorkspace";
import AppHomeRoute from "./app/routes/AppHomeRoute";
import Forbidden403 from "./pages/errors/Forbidden403";
import AccessDebugger from "./dev/AccessDebugger";
// Settings
import SettingsWorkspacePage from "./pages/Workspaces/SettingsWorkspacePage";
import TagList from "./pages/Tags/TagList";
import MessageLogsReport from "./pages/reports/MessageLogsReport";
const isDev = process.env.NODE_ENV === "development";

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
          <Route index element={<AppHomeRoute />} />
          <Route path="403" element={<Forbidden403 />} />

          {/* Feature-Gated Workspaces */}
          <Route
            path="dashboard"
            element={
              <FeatureGuard featureKey={FK.DASHBOARD_VIEW}>
                <DashboardWorkspace />
              </FeatureGuard>
            }
          />
          <Route
            path="crm"
            element={
              <FeatureGuard featureKey={FK.CRM_CONTACTS /* or FK.CRM_TAGS */}>
                <CrmWorkspacePage />
              </FeatureGuard>
            }
          />
          <Route
            path="catalog"
            element={
              <FeatureGuard featureKey={FK.PRODUCT_VIEW}>
                <CatalogWorkspacePage />
              </FeatureGuard>
            }
          />
          <Route
            path="campaigns"
            element={
              <FeatureGuard featureKey={FK.CAMPAIGN_VIEW}>
                <CampaignWorkspacePage />
              </FeatureGuard>
            }
          />
          <Route
            path="inbox"
            element={
              <FeatureGuard featureKey={FK.INBOX_VIEW}>
                <InboxWorkspace />
              </FeatureGuard>
            }
          />
          <Route
            path="inbox/inboxwarpper"
            element={
              <FeatureGuard featureKey={FK.INBOX_VIEW}>
                <InboxWrapper />
              </FeatureGuard>
            }
          />
          <Route
            path="insights"
            element={
              <FeatureGuard featureKey={FK.CRM_INSIGHTS_VIEW}>
                <InsightsWorkspacePage />
              </FeatureGuard>
            }
          />
          <Route
            path="messaging"
            element={
              <FeatureGuard featureKey={FK.MESSAGING_INBOX_VIEW}>
                <MessagingWorkspacePage />
              </FeatureGuard>
            }
          />
          <Route
            path="automation"
            element={
              <FeatureGuard featureKey={FK.AUTOMATION_VIEW}>
                <AutomationWorkspace />
              </FeatureGuard>
            }
          />
          <Route
            path="settings"
            element={
              <FeatureGuard featureKey={FK.SETTINGS_WHATSAPP_VIEW}>
                <SettingsWorkspacePage />
              </FeatureGuard>
            }
          />
          <Route
            path="settings/whatsapp"
            element={
              <FeatureGuard featureKey={FK.SETTINGS_WHATSAPP_VIEW}>
                <WhatsAppSettings />
              </FeatureGuard>
            }
          />
          <Route
            path="settings/theme"
            element={<div className="p-6">Theme settings (stub)</div>}
          />
          <Route
            path="settings/password"
            element={<div className="p-6">Password settings (stub)</div>}
          />
          {/* Admin (role/guard controlled) */}
          <Route
            path="admin"
            element={
              <AdminRouteGuard>
                <AdminWorkspacePage />
              </AdminRouteGuard>
            }
          />

          {/* crm subroutes */}
          <Route
            path="crm/tags"
            element={
              <FeatureGuard featureKey={FK.CRM_TAGS}>
                <TagList />
              </FeatureGuard>
            }
          />

          {/* Catalog subroutes */}
          <Route
            path="catalog/products"
            element={
              <FeatureGuard featureKey={FK.PRODUCT_VIEW}>
                <ProductCatalog />
              </FeatureGuard>
            }
          />
          <Route
            path="catalog/form"
            element={
              <FeatureGuard featureKey={FK.PRODUCT_CREATE}>
                <ProductForm />
              </FeatureGuard>
            }
          />
          <Route
            path="catalog/insights"
            element={
              <FeatureGuard featureKey={FK.CATALOG_INSIGHTS_VIEW}>
                <CatalogDashboard />
              </FeatureGuard>
            }
          />

          {/* Campaigns subroutes */}
          <Route
            path="campaigns/list"
            element={
              <FeatureGuard featureKey={FK.CAMPAIGN_VIEW}>
                <CampaignList />
              </FeatureGuard>
            }
          />
          <Route
            path="campaigns/template-single"
            element={
              <FeatureGuard featureKey={FK.CAMPAIGN_CREATE}>
                <CampaignCreateSingle />
              </FeatureGuard>
            }
          />
          <Route
            path="campaigns/cta-management"
            element={
              <FeatureGuard featureKey={FK.CAMPAIGN_VIEW}>
                <CTAManagement />
              </FeatureGuard>
            }
          />
          <Route
            path="campaigns/create-image-campaign"
            element={
              <FeatureGuard featureKey={FK.CAMPAIGN_CREATE}>
                <ImageCampaignPage />
              </FeatureGuard>
            }
          />
          <Route
            path="campaigns/image-campaigns/:id"
            element={
              <FeatureGuard featureKey={FK.CAMPAIGN_VIEW}>
                <ImageCampaignDetailPage />
              </FeatureGuard>
            }
          />
          <Route
            path="campaigns/image-campaigns/:id/edit"
            element={
              <FeatureGuard
                featureKey={FK.CAMPAIGN_UPDATE ?? FK.CAMPAIGN_CREATE}
              >
                <ImageCampaignEditPage />
              </FeatureGuard>
            }
          />
          <Route
            path="campaigns/image-campaigns/assign-contacts/:id"
            element={
              <FeatureGuard
                featureKey={FK.CAMPAIGN_UPDATE ?? FK.CAMPAIGN_CREATE}
              >
                <AssignContactsPage />
              </FeatureGuard>
            }
          />
          <Route
            path="campaigns/image-campaigns/assigned-contacts/:id"
            element={
              <FeatureGuard featureKey={FK.CAMPAIGN_VIEW}>
                <RecipientsListPage />
              </FeatureGuard>
            }
          />
          <Route
            path="campaigns/template-campaign-builder"
            element={
              <FeatureGuard featureKey={FK.CAMPAIGN_CREATE}>
                <CampaignBuilderPage />
              </FeatureGuard>
            }
          />
          {/* Display Only Template based list of campaign */}
          <Route
            path="campaigns/template-campaigns-list"
            element={
              <FeatureGuard featureKey={FK.CAMPAIGN_VIEW}>
                <TemplateCampaignList />
              </FeatureGuard>
            }
          />
          <Route
            path="campaigns/CampaignWizard"
            element={
              <FeatureGuard featureKey={FK.CAMPAIGN_CREATE}>
                <CampaignWizard />
              </FeatureGuard>
            }
          />
          <Route
            path="campaigns/dashboard/:campaignId"
            element={
              <FeatureGuard featureKey={FK.CAMPAIGN_VIEW}>
                <CampaignDashboard />
              </FeatureGuard>
            }
          />
          <Route
            path="campaigns/logs/:campaignId"
            element={
              <FeatureGuard featureKey={FK.CAMPAIGN_VIEW}>
                <CampaignSendLogs />
              </FeatureGuard>
            }
          />
          <Route
            path="campaigns/messagelogs/"
            element={
              <FeatureGuard featureKey={FK.CAMPAIGN_VIEW}>
                <MessageLogsReport />
              </FeatureGuard>
            }
          />
          <Route
            path="campaigns/ImageCampaignListPage"
            element={
              <FeatureGuard featureKey={FK.CAMPAIGN_IMAGE_LIST_VIEW}>
                <ImageCampaignListPage />
              </FeatureGuard>
            }
          />
          <Route
            path="campaigns/send-template-simple"
            element={
              <FeatureGuard featureKey={FK.CAMPAIGN_SEND_TEMPLATE_SIMPLE}>
                <SendTemplateMessagePage />
              </FeatureGuard>
            }
          />
          {/* Messaging Inbox & Automation */}

          {/* // Inbox */}
          {/* <Route
            path="inbox/inboxwarpper"
            element={
              <FeatureGuard featureKey={FK.INBOX_MENU}>
                <InboxWrapper />
              </FeatureGuard>
            }
          /> */}
          {/* <Route
            path="messaging/inboxwrapper"
            element={
              <FeatureGuard featureKey={FK.INBOX_VIEW}>
                <InboxWrapper />
              </FeatureGuard>
            }
          /> */}

          <Route
            path="messaging/whatsapp-message"
            element={
              <FeatureGuard featureKey={FK.MESSAGING_SEND}>
                <SendMessagePage />
              </FeatureGuard>
            }
          />
          <Route
            path="messaging/send-direct-text"
            element={
              <FeatureGuard featureKey={FK.MESSAGING_SEND_TEXT}>
                <SendTextMessagePage />
              </FeatureGuard>
            }
          />

          <Route
            path="messaging/reporting/direct-message-history"
            element={
              <FeatureGuard featureKey={FK.MESSAGING_REPORT_VIEW}>
                <DirectMessageHistory />
              </FeatureGuard>
            }
          />

          {/* ✅ WhatsApp Settings (GUARD FIXED) */}
          {/* <Route
            path="settings/whatsapp"
            element={
              <FeatureGuard featureKey={FK.SETTINGS_WHATSAPP_VIEW}>
                <WhatsAppSettings />
              </FeatureGuard>
            }
          /> */}

          {/* CRM subroutes without guards (pages can still check internally) */}
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

          {/* Admin (tools) */}
          {/* <Route path="admin/approvals" element={<BusinessApprovals />} /> */}
          <Route
            path="admin/approvals"
            element={
              <FeatureGuard featureKey={FK.ADMIN_BUSINESS_APPROVE}>
                <BusinessApprovals />
              </FeatureGuard>
            }
          />

          <Route path="admin/features" element={<FeatureToggles />} />
          <Route path="admin/plans" element={<PlanManagement />} />
          <Route
            path="admin/user-permissions"
            element={<UserPermissionsPage />}
          />

          {/* Misc */}

          <Route path="tracking/logs/:id" element={<TrackingLogDetail />} />
          <Route path="devtools/cta-tester" element={<CTATester />} />
          <Route path="webhooks/failed" element={<FailedWebhookLogs />} />
          <Route path="webhooks/settings" element={<WebhookSettings />} />
          <Route path="upgrade" element={<UpgradePlanPage />} />
          <Route path="feature-access" element={<FeatureTogglePage />} />
          <Route path="profile-completion" element={<ProfileCompletion />} />
          <Route path="preview-test" element={<PreviewTest />} />

          {/* Flow Builder direct routes */}
          <Route
            path="cta-flow/visual-builder"
            element={<CTAFlowVisualBuilder />}
          />

          <Route
            path="cta-flow/flow-manager"
            element={
              <FeatureGuard
                featureKey={
                  FK.AUTOMATION_VIEW_TEMPLATE_FLOW_TEMPLATEP_ANALYTICS
                }
              >
                <CTAFlowManager />
              </FeatureGuard>
            }
          />
          <Route
            path="campaigns/FlowAnalyticsDashboard"
            element={
              <FeatureGuard featureKey={FK.FLOW_INSIGHTS_VIEW}>
                <FlowAnalyticsDashboard />
              </FeatureGuard>
            }
          />
          <Route
            path="tracking/logs"
            element={
              <FeatureGuard featureKey={FK.TRACKING_LOGS_VIEW}>
                <TrackingViewer />
              </FeatureGuard>
            }
          />

          <Route
            path="automation/auto-reply-builder"
            element={
              <FeatureGuard
                featureKey={FK.AUTOMATION_CREATE_TEMPLATE_PLUS_FREE_TEXT_FLOW}
              >
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
      {isDev && <AccessDebugger />}
    </AuthProvider>
  );
}

export default App;
