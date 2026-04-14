import { describe, expect, it } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { render, screen } from '@testing-library/react'

import { AppLayout } from '../layouts/AppLayout'
import { DashboardPage } from '../features/dashboard/DashboardPage'

describe('route smoke tests', () => {
  it('renders dashboard route content', () => {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <AppLayout />,
          children: [{ index: true, element: <DashboardPage /> }],
        },
      ],
      { initialEntries: ['/'] },
    )

    render(<RouterProvider router={router} />)

    expect(screen.getByText('Warehouse Management System')).toBeInTheDocument()
    expect(screen.getByText('Available Stock')).toBeInTheDocument()
  })
})
