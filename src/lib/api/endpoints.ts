export const endpoints = {
  core: {
    upload: '/core/upload',
    kitchens: '/core/kitchens',
    bundles: '/core/bundles',
    records: '/core/records',
    scan: '/core/scan',
    kitchenItems: '/core/kitchens',
    kitchenScan: '/core/kitchens',
    kitchenItemsSave: '/core/kitchens',
    export: '/core/export',
    recordPhoto: (recordId: number) => `/core/records/${recordId}/photo`,
  },
}
