-- Postgres baseline migration
CREATE TABLE "msg" (
  "id" TEXT PRIMARY KEY,
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
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "user_likes" (
  "user_id" TEXT NOT NULL,
  "cat_id" TEXT NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_likes_cat_id_fkey" FOREIGN KEY ("cat_id") REFERENCES "msg" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE INDEX "idx_msg_count" ON "msg"("count");
CREATE INDEX "idx_ul_cat" ON "user_likes"("cat_id");
CREATE INDEX "idx_ul_user" ON "user_likes"("user_id");

-- Composite PK for user_likes
ALTER TABLE "user_likes" ADD CONSTRAINT user_likes_pkey PRIMARY KEY ("user_id", "cat_id");
