import QuizPlayer from "@/components/quiz-player";

interface Props {
  params: Promise<{ slug: string[] }>;
}

export default async function QuizPage({ params }: Props) {
  const { slug } = await params;
  const slugPath = slug.join("/");

  return <QuizPlayer slug={slugPath} />;
}