Port React Web Covered Calls Dashboard to React Native Android App
This plan outlines the design and technical steps to transform the Covered Calls portfolio tracker and options writing web application in frontend/web into a premium React Native application within frontend/mobile.

User Review Required
IMPORTANT

API Host Binding The backend server (in backend/api.js) binds explicitly to 127.0.0.1.

In standard Android Emulator development, the emulator accesses the host machine's loopback via http://10.0.2.2:3001.
We will configure the mobile app's API client to use http://10.0.2.2:3001 as the default on Android, and http://localhost:3001 on Web/iOS, avoiding configuration headaches.
TIP

Premium Custom Visualizations (No Heavy Charting Libraries) Chart.js is canvas-dependent and not supported natively in React Native.

We will build premium, custom, high-fidelity native components for visualizations rather than introducing heavy external dependencies.
Income History: A pure React Native animated bar chart component with side-by-side premium and realized P&L bars.
Risk Concentration Breakdown: A beautiful visual list showing ticker exposure with colored progress bars (similar to premium investment applications like Robinhood/Webull).
Moneyness Strike Distribution: A sleek segmented percentage bar showing [ OTM | ATM | ITM ] ratios.
Premium progression: A vertical harvest progression timeline showing cost-basis reductions step-by-step.
NOTE

Routing Architecture We will leverage Expo Router's file-system routing:

Tabs: Home (Dashboard), Positions, and Statistics.
Positions Stack: The positions tab will hold a nested Stack navigator to manage drilling down into position details, editing them, and adding trades seamlessly while keeping the tab bar active.
Auth Guard: If no user is stored in state/context, we will intercept the layout render and overlay a beautiful full-screen premium Login screen.
Open Questions
None at this stage. The target requirements are fully covered by mapping the existing pages and services.

Proposed Changes
Core API & Context
Helper files to establish the network layer and authentication state matching the React Web app.

[NEW] 
api.ts
Connects to the backend server with platform-aware host addresses (defaults to http://10.0.2.2:3001 for Android Emulator, http://localhost:3001 for web/iOS).
Implements equivalent wrapper functions matching the frontend/web/src/services/api.js client interface.
[NEW] 
auth-context.tsx
Replicates AuthContext.jsx authentication context logic.
Manages user login/logout states.
Saves and loads session user details (stored in memory and optionally persistent state).
[NEW] 
LoginScreen.tsx
Premium dark-themed, glassmorphic login card with interactive inputs and feedback.
Pre-filled with demo credentials (trader / password123) for seamless developer onboarding.
App Shell & Navigation
Updating layouts to integrate authentication guards, apply the covered calls theme palette, and define the tab bar items.

[MODIFY] 
_layout.tsx
Wraps the application layout content with AuthProvider.
Checks if the user is authenticated. If not, displays LoginScreen.
Otherwise, proceeds to render the main AppTabs shell.
[MODIFY] 
theme.ts
Customizes the dark theme palette to match the web dashboard design tokens (#0f1117 background, #1a1d27 surface element card, blue accents, green/red values).
[MODIFY] 
app-tabs.tsx
Redefines native tabs layout triggers:
index -> Dashboard (Home)
positions -> Positions Stack
statistics -> Advanced Statistics
Configures icon references.
[MODIFY] 
app-tabs.web.tsx
Aligns the web tab fallback layout triggers to match index, positions, and statistics.
Screens (Vite Pages to Expo Router Screens)
Re-implementing the web user interface as React Native views using high-quality layouts.

[MODIFY] 
index.tsx
Home/Dashboard:
Displays summary stat cards (Total P&L, Win Rate, Open Positions, 30D Premium) with colored values.
Implements the Monthly Income Chart using pure React Native view bars.
Renders a horizontal card carousel of active call positions.
Lists the recent trade activity feed with quick visual status indicators.
[DELETE] 
explore.tsx
Removed as it is replaced by the specific positions list stack and statistics pages.
[NEW] 
statistics.tsx
Advanced Statistics tab screen:
Leverages horizontal navigation pills to switch views: Overview, Income, Performance, Risk.
Overview: Key metrics, average days option held, assignment rates, and ranked tickers list.
Income: 30D/60D/90D income stats, monthly bar chart, and total premium by ticker.
Performance: Streaks (win/loss records), moneyness segmented distribution bar.
Risk: Drawdown stats, max exposure capital, and risk concentration breakdown progress bar list.
Positions Stack Components
A nested routing stack within the Positions tab, allowing clean push/pop screen transitions.

[NEW] 
_layout.tsx
Initiates <Stack> navigator within the positions folder workspace.
[NEW] 
index.tsx
Positions List screen:
Renders active, closed, and assigned covered call positions.
Interactive filter filters by status (horizontal pill switches) and ticker.
Sorting toggles (opened date, ticker alphabetically, cost basis, status).
List entries drill down to details or link to add covered calls directly.
[NEW] 
[id].tsx
Position Detail screen:
Displays comprehensive stats for a single ticker (yield on cost, cost basis vs. effective basis, total premium offset).
Renders visual progress bars of basis reductions.
Lists the historical trade log contracts.
Supports actions: Close option (triggering modal), Expire option, and Assign option.
Integrates the Option Signal Assessment tool (inputs current underlying/option price and hits /trades/:id/assess to display actionable Hold/Close/Roll signals).
[NEW] 
add.tsx
Form to log new shares holdings (ticker, average cost basis, purchase date, contract-compliant multiple of 100 shares, and notes).
[NEW] 
[id]/edit.tsx
Form to edit an underlying holding details.
[NEW] 
[id]/trades/add.tsx
Covered call entry form (contracts, strike price, premium per share, dates, volatility parameters).
Live Return Projection widget: Updates capital-at-risk, DTE, return on capital (ROC), and annualized yield indicators as the user types.
Verification Plan
Automated Tests
Run npm run lint in frontend/mobile to verify code compiles and conforms to TypeScript configurations.
Manual Verification
Run backend server and database.
Run npm start in the mobile app, and launch on the Android Emulator.
Test full app flows:
Log in via the credentials card (trader / password123).
View dashboard statistics and review the custom bar charts.
Add a new position (e.g. TSLA, 200 shares, $220.00 average cost).
Add a trade against that position (e.g. Strike $230.00, $5.00 premium per share).
Navigate to the new position detail, verify the basis offset calculations.
Run the Assessment Tool with custom prices, checking that Hold/Close/Roll recommendations render correctly.
Exercise Close/Expire/Assign status changes.
Review the advanced statistics tabs to check streak calculations and concentration progress indicators.