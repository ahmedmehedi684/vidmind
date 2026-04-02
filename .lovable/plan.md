## Phase 1: Task Manager UI Fixes
1. **Date strip horizontal scroll** — Date bar সাইড স্ক্রল হবে, পুরো পেজ স্ক্রল হবে না
2. **Done confirmation popup** — Task done করতে গেলে Yes/No popup আসবে
3. **Progress graph** — দুইটা bar chart (Done=green left, Undone=red right) with % display

## Phase 2: Payment System
4. **Admin Payment Method Manager** — Admin panel এ payment method (bKash/Nagad/Rocket/Upay + Payoneer) details add/edit করার section
5. **Currency detection** — User এর location/IP অনুযায়ী BDT বা USD auto-select, manual override option
6. **User Payment Page update** — BDT হলে mobile payment methods দেখাবে, USD হলে Payoneer দেখাবে
7. **Pricing/Subscription page** — User দের জন্য plan দেখানো ও payment flow

## Phase 3: Notifications (Future)
8. **Mobile push notifications** — Task এর সময় অনুযায়ী notification পাঠানো (এটা Play Store app দরকার, web notification দিয়ে শুরু করা যায়)

> **Note:** Push notification for mobile app needs service worker + Firebase Cloud Messaging setup — এটা আলাদা ধাপে করবো।
