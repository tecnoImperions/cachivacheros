import { useLocalSearchParams, useRouter } from 'expo-router';
import ChatScreen from '../src/screens/chat/ChatScreen';

export default function Chat() {
    const router = useRouter();
    const params = useLocalSearchParams();

    return (
        <ChatScreen
            route={{
                params: {
                    listingId:  Number(params.listingId),
                    receiverId: Number(params.receiverId),
                    title:      params.title as string,
                },
            }}
            navigation={{ goBack: () => router.back() }}
        />
    );
}