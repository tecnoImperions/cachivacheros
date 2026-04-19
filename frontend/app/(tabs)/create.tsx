import CreateListingScreen from '../../src/screens/listings/CreateListingScreen';
import { useRouter } from 'expo-router';

export default function Create() {
    const router = useRouter();
    return (
        <CreateListingScreen
            navigation={{
                navigate: (screen: string) => router.push(`/${screen.toLowerCase()}` as any),
                goBack:   () => router.back(),
            }}
        />
    );
}