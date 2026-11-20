import { useCallback, useEffect, useRef, useState } from 'react';
import type { AtmosphereSnapshot, BeatId, ModelSource, WeatherMode } from './types/weather';
import { fetchLiveAtmosphere, getCaseStudySnapshot } from './services/weatherData';
import { progressToBeat } from './scene/cameraWaypoints';
import { AtmosphereScene } from './scene/AtmosphereScene';
import { TopHud } from './components/TopHud';
import { AltitudeGauge } from './components/AltitudeGauge';
import { ScrollStory } from './components/ScrollStory';
import { BriefingEditorial } from './components/BriefingEditorial';
import { IntroHero } from './components/IntroHero';
import { scrollToId } from './lib/scroll';
import { useMediaQuery } from './lib/useMediaQuery';
import { initialModelSource, saveModelSource } from './lib/modelPreference';

export default function App() {
  const storyRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [inEditorial, setInEditorial] = useState(false);
  const [inIntro, setInIntro] = useState(true);
  const [mode, setMode] = useState<WeatherMode>('case-study');
  const [modelSource, setModelSourceState] = useState<ModelSource>(initialModelSource);
  const setModelSource = useCallback((next: ModelSource) => {
    setModelSourceState(next);
    saveModelSource(next);
  }, []);
  // Phones: no room to pin figures to the globe, so they go inside the story cards.
  const isNarrow = useMediaQuery('(max-width: 767px)');
  const [snapshot, setSnapshot] = useState<AtmosphereSnapshot>(() => getCaseStudySnapshot());
  const [isLoading, setIsLoading] = useState(false);

  const loadMode = useCallback(async (targetMode: WeatherMode, forceRefresh = false) => {
    setMode(targetMode);
    if (targetMode === 'case-study') {
      setSnapshot(getCaseStudySnapshot());
      return;
    }
    setIsLoading(true);
    try {
      const liveData = await fetchLiveAtmosphere(forceRefresh);
      setSnapshot(liveData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMode('live', false);
  }, [loadMode]);

  useEffect(() => {
    let rafId = 0;
    const updateScroll = () => {
      rafId = 0;
      const el = storyRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const storyScrollable = Math.max(1, el.offsetHeight - window.innerHeight);
        const next = Math.min(1, Math.max(0, -rect.top / storyScrollable));
        setScrollProgress(next);
        setInEditorial(rect.bottom <= window.innerHeight * 0.65);
        setInIntro(rect.top > window.innerHeight * 0.35);
      }
    };

    const onScroll = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(updateScroll);
      }
    };

    updateScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const handleJumpBeat = useCallback((beat: BeatId) => scrollToId(`beat-${beat}`), []);

  const handleJumpEditorial = useCallback(() => scrollToId('briefing-editorial'), []);

  const activeBeat = progressToBeat(scrollProgress);

  return (
    <div className="relative min-h-screen bg-[#040914] text-slate-100">
      <TopHud
        mode={mode}
        snapshot={snapshot}
        isLoading={isLoading}
        inEditorial={inEditorial}
        onJumpBeat={handleJumpBeat}
        onToggleMode={(next) => void loadMode(next, false)}
        onRefreshLive={() => void loadMode('live', true)}
      />

      <AtmosphereScene
        scrollProgress={scrollProgress}
        activeBeat={activeBeat}
        modelSource={modelSource}
        snapshot={snapshot}
        showTooltips={!inEditorial && !inIntro && !isNarrow}
      />

      <AltitudeGauge
        scrollProgress={scrollProgress}
        activeBeat={activeBeat}
        hidden={inEditorial || inIntro}
        onJumpBeat={handleJumpBeat}
        onJumpEditorial={handleJumpEditorial}
      />

      <IntroHero
        onStart={() => handleJumpBeat(1)}
        onSkipToBriefing={handleJumpEditorial}
        modelSource={modelSource}
        onUseSimpleModel={() => setModelSource('procedural')}
      />

      <div ref={storyRef}>
        <ScrollStory
          activeBeat={activeBeat}
          snapshot={snapshot}
          mode={mode}
          onToggleMode={(next) => void loadMode(next, false)}
          inlineFigures={isNarrow}
          scrollProgress={scrollProgress}
          onJumpBeat={handleJumpBeat}
          onReadBriefing={handleJumpEditorial}
        />
      </div>

      <BriefingEditorial
        snapshot={snapshot}
        mode={mode}
        onToggleMode={(next) => void loadMode(next, false)}
        modelSource={modelSource}
        onChangeModel={setModelSource}
        onJumpBeat={handleJumpBeat}
      />
    </div>
  );
}
