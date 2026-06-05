# QA Checklist - Employee Flow (Week 1 - Person 5)

## Authentication
- [ ] Log in employee (`active.employee@company.local` / `Active1234`) → redirect `/employee/dashboard`
- [ ] Log in admin without accessing employee route
- [ ] Log out, delete token + redirect login
- [ ] Protected routes working correctly

## Employee Dashboard
- [ ] Display correct username
- [ ] 3 card metrics (Asset, Request, To-Do)
- [ ] Responsive mobile + desktop

## My Assigned Assets
- [ ] Display asset grid card
- [ ] Search working
- [ ] Empty state when not found

## Asset Detail + Report Broken
- [ ] Click asset → open detail modal
- [ ] "Report Broken / Create Request" button in modal
- [ ] Successfully created maintenance request

## Maintenance Requests
- [ ] View request list
- [ ] Create new request (form + toast)
- [ ] Update status correct

## Profile
- [ ] Display full information
- [ ] Change Password flow (from profile or sidebar)

## Cross-cutting
- [ ] No console error (Playwright passed)
- [ ] No horizontal scroll
- [ ] Smooth animation, loading states
- [ ] Mobile sidebar works