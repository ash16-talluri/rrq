
-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('user', 'technician', 'admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Vehicles
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_number TEXT NOT NULL,
  make TEXT,
  model TEXT,
  year INT,
  color TEXT,
  fuel_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own vehicles" ON public.vehicles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Service provider types
CREATE TYPE public.provider_type AS ENUM ('puncture_shop','mechanic','towing','fuel_station','hospital','police');

CREATE TABLE public.service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type public.provider_type NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  region TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  rating NUMERIC(2,1) DEFAULT 0,
  hours TEXT,
  open_24h BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_providers TO anon, authenticated;
GRANT ALL ON public.service_providers TO service_role;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view providers" ON public.service_providers FOR SELECT USING (true);
CREATE POLICY "Admins manage providers" ON public.service_providers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER service_providers_updated_at BEFORE UPDATE ON public.service_providers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Region packs
CREATE TABLE public.region_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  region TEXT,
  highway TEXT,
  size_kb INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.region_packs TO anon, authenticated;
GRANT ALL ON public.region_packs TO service_role;
ALTER TABLE public.region_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view region packs" ON public.region_packs FOR SELECT USING (true);
CREATE POLICY "Admins manage region packs" ON public.region_packs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER region_packs_updated_at BEFORE UPDATE ON public.region_packs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Region pack items (link providers + free-form emergency contacts)
CREATE TABLE public.region_pack_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES public.region_packs(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.service_providers(id) ON DELETE CASCADE,
  extra_name TEXT,
  extra_phone TEXT,
  extra_type TEXT,
  extra_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.region_pack_items TO anon, authenticated;
GRANT ALL ON public.region_pack_items TO service_role;
ALTER TABLE public.region_pack_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view pack items" ON public.region_pack_items FOR SELECT USING (true);
CREATE POLICY "Admins manage pack items" ON public.region_pack_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Assistance requests
CREATE TYPE public.request_type AS ENUM ('puncture','blowout','dead_battery','wont_start','mechanical','other');
CREATE TYPE public.request_status AS ENUM ('pending','accepted','in_progress','resolved','cancelled');

CREATE TABLE public.assistance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  type public.request_type NOT NULL,
  status public.request_status NOT NULL DEFAULT 'pending',
  description TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_text TEXT,
  assigned_technician UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assistance_requests TO authenticated;
GRANT ALL ON public.assistance_requests TO service_role;
ALTER TABLE public.assistance_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own requests" ON public.assistance_requests FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'technician') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users create own requests" ON public.assistance_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own requests" ON public.assistance_requests FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'technician') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users delete own requests" ON public.assistance_requests FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER assistance_requests_updated_at BEFORE UPDATE ON public.assistance_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
