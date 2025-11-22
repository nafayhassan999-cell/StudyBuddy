import AnimatedPage from "@/components/AnimatedPage";

export default function FeaturesPage() {
  return (
    <AnimatedPage>
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl font-bold gradient-text mb-6">Features</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Coming soon: Explore all the amazing features of StudyBuddy
            </p>
          </div>
        </div>
      </main>
    </AnimatedPage>
  );
}
