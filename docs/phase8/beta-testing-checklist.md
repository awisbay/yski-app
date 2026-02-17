# Beta Testing Checklist

> Comprehensive checklist for beta testers and the development team.

---

## For Beta Testers

### Day 1: Getting Started

- [ ] Download and install the app (TestFlight / Play Store)
- [ ] Create a new account
- [ ] Verify email/phone
- [ ] Complete profile setup
- [ ] Explore the home screen
- [ ] Check all navigation tabs

**Feedback Questions:**
- Was registration smooth?
- Did you receive the verification code?
- Is the app easy to navigate?

### Day 2: Booking Pindahan

- [ ] Navigate to Booking Pindahan
- [ ] Select a date (at least 3 days from now)
- [ ] Choose available slot
- [ ] Fill in address details
- [ ] Add notes/instructions
- [ ] Submit booking
- [ ] View booking in history
- [ ] Check booking status

**Test Edge Cases:**
- [ ] Try booking a past date (should be rejected)
- [ ] Try booking same date twice (should show conflict)
- [ ] Cancel a booking

**Feedback Questions:**
- Was the date picker easy to use?
- Did you understand the slot availability?
- Was address input smooth?

### Day 3: Donasi & Zakat

- [ ] Navigate to Donasi
- [ ] Select donation type
- [ ] Enter custom amount
- [ ] Select preset amount
- [ ] Choose payment method
- [ ] Submit donation
- [ ] View donation in history

- [ ] Navigate to Jemput Zakat
- [ ] Select zakat type
- [ ] Enter pickup address
- [ ] Select pickup schedule
- [ ] Add notes
- [ ] Submit request

**Test Edge Cases:**
- [ ] Try amount below minimum (Rp 10,000)
- [ ] Try invalid phone number

**Feedback Questions:**
- Were donation amounts clear?
- Did you understand the payment flow?
- Was address input for pickup easy?

### Day 4: Alkes & Lelang

- [ ] Navigate to Alkes
- [ ] Browse equipment list
- [ ] Filter by category
- [ ] View equipment details
- [ ] Submit loan request
- [ ] View loan status

- [ ] Navigate to Lelang
- [ ] Browse active auctions
- [ ] View auction details
- [ ] Place a bid
- [ ] Check bid status

**Test Edge Cases:**
- [ ] Try to bid below minimum increment
- [ ] Try to bid on closed auction

**Feedback Questions:**
- Could you find the equipment you needed?
- Was the bidding process clear?
- Did you understand the auction rules?

### Day 5: Laporan & Profil

- [ ] Navigate to Laporan Keuangan
- [ ] View financial dashboard
- [ ] Browse financial reports
- [ ] View program progress

- [ ] Navigate to Profile
- [ ] Edit profile information
- [ ] Change password
- [ ] View activity history

- [ ] Check Notifications
- [ ] View all notifications
- [ ] Mark notifications as read

**Feedback Questions:**
- Were the financial reports clear?
- Did you find the profile settings easily?
- Were notifications helpful?

---

## Feature-Specific Checklists

### Authentication

- [ ] Register with email
- [ ] Register with phone
- [ ] Login with email
- [ ] Login with phone
- [ ] Forgot password flow
- [ ] Logout
- [ ] Session timeout handling
- [ ] Token refresh

### Booking Pindahan (Admin/Relawan)

- [ ] View all bookings
- [ ] Filter by status
- [ ] Approve booking
- [ ] Reject booking
- [ ] Assign relawan
- [ ] Update booking status
- [ ] Complete booking

### Donations (Admin/Pengurus)

- [ ] View all donations
- [ ] Filter by status
- [ ] Verify donation (manual transfer)
- [ ] Reject donation
- [ ] View donation statistics

---

## Technical Testing

### Device Compatibility

Test on these devices/platforms:

| Device | OS Version | Status |
|--------|------------|--------|
| iPhone 14 Pro | iOS 17.x | ⬜ |
| iPhone 12 | iOS 16.x | ⬜ |
| iPhone SE | iOS 15.x | ⬜ |
| Samsung Galaxy S23 | Android 14 | ⬜ |
| Google Pixel 7 | Android 13 | ⬜ |
| Xiaomi Redmi Note | Android 12 | ⬜ |

### Network Conditions

- [ ] Test on WiFi
- [ ] Test on 4G/5G
- [ ] Test on slow 3G
- [ ] Test with intermittent connection
- [ ] Test offline behavior

### Performance

- [ ] App launch time < 3 seconds
- [ ] Screen transitions smooth
- [ ] No noticeable lag in forms
- [ ] Image loading reasonable
- [ ] No memory warnings

---

## For Development Team

### Daily Monitoring Checklist

**Morning (8:00 AM):**
- [ ] Check overnight crash reports (Sentry/Expo)
- [ ] Review error logs
- [ ] Check Telegram alerts
- [ ] Verify API health endpoints
- [ ] Check database performance

**Afternoon (2:00 PM):**
- [ ] Review user feedback from WhatsApp
- [ ] Check new feedback form submissions
- [ ] Review KPI dashboard
- [ ] Check for critical bugs

**Evening (6:00 PM):**
- [ ] Summary of day's issues
- [ ] Plan next day's priorities
- [ ] Update stakeholders

### Weekly Tasks

- [ ] Review all feedback collected
- [ ] Prioritize bug fixes
- [ ] Update beta testers on fixes
- [ ] Review KPI trends
- [ ] Plan next week's features/fixes

### Bug Triage

For each bug report:
- [ ] Reproduce the issue
- [ ] Assign severity (P0/P1/P2/P3)
- [ ] Assign to developer
- [ ] Estimate fix time
- [ ] Update reporter

---

## Feedback Collection

### Channels

1. **In-App Feedback**
   - Shake to report
   - Profile → Feedback

2. **WhatsApp Group**
   - Quick reports
   - Screenshots
   - Group discussion

3. **Google Form**
   - Structured feedback
   - Feature requests
   - Overall rating

### Questions to Ask

**Weekly Survey:**
1. How satisfied are you with the app? (1-10)
2. What feature did you use most?
3. What was most confusing?
4. Any crashes or errors?
5. What feature would you add?
6. Would you recommend to a friend?

**Open-ended:**
- What did you like most?
- What frustrated you?
- Any suggestions for improvement?

---

## Beta Exit Criteria Checklist

### Quantitative

- [ ] 30+ registered users
- [ ] Crash-free rate >99%
- [ ] API uptime >99.5% (7 days)
- [ ] All P0 bugs resolved
- [ ] Max 3 P1 bugs open
- [ ] Average rating >4.0

### Qualitative

- [ ] >70% positive feedback
- [ ] No recurring UX confusion
- [ ] Core workflows validated
- [ ] Payment flow tested end-to-end
- [ ] Admin tools validated

### Stakeholder Sign-off

- [ ] Project lead approval
- [ ] Yayasan representative approval
- [ ] Technical lead confirmation

---

*Last updated: 2026-02-18*
