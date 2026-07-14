
-- 1. Private schema not exposed by PostgREST
CREATE SCHEMA IF NOT EXISTS internal;
REVOKE ALL ON SCHEMA internal FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA internal TO authenticated, service_role;

-- 2. Recreate has_role in the private schema
CREATE OR REPLACE FUNCTION internal.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
REVOKE ALL ON FUNCTION internal.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION internal.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 3. Recreate handle_new_user in the private schema
CREATE OR REPLACE FUNCTION internal.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION internal.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 4. Rebuild RLS policies to call internal.has_role
DROP POLICY IF EXISTS "Admins manage providers" ON public.service_providers;
CREATE POLICY "Admins manage providers" ON public.service_providers
  FOR ALL TO authenticated
  USING (internal.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (internal.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins manage region packs" ON public.region_packs;
CREATE POLICY "Admins manage region packs" ON public.region_packs
  FOR ALL TO authenticated
  USING (internal.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (internal.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins manage pack items" ON public.region_pack_items;
CREATE POLICY "Admins manage pack items" ON public.region_pack_items
  FOR ALL TO authenticated
  USING (internal.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (internal.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users view own requests" ON public.assistance_requests;
CREATE POLICY "Users view own requests" ON public.assistance_requests
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR internal.has_role(auth.uid(), 'technician'::public.app_role)
    OR internal.has_role(auth.uid(), 'admin'::public.app_role)
  );

DROP POLICY IF EXISTS "Users update own requests" ON public.assistance_requests;
CREATE POLICY "Users update own requests" ON public.assistance_requests
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR internal.has_role(auth.uid(), 'technician'::public.app_role)
    OR internal.has_role(auth.uid(), 'admin'::public.app_role)
  );

DROP POLICY IF EXISTS "Users delete own requests" ON public.assistance_requests;
CREATE POLICY "Users delete own requests" ON public.assistance_requests
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR internal.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- 5. Rewire the auth.users trigger to the private function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION internal.handle_new_user();

-- 6. Drop the old public versions
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.handle_new_user();
