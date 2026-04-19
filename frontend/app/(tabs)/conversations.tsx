import ConversationsScreen from '../../src/screens/chat/ConversationsScreen';
import { useRouter } from 'expo-router';

export default function Conversations() {
    const router = useRouter();
    return (
        <ConversationsScreen
            navigation={{
                navigate: (screen: string, params?: any) => {
                    router.push({ pathname: '/chat' as any, params });
                },
                goBack: () => router.back(),
            }}
        />
    );
}