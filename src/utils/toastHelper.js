import { toast } from "react-toastify";

// Success
export const showSuccess = msg => toast.success(`✅ ${msg}`);

// Error
export const showError = msg => toast.error(`❌ ${msg}`);

// Warning
export const showWarning = msg => toast.warn(`⚠️ ${msg}`);

// Info
export const showInfo = msg => toast.info(`ℹ️ ${msg}`);
