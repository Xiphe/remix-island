import type { V2_MetaFunction } from '@remix-run/node';
import { Link } from '@remix-run/react';

export const meta: V2_MetaFunction = () => [{ title: 'About' }];

export default function About() {
  return (
    <>
      <h1>About</h1>
      <Link to="/">Go home</Link>
    </>
  );
}
