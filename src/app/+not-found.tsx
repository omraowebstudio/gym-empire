import { Redirect } from 'expo-router';

/** Any unknown start URL (e.g. when the web build is hosted under another path) goes home. */
export default function NotFound() {
  return <Redirect href="/" />;
}
