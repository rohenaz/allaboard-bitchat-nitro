// Mock Next.js modules for Vite/React environment
export const NextResponse = {
  json: (data) => ({ ok: true, json: () => Promise.resolve(data) }),
  next: () => ({ ok: true }),
  redirect: (url) => ({ ok: true, redirected: true, url }),
};

export const NextRequest = class {
  constructor(url) {
    this.url = url;
  }
};

export const useRouter = () => ({
  push: (path) =>
    console.warn('useRouter.push called in non-Next environment:', path),
  replace: (path) =>
    console.warn('useRouter.replace called in non-Next environment:', path),
  back: () => console.warn('useRouter.back called in non-Next environment'),
});

export const usePathname = () => {
  console.warn('usePathname called in non-Next environment');
  return '/';
};

export const useSearchParams = () => {
  console.warn('useSearchParams called in non-Next environment');
  return new URLSearchParams();
};

export const headers = () => {
  console.warn('headers() called in non-Next environment');
  return new Map();
};

export const cookies = () => {
  console.warn('cookies() called in non-Next environment');
  return new Map();
};

export default function dynamic() {
  console.warn('dynamic() called in non-Next environment');
  return () => null;
}

// Default exports for different import patterns
export { NextResponse as default };
