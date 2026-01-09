'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface WelcomeModalProps {
  username?: string;
  onComplete: () => void;
}

const ONBOARDING_STEPS = [
  {
    icon: '🌱',
    title: 'Welcome to Plobie!',
    subtitle: 'Your plant-centered social journey starts here',
    content:
      "We're excited to have you join our community of plant enthusiasts. Let's show you around!",
    tip: null,
  },
  {
    icon: '🎯',
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
    icon: '💬',
    title: 'Join the Community',
    subtitle: 'Share your plant journey',
    content:
      'Post photos, ask questions, and connect with fellow plant lovers. From succulents to orchids, find your tribe!',
    tip: null,
  },
  {
    icon: '🏆',
    title: 'Unlock Achievements',
    subtitle: 'Celebrate your milestones',
    content:
      "As you participate, you'll unlock achievements that showcase your journey. Check your profile to see your progress!",
    tip: null,
  },
  {
    icon: '🚀',
    title: "You're All Set!",
    subtitle: 'Start your adventure',
    content:
      "You're ready to explore Plobie. Why not start by introducing yourself to the community or browsing some learning articles?",
    tip: null,
  },
];

export default function WelcomeModal({ username, onComplete }: WelcomeModalProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleSkip} />

      {/* Modal */}
      <div
        className={`relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* Icon */}
          <div className="text-center mb-6">
            <span className="text-6xl sm:text-7xl block mb-4">{step.icon}</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              {currentStep === 0 && username ? `Welcome, ${username}!` : step.title}
            </h2>
            <p className="text-green-600 font-medium">{step.subtitle}</p>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-center mb-6">{step.content}</p>

          {/* XP Tips */}
          {step.tip && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-2 gap-3">
                {step.tip.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">{item.action}</span>
                    <span className="text-sm font-bold text-amber-600">{item.xp}</span>
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
                className="p-3 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors"
              >
                <span className="text-2xl block mb-1">💬</span>
                <span className="text-sm font-medium text-green-700">Visit Community</span>
              </button>
              <button
                onClick={() => handleQuickAction('/hobbies/learn')}
                className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors"
              >
                <span className="text-2xl block mb-1">📚</span>
                <span className="text-sm font-medium text-blue-700">Learn & Earn</span>
              </button>
              <button
                onClick={() => handleQuickAction('/achievements')}
                className="p-3 bg-amber-50 hover:bg-amber-100 rounded-lg text-center transition-colors"
              >
                <span className="text-2xl block mb-1">🏆</span>
                <span className="text-sm font-medium text-amber-700">Achievements</span>
              </button>
              <button
                onClick={() => handleQuickAction('/games')}
                className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors"
              >
                <span className="text-2xl block mb-1">🎮</span>
                <span className="text-sm font-medium text-purple-700">Play Game</span>
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            {/* Step indicators */}
            <div className="flex gap-1.5">
              {ONBOARDING_STEPS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-6 bg-green-500'
                      : index < currentStep
                        ? 'bg-green-300'
                        : 'bg-gray-200'
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              {!isLastStep && (
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                  Skip
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
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
