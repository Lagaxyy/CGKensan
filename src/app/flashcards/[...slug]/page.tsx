import FlashcardPlayer from "@/components/flashcard-player";

interface Props {
  params: Promise<{ slug: string[] }>;
}

export default async function FlashcardDeckPage({ params }: Props) {
  const { slug } = await params;
  const slugPath = slug.join("/");

  return <FlashcardPlayer slug={slugPath} />;
}
