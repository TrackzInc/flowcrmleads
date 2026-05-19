-- Add file_categories to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS file_categories TEXT[] DEFAULT '{}';
