# Admin claim approval with temporary password — design

**Date:** 2026-07-31  
**Status:** Approved (user: “ilerle”)

## Goal

On admin **Kurum edinimi**, pending claim rows show **Onayla**. Confirm modal completes ownership: approve claim, verify institution, bind owner, provision Auth user with temporary password, email credentials. Owner can change password in the portal.

## Flow

1. Row with pending `claim_request` → **Onayla**
2. Modal: institution, applicant name, email → Onayla / İptal
3. Server: `approveClaimRequest`
   - claim → `approved`
   - institution verification → `verified`
   - `institutionOwners` approved binding
   - Firebase Auth create/update user (email + temp password, `role: owner`, emailVerified)
   - Email: login email, temp password, `/login` link (absolute URL)
4. Owner profile: change password (current + new)

## Out of scope

Bulk approve, reject UI, password-reset link as primary delivery.
