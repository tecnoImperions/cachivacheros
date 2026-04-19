import MyListingsScreen from '../../src/screens/listings/MyListingsScreen';
import { useRouter } from 'expo-router';

export default function MyListings() {
    const router = useRouter();
    return (
        <MyListingsScreen
            navigation={{
                navigate: (screen: string, params?: any) => router.push(`/${screen.toLowerCase()}` as any),
                goBack:   () => router.back(),
            }}
        />
    );
}