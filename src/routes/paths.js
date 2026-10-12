/**
 * Every route in the application, in one place.
 *
 * Navigation is built from these rather than from string literals scattered
 * through components, so renaming a route is one edit and a typo in a link is
 * a missing export rather than a silent 404.
 */
export const paths = {
  landing: '/',
  login: '/login',
  register: '/register',
  inviteAccept: '/invite/accept',
  // Short on purpose: it rides inside an SMS, where a Hebrew message
  // carries 70 characters per segment and every one is billed.
  unsubscribe: (token = ':token') => `/u/${token}`,

  app: '/app',
  space: (key = ':space') => `/app/space/${key}`,
  reportDetails: (key = ':space', behaviorId = ':behaviorId') =>
    `/app/space/${key}/report/${behaviorId}`,
  customReport: (key = ':space') => `/app/space/${key}/report/new`,
  profile: '/app/profile',
  about: '/app/about',
  coach: '/app/coach',
  dashboard: '/app/dashboard',
}

/** Route segments, relative to the /app layout route. */
export const appSegments = {
  space: 'space/:space',
  reportDetails: 'space/:space/report/:behaviorId',
  // Static, so React Router ranks it above :behaviorId - "new" is never an id.
  customReport: 'space/:space/report/new',
  profile: 'profile',
  about: 'about',
  coach: 'coach',
  dashboard: 'dashboard',
}
