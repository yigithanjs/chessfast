'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import clsx from 'clsx'
import { tags } from '@/app/lib/exploreItems'

function Filtersheet() {
  const [isFilterActive, setIsFilterActive] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const divClass = 'relative flex items-center text-lg z-20 lg:ml-2'

  // Read currently selected tags from URL
  const selected = searchParams.get('tags')?.split(',') || []

  // Toggle tag in the URL
  function toggleTag(tag) {
    const next = selected.includes(tag)
      ? selected.filter(t => t !== tag)
      : [...selected, tag]

    const query = next.length ? `?tags=${next.join(',')}` : ''
    router.push(`/explore${query}`)
  }

  return (
    <section className="lg:w-[950px] ml-auto mr-auto xl:w-[1150px] 2xl:w-[1300px]">
      <div
        className={clsx(
          divClass,
          isFilterActive ? '-translate-y-25' : '',
          'transition lg:translate-y-0'
        )}
      >
        <p>Filter by</p>
        <button
          className="cursor-pointer bg-gray-100 h-5 w-9 text-black rounded ml-2 flex items-center justify-center lg:hidden text-2xl"
          onClick={() => setIsFilterActive(prev => !prev)}
        >
          {isFilterActive ? '-' : '+'}
        </button>
      </div>

      {/* Mobile overlay */}
      {isFilterActive && (
        <div className="absolute left-0 bottom-0 w-full h-full bg-zinc-900 z-10 lg:hidden">
          <div className="mt-30 ml-5 md:ml-8">
            {tags.map(tag => {
              const active = selected.includes(tag)
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={clsx(
                    'w-30 h-10 text-sm rounded-full border mx-2 my-2',
                    active
                      ? 'bg-white text-black border-white'
                      : 'border-zinc-700 text-zinc-200 hover:bg-zinc-800/60'
                  )}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Desktop */}
      <div className="hidden lg:block mt-5 -ml-1">
        {tags.map(tag => {
          const active = selected.includes(tag)
          return (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={clsx(
                'w-30 h-10 text-sm rounded-full border mx-1 my-1 cursor-pointer',
                active
                  ? 'bg-white text-black border-white'
                  : 'border-zinc-700 text-zinc-200 hover:bg-zinc-800/60'
              )}
            >
              {tag}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default Filtersheet
