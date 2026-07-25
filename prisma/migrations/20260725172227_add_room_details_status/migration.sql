-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ACType" AS ENUM ('FAN_ONLY', 'FAN_AC');

-- CreateEnum
CREATE TYPE "CupboardType" AS ENUM ('INDIVIDUAL', 'SHARED', 'NONE');

-- AlterEnum
ALTER TYPE "RoomType" ADD VALUE 'CUSTOM';

-- AlterTable: add new columns first (isAvailable still present so we can backfill from it)
ALTER TABLE "Room"
ADD COLUMN     "acType" "ACType" NOT NULL DEFAULT 'FAN_ONLY',
ADD COLUMN     "cupboardType" "CupboardType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "customRoomType" TEXT,
ADD COLUMN     "hasAttachedBathroom" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "roomName" TEXT,
ADD COLUMN     "status" "RoomStatus" NOT NULL DEFAULT 'AVAILABLE';

-- Backfill: map the old boolean onto the new enum. isAvailable only ever
-- flipped to false when a room got booked, so false -> OCCUPIED is more
-- accurate than defaulting every existing row to AVAILABLE. MAINTENANCE and
-- INACTIVE didn't exist as concepts before, so no row can retroactively
-- claim them.
UPDATE "Room" SET "status" = CASE WHEN "isAvailable" THEN 'AVAILABLE'::"RoomStatus" ELSE 'OCCUPIED'::"RoomStatus" END;

-- AlterTable: now drop the old column
ALTER TABLE "Room" DROP COLUMN "isAvailable";
