import { Navigate, useSearchParams } from 'react-router-dom';

/** Legacy registration route — redirects to simplified membership flow. */
export default function MembershipRegister() {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan');
  const target = plan === 'monthly' || plan === 'annual' ? `/membership?plan=${plan}` : '/membership?plan=monthly';
  return <Navigate to={target} replace />;
}
