-- Hot Wheels E-Commerce Database Schema
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  series TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  year INTEGER NOT NULL,
  color TEXT NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('Common', 'Uncommon', 'Rare', 'Super Rare', 'Treasure Hunt')),
  image TEXT NOT NULL,
  rating DECIMAL(2, 1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  description TEXT,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'verification_pending', 'verified', 'failed', 'cod')),
  payment_method TEXT DEFAULT 'cod' CHECK (payment_method IN ('cod', 'online')),
  transaction_id TEXT,
  payment_screenshot TEXT, -- URL to payment screenshot image
  total DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  shipping_address JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORDER ITEMS TABLE
-- ============================================
CREATE TABLE public.order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WISHLIST TABLE
-- ============================================
CREATE TABLE public.wishlist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ============================================
-- STORE SETTINGS TABLE
-- ============================================
CREATE TABLE public.store_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  -- Contact Information
  contact_phone TEXT,
  contact_email TEXT,
  contact_whatsapp TEXT,
  -- Payment Settings
  upi_qr_code TEXT, -- URL to QR code image
  upi_id TEXT,
  cod_enabled BOOLEAN DEFAULT true,
  online_payment_enabled BOOLEAN DEFAULT true,
  cod_charges DECIMAL(10, 2) DEFAULT 0,
  -- Discount Settings
  discount_enabled BOOLEAN DEFAULT false,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  discount_code TEXT,
  -- Store Info
  store_name TEXT DEFAULT 'Hot Wheels Store',
  store_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings row
INSERT INTO public.store_settings (id) VALUES (uuid_generate_v4());

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_products_series ON public.products(series);
CREATE INDEX idx_products_rarity ON public.products(rarity);
CREATE INDEX idx_products_price ON public.products(price);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_wishlist_user_id ON public.wishlist(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- USERS policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- PRODUCTS policies (public read, admin write)
CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert products" ON public.products
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update products" ON public.products
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete products" ON public.products
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ORDERS policies
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ORDER ITEMS policies
CREATE POLICY "Users can view their own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create order items for their orders" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can view all order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- WISHLIST policies
CREATE POLICY "Users can view their own wishlist" ON public.wishlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their wishlist" ON public.wishlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their wishlist" ON public.wishlist
  FOR DELETE USING (auth.uid() = user_id);

-- STORE SETTINGS policies (public read, admin write)
CREATE POLICY "Anyone can view store settings" ON public.store_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update store settings" ON public.store_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert store settings" ON public.store_settings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_store_settings_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Uncomment below to add sample products
/*
INSERT INTO public.products (name, series, price, year, color, rarity, image, rating, review_count, description, stock) VALUES
  ('Twin Mill', 'HW Legends', 12.99, 2024, 'Red', 'Rare', '/hw/twin-mill.png', 4.8, 156, 'Classic Twin Mill design with chrome finish', 25),
  ('Bone Shaker', 'HW Horror', 9.99, 2024, 'Black', 'Uncommon', '/hw/bone-shaker.png', 4.5, 89, 'Spooky skull-themed hot rod', 50),
  ('Porsche 911 GT3', 'Porsche Series', 15.99, 2024, 'Yellow', 'Super Rare', '/porche/911-gt3.png', 4.9, 234, 'Detailed replica of the iconic GT3', 10),
  ('Ferrari LaFerrari', 'Ferrari Collection', 19.99, 2023, 'Red', 'Treasure Hunt', '/ferrari/laferrari.png', 5.0, 312, 'Limited edition hypercar', 5),
  ('Lamborghini Huracan', 'Lamborghini Series', 14.99, 2024, 'Green', 'Rare', '/lamborgini/huracan.png', 4.7, 178, 'Striking Huracan with detailed interior', 15);
*/
