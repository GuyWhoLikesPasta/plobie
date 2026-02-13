'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface WelcomeModalProps {
  username?: string;
  onComplete: () => void;
}

const ONBOARDING_STEPS = [
  {
    title: 'Welcome to Plobie!',
    subtitle: 'Your plant-centered social journey starts here',
    content:
      "We're excited to have you join our community of plant enthusiasts. Let's show you around!",
    tip: null,
  },
  {
    title: 'Earn XP & Level Up',
    subtitle: 'Every action rewards you',
    content:
      'Engage with the community to earn XP and level up your profile. Your progress unlocks achievements and shows your dedication!',
    tip: {
      items: [
        { action: 'Create a post', xp: '+3 XP' },
        { action: 'Comment', xp: '+1 XP' },
        { action: 'Read articles', xp: '+1 XP' },
        { action: 'Play games', xp: '+2 XP' },
      ],
    },
  },
  {
    title: 'Join the Community',
    subtitle: 'Share your plant journey',
    content:
      'Post photos, ask questions, and connect with fellow plant lovers. From succulents to orchids, find your tribe!',
    tip: null,
  },
  {
    title: 'Unlock Achievements',
    subtitle: 'Celebrate your milestones',
    content:
      "As you participate, you'll unlock achievements that showcase your journey. Check your profile to see your progress!",
    tip: null,
  },
  {
    title: "You're All Set!",
    subtitle: 'Start your adventure',
    content:
      "You're ready to explore Plobie. Why not start by introducing yourself to the community or browsing some learning articles?",
    tip: null,
  },
];

const stepIcons = [
  <svg
    key="welcome"
    className="w-10 h-10"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
    />
  </svg>,
  <svg
    key="xp"
    className="w-10 h-10"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
    />
  </svg>,
  <svg
    key="community"
    className="w-10 h-10"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
    />
  </svg>,
  <svg
    key="achievements"
    className="w-10 h-10"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-5.54 0"
    />
  </svg>,
  <svg
    key="ready"
    className="w-10 h-10"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
    />
  </svg>,
];

export default function WelcomeModal({ username, onComplete }: WelcomeModalProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const handleQuickAction = (path: string) => {
    handleComplete();
    router.push(path);
  };

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm" onClick={handleSkip} />

      {/* Modal */}
      <div
        className={`relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        {/* Progress bar */}
        <div className="h-1 bg-stone-100 dark:bg-stone-800">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* Icon */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 mb-4">
              {stepIcons[currentStep]}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white tracking-tight mb-1">
              {currentStep === 0 && username ? `Welcome, ${username}!` : step.title}
            </h2>
            <p className="text-green-600 dark:text-green-400 font-medium text-sm">
              {step.subtitle}
            </p>
          </div>

          {/* Description */}
          <p className="text-stone-600 dark:text-stone-400 text-center mb-6 leading-relaxed">
            {step.content}
          </p>

          {/* XP Tips */}
          {step.tip && (
            <div className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-2 gap-3">
                {step.tip.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-stone-600 dark:text-stone-400">
                      {item.action}
                    </span>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      {item.xp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions (last step only) */}
          {isLastStep && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => handleQuickAction('/hobbies')}
                className="p-3 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-xl text-center transition-colors border border-stone-200 dark:border-stone-700"
              >
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  Community
                </span>
              </button>
              <button
                onClick={() => handleQuickAction('/hobbies/learn')}
                className="p-3 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-xl text-center transition-colors border border-stone-200 dark:border-stone-700"
              >
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  Learn & Earn
                </span>
              </button>
              <button
                onClick={() => handleQuickAction('/achievements')}
                className="p-3 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-xl text-center transition-colors border border-stone-200 dark:border-stone-700"
              >
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  Achievements
                </span>
              </button>
              <button
                onClick={() => handleQuickAction('/games')}
                className="p-3 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-xl text-center transition-colors border border-stone-200 dark:border-stone-700"
              >
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  Play Game
                </span>
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {ONBOARDING_STEPS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-6 bg-green-500'
                      : index < currentStep
                        ? 'w-2 bg-green-300 dark:bg-green-700'
                        : 'w-2 bg-stone-200 dark:bg-stone-700'
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>

            <div className="flex gap-3">
              {!isLastStep && (
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 text-sm font-medium"
                >
                  Skip
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition-colors text-sm"
              >
                {isLastStep ? "Let's Go!" : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
