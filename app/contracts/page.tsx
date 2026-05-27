import ContractsBoard from "@/components/atlas/ContractsBoard";

export const dynamic = "force-dynamic";

export default function ContractsPage() {
  return (
    <main className="min-h-screen bg-[#020817] px-4 py-6 text-white md:px-8">
      <ContractsBoard />
    </main>
  );
}
