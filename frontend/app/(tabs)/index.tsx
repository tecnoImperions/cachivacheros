import ListingsScreen from '../../src/screens/listings/ListingsScreen';
import { useRouter } from 'expo-router';

export default function Listings() {
    const router = useRouter();
    return (
        <ListingsScreen
            navigation={{
                navigate: (screen: string, params?: any) => {
                    if (screen === 'ListingDetail') {
                        router.push({ pathname: '/listingdetail' as any, params: { listing: JSON.stringify(params?.listing) } });
                    }
                },
                goBack: () => router.back(),
            }}
        />
    );
}