'use client';
import dynamic from 'next/dynamic';

const SocketComponents = dynamic(
  () => import('@/src/app/components/SocketComponents'),
  { ssr: false }
);
const SocketState = dynamic(
  () => import('@/src/app/components/SocketState'),
  { ssr: false }
);
const UserActiveStatus = dynamic(
  () => import('@/src/app/components/ActiveStatus'),
  { ssr: false }
);

export default function SocketLazy() {
  return (
    <>
      <SocketComponents />
      <SocketState />
      <UserActiveStatus />
    </>
  );
}
