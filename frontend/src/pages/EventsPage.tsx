import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/shared/Navbar';
import { EventCard } from '../components/shared/EventCard';
import { PageTransition } from '../components/shared/PageTransition';
import { AnimatedSection } from '../components/shared/AnimatedSection';
import { useEvents } from '../hooks/useEvents';
import { useDebounce } from '../hooks/useDebounce';
import { eventsApi } from '../api/events.api';
import type { EventCategory } from '../types';
import { CATEGORY_META } from '../types';

export const EventsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const activeCategory = (searchParams.get('category') as EventCategory | null) || undefined;
  const activeSort = searchParams.get('sort') || undefined;

  // Dynamic categories state
  const [dynamicCategories, setDynamicCategories] = useState<string[]>(Object.keys(CATEGORY_META));

  useEffect(() => {
    eventsApi.getCategories().then((cats) => {
      if (cats && cats.length > 0) {
        setDynamicCategories(cats);
      }
    }).catch(console.error);
  }, []);

  // Build query params
  const queryParams: Record<string, string | number> = { page, limit: 9 };
  const searchTerm = searchParams.get('search');
  if (searchTerm) queryParams.search = searchTerm;
  if (activeCategory) queryParams.category = activeCategory;
  if (activeSort) queryParams.sort = activeSort;

  const { data, isLoading } = useEvents(queryParams);

  const debouncedSearchInput = useDebounce(searchInput, 200);

  // Update URL params when debounced search term changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    
    // Check if the actual search param differs from the debounced input
    // to prevent infinite loops or unnecessary updates on initial load.
    const currentSearchParam = params.get('search') || '';
    
    if (debouncedSearchInput !== currentSearchParam) {
      if (debouncedSearchInput) {
        params.set('search', debouncedSearchInput);
      } else {
        params.delete('search');
      }
      params.set('page', '1'); // reset to page 1 on new search
      setSearchParams(params);
    }
  }, [debouncedSearchInput, searchParams, setSearchParams]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryFilter = (cat: EventCategory | 'all') => {
    const params = new URLSearchParams(searchParams);
    if (cat === 'all') {
      params.delete('category');
    } else {
      params.set('category', cat);
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleSort = (sort: string) => {
    const params = new URLSearchParams(searchParams);
    if (sort) {
      params.set('sort', sort);
    } else {
      params.delete('sort');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  return (
    <>
      <Navbar />
      <PageTransition>
        <div className="page">
          <div className="container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
              <div>
                <h1 className="page-title">Upcoming Events</h1>
                <p className="page-subtitle">
                  {data?.meta ? `${data.meta.total} events found` : 'Loading events...'}
                </p>
              </div>
              <div className="search-bar">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="input"
                  placeholder="Search events..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  id="events-search"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            {/* Category & Sort Controls */}
            <AnimatedSection>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <div className="category-chips">
                  <button
                    className={`category-chip ${!activeCategory ? 'active' : ''}`}
                    onClick={() => handleCategoryFilter('all')}
                  >
                    🎯 All
                  </button>
                  {dynamicCategories.map((cat) => {
                    const meta = CATEGORY_META[cat as EventCategory] || { 
                      label: cat.charAt(0).toUpperCase() + cat.slice(1), 
                      emoji: '🏷️' 
                    };
                    return (
                      <button
                        key={cat}
                        className={`category-chip ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => handleCategoryFilter(cat as EventCategory)}
                      >
                        {meta.emoji} {meta.label}
                      </button>
                    );
                  })}
                </div>

                <select
                  className="select"
                  style={{ width: 'auto', minWidth: '160px' }}
                  value={activeSort || ''}
                  onChange={(e) => handleSort(e.target.value)}
                  id="events-sort"
                >
                  <option value="">Sort: Date ↑</option>
                  <option value="date_desc">Date ↓</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                  <option value="availability">Most Available</option>
                </select>
              </div>
            </AnimatedSection>

            {/* Event Grid */}
            {isLoading ? (
              <div className="grid grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="card skeleton-card" />
                ))}
              </div>
            ) : data?.events && data.events.length > 0 ? (
              <div className="grid grid-cols-3">
                {data.events.map((event, i) => (
                  <EventCard key={event.id} event={event} index={i} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🎭</div>
                <h2 className="empty-state-title">No events found</h2>
                <p className="empty-state-text">
                  {searchTerm
                    ? `No events match "${searchTerm}". Try a different search.`
                    : activeCategory
                      ? `No ${CATEGORY_META[activeCategory]?.label || ''} events at the moment.`
                      : 'There are no upcoming events at the moment.'}
                </p>
                {(searchTerm || activeCategory) && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setSearchInput('');
                      setSearchParams(new URLSearchParams());
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}

            {/* Pagination */}
            {data?.meta && data.meta.totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  ◄
                </button>
                {Array.from({ length: data.meta.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`pagination-btn ${p === page ? 'active' : ''}`}
                    onClick={() => handlePageChange(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="pagination-btn"
                  disabled={page >= data.meta.totalPages}
                  onClick={() => handlePageChange(page + 1)}
                >
                  ►
                </button>
              </div>
            )}
          </div>
        </div>
      </PageTransition>
    </>
  );
};
