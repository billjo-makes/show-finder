import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ProfileDTO } from '@show-finder/shared'
import { WatchlistButton } from './WatchlistButton'

function makeProfile(overrides: Partial<ProfileDTO>): ProfileDTO {
  return {
    id: 'p1',
    name: 'Bill',
    avatarColor: null,
    defaultWatchProviderIds: [],
    isUnder18: false,
    isPrimary: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('WatchlistButton', () => {
  it('calls onToggle when the main button is clicked', async () => {
    const onToggle = vi.fn()
    render(<WatchlistButton onWatchlist={false} onToggle={onToggle} />)

    await userEvent.click(screen.getByRole('button', { name: 'Add to watch list' }))

    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('does not show a profile caret for a non-primary active profile', () => {
    const profiles = [makeProfile({ id: 'p1', isPrimary: false }), makeProfile({ id: 'p2', name: 'Kids' })]
    render(
      <WatchlistButton
        onWatchlist={false}
        onToggle={vi.fn()}
        profiles={profiles}
        activeProfileId="p1"
        onAddToProfile={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Choose profile' })).not.toBeInTheDocument()
  })

  it('lets the primary profile add the title to a sibling profile via the caret menu', async () => {
    const onToggle = vi.fn()
    const onAddToProfile = vi.fn()
    const profiles = [
      makeProfile({ id: 'p1', name: 'Bill', isPrimary: true }),
      makeProfile({ id: 'p2', name: 'Kids' }),
    ]
    render(
      <WatchlistButton
        onWatchlist={false}
        onToggle={onToggle}
        profiles={profiles}
        activeProfileId="p1"
        onAddToProfile={onAddToProfile}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Choose profile' }))
    await userEvent.click(screen.getByRole('button', { name: 'Add to Kids' }))

    expect(onAddToProfile).toHaveBeenCalledWith('p2')
    expect(onToggle).not.toHaveBeenCalled()
  })
})
