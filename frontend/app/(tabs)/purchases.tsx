import MyPurchasesScreen from '../../src/screens/orders/MyPurchasesScreen';
import { useRouter } from 'expo-router';

export default function Purchases() {
    const router = useRouter();
    return (
        <MyPurchasesScreen
            navigation={{
                navigate: (screen: string, params?: any) =>
                    router.push({ pathname: `/${screen}` as any, params }),
                goBack: () => router.back(),
            }}
        />
    );
}