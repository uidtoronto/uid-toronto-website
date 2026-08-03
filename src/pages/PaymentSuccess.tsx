import { Navigate } from 'react-router-dom';
import { getPendingRegistrationCheckout } from '../lib/registrationCheckout';

/** Legacy payment success URL — forwards to membership confirmation. */
export default function PaymentSuccess() {
  const pending = getPendingRegistrationCheckout();
  const target = pending?.memberId
    ? `/membership-confirmation?member=${pending.memberId}`
    : '/membership-confirmation';
  return <Navigate to={target} replace />;
}
