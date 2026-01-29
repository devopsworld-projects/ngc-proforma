-- Add RLS policies to prevent unauthorized UPDATE and DELETE on user_sessions
-- This prevents attackers from manipulating or deleting session audit logs

-- Policy: Only admins can update sessions (e.g., to mark them inactive)
CREATE POLICY "Admins can update all sessions" 
ON public.user_sessions 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Only admins can delete sessions  
CREATE POLICY "Admins can delete all sessions" 
ON public.user_sessions 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));