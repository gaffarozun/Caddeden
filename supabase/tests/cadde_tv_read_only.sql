-- Read-only Cadde TV regression checks; no records are changed.
do $$ begin
 if not has_function_privilege('anon','public.public_cadde_tv_channels()','execute') then raise exception 'Public TV read permission missing'; end if;
 if not has_function_privilege('authenticated','public.submit_university_message(text)','execute') then raise exception 'Student submission permission missing'; end if;
 if has_function_privilege('anon','public.submit_university_message(text)','execute') then raise exception 'Anonymous student submission exposed'; end if;
 if exists(select 1 from public.public_cadde_tv_channels() c join public.businesses b on b.id=c.business_id where b.approval_status<>'approved' or not b.is_published) then raise exception 'Unpublished business exposed'; end if;
 if exists(select 1 from public.public_cadde_tv_channels() c join public.ads a on a.id=c.id where c.sponsored and (a.status<>'active' or a.payment_status<>'paid' or a.start_date>current_date or a.end_date<current_date)) then raise exception 'Unapproved ad exposed'; end if;
 if exists(select 1 from public.public_cadde_tv_channels() c join public.business_posts p on p.id=c.id where not c.sponsored and (p.kind<>'reel' or p.status<>'approved')) then raise exception 'Pending content exposed'; end if;
 if not (select relrowsecurity from pg_class where oid='public.university_messages'::regclass) then raise exception 'Student RLS missing'; end if;
 if not (select relrowsecurity from pg_class where oid='public.ads'::regclass) then raise exception 'Ad RLS missing'; end if;
 if not (select relrowsecurity from pg_class where oid='public.business_posts'::regclass) then raise exception 'Content RLS missing'; end if;
end; $$;
begin;
set local role anon;
select count(*) as visible_tv_channels from public.public_cadde_tv_channels();
reset role;
rollback;
