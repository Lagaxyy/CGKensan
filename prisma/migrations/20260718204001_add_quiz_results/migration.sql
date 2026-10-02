-- CreateTable
CREATE TABLE "quiz_results" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "max_score" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_answers" (
    "id" TEXT NOT NULL,
    "quiz_result_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "question_type" TEXT NOT NULL,
    "earned_points" INTEGER NOT NULL,
    "max_points" INTEGER NOT NULL,

    CONSTRAINT "quiz_answers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "quiz_results" ADD CONSTRAINT "quiz_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_quiz_result_id_fkey" FOREIGN KEY ("quiz_result_id") REFERENCES "quiz_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;
