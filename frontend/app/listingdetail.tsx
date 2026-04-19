import { useLocalSearchParams, useRouter } from 'expo-router';
import ListingDetailScreen from '../src/screens/listings/ListingDetailScreen';

export default function ListingDetail() {
    const router  = useRouter();
    const params  = useLocalSearchParams();
    const listing = params.listing ? JSON.parse(params.listing as string) : null;

    return (
        <ListingDetailScreen
            route={{ params: { listing } }}
            navigation={{
                navigate: (screen: string, p?: any) => router.push({ pathname: '/chat' as any, params: p }),
                goBack:   () => router.back(),
            }}
        />
    );
}