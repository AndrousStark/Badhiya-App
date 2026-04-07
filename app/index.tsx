/**
 * Root route — 3-way routing based on auth + onboarding state.
 *
 *   not authenticated      → /(auth)/login
 *   authenticated, no biz  → /(auth)/onboarding
 *   authenticated + biz    → /(tabs)
 *
 * Wrapped in Legend State's `observer` so auth changes flip the
 * redirect automatically without remounting.
 */

import { Redirect } from 'expo-router';
import { observer } from '@legendapp/state/react';
import { auth$ } from '../src/stores/auth';

export default observer(function Index() {
  const isAuth = auth$.isAuthenticated.get();
  const businessId = auth$.businessId.get();

  if (!isAuth) {
    return <Redirect href="/(auth)/login" />;
  }
  if (!businessId) {
    return <Redirect href="/(auth)/onboarding" />;
  }
  return <Redirect href="/(tabs)" />;
});
