/**
 * Landing colour directions. Each maps to CSS custom properties consumed by
 * LandingPage, so a palette is data rather than a duplicated component.
 */
export const PALETTES = {
  petrol: {
    key: 'petrol',
    label: 'פטרול',
    vars: {
      '--l-from': '#E4F0F3',
      '--l-via': '#F2F9FA',
      '--l-ink': '#0F2E36',
      '--l-muted': '#4A6670',
      '--l-primary': '#17505E',
      '--l-primary-hover': '#1F6376',
      '--l-soft': '#DAEAEE',
      '--l-soft-hover': '#C7DEE4',
      '--l-ring': '#CBE0E5',
      '--l-eyebrow': '#2B7D94',
      '--l-figure': '#17505E',
    },
  },
  indigo: {
    key: 'indigo',
    label: 'אינדיגו',
    vars: {
      '--l-from': '#ECEBFA',
      '--l-via': '#F6F5FD',
      '--l-ink': '#1E1B4B',
      '--l-muted': '#575383',
      '--l-primary': '#4338CA',
      '--l-primary-hover': '#5A4FE0',
      '--l-soft': '#E4E2F8',
      '--l-soft-hover': '#D5D2F2',
      '--l-ring': '#D8D5F0',
      '--l-eyebrow': '#5B52D6',
      '--l-figure': '#4338CA',
    },
  },
  green: {
    key: 'green',
    label: 'ירוק',
    vars: {
      '--l-from': '#E2F5EA',
      '--l-via': '#F2FBF5',
      '--l-ink': '#0E2E1C',
      '--l-muted': '#476A57',
      // green-700 rather than a brighter green: 5.0:1 against white,
      // so the button label clears WCAG AA at this size.
      '--l-primary': '#15803D',
      '--l-primary-hover': '#1A9B4B',
      '--l-soft': '#DBF2E3',
      '--l-soft-hover': '#C6E9D2',
      '--l-ring': '#CBEBD8',
      '--l-eyebrow': '#15803D',
      '--l-figure': '#16A34A',
    },
  },
  plum: {
    key: 'plum',
    label: 'שזיף',
    vars: {
      '--l-from': '#F8EAF0',
      '--l-via': '#FDF5F8',
      '--l-ink': '#3E1024',
      '--l-muted': '#6E4457',
      '--l-primary': '#7A2E4E',
      '--l-primary-hover': '#953A60',
      '--l-soft': '#F3DFE7',
      '--l-soft-hover': '#EACCD8',
      '--l-ring': '#EDD5DF',
      '--l-eyebrow': '#A34068',
      '--l-figure': '#7A2E4E',
    },
  },
}
