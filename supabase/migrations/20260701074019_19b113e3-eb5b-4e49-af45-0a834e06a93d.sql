
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role public.app_role;
  v_role_text text;
  v_province public.province;
BEGIN
  v_role_text := NEW.raw_user_meta_data ->> 'role';
  IF v_role_text IN ('student','psychologist','organisation') THEN
    v_role := v_role_text::public.app_role;
  ELSE
    v_role := 'student';
  END IF;

  BEGIN
    v_province := NULLIF(NEW.raw_user_meta_data ->> 'province','')::public.province;
  EXCEPTION WHEN others THEN v_province := NULL;
  END;

  INSERT INTO public.profiles (id, full_name, email, university, degree, province)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email,'@',1)),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data ->> 'university',''),
    NULLIF(NEW.raw_user_meta_data ->> 'degree',''),
    v_province
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role)
  ON CONFLICT DO NOTHING;

  IF v_role = 'psychologist' THEN
    INSERT INTO public.psychologist_details (user_id, hpcsa_number, category, organisation, verified_at)
    VALUES (
      NEW.id,
      NULLIF(NEW.raw_user_meta_data ->> 'hpcsa_number',''),
      NULLIF(NEW.raw_user_meta_data ->> 'psych_category',''),
      NULLIF(NEW.raw_user_meta_data ->> 'psych_org',''),
      now()
    );
  END IF;

  RETURN NEW;
END; $function$;

REVOKE EXECUTE ON FUNCTION public.get_public_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO authenticated;
