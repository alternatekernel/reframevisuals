import ReframeCS from '../../components/ReframeCS';
import { routed } from '../routed';

const EmbeddedChat = () => <ReframeCS variant="embedded" defaultExpanded showLauncher={false} />;

export default routed(EmbeddedChat);
