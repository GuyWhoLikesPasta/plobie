# Critical Schema Mismatch - Week 3

## Problem
Production database uses OLD schema (user_id) but Week 3 code uses NEW schema (profile_id).

##  Production Schema (Week 1/2)
- `pot_claims.user_id` (NOT profile_id)
- `xp_events.user_id` (NOT profile_id)
- `xp_balances.user_id` (NOT profile_id)  
- `xp_balances.balance` (NOT total_xp)
- No `profile_id`, `reference_type`, `reference_id` columns
- No `apply_xp` stored procedure with Week 3 signature

## Week 3 Code Expectations
- Uses `profile_id` everywhere
- Uses `total_xp`, `level` columns
- Uses `apply_xp` stored procedure

## Quick Fix (Now)
Revert Week 3 APIs to use user_id schema

## Proper Fix (Later)
Run migration to add profile_id columns and new apply_xp function

