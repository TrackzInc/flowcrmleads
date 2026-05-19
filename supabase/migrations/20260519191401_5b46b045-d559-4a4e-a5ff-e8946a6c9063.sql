-- Create project_files table
CREATE TABLE public.project_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  size BIGINT,
  content_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add file_categories_metadata to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS file_categories_metadata JSONB DEFAULT '{}'::jsonb;

-- Enable RLS on project_files
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

-- Create policies for project_files
CREATE POLICY "Users can view their own project files" 
ON public.project_files 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own project files" 
ON public.project_files 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project files" 
ON public.project_files 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage bucket for project files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can view their own project storage" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'project-files' AND auth.uid()::text = owner::text);

CREATE POLICY "Users can upload their own project storage" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'project-files' AND auth.uid()::text = owner::text);

CREATE POLICY "Users can update their own project storage" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'project-files' AND auth.uid()::text = owner::text);

CREATE POLICY "Users can delete their own project storage" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'project-files' AND auth.uid()::text = owner::text);
