import Link from 'next/link';

export default async function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold text-green-800 mb-4">
              🌱 Plobie
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Plant-Centered Social Commerce MVP
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/api/healthz"
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Check Status
              </Link>
              <Link
                href="/api/flags"
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                View Flags
              </Link>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">📊 Week 1 Progress</h2>
            <div className="space-y-3">
              <StatusItem done>Next.js 15 + TypeScript + Tailwind</StatusItem>
              <StatusItem done>Database schema with 14 tables</StatusItem>
              <StatusItem done>Row Level Security policies</StatusItem>
              <StatusItem done>XP engine with daily caps</StatusItem>
              <StatusItem done>Feature flags system</StatusItem>
              <StatusItem done>Stripe checkout + webhooks</StatusItem>
              <StatusItem done>Analytics & error tracking setup</StatusItem>
              <StatusItem done>Seed script for dev data</StatusItem>
              <StatusItem>Auth flows (in progress)</StatusItem>
              <StatusItem>Demo UI components</StatusItem>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <FeatureCard
              title="🛍️ Shop"
              description="Stripe-powered e-commerce with product variants"
              status="API Ready"
            />
            <FeatureCard
              title="🌿 My Plants"
              description="Unity WebGL garden with QR pot claiming"
              status="Schema Ready"
            />
            <FeatureCard
              title="🎮 Games"
              description="Web games with XP rewards"
              status="XP Engine Ready"
            />
            <FeatureCard
              title="💬 Hobbies"
              description="Reddit-style community forum"
              status="Tables Ready"
            />
          </div>

          {/* Next Steps */}
          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3 text-green-800">🎯 Next Steps</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Configure Supabase project and apply migrations</li>
              <li>Set up Auth providers (Google, Apple)</li>
              <li>Run seed script: <code className="bg-white px-2 py-1 rounded">npm run seed</code></li>
              <li>Configure Stripe test mode</li>
              <li>Build UI components for each tab</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusItem({ done, children }: { done?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`text-2xl ${done ? '' : 'opacity-30'}`}>
        {done ? '✅' : '⏳'}
      </span>
      <span className={done ? 'text-gray-800' : 'text-gray-500'}>{children}</span>
    </div>
  );
}

function FeatureCard({ title, description, status }: { title: string; description: string; status: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 mb-3">{description}</p>
      <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
        {status}
      </span>
    </div>
  );
}
