export type AppUser = {
  full_name?: string | null;
  kunyah_name?: string | null;
  email?: string | null;
  occupation?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
};

const hasText = (value?: string | null) => !!value && value.trim().length > 0;

export function isProfileComplete(user?: AppUser | null): boolean {
  if (!user) return false;
  return (
    hasText(user.full_name) &&
    hasText(user.kunyah_name) &&
    hasText(user.email) &&
    hasText(user.occupation) &&
    hasText(user.phone) &&
    hasText(user.address) &&
    hasText(user.city) &&
    hasText(user.province)
  );
}
