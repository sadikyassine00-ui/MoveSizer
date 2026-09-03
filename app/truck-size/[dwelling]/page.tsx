interface PageProps {
  params: Promise<{ dwelling: string }>;
}

export default async function DwellingPage({ params }: PageProps) {
  const { dwelling } = await params;
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold font-mono">Truck Sizing Guide: {dwelling}</h1>
    </div>
  );
}
