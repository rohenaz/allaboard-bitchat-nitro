export const FetchStatus = {
  Idle: 0,
  Loading: 1,
  Error: 2,
  Success: 3,
};

export const defaultAlias = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  alternateName: '',
  logo: '',
  image: '',
  homeLocation: {
    '@type': 'Place',
    name: '',
  },
  description: '',
  url: '',
  paymail: '',
  bitcoinAddress: '',
};
