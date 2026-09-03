interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function WillItFitPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold font-mono">Will It Fit: {slug}</h1>
    </div>
  );
}
