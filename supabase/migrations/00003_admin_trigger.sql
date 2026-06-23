-- Keep self-service registrations as customers.
-- Admin role must be assigned explicitly outside the public signup flow.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    'customer'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
