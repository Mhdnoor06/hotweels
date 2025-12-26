-- ============================================
-- CUSTOM CARS TABLE (for frame customization)
-- ============================================
CREATE TABLE public.custom_cars (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  series TEXT,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  transparent_image TEXT NOT NULL,  -- PNG image URL (Supabase storage)
  video_url TEXT,                    -- Cloudinary video URL
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CUSTOM BACKGROUNDS TABLE
-- ============================================
CREATE TABLE public.custom_backgrounds (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  image TEXT NOT NULL,               -- Background image URL (Supabase storage)
  car_id UUID REFERENCES public.custom_cars(id) ON DELETE CASCADE,
  is_common BOOLEAN DEFAULT false,   -- If true, available for all cars
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_custom_cars_active ON public.custom_cars(active);
CREATE INDEX idx_custom_backgrounds_car_id ON public.custom_backgrounds(car_id);
CREATE INDEX idx_custom_backgrounds_is_common ON public.custom_backgrounds(is_common);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE public.custom_cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_backgrounds ENABLE ROW LEVEL SECURITY;

-- CUSTOM CARS policies (public read, admin write)
CREATE POLICY "Anyone can view active custom cars" ON public.custom_cars
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can view all custom cars" ON public.custom_cars
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert custom cars" ON public.custom_cars
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update custom cars" ON public.custom_cars
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete custom cars" ON public.custom_cars
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- CUSTOM BACKGROUNDS policies (public read, admin write)
CREATE POLICY "Anyone can view active custom backgrounds" ON public.custom_backgrounds
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can view all custom backgrounds" ON public.custom_backgrounds
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert custom backgrounds" ON public.custom_backgrounds
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update custom backgrounds" ON public.custom_backgrounds
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete custom backgrounds" ON public.custom_backgrounds
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger for updated_at on custom_cars
CREATE TRIGGER update_custom_cars_updated_at
  BEFORE UPDATE ON public.custom_cars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
