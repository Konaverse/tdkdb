import Navbar from '@/components/layout/Navbar';
import NotFoundAnimations from './not-found-animations';

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col bg-void text-paper">
      <Navbar />
      <div className="flex flex-1 items-center justify-center">
        <NotFoundAnimations />
      </div>
    </div>
  );
}
