import React, { useState, useEffect } from 'react';
import { Module, Slide, UserProgress, ReviewRating } from './types';
import { storageService } from './services/storageService';
import { useTelegram } from './telegram/TelegramContext';
import { Navigation, ScreenTab } from './components/Navigation';
import { HomeScreen } from './screens/HomeScreen';
import { TrainerScreen } from './screens/TrainerScreen';
import { CheatSheetsScreen } from './screens/CheatSheetsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { PaywallModal } from './components/PaywallModal';

export const App: React.FC = () => {
  const { user } = useTelegram();

  const [modules, setModules] = useState<Module[]>([]);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [progress, setProgress] = useState<Record<string, UserProgress>>({});
  const [currentTab, setCurrentTab] = useState<ScreenTab>('home');
  const [loading, setLoading] = useState(true);

  // Active trainer session data
  const [activeTrainerSlides, setActiveTrainerSlides] = useState<Slide[]>([]);
  const [trainerSessionTitle, setTrainerSessionTitle] = useState('Тренажер препаратов');

  // Paywall Modal State
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallModuleTitle, setPaywallModuleTitle] = useState('');

  // Initial Load
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [loadedModules, loadedSlides, loadedProgress] = await Promise.all([
          storageService.getModules(),
          storageService.getSlides(),
          storageService.getAllProgress(user.id),
        ]);

        setModules(loadedModules);
        setSlides(loadedSlides);
        setProgress(loadedProgress);
        setActiveTrainerSlides(loadedSlides);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user.id]);

  const handleStartModule = (moduleId: string) => {
    const mod = modules.find((m) => m.id === moduleId);
    const modSlides = slides.filter((s) => s.module_id === moduleId);
    if (modSlides.length > 0) {
      setActiveTrainerSlides(modSlides);
      setTrainerSessionTitle(mod ? mod.title : 'Тренажер');
    } else {
      // If module has no separate slides yet, fallback to all available
      setActiveTrainerSlides(slides);
      setTrainerSessionTitle(mod ? mod.title : 'Тренажер');
    }
    setCurrentTab('trainer');
  };

  const handleStartSpeedrun = () => {
    // 15 random slides or all available shuffled
    const shuffled = [...slides].sort(() => 0.5 - Math.random());
    const speedrunPool = shuffled.slice(0, 15);
    setActiveTrainerSlides(speedrunPool);
    setTrainerSessionTitle('Спидран: 15 препаратов');
    setCurrentTab('trainer');
  };

  const handleSelectSlideForTraining = (slideId: string) => {
    const target = slides.find((s) => s.id === slideId);
    if (target) {
      // Put target slide first followed by rest
      const remaining = slides.filter((s) => s.id !== slideId);
      setActiveTrainerSlides([target, ...remaining]);
      setTrainerSessionTitle(target.title);
      setCurrentTab('trainer');
    }
  };

  const handleRecordReview = async (slideId: string, rating: ReviewRating) => {
    const updated = await storageService.recordReview(user.id, slideId, rating);
    setProgress((prev) => ({
      ...prev,
      [slideId]: updated,
    }));
  };

  const handleResetProgress = () => {
    storageService.resetProgress(user.id);
    setProgress({});
  };

  const handleOpenPaywall = (moduleName: string) => {
    setPaywallModuleTitle(moduleName);
    setPaywallOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Загрузка атласа гистологии...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] font-sans selection:bg-slate-200 transition-colors duration-200">
      {/* Screen Views */}
      {currentTab === 'home' && (
        <HomeScreen
          modules={modules}
          slides={slides}
          progress={progress}
          onStartModule={handleStartModule}
          onStartSpeedrun={handleStartSpeedrun}
          onOpenPaywall={handleOpenPaywall}
          onOpenCheatSheets={() => setCurrentTab('cheatsheets')}
        />
      )}

      {currentTab === 'trainer' && (
        <TrainerScreen
          slides={activeTrainerSlides.length > 0 ? activeTrainerSlides : slides}
          allSlides={slides}
          sessionTitle={trainerSessionTitle}
          onClose={() => setCurrentTab('home')}
          onRecordReview={handleRecordReview}
        />
      )}

      {currentTab === 'cheatsheets' && (
        <CheatSheetsScreen
          slides={slides}
          modules={modules}
          onSelectSlideForTraining={handleSelectSlideForTraining}
        />
      )}

      {currentTab === 'profile' && (
        <ProfileScreen
          slides={slides}
          progress={progress}
          onOpenPaywall={() => handleOpenPaywall('Полный доступ')}
          onResetProgress={handleResetProgress}
        />
      )}

      {/* Persistent Bottom Navigation (Hidden inside trainer to allow full microscope focus and spaced repetition buttons) */}
      {currentTab !== 'trainer' && (
        <Navigation currentTab={currentTab} onTabChange={setCurrentTab} />
      )}

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        moduleName={paywallModuleTitle}
      />
    </div>
  );
};
