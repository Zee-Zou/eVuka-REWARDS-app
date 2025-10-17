-- Only run this if we're in development mode
DO $$
DECLARE
  is_dev BOOLEAN;
BEGIN
  -- Check if we're in development mode
  is_dev := current_setting('request.jwt.claims', true)::jsonb ? 'role' = false OR 
            current_setting('request.jwt.claims', true)::jsonb->>'role' != 'service_role';
  
  IF is_dev THEN
    -- Insert sample users if they don't exist
    INSERT INTO public.users (id, email, display_name, avatar_url, created_at, updated_at)
    VALUES 
      ('00000000-0000-0000-0000-000000000001', 'john@example.com', 'John Doe', 'https://api.dicebear.com/7.x/avataaars/svg?seed=john', now(), now()),
      ('00000000-0000-0000-0000-000000000002', 'jane@example.com', 'Jane Smith', 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane', now(), now()),
      ('00000000-0000-0000-0000-000000000003', 'bob@example.com', 'Bob Johnson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob', now(), now())
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert sample user profiles
    INSERT INTO public.user_profiles (user_id, display_name, avatar_url, total_points, level, achievements)
    VALUES
      ('00000000-0000-0000-0000-000000000001', 'John Doe', 'https://api.dicebear.com/7.x/avataaars/svg?seed=john', 1250, 5, '{"First Receipt","Level 5"}'),
      ('00000000-0000-0000-0000-000000000002', 'Jane Smith', 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane', 750, 3, '{"First Receipt"}'),
      ('00000000-0000-0000-0000-000000000003', 'Bob Johnson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob', 2500, 6, '{"First Receipt","Level 5","7-Day Streak"}')
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Insert sample receipts
    INSERT INTO public.receipts (id, user_id, store, total, image_url, category, points_earned, created_at)
    VALUES
      ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Walmart', 56.78, 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80', 'Groceries', 150, now() - interval '3 days'),
      ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Target', 34.99, 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80', 'Household', 100, now() - interval '1 day'),
      ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Kroger', 45.67, 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80', 'Groceries', 120, now() - interval '2 days'),
      ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'Costco', 125.45, 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80', 'Bulk', 300, now() - interval '5 days')
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert sample receipt items
    INSERT INTO public.receipt_items (receipt_id, name, price, category)
    VALUES
      ('00000000-0000-0000-0000-000000000001', 'Milk', 3.99, 'Dairy'),
      ('00000000-0000-0000-0000-000000000001', 'Bread', 2.49, 'Bakery'),
      ('00000000-0000-0000-0000-000000000001', 'Eggs', 4.99, 'Dairy'),
      ('00000000-0000-0000-0000-000000000001', 'Apples', 5.99, 'Produce'),
      ('00000000-0000-0000-0000-000000000002', 'Paper Towels', 8.99, 'Household'),
      ('00000000-0000-0000-0000-000000000002', 'Dish Soap', 3.49, 'Household'),
      ('00000000-0000-0000-0000-000000000002', 'Laundry Detergent', 12.99, 'Household'),
      ('00000000-0000-0000-0000-000000000003', 'Chicken Breast', 12.99, 'Meat'),
      ('00000000-0000-0000-0000-000000000003', 'Rice', 4.99, 'Pantry'),
      ('00000000-0000-0000-0000-000000000003', 'Broccoli', 2.99, 'Produce'),
      ('00000000-0000-0000-0000-000000000004', 'TV', 499.99, 'Electronics'),
      ('00000000-0000-0000-0000-000000000004', 'Microwave', 89.99, 'Appliances')
    ON CONFLICT DO NOTHING;
    
    -- Insert sample points transactions
    INSERT INTO public.points_transactions (user_id, points, source, receipt_id)
    VALUES
      ('00000000-0000-0000-0000-000000000001', 150, 'Receipt Scan', '00000000-0000-0000-0000-000000000001'),
      ('00000000-0000-0000-0000-000000000001', 100, 'Receipt Scan', '00000000-0000-0000-0000-000000000002'),
      ('00000000-0000-0000-0000-000000000001', 50, 'Daily Challenge', NULL),
      ('00000000-0000-0000-0000-000000000002', 120, 'Receipt Scan', '00000000-0000-0000-0000-000000000003'),
      ('00000000-0000-0000-0000-000000000002', 100, 'Referral Bonus', NULL),
      ('00000000-0000-0000-0000-000000000003', 300, 'Receipt Scan', '00000000-0000-0000-0000-000000000004'),
      ('00000000-0000-0000-0000-000000000003', 200, 'Achievement', NULL)
    ON CONFLICT DO NOTHING;
    
    -- Insert sample rewards
    INSERT INTO public.rewards (title, description, image_url, points_cost, stock, category)
    VALUES
      ('$5 Amazon Gift Card', 'Redeem for a $5 Amazon gift card', 'https://images.unsplash.com/photo-1576224731050-fbde3f3d9a3e?w=800&q=80', 5000, 100, 'Gift Cards'),
      ('$10 Target Gift Card', 'Redeem for a $10 Target gift card', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80', 10000, 50, 'Gift Cards'),
      ('$20 Walmart Gift Card', 'Redeem for a $20 Walmart gift card', 'https://images.unsplash.com/photo-1601598851547-4302969d0614?w=800&q=80', 20000, 25, 'Gift Cards'),
      ('Premium Membership - 1 Month', 'Upgrade to Premium for 1 month', 'https://images.unsplash.com/photo-1567016526105-22da7c13161a?w=800&q=80', 7500, null, 'Memberships'),
      ('Donation to Charity', 'Donate $5 to a charity of your choice', 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&q=80', 3000, null, 'Donations')
    ON CONFLICT DO NOTHING;
    
    -- Insert sample receipt analysis
    INSERT INTO public.receipt_analysis (receipt_id, items, total, store, date, confidence_score)
    VALUES
      ('00000000-0000-0000-0000-000000000001', 
       '[{"name": "Milk", "price": 3.99, "category": "Dairy"}, {"name": "Bread", "price": 2.49, "category": "Bakery"}, {"name": "Eggs", "price": 4.99, "category": "Dairy"}, {"name": "Apples", "price": 5.99, "category": "Produce"}]'::jsonb, 
       56.78, 'Walmart', now() - interval '3 days', 0.95),
      ('00000000-0000-0000-0000-000000000002', 
       '[{"name": "Paper Towels", "price": 8.99, "category": "Household"}, {"name": "Dish Soap", "price": 3.49, "category": "Household"}, {"name": "Laundry Detergent", "price": 12.99, "category": "Household"}]'::jsonb, 
       34.99, 'Target', now() - interval '1 day', 0.92),
      ('00000000-0000-0000-0000-000000000003', 
       '[{"name": "Chicken Breast", "price": 12.99, "category": "Meat"}, {"name": "Rice", "price": 4.99, "category": "Pantry"}, {"name": "Broccoli", "price": 2.99, "category": "Produce"}]'::jsonb, 
       45.67, 'Kroger', now() - interval '2 days', 0.88),
      ('00000000-0000-0000-0000-000000000004', 
       '[{"name": "TV", "price": 499.99, "category": "Electronics"}, {"name": "Microwave", "price": 89.99, "category": "Appliances"}]'::jsonb, 
       125.45, 'Costco', now() - interval '5 days', 0.90)
    ON CONFLICT DO NOTHING;
    
    -- Insert sample daily challenges
    INSERT INTO public.daily_challenges (title, description, points_reward, start_date, end_date, is_active)
    VALUES
      ('Grocery Run', 'Scan a receipt from a grocery store', 50, now(), now() + interval '1 day', true),
      ('Big Spender', 'Scan a receipt with a total over $50', 75, now(), now() + interval '1 day', true),
      ('Early Bird', 'Scan a receipt before 10am', 50, now(), now() + interval '1 day', true)
    ON CONFLICT DO NOTHING;
  END IF;
END
$$;