import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Button, Input, FormField, RadioBadgeGroup, Select } from '../../../components/ui';
import { Client, CreateClientDto } from '../../../types/client.types';
import { useCurrencySymbol } from '../../../hooks/useSettings';
import { recoveryService } from '../../../services/recoveryService';

const COUNTRY_CODES = [
  { code: '+92', label: 'PK +92' },
  { code: '+971', label: 'UAE +971' },
  { code: '+966', label: 'SA +966' },
  { code: '+44', label: 'UK +44' },
  { code: '+1', label: 'US +1' },
];

function splitPhone(fullPhone?: string | null): { countryCode: string; number: string } {
  if (!fullPhone) return { countryCode: '+92', number: '' };
  for (const cc of COUNTRY_CODES) {
    if (fullPhone.startsWith(cc.code)) {
      return { countryCode: cc.code, number: fullPhone.slice(cc.code.length) };
    }
  }
  return { countryCode: '+92', number: fullPhone };
}

const RECOVERY_DAYS = [
  { value: 'NONE', label: 'Not Assigned' },
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' },
];

export const clientFormSchema = z.object({
  name: z.string().min(1, 'Customer name is required').min(2, 'Name must be at least 2 characters'),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  city: z.string().optional(),
  area: z.string().optional(),
  creditLimit: z.number().min(0, 'Credit limit cannot be negative').default(0),
  paymentTermsDays: z.number().min(1, 'Payment terms must be at least 1 day').default(30),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  recoveryDay: z.string().optional(),
  recoveryAgentId: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  onSubmit: (data: CreateClientDto) => Promise<void>;
  client?: Client;
  isLoading?: boolean;
}

/**
 * ClientForm - Reusable client form component
 * Can be used for both creating and editing clients
 */
export const ClientForm: React.FC<ClientFormProps> = ({
  onSubmit,
  client,
  isLoading = false,
}) => {
  const [status, setStatus] = useState(client?.status || 'ACTIVE');
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';

  const { data: agentsData } = useQuery({
    queryKey: ['recovery-agents'],
    queryFn: () => recoveryService.getRecoveryAgents(),
  });
  const recoveryAgents = (agentsData as any)?.data || [];

  // Phone country code state
  const phoneParts = splitPhone(client?.phone);
  const [phoneCountryCode, setPhoneCountryCode] = useState(phoneParts.countryCode);
  const [phoneNumber, setPhoneNumber] = useState(phoneParts.number);

  // WhatsApp state
  const [sameAsPhone, setSameAsPhone] = useState(
    client ? (client.whatsapp === client.phone && !!client.whatsapp) : true
  );
  const whatsappParts = splitPhone(client?.whatsapp);
  const [waCountryCode, setWaCountryCode] = useState(whatsappParts.countryCode);
  const [waNumber, setWaNumber] = useState(whatsappParts.number);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: client?.name || '',
      contactPerson: client?.contactPerson || '',
      phone: client?.phone || '',
      whatsapp: client?.whatsapp || '',
      email: client?.email || '',
      city: client?.city || '',
      area: client?.area || '',
      creditLimit: client?.creditLimit || 0,
      paymentTermsDays: client?.paymentTermsDays || 30,
      status: client?.status || 'ACTIVE',
      recoveryDay: client?.recoveryDay || 'NONE',
      recoveryAgentId: client?.recoveryAgentId || '',
    },
  });

  useEffect(() => {
    if (client) {
      const pp = splitPhone(client.phone);
      const wp = splitPhone(client.whatsapp);
      setPhoneCountryCode(pp.countryCode);
      setPhoneNumber(pp.number);
      setWaCountryCode(wp.countryCode);
      setWaNumber(wp.number);
      setSameAsPhone(client.whatsapp === client.phone && !!client.whatsapp);
      reset({
        name: client.name,
        contactPerson: client.contactPerson || '',
        phone: client.phone || '',
        whatsapp: client.whatsapp || '',
        email: client.email || '',
        city: client.city || '',
        area: client.area || '',
        creditLimit: client.creditLimit,
        paymentTermsDays: client.paymentTermsDays,
        status: client.status,
        recoveryDay: client.recoveryDay || 'NONE',
        recoveryAgentId: client.recoveryAgentId || '',
      });
      setStatus(client.status);
    }
  }, [client, reset]);

  // Keep form values in sync with phone/whatsapp state
  useEffect(() => {
    const combined = phoneNumber ? `${phoneCountryCode}${phoneNumber}` : '';
    setValue('phone', combined);
    if (sameAsPhone) {
      setValue('whatsapp', combined);
    }
  }, [phoneCountryCode, phoneNumber, sameAsPhone, setValue]);

  useEffect(() => {
    if (!sameAsPhone) {
      const combined = waNumber ? `${waCountryCode}${waNumber}` : '';
      setValue('whatsapp', combined);
    }
  }, [waCountryCode, waNumber, sameAsPhone, setValue]);

  const handleFormSubmit = async (data: ClientFormData) => {
    try {
      await onSubmit(data as any);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* SECTION 1: Basic Information */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">
          Basic Information
        </h3>

        <FormField label="Customer Name" error={errors.name?.message} required>
          <Input
            {...register('name')}
            type="text"
            placeholder="Enter customer name"
            disabled={isLoading}
            className="py-2.5"
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="City" error={errors.city?.message}>
            <Input
              {...register('city')}
              type="text"
              placeholder="Enter city"
              disabled={isLoading}
              className="py-2.5"
            />
          </FormField>

          <FormField label="Area" error={errors.area?.message}>
            <Input
              {...register('area')}
              type="text"
              placeholder="Enter area"
              disabled={isLoading}
              className="py-2.5"
            />
          </FormField>
        </div>
      </div>

      {/* SECTION 2: Contact Details */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">
          Contact Details
        </h3>

        <FormField label="Contact Person" error={errors.contactPerson?.message}>
          <Input
            {...register('contactPerson')}
            type="text"
            placeholder="Enter contact person name"
            disabled={isLoading}
            className="py-2.5"
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Phone with Country Code */}
          <FormField label="Phone" error={errors.phone?.message}>
            <div className="flex gap-2">
              <select
                value={phoneCountryCode}
                onChange={(e) => setPhoneCountryCode(e.target.value)}
                disabled={isLoading}
                className="w-28 rounded border border-gray-300 px-2 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {COUNTRY_CODES.map((cc) => (
                  <option key={cc.code} value={cc.code}>{cc.label}</option>
                ))}
              </select>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="3001234567"
                disabled={isLoading}
                className="flex-1 rounded border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <input type="hidden" {...register('phone')} />
          </FormField>

          <FormField label="Email" error={errors.email?.message}>
            <Input
              {...register('email')}
              type="email"
              placeholder="Enter email address"
              disabled={isLoading}
              className="py-2.5"
            />
          </FormField>
        </div>

        {/* WhatsApp Section */}
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={sameAsPhone}
              onChange={(e) => setSameAsPhone(e.target.checked)}
              disabled={isLoading}
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">This phone number is on WhatsApp</span>
          </label>

          {!sameAsPhone && (
            <FormField label="WhatsApp Number" error={errors.whatsapp?.message}>
              <div className="flex gap-2">
                <select
                  value={waCountryCode}
                  onChange={(e) => setWaCountryCode(e.target.value)}
                  disabled={isLoading}
                  className="w-28 rounded border border-gray-300 px-2 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {COUNTRY_CODES.map((cc) => (
                    <option key={cc.code} value={cc.code}>{cc.label}</option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={waNumber}
                  onChange={(e) => setWaNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="3001234567"
                  disabled={isLoading}
                  className="flex-1 rounded border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <input type="hidden" {...register('whatsapp')} />
            </FormField>
          )}
        </div>
      </div>

      {/* SECTION 3: Credit Terms */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">
          Credit Terms
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label={`Credit Limit (${cs})`}
            error={errors.creditLimit?.message}
            required
            helperText="Set to 0 for cash-only customers"
          >
            <Input
              {...register('creditLimit', { valueAsNumber: true })}
              type="number"
              step="0.01"
              placeholder="0.00"
              disabled={isLoading}
              className="py-2.5"
            />
          </FormField>

          <FormField
            label="Payment Terms (Days)"
            error={errors.paymentTermsDays?.message}
            required
            helperText="e.g., 7 for weekly, 30 for monthly"
          >
            <Input
              {...register('paymentTermsDays', { valueAsNumber: true })}
              type="number"
              placeholder="30"
              disabled={isLoading}
              className="py-2.5"
            />
          </FormField>
        </div>
      </div>

      {/* SECTION 4: Recovery Settings */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">
          Recovery Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Recovery Day" helperText="Day of week for recovery visits">
            <select
              {...register('recoveryDay')}
              disabled={isLoading}
              className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {RECOVERY_DAYS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Recovery Agent" helperText="Assigned collection agent">
            <select
              {...register('recoveryAgentId')}
              disabled={isLoading}
              className="w-full rounded border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Not Assigned</option>
              {recoveryAgents.map((a: any) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </FormField>
        </div>
      </div>

      {/* SECTION 5: Status */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">
          Status
        </h3>

        <FormField label="Customer Status" error={errors.status?.message}>
          <RadioBadgeGroup
            name="status"
            value={status}
            onChange={(value) => {
              setStatus(value as 'ACTIVE' | 'INACTIVE');
              register('status').onChange({ target: { value } } as any);
            }}
            options={[
              { value: 'ACTIVE', label: 'Active', color: 'green' },
              { value: 'INACTIVE', label: 'Inactive', color: 'red' },
            ]}
            disabled={isLoading}
          />
          <input type="hidden" {...register('status')} value={status} />
        </FormField>
      </div>

      {/* Action Button - Sticky */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-6 -mb-8 px-6 py-4">
        <div className="flex gap-3 max-w-md ml-auto">
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isLoading}
            disabled={isLoading}
            className="flex-1"
          >
            {client ? 'Update Customer' : 'Save Customer'}
          </Button>
        </div>
      </div>
    </form>
  );
};
