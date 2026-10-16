import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useContent } from '../context/ContentBase';

interface GoogleAuthButtonProps {
  /** Google's built-in button label. 'signin_with' for login, 'signup_with' for register. */
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  /** Where to send the user after a successful auth. Defaults to /dashboard. */
  redirectTo?: string;
  /** Surfaces auth errors to the parent form's error state. */
  onError: (message: string) => void;
  /** Called when verification starts (e.g. to toggle a loading flag). */
  onStart?: () => void;
}

/**
 * Renders Google's branded sign-in button. On success it exchanges the Google
 * ID token (`credential`) for a portal session via the ContentContext, then
 * navigates to the dashboard. Works for both new and returning users — the
 * backend decides whether to create or link the account.
 */
const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  text = 'continue_with',
  redirectTo = '/dashboard',
  onError,
  onStart,
}) => {
  const { googleLogin } = useContent();
  const navigate = useNavigate();

  return (
    <div className="flex justify-center">
      <GoogleLogin
        text={text}
        shape="pill"
        size="large"
        width="320"
        logo_alignment="center"
        onSuccess={async (credentialResponse) => {
          if (!credentialResponse.credential) {
            onError('Google sign-in failed. Please try again.');
            return;
          }
          onStart?.();
          const result = await googleLogin(credentialResponse.credential);
          if (result.success) {
            navigate(redirectTo);
          } else {
            onError(result.message || 'Google sign-in failed. Please try again.');
          }
        }}
        onError={() => onError('Google sign-in was cancelled or failed.')}
      />
    </div>
  );
};

export default GoogleAuthButton;
