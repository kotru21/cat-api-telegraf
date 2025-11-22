-- CreateTable
CREATE TABLE "Cat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "count" INTEGER NOT NULL DEFAULT 0,
    "breed_name" TEXT,
    "image_url" TEXT,
    "description" TEXT,
    "wikipedia_url" TEXT,
    "breed_id" TEXT,
    "temperament" TEXT,
    "origin" TEXT,
    "life_span" TEXT,
    "weight_imperial" TEXT,
    "weight_metric" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "user_likes" (
    "user_id" TEXT NOT NULL,
    "cat_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("user_id", "cat_id"),
    CONSTRAINT "user_likes_cat_id_fkey" FOREIGN KEY ("cat_id") REFERENCES "Cat" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateIndex
CREATE INDEX "idx_cat_count" ON "Cat"("count");

-- CreateIndex
CREATE INDEX "idx_ul_cat" ON "user_likes"("cat_id");

-- CreateIndex
CREATE INDEX "idx_ul_user" ON "user_likes"("user_id");
