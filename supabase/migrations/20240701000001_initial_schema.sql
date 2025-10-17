-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create receipts table
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users NOT NULL,
  image_url TEXT,
  total DECIMAL(10, 2) NOT NULL,
  store TEXT,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  category TEXT,
  fraud_score DECIMAL(3, 2)
);

-- Create receipt_items table
CREATE TABLE IF NOT EXISTS public.receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID REFERENCES public.receipts NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create points_transactions table
CREATE TABLE IF NOT EXISTS public.points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users NOT NULL,
  points INTEGER NOT NULL,
  source TEXT NOT NULL,
  receipt_id UUID REFERENCES public.receipts,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  total_points INTEGER DEFAULT 0 NOT NULL,
  level INTEGER DEFAULT 1 NOT NULL,
  achievements TEXT[] DEFAULT '{}' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create rewards table
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  points_cost INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  stock INTEGER,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create leaderboard view
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
  u.id as user_id,
  up.display_name,
  up.avatar_url,
  up.total_points as points,
  RANK() OVER (ORDER BY up.total_points DESC) as rank
FROM 
  public.users u
JOIN 
  public.user_profiles up ON u.id = up.user_id
ORDER BY 
  rank ASC;

-- Create receipt_analysis table
CREATE TABLE IF NOT EXISTS public.receipt_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID REFERENCES public.receipts NOT NULL,
  items JSONB NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  store TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  confidence_score DECIMAL(3, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create system_logs table for edge function logging
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation TEXT NOT NULL,
  status TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create daily_challenges table
CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  points_reward INTEGER NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users table policies
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Receipts policies
DROP POLICY IF EXISTS "Users can view their own receipts" ON public.receipts;
CREATE POLICY "Users can view their own receipts" ON public.receipts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own receipts" ON public.receipts;
CREATE POLICY "Users can insert their own receipts" ON public.receipts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Receipt items policies
DROP POLICY IF EXISTS "Users can view their own receipt items" ON public.receipt_items;
CREATE POLICY "Users can view their own receipt items" ON public.receipt_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.receipts
      WHERE receipts.id = receipt_items.receipt_id AND receipts.user_id = auth.uid()
    )
  );

-- Points transactions policies
DROP POLICY IF EXISTS "Users can view their own points transactions" ON public.points_transactions;
CREATE POLICY "Users can view their own points transactions" ON public.points_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- User profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = user_profiles.user_id AND users.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = user_profiles.user_id AND users.id = auth.uid()
    )
  );

-- Rewards policies (public read)
DROP POLICY IF EXISTS "Rewards are public" ON public.rewards;
CREATE POLICY "Rewards are public" ON public.rewards
  FOR SELECT USING (true);

-- Receipt analysis policies
DROP POLICY IF EXISTS "Users can view their own receipt analysis" ON public.receipt_analysis;
CREATE POLICY "Users can view their own receipt analysis" ON public.receipt_analysis
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.receipts
      WHERE receipts.id = receipt_analysis.receipt_id AND receipts.user_id = auth.uid()
    )
  );

-- System logs policies (admin only)
DROP POLICY IF EXISTS "System logs are admin only" ON public.system_logs;
CREATE POLICY "System logs are admin only" ON public.system_logs
  FOR SELECT USING (auth.uid() IN (SELECT id FROM public.users WHERE email = 'admin@example.com'));

-- Daily challenges policies (public read)
DROP POLICY IF EXISTS "Daily challenges are public" ON public.daily_challenges;
CREATE POLICY "Daily challenges are public" ON public.daily_challenges
  FOR SELECT USING (true);

-- Create functions
-- Create function to reset weekly points
CREATE OR REPLACE FUNCTION reset_weekly_points()
RETURNS void AS $$
BEGIN
  UPDATE public.user_profiles
  SET weekly_points = 0,
      updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to reset monthly points
CREATE OR REPLACE FUNCTION reset_monthly_points()
RETURNS void AS $$
BEGIN
  UPDATE public.user_profiles
  SET monthly_points = 0,
      updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update user_profiles when points_transactions are inserted
CREATE OR REPLACE FUNCTION update_user_profile_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user_profiles
  UPDATE public.user_profiles
  SET 
    total_points = total_points + NEW.points,
    updated_at = now()
  WHERE user_id = NEW.user_id;
  
  -- If no profile record exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.user_profiles (user_id, display_name, total_points)
    VALUES (NEW.user_id, (SELECT email FROM public.users WHERE id = NEW.user_id), NEW.points);
  END IF;
  
  -- Update level based on points
  UPDATE public.user_profiles
  SET 
    level = CASE
      WHEN total_points < 100 THEN 1
      WHEN total_points < 250 THEN 2
      WHEN total_points < 500 THEN 3
      WHEN total_points < 1000 THEN 4
      WHEN total_points < 2000 THEN 5
      WHEN total_points < 3500 THEN 6
      WHEN total_points < 5000 THEN 7
      WHEN total_points < 7500 THEN 8
      WHEN total_points < 10000 THEN 9
      ELSE 10 + floor((total_points - 10000) / 2500)
    END
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_points_transaction_insert ON public.points_transactions;
CREATE TRIGGER on_points_transaction_insert
  AFTER INSERT ON public.points_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profile_points();

-- Create trigger to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NEW.created_at, NEW.updated_at);
  
  -- Create initial user_profile
  INSERT INTO public.user_profiles (user_id, display_name, total_points, level)
  VALUES (NEW.id, NEW.email, 0, 1);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Enable realtime for all tables
alter publication supabase_realtime add table users;
alter publication supabase_realtime add table receipts;
alter publication supabase_realtime add table receipt_items;
alter publication supabase_realtime add table points_transactions;
alter publication supabase_realtime add table user_profiles;
alter publication supabase_realtime add table rewards;
alter publication supabase_realtime add table receipt_analysis;
alter publication supabase_realtime add table system_logs;
alter publication supabase_realtime add table daily_challenges;