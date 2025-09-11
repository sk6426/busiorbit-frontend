# Manual Test: Welcome Banner

Steps to verify the welcome banner shows up after login:

1. Start the app (npm start / yarn start) and ensure you can reach the login page.
2. Open the browser devtools -> Application -> Session Storage for the app's origin and clear any keys named "show-welcome-banner" or "welcome-banner-dismissed".
3. Perform a normal login with valid credentials.
4. After successful login you should:
   - See a toast "✅ Login successful" (existing behavior).
   - Be navigated to the target page (usually /app/crm).
   - See a temporary welcome banner under the topbar with the message "Welcome back, <Your Name>!" and buttons "Go to CRM" and an X (dismiss).
5. The banner should auto-hide after ~5 seconds.
6. Clicking the X should dismiss the banner immediately and it should not reappear for this session.
7. Refresh the page: the banner should not reappear (session dismissal persisted for the tab). Closing the tab and logging in a new tab should show it again on next successful login.

Edge cases:
- If sessionStorage is unavailable (private mode / storage error), no crash should occur; banner simply won't appear.
