import Alert from '../../../components/ui/Alert';
import { CalloutVariant } from '../types';

const VARIANT_MAP: Record<CalloutVariant, 'success' | 'warning' | 'info' | 'error'> = {
  tip: 'success',
  warning: 'warning',
  note: 'info',
  important: 'error',
};

interface InfoCalloutProps {
  variant: CalloutVariant;
  title: string;
  children: React.ReactNode;
}

export default function InfoCallout({ variant, title, children }: InfoCalloutProps) {
  return (
    <Alert variant={VARIANT_MAP[variant]} title={title}>
      {children}
    </Alert>
  );
}
