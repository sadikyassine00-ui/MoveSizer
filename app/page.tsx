import { AppShell } from '@/components/layout/AppShell';

export default function Home() {
  return (
    <main>
      <h1 className="sr-only">
        Moving Truck Sizing Calculator & 2.5D Visual Cargo Planner
      </h1>
      <AppShell initialPreset="studio" initialTruckId="10ft" />
    </main>
  );
}
