import { useWindowDimensions } from 'react-native'

export function useIsTablet() {
  const { width } = useWindowDimensions()
  return width >= 768
}

export const TABLET_MAX_W = 720
