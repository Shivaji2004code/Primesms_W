import { useLoading } from '../../contexts/LoadingContext';
import SmsLoader from './SmsLoader';

const GlobalLoader = () => {
  const { loading, message } = useLoading();
  
  return <SmsLoader visible={loading} message={message} />;
};

export default GlobalLoader;