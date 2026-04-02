## Plan: Subscription System Upgrade

### Phase 1: Database Changes
- Add `currency` column to `subscription_plans` (BDT/USD)
- Add `limits` JSONB column to `subscription_plans` for feature access limits (tasks, transactions, summaries per month)
- Add `team_members` table for staff/moderator management
- Update existing Free/Pro plans with BDT/USD variants and feature limits

### Phase 2: Feature Access Control
- Create a hook/utility to check user's plan limits (e.g., max tasks, max transactions, max summaries per month)
- Enforce limits in TaskManager, MoneyManager, and Summarize features
- Admin can set "unlimited" for any feature limit

### Phase 3: Payment Flow Improvements
- Landing page plan button → if not logged in → sign up → redirect to payment page (not re-select plan)
- Payment page: must select payment method before submit
- Copy button on payment method account numbers
- Currency selector (BDT/USD) on subscription page

### Phase 4: Admin Payment Orders Page Upgrade
- Show: user email, user name, plan name, currency, payment method, payment number, amount, Transaction ID, status, expiry date
- Edit button for orders
- User section: name, email, user ID, subscription count, plan name

### Phase 5: Team/Staff Management
- Admin can add team members with roles (moderator, CEO, staff)
- Name, email, password fields
- Role-based confirmation email
- Staff list with role badges

### Implementation Order
1. Database migration (Phase 1)
2. Update plans with limits (Phase 1)
3. Admin payment page upgrade (Phase 4)
4. Payment flow improvements (Phase 3)
5. Feature access control (Phase 2)
6. Team management (Phase 5)
