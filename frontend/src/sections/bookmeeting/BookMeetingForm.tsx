import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { ButtonWithIcon } from '../../components/ui/button-with-icon';
import { FieldLabel, SelectInput, TextArea, TextInput } from '../../components/ui/form-controls';

interface BookMeetingFormProps {
  formData: {
    name: string;
    email: string;
    company: string;
    message: string;
    meetingDate: string;
    meetingTime: string;
    meetingType: string;
    country: string;
    city: string;
    requestType: string;
  };
  onChange: (data: BookMeetingFormProps['formData']) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  isValid: boolean;
  submitError: string;
}

const BookMeetingForm: React.FC<BookMeetingFormProps> = ({
  formData, onChange, onSubmit, isSubmitting, isValid, submitError
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.15 }}
    className="bg-white"
  >
    <form onSubmit={onSubmit} className="space-y-3.5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { label: 'Full Name',   key: 'name',    type: 'text',  placeholder: 'Jane Cooper' },
          { label: 'Work Email',  key: 'email',   type: 'email', placeholder: 'jane@company.com' },
        ].map(({ label, key, type, placeholder }) => (
          <div key={key} className="space-y-1.5">
            <FieldLabel>{label}</FieldLabel>
            <TextInput
              type={type}
              value={(formData as any)[key]}
              onChange={(e) => onChange({ ...formData, [key]: e.target.value })}
              placeholder={placeholder}
              className="bg-[var(--color-bg-secondary)]/50"
              required
            />
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Company</FieldLabel>
        <TextInput
          type="text"
          value={formData.company}
          onChange={(e) => onChange({ ...formData, company: e.target.value })}
          placeholder="Acme Studios"
          className="bg-[var(--color-bg-secondary)]/50"
          required
        />
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Meeting option</FieldLabel>
        <SelectInput
          value={formData.meetingType}
          onChange={(e) => onChange({ ...formData, meetingType: e.target.value })}
          className="bg-[var(--color-bg-secondary)]/50"
        >
          <option>Strategy call</option>
          <option>Project discussion</option>
          <option>High-volume custom SLA</option>
        </SelectInput>
      </div>

      <div className="space-y-1.5">
        <FieldLabel>What would you like to discuss?</FieldLabel>
        <TextArea
          value={formData.message}
          onChange={(e) => onChange({ ...formData, message: e.target.value })}
          placeholder="Tell us about your project needs..."
          rows={2}
          className="bg-[var(--color-bg-secondary)]/50"
          required
        />
      </div>

      {submitError && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 text-red-600 border border-red-100">
          <X size={16} />
          <p className="text-[13px] font-medium">{submitError}</p>
        </div>
      )}

      <div>
        <ButtonWithIcon 
          label={isSubmitting ? 'Booking...' : 'Schedule Call'}
          variant="default"
          className="!h-12 !w-full !max-w-none disabled:cursor-not-allowed disabled:opacity-50"
          animated={false}
          type="submit"
          disabled={!isValid || isSubmitting}
        />
        <p className="mt-2 text-center text-[11px] text-[var(--color-text-muted)]">
           Calendar invite sent after confirmation. No spam.
        </p>
      </div>
    </form>
  </motion.div>
);

export default BookMeetingForm;
