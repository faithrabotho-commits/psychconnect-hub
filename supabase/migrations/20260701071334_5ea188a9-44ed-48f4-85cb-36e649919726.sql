
ALTER TABLE public.experiences ADD CONSTRAINT experiences_author_profile_fk FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.forum_threads ADD CONSTRAINT forum_threads_author_profile_fk FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.forum_posts ADD CONSTRAINT forum_posts_author_profile_fk FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.experience_comments ADD CONSTRAINT experience_comments_author_profile_fk FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
