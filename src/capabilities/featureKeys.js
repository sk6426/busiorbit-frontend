// 📄 src/capabilities/featureKeys.js
export const FK = {
  // CRM
  CRM_CONTACTS: "crm.contacts.view",
  CRM_TAGS: "crm.tags.view",

  // Catalog
  PRODUCT_VIEW: "product.view",
  PRODUCT_CREATE: "product.create",
  PRODUCT_DELETE: "product.delete",

  // Campaigns
  CAMPAIGN_VIEW: "campaign.view",
  CAMPAIGN_CREATE: "campaign.create",
  CAMPAIGN_DELETE: "campaign.delete",
  // CAMPAIG_SEND_TEMPLATE: "campaign.create",
  // Dashboard
  DASHBOARD_VIEW: "dashboard.view",

  // Messaging
  MESSAGING_REPORT_VIEW: "messaging.report.view",
  MESSAGING_STATUS_VIEW: "messaging.status.view",
  MESSAGING_SEND: "messaging.send",
  MESSAGING_SEND_TEXT: "messaging.send.text",

  // WhatsApp Settings (canonical)
  WHATSAPP_SETTINGS_VIEW: "admin.whatsappsettings.view",

  // Insights
  CRM_INSIGHTS_VIEW: "crm.insights.view",
  CATALOG_INSIGHTS_VIEW: "catalog.insights.view",
  FLOW_INSIGHTS_VIEW: "flow.insights.view",

  // Admin
  ADMIN_PLANS_VIEW: "admin.plans.view",
  ADMIN_PLANS_CREATE: "admin.plans.create",
  ADMIN_PLANS_UPDATE: "admin.plans.update",
  ADMIN_PLANS_DELETE: "admin.plans.delete",
  ADMIN_LOGS_VIEW: "admin.logs.view",
  ADMIN_BUSINESS_APPROVE: "admin.business.approve",

  // Plan Manager
  PLAN_MANAGER_VIEW: "plan.manager.view",

  // User management
  USER_PERMISSIONS_VIEW: "user.permissions.view",

  // My Account
  PROFILE_VIEW: "profile.view",
  UPGRADE_VIEW: "upgrade.view",

  // Automation Workspace

  AUTOMATION_CREATE_TEMPLATE_FLOW: "automation.Create.Template.Flow",
  AUTOMATION_CREATE_TEMPLATE_PLUS_FREE_TEXT_FLOW:
    "automation.Create.TemplatePlusFreetext.Flow",
  AUTOMATION_VIEW_TEMPLATE_FLOW_MANGE:
    "automation.View.TemplatePlusFreetext.Flow",
  AUTOMATION_VIEW_TEMPLATE_FLOW_TEMPLATEP_ANALYTICS:
    "automation.View.Template.Flow_analytics",
  AUTOMATION_VIEW_TEMPLATE_PLUS_FREETEXT_FLOW_ANALYTICS:
    "automation.View.TemplatePlusFreeText.Flow_analytics",
  AUTOMATION_TRIGGER_TEST: "automation_trigger_test",

  // Settings workspace
  SETTINGS_WHATSAPP_VIEW: "settings.whatsapp.view", // gate the workspace (coarse)
  SETTINGS_THEME_UPDATE: "settings.theme.update", // optional fine-grained
  SETTINGS_PASSWORD_UPDATE: "settings.password.update",
  SETTINGS_PROFILE_VIEW: "settings.profile.view",

  // Hide
  HIDE: "hide",

  //Inbox

  INBOX_MENU: "inbox.menu",
  INBOX_VIEW: "inbox.view",
};
