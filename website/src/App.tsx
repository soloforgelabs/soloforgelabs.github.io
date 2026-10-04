import React, { useState } from 'react';
import { PRODUCTS, CHANGELOGS } from './data/products';
import { Product } from './types/product';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { SuiteSwitcher } from './components/SuiteSwitcher';
import { UpdatesSection } from './components/UpdatesSection';
import { DeepDiveView } from './components/DeepDiveView';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  const [activeProductId, setActiveProductId] = useState<string>('blinkscribe');
  const [viewMode, setViewMode] = useState<'hub' | 'deep-dive'>('hub');
  const [deepDiveProduct, setDeepDiveProduct] = useState<Product | null>(null);

  const handleSelectProduct = (id: string) => {
    setActiveProductId(id);
    const prod = PRODUCTS.find((p) => p.id === id);
    if (prod && viewMode === 'deep-dive') {
      setDeepDiveProduct(prod);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleExploreProduct = (product: Product) => {
    setDeepDiveProduct(product);
    setActiveProductId(product.id);
    setViewMode('deep-dive');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoHome = () => {
    setViewMode('hub');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-obsidian-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500/20 selection:text-cyan-300">
      <Navbar
        onGoHome={handleGoHome}
        isDeepDive={viewMode === 'deep-dive'}
      />

      <main className="flex-1">
        {viewMode === 'hub' ? (
          <>
            <Hero />
            <SuiteSwitcher
              products={PRODUCTS}
              activeProductId={activeProductId}
              onSelectProduct={handleSelectProduct}
              onExploreProduct={handleExploreProduct}
            />
            <UpdatesSection changelogs={CHANGELOGS} />
          </>
        ) : deepDiveProduct ? (
          <DeepDiveView
            product={deepDiveProduct}
            allProducts={PRODUCTS}
            onSelectProduct={handleExploreProduct}
            onBackToHub={handleGoHome}
          />
        ) : null}
      </main>

      <Footer />
    </div>
  );
};

export default App;
