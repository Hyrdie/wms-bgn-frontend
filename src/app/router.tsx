import { createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '../layouts/AppLayout'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { CoreUploadPage } from '../features/core/CoreUploadPage'
import { CoreRecordsPage } from '../features/core/CoreRecordsPage'
import { CoreKitchenBundlesPage } from '../features/core/CoreKitchenBundlesPage'
import { CoreKitchenDetailPage } from '../features/core/CoreKitchenDetailPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'core/upload', element: <CoreUploadPage /> },
      { path: 'core/records', element: <CoreRecordsPage /> },
      { path: 'core/overview', element: <CoreKitchenBundlesPage /> },
      { path: 'core/kitchens/:kitchenId', element: <CoreKitchenDetailPage /> },
    ],
  },
])
