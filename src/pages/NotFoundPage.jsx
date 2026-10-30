import { Link } from 'react-router-dom';
import SectionHeading from '../components/SectionHeading';
export default function NotFoundPage() {
  return <div className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 lg:px-10"><SectionHeading eyebrow="404" title="Page not found" description="That page doesn’t seem to exist." /><Link to="/" className="inline-flex rounded-full bg-burgundy px-5 py-3 text-sm font-bold text-white hover:bg-burgundy-dark">Go home</Link></div>;
}
