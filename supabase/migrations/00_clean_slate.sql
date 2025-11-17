-- Clean Slate: Drop all existing tables to start fresh
-- Run this FIRST before running the initial_schema.sql

-- Drop existing tables (Connor's previous setup)
drop table if exists public.user_badges cascade;
drop table if exists public.badges cascade;
drop table if exists public.game_scores cascade;
drop table if exists public.transactions cascade;
drop table if exists public.plants cascade;
drop table if exists public.events cascade;
drop table if exists public.pots cascade;
drop table if exists public.profiles cascade;
drop table if exists public.products cascade;
drop table if exists public.users cascade;

-- Drop any existing types
drop type if exists public.order_status cascade;
drop type if exists public.audit_type cascade;

-- Drop any existing functions/triggers
drop function if exists public.handle_new_user cascade;
drop function if exists public.update_updated_at_column cascade;
drop function if exists public.apply_xp cascade;

-- Clean slate ready for fresh migration

