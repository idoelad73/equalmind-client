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

  app: '/app',
  space: (key = ':space') => `/app/space/${key}`,
  profile: '/app/profile',
  about: '/app/about',
  coach: '/app/coach',
  dashboard: '/app/dashboard',
}

/** Route segments, relative to the /app layout route. */
export const appSegments = {
  space: 'space/:space',
  profile: 'profile',
  about: 'about',
  coach: 'coach',
  dashboard: 'dashboard',
}
