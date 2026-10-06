-- Add photo_url to profiles table
-- Run this in Supabase SQL Editor if you already applied the initial schema

alter table public.profiles
  add column if not exists photo_url text;

comment on column public.profiles.photo_url is 'Profile photo URL from Supabase Storage bucket: profile-photos';
