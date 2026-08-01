-- 1. Create Profile table
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarColor" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Profile_userId_idx" ON "Profile"("userId");

-- 2. Backfill exactly one default Profile per existing User
INSERT INTO "Profile" ("id", "userId", "name", "createdAt")
SELECT 'profile_' || lower(hex(randomblob(12))), "id", 'Default', "createdAt" FROM "User";

-- 3. Rebuild Rating with profileId (SQLite requires a table rebuild for this kind of FK swap)
CREATE TABLE "new_Rating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "mediaType" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "posterPath" TEXT,
    "genreIds" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Rating_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Rating" ("id", "profileId", "tmdbId", "mediaType", "value", "title", "posterPath", "genreIds", "createdAt", "updatedAt")
SELECT r."id", p."id", r."tmdbId", r."mediaType", r."value", r."title", r."posterPath", r."genreIds", r."createdAt", r."updatedAt"
FROM "Rating" r
JOIN "Profile" p ON p."userId" = r."userId";

DROP TABLE "Rating";
ALTER TABLE "new_Rating" RENAME TO "Rating";

CREATE INDEX "Rating_profileId_idx" ON "Rating"("profileId");
CREATE UNIQUE INDEX "Rating_profileId_tmdbId_mediaType_key" ON "Rating"("profileId", "tmdbId", "mediaType");
