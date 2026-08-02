import { prisma } from "../prisma";

// A primary profile can act on behalf of any sibling profile on the same
// account (view/rate/watch-list); every other profile can only act on itself.
export async function canManageProfile(
  userId: string,
  activeProfileId: string,
  targetProfileId: string,
): Promise<boolean> {
  if (targetProfileId === activeProfileId) return true;

  const [activeProfile, targetProfile] = await Promise.all([
    prisma.profile.findUnique({ where: { id: activeProfileId } }),
    prisma.profile.findUnique({ where: { id: targetProfileId } }),
  ]);

  if (!activeProfile?.isPrimary) return false;
  return Boolean(targetProfile && targetProfile.userId === userId);
}
