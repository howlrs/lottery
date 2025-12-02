-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WinLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rewardId" TEXT NOT NULL,
    "wonAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WinLog_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WinLog" ("id", "rewardId", "wonAt") SELECT "id", "rewardId", "wonAt" FROM "WinLog";
DROP TABLE "WinLog";
ALTER TABLE "new_WinLog" RENAME TO "WinLog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
