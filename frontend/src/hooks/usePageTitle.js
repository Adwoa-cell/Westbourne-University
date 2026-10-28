import { useEffect } from 'react';

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | Westbourne University` : 'Westbourne University';
  }, [title]);
}
